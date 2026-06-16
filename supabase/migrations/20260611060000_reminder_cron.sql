-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions for reminder-cron Edge Function
--
-- These run as SECURITY DEFINER (service_role context) so they can read
-- across tenant boundaries without RLS interference.
--
-- Each function returns a JSON array of payment rows the Edge Function
-- needs to send reminders for, and marks nothing itself — the Edge Function
-- updates reminder_*_sent_at only after a successful Resend call.
-- ─────────────────────────────────────────────────────────────────────────────

-- T-5: pending payments due in exactly 5 days (tenant receives QR reminder)
create or replace function public.get_payments_t_minus5()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(row_to_json(r)),
    '[]'::jsonb
  )
  from (
    select
      p.id                as payment_id,
      p.amount,
      p.due_date,
      p.qr_payload,
      p.variable_symbol,
      t.email             as tenant_email,
      t.full_name         as tenant_name,
      pr.name             as property_name,
      pr.address          as property_address
    from public.payments p
    join public.leases     l  on l.id  = p.lease_id
    join public.tenants    t  on t.id  = l.tenant_id
    join public.properties pr on pr.id = l.property_id
    where p.status                       = 'pending'
      and p.due_date                     = (current_date + 5)
      and p.reminder_t_minus5_sent_at    is null
      and l.archived_at                  is null
  ) r
$$;

-- T+7: overdue payments 7 days past due (tenant receives firm reminder)
create or replace function public.get_payments_t_plus7()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(row_to_json(r)),
    '[]'::jsonb
  )
  from (
    select
      p.id                as payment_id,
      p.amount,
      p.due_date,
      p.qr_payload,
      p.variable_symbol,
      t.email             as tenant_email,
      t.full_name         as tenant_name,
      pr.name             as property_name,
      pr.address          as property_address
    from public.payments p
    join public.leases     l  on l.id  = p.lease_id
    join public.tenants    t  on t.id  = l.tenant_id
    join public.properties pr on pr.id = l.property_id
    where p.status                      = 'overdue'
      and p.due_date                    = (current_date - 7)
      and p.reminder_t_plus7_sent_at    is null
      and l.archived_at                 is null
  ) r
$$;

-- T+14: overdue payments 14 days past due (OWNER receives intervention request)
create or replace function public.get_payments_t_plus14()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(row_to_json(r)),
    '[]'::jsonb
  )
  from (
    select
      p.id                as payment_id,
      p.amount,
      p.due_date,
      t.full_name         as tenant_name,
      pr.name             as property_name,
      pr.address          as property_address,
      prof.email          as owner_email,
      prof.full_name      as owner_name
    from public.payments p
    join public.leases     l    on l.id    = p.lease_id
    join public.tenants    t    on t.id    = l.tenant_id
    join public.properties pr   on pr.id   = l.property_id
    join public.profiles   prof on prof.id = pr.owner_id
    where p.status                       = 'overdue'
      and p.due_date                     = (current_date - 14)
      and p.reminder_t_plus14_sent_at    is null
      and l.archived_at                  is null
  ) r
$$;

grant execute on function public.get_payments_t_minus5()  to service_role;
grant execute on function public.get_payments_t_plus7()   to service_role;
grant execute on function public.get_payments_t_plus14()  to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: daily at 07:00 UTC (= 08:00 CET / 09:00 CEST)
--
-- Calls the reminder-cron Edge Function via pg_net.
--
-- SETUP (run once before applying this migration):
--
--   1. Set your project URL:
--      ALTER DATABASE postgres SET app.supabase_url = 'https://<YOUR_PROJECT_REF>.supabase.co';
--
--   2. Set your service role key (find in Project Settings → API):
--      ALTER DATABASE postgres SET app.service_role_key = 'eyJ...';
--
--   3. Add RESEND_API_KEY as a Supabase Secret:
--      supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
--
-- After that, apply this migration normally.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'reminder-cron-daily',
  '0 7 * * *',
  $$
    select net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/reminder-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    )
  $$
);
