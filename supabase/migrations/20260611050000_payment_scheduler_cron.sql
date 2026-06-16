-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: Czech bank account → IBAN (CZ)
-- Czech format: [prefix-]number/bankCode  e.g. 670100-2200130267/6210
-- Czech IBAN:   CZ + 2 check digits + 4-digit bank + 6-digit prefix + 10-digit number
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.czech_account_to_iban(p_account text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_clean  text;
  v_m      text[];
  v_prefix text;
  v_number text;
  v_bank   text;
  v_bban   text;
  v_rearr  text;
  v_rem    bigint := 0;
  ch       text;
begin
  v_clean := regexp_replace(p_account, '\s', '', 'g');
  if v_clean ~ '^CZ[0-9]{22}$' then return v_clean; end if;

  v_m := regexp_match(v_clean, '^(?:([0-9]{1,6})-)?([0-9]{2,10})/([0-9]{4})$');
  if v_m is null then return p_account; end if;

  v_prefix := lpad(coalesce(v_m[1], ''), 6, '0');
  v_number := lpad(v_m[2], 10, '0');
  v_bank   := v_m[3];
  v_bban   := v_bank || v_prefix || v_number; -- 20 digits

  -- IBAN check: rearrange = BBAN + C(12) Z(35) + 00, then 98 − mod97
  v_rearr := v_bban || '123500';
  foreach ch in array regexp_split_to_array(v_rearr, '')
  loop
    v_rem := (v_rem * 10 + ch::bigint) % 97;
  end loop;

  return 'CZ' || lpad((98 - v_rem::int)::text, 2, '0') || v_bban;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Core function: generate monthly rent payments
--
-- Called by:
--   • pg_cron (directly, no HTTP) — automatic on 1st of each month
--   • Edge Function payment-scheduler — manual trigger / backfill via HTTP
--
-- Idempotent: skips leases that already have a rent payment for the period.
-- Uses ON CONFLICT DO NOTHING as final safety net for the unique constraint
-- (lease_id, type, period_year, period_month).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.generate_monthly_payments(
  p_year  int default null,
  p_month int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year         int;
  v_month        int;
  v_month_padded text;
  v_created      int := 0;
  v_skipped      int := 0;
  rec            record;
  v_due_date     date;
  v_vs           text;
  v_qr           text;
  v_iban         text;
begin
  v_year  := coalesce(p_year,  extract(year  from now() at time zone 'Europe/Prague')::int);
  v_month := coalesce(p_month, extract(month from now() at time zone 'Europe/Prague')::int);
  v_month_padded := lpad(v_month::text, 2, '0');

  raise notice '[generate_monthly_payments] period=%/%', v_year, v_month_padded;

  for rec in
    select
      l.id           as lease_id,
      l.monthly_rent,
      l.payment_day,
      l.bank_account,
      l.tenant_id,
      p.name         as property_name
    from public.leases l
    join public.properties p on p.id = l.property_id
    where l.status    = 'aktivni'
      and l.archived_at is null
  loop
    if exists (
      select 1 from public.payments
      where lease_id    = rec.lease_id
        and type        = 'rent'
        and period_year = v_year
        and period_month = v_month
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_due_date := make_date(v_year, v_month, rec.payment_day);

    -- Variable symbol: YYYYMM + last 4 numeric chars of tenant UUID = max 10 digits (CZ limit)
    v_vs := v_year::text || v_month_padded
         || lpad(
              right(regexp_replace(rec.tenant_id::text, '[^0-9]', '', 'g'), 4),
              4, '0'
            );

    -- CZ QR SPD 1.0 — https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
    v_iban := case
      when rec.bank_account is not null
      then public.czech_account_to_iban(rec.bank_account)
      else null
    end;

    v_qr := 'SPD*1.0'
         || case when v_iban is not null then '*ACC:' || v_iban else '' end
         || '*AM:'   || to_char(rec.monthly_rent, 'FM999999999.00')
         || '*CC:CZK'
         || '*X-VS:' || v_vs
         || '*DT:'   || to_char(v_due_date, 'YYYYMMDD')
         || '*MSG:'  || left(
              'Najem ' || rec.property_name || ' ' || v_year::text || '/' || v_month_padded,
              60
            );

    insert into public.payments (
      lease_id, type, status, amount,
      due_date, period_year, period_month,
      variable_symbol, qr_payload
    ) values (
      rec.lease_id, 'rent', 'pending', rec.monthly_rent,
      v_due_date, v_year, v_month,
      v_vs, v_qr
    )
    on conflict (lease_id, type, period_year, period_month) do nothing;

    if found then
      v_created := v_created + 1;
    end if;
  end loop;

  raise notice '[generate_monthly_payments] created=% skipped=%', v_created, v_skipped;

  return jsonb_build_object(
    'success', true,
    'period',  v_year::text || '/' || v_month_padded,
    'created', v_created,
    'skipped', v_skipped
  );
end;
$$;

grant execute on function public.generate_monthly_payments(int, int) to service_role;
grant execute on function public.czech_account_to_iban(text)         to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: 1st of every month at 05:00 UTC (= 06:00 CET / 07:00 CEST)
-- pg_cron runs as postgres (superuser) → SECURITY DEFINER function bypasses RLS
-- No secrets needed — function is called directly, not via HTTP.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'payment-scheduler-monthly',
  '0 5 1 * *',
  $$ select public.generate_monthly_payments() $$
);
