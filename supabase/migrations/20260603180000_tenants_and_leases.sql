create type lease_status as enum ('aktivni', 'ukoncena', 'ceka_na_podpis', 'archivovana');

create table public.tenants (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references public.profiles(id) on delete set null,
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  phone           text,
  birth_date      date,
  id_number       text,
  address         text,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tenants_owner   on public.tenants(owner_id);
create index idx_tenants_user    on public.tenants(user_id);
create index idx_tenants_email   on public.tenants(email);

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

create table public.leases (
  id                uuid primary key default uuid_generate_v4(),
  property_id       uuid not null references public.properties(id) on delete cascade,
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  status            lease_status not null default 'aktivni',
  monthly_rent      numeric(10,2) not null,
  deposit           numeric(10,2) not null default 0,
  utilities_flat    numeric(10,2) not null default 0,
  start_date        date not null,
  end_date          date,
  payment_day       smallint not null default 1 check (payment_day between 1 and 28),
  bank_account      text,
  variable_symbol   text,
  contract_url      text,
  handover_url      text,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_leases_property  on public.leases(property_id);
create index idx_leases_tenant    on public.leases(tenant_id);
create index idx_leases_status    on public.leases(status) where archived_at is null;

create trigger leases_updated_at
  before update on public.leases
  for each row execute function public.set_updated_at();

create sequence if not exists vs_seq start 1000;
create or replace function public.generate_variable_symbol()
returns trigger language plpgsql as $$
begin
  if new.variable_symbol is null then
    new.variable_symbol := to_char(now(), 'YYYYMMDD') || lpad(nextval('vs_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger leases_variable_symbol
  before insert on public.leases
  for each row execute function public.generate_variable_symbol();

alter table public.tenants enable row level security;
alter table public.leases enable row level security;

create policy "Vlastník vidí své nájemníky"
  on public.tenants for select
  using (owner_id = auth.uid());

create policy "Nájemník vidí svůj záznam"
  on public.tenants for select
  using (user_id = auth.uid());

create policy "Vlastník spravuje nájemníky"
  on public.tenants for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Vlastník vidí nájmy svých nemovitostí"
  on public.leases for select
  using (property_id in (select public.my_property_ids()));

create policy "Nájemník vidí svůj nájem"
  on public.leases for select
  using (
    tenant_id in (
      select id from public.tenants where user_id = auth.uid()
    )
  );

create policy "Vlastník spravuje nájmy"
  on public.leases for all
  using (property_id in (select public.my_property_ids()))
  with check (property_id in (select public.my_property_ids()));
