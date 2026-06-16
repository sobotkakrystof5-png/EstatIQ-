create type energy_type    as enum ('elektrina', 'plyn', 'voda_studena', 'voda_tepla', 'teplo');
create type energy_provider as enum ('cez', 'eon', 'pre', 'innogy', 'prazska_teplarenska', 'jiny');

create table public.energy_readings (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  lease_id      uuid references public.leases(id) on delete set null,
  type          energy_type not null,
  meter_id      text,
  provider      energy_provider,
  reading_value numeric(12,3) not null,
  reading_date  date not null,
  period_year   smallint not null,
  period_month  smallint not null check (period_month between 1 and 12),
  consumption   numeric(12,3),
  note          text,
  photo_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(property_id, type, meter_id, period_year, period_month)
);

create index idx_energy_property  on public.energy_readings(property_id);
create index idx_energy_type      on public.energy_readings(property_id, type);
create index idx_energy_period    on public.energy_readings(period_year, period_month);

create trigger energy_readings_updated_at
  before update on public.energy_readings
  for each row execute function public.set_updated_at();

-- Detekce anomálie: >30% nad 12měsíčním klouzavým průměrem
create or replace function public.check_energy_anomaly(
  p_property_id uuid,
  p_type energy_type,
  p_consumption numeric,
  p_period_year smallint,
  p_period_month smallint
) returns boolean language plpgsql security definer as $$
declare
  v_avg numeric;
begin
  select avg(consumption) into v_avg
  from public.energy_readings
  where property_id = p_property_id
    and type = p_type
    and consumption is not null
    and (period_year * 12 + period_month) < (p_period_year * 12 + p_period_month)
    and (period_year * 12 + period_month) >= (p_period_year * 12 + p_period_month - 12);

  if v_avg is not null and v_avg > 0 and p_consumption > v_avg * 1.3 then
    return true;
  end if;
  return false;
end;
$$;

alter table public.energy_readings enable row level security;

create policy "Vlastník vidí energie svých nemovitostí"
  on public.energy_readings for select
  using (property_id in (select public.my_property_ids()));

create policy "Nájemník vidí energie svého nájmu"
  on public.energy_readings for select
  using (
    lease_id in (
      select l.id from public.leases l
      join public.tenants t on t.id = l.tenant_id
      where t.user_id = auth.uid()
    )
  );

create policy "Vlastník spravuje energie"
  on public.energy_readings for all
  using (property_id in (select public.my_property_ids()))
  with check (property_id in (select public.my_property_ids()));
