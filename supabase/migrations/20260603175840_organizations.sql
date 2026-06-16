create type org_member_role as enum ('admin', 'spravce', 'accountant', 'viewer');

create table public.organizations (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text unique not null,
  logo_url     text,
  email        text,
  phone        text,
  address      text,
  ico          text,
  dic          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            org_member_role not null default 'viewer',
  invited_by      uuid references public.profiles(id),
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(organization_id, user_id)
);

create index idx_org_members_org    on public.organization_members(organization_id);
create index idx_org_members_user   on public.organization_members(user_id);

create trigger organization_members_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create or replace function public.my_organization_ids()
returns setof uuid language sql stable security definer as $$
  select organization_id from public.organization_members where user_id = auth.uid();
$$;

create policy "Člen vidí svoji organizaci"
  on public.organizations for select
  using (id in (select public.my_organization_ids()));

create policy "Admin může upravovat organizaci"
  on public.organizations for update
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Člen vidí členy své organizace"
  on public.organization_members for select
  using (organization_id in (select public.my_organization_ids()));

create policy "Admin spravuje členy"
  on public.organization_members for all
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = organization_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );
