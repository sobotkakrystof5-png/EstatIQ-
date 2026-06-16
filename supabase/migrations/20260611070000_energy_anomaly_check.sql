-- ─────────────────────────────────────────────────────────────────────────────
-- Energy anomaly check infrastructure
--
-- 1. metadata jsonb on notifications  — stores per-type extra context
-- 2. check_energy_anomaly()           — compares consumption vs 12-month avg;
--                                       returns (is_anomaly, anomaly_percent, avg_consumption)
-- 3. tr_energy_anomaly_webhook()      — AFTER INSERT trigger on energy_readings
--                                       → async HTTP POST to Edge Function
--
-- SETUP (same database settings as reminder-cron — skip if already set):
--   ALTER DATABASE postgres SET app.supabase_url = 'https://mzuhyynwsnypqjvshyrb.supabase.co';
--   ALTER DATABASE postgres SET app.service_role_key = 'eyJ...';
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. metadata column on notifications
alter table public.notifications
  add column if not exists metadata jsonb;

-- 2. Drop old single-boolean version (incompatible return type), rebuild
drop function if exists public.check_energy_anomaly(uuid, energy_type, numeric, smallint, smallint);

create function public.check_energy_anomaly(
  p_property_id  uuid,
  p_type         energy_type,
  p_consumption  numeric,
  p_year         smallint,
  p_month        smallint
)
returns table(is_anomaly boolean, anomaly_percent numeric, avg_consumption numeric)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_avg   numeric;
  v_count integer;
  v_pct   numeric;
  v_seq   integer;
begin
  v_seq := p_year::integer * 12 + p_month::integer;

  select count(*), avg(er.consumption)
    into v_count, v_avg
  from public.energy_readings er
  where er.property_id = p_property_id
    and er.type        = p_type
    and er.consumption is not null
    and (er.period_year::integer * 12 + er.period_month::integer) <  v_seq
    and (er.period_year::integer * 12 + er.period_month::integer) >= v_seq - 12;

  -- < 3 historické záznamy → no anomaly (zabrání false positives na sparse datech)
  if v_count < 3 or v_avg is null or v_avg = 0 or p_consumption is null then
    return query select false, 0::numeric, coalesce(v_avg, 0::numeric);
    return;
  end if;

  v_pct := ((p_consumption - v_avg) / v_avg) * 100;
  return query select (v_pct > 30), round(v_pct, 1), round(v_avg, 2);
end;
$$;

grant execute on function public.check_energy_anomaly(uuid, energy_type, numeric, smallint, smallint)
  to service_role;

-- 3. Trigger function — fires async HTTP POST to energy-anomaly-check Edge Function
--    Uses the same app.supabase_url / app.service_role_key database settings
--    as the reminder-cron infrastructure.
create or replace function public.tr_energy_anomaly_webhook()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip readings where consumption has not been computed yet
  if NEW.consumption is null then
    return NEW;
  end if;

  perform net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/energy-anomaly-check',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object(
      'type',       TG_OP,
      'table',      TG_TABLE_NAME,
      'schema',     TG_TABLE_SCHEMA,
      'record',     row_to_json(NEW),
      'old_record', NULL
    )
  );

  return NEW;
end;
$$;

drop trigger if exists energy_reading_anomaly_webhook on public.energy_readings;

create trigger energy_reading_anomaly_webhook
  after insert on public.energy_readings
  for each row
  execute function public.tr_energy_anomaly_webhook();
