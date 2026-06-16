create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.invitations (
  id          uuid primary key default uuid_generate_v4(),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  lease_id    uuid references public.leases(id) on delete cascade,
  invited_by  uuid not null references public.profiles(id),
  email       text not null,
  status      invitation_status not null default 'pending',
  expires_at  timestamptz not null default (now() + interval '72 hours'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_invitations_token      on public.invitations(token) where status = 'pending';
create index idx_invitations_email      on public.invitations(email);
create index idx_invitations_invited_by on public.invitations(invited_by);

create trigger invitations_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

create or replace function public.expire_old_invitations()
returns void language sql security definer as $$
  update public.invitations
  set status = 'expired'
  where status = 'pending' and expires_at < now();
$$;

alter table public.invitations enable row level security;

create policy "Pronajímatel vidí své pozvánky"
  on public.invitations for select
  using (invited_by = auth.uid());

create policy "Pronajímatel vytváří pozvánky"
  on public.invitations for insert
  with check (invited_by = auth.uid());

create policy "Pronajímatel ruší pozvánky"
  on public.invitations for update
  using (invited_by = auth.uid());

create policy "Kdokoli může číst pending pozvánku dle tokenu"
  on public.invitations for select
  using (status = 'pending' and expires_at > now());
