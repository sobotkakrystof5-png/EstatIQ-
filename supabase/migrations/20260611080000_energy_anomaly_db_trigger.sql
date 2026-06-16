-- ─────────────────────────────────────────────────────────────────────────────
-- Energy anomaly — direct DB trigger (no HTTP, no secrets)
--
-- Replaces the pg_net webhook version from 20260611070000: the database role
-- cannot set app.service_role_key settings, so the trigger now performs the
-- anomaly check and notification INSERT directly in the database. Atomic,
-- no network dependency, works without any secret configuration.
--
-- The energy-anomaly-check Edge Function remains deployed as an optional
-- HTTP entry point (manual re-checks, future Resend e-mail escalation).
-- ─────────────────────────────────────────────────────────────────────────────

drop trigger if exists energy_reading_anomaly_webhook on public.energy_readings;
drop function if exists public.tr_energy_anomaly_webhook();

create or replace function public.tr_energy_anomaly_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result     record;
  v_property   record;
  v_type_label text;
begin
  -- consumption not yet computed → nothing to evaluate
  if NEW.consumption is null then
    return NEW;
  end if;

  select * into v_result
  from public.check_energy_anomaly(
    NEW.property_id, NEW.type, NEW.consumption, NEW.period_year, NEW.period_month
  );

  if not v_result.is_anomaly then
    return NEW;
  end if;

  select name, owner_id into v_property
  from public.properties
  where id = NEW.property_id;

  if v_property.owner_id is null then
    return NEW;
  end if;

  v_type_label := case NEW.type
    when 'elektrina'    then 'Elektřina'
    when 'plyn'         then 'Plyn'
    when 'voda_studena' then 'Studená voda'
    when 'voda_tepla'   then 'Teplá voda'
    when 'teplo'        then 'Teplo'
    else NEW.type::text
  end;

  insert into public.notifications
    (user_id, type, channel, title, body, ref_table, ref_id, metadata)
  values (
    v_property.owner_id,
    'energy_anomaly',
    'in_app',
    'Neobvyklá spotřeba energií',
    v_type_label || ' na ' || v_property.name || ' je o ' || v_result.anomaly_percent
      || ' % vyšší než průměr posledních 12 měsíců.',
    'energy_readings',
    NEW.id,
    jsonb_build_object(
      'reading_id',      NEW.id,
      'anomaly_percent', v_result.anomaly_percent,
      'avg_consumption', v_result.avg_consumption
    )
  );

  return NEW;
end;
$$;

create trigger energy_reading_anomaly_check
  after insert on public.energy_readings
  for each row
  execute function public.tr_energy_anomaly_check();
