create type property_type as enum ('byt', 'dum', 'kancelar', 'sklad', 'garaz', 'jine');
create type property_status as enum ('volna', 'pronajata', 'v_oprave', 'archivovana');

create table public.properties (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  name            text not null,
  address         text not null,
  city            text not null,
  postal_code     text,
  country         text not null default 'CZ',
  type            property_type not null default 'byt',
  status          property_status not null default 'volna',
  area_sqm        numeric(8,2),
  floor           integer,
  rooms           integer,
  description     text,
  cover_image_url text,
  cadastral_number text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_properties_owner    on public.properties(owner_id);
create index idx_properties_org      on public.properties(organization_id);
create index idx_properties_status   on public.properties(status) where archived_at is null;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

alter table public.properties enable row level security;

create or replace function public.my_property_ids()
returns setof uuid language sql stable security definer as $$
  select id from public.properties
  where owner_id = auth.uid()
  union
  select p.id from public.properties p
  join public.organization_members om
    on om.organization_id = p.organization_id
    and om.user_id = auth.uid();
$$;

create policy "Vlastník a správce vidí nemovitost"
  on public.properties for select
  using (id in (select public.my_property_ids()));

create policy "Vlastník vytváří nemovitost"
  on public.properties for insert
  with check (owner_id = auth.uid());

create policy "Vlastník a správce upravují nemovitost"
  on public.properties for update
  using (id in (select public.my_property_ids()))
  with check (id in (select public.my_property_ids()));

create or replace function public.check_property_unit_limit()
returns trigger language plpgsql security definer as $$
declare
  v_count integer;
  v_limit integer;
begin
  select count(*) into v_count
  from public.properties
  where owner_id = new.owner_id and archived_at is null;

  select unit_limit into v_limit
  from public.subscriptions
  where user_id = new.owner_id
  order by created_at desc
  limit 1;

  if v_count >= coalesce(v_limit, 1) then
    raise exception 'unit_limit_exceeded' using
      hint = 'Upgrade your subscription to add more properties';
  end if;
  return new;
end;
$$;

create trigger enforce_property_unit_limit
  before insert on public.properties
  for each row execute function public.check_property_unit_limit();
