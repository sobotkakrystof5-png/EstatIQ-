-- ── Rozšíření enum property_type o nové typy ──────────────────────────────────
alter type property_type add value if not exists 'pozemek';
alter type property_type add value if not exists 'komercni_prostor';

-- ── Nová pole tabulky properties ──────────────────────────────────────────────
alter table public.properties
  add column if not exists region                 text,
  add column if not exists disposition            text,
  add column if not exists purchase_price         numeric(14,2),
  add column if not exists market_value           numeric(14,2),
  add column if not exists ownership_type         text,
  add column if not exists construction_type      text,
  add column if not exists heating_type           text,
  add column if not exists unit_number            text,
  add column if not exists total_floors           integer,
  add column if not exists basement_floors        integer,
  add column if not exists equipment              text[]  not null default '{}',
  add column if not exists gas_eic_code           text,
  add column if not exists electricity_ean_code   text,
  add column if not exists insurance_policy_number text,
  add column if not exists insurance_annual_premium numeric(14,2),
  add column if not exists insurance_note         text;

-- ── CalendarEvent — nová entita (sekce 9 specifikace) ─────────────────────────
create table if not exists public.calendar_events (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  organization_id     uuid references public.organizations(id) on delete set null,
  title               text not null,
  description         text,
  due_at              timestamptz not null,
  event_type          text not null default 'task',
  -- event_type values: task | payment_due | lease_expiry | insurance_expiry | revision
  related_property_id uuid references public.properties(id) on delete set null,
  related_tenant_id   uuid references public.tenants(id) on delete set null,
  status              text not null default 'open', -- open | done
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_calendar_events_owner    on public.calendar_events(owner_id);
create index if not exists idx_calendar_events_due_at   on public.calendar_events(due_at);
create index if not exists idx_calendar_events_org      on public.calendar_events(organization_id);

create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "Vlastník vidí své události"
  on public.calendar_events for select
  using (
    owner_id = auth.uid()
    or organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Vlastník vytváří události"
  on public.calendar_events for insert
  with check (owner_id = auth.uid());

create policy "Vlastník upravuje události"
  on public.calendar_events for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Vlastník maže události"
  on public.calendar_events for delete
  using (owner_id = auth.uid());
