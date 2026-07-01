-- Migration: create loans table
-- Already applied to remote Supabase (mzuhyynwsnypqjvshyrb) — this file is the local record.

create type public.loan_type as enum ('mortgage', 'renovation', 'personal', 'other');

create table if not exists public.loans (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  organization_id   uuid references public.organizations(id) on delete set null,
  property_id       uuid references public.properties(id) on delete set null,
  lender            text not null,
  loan_type         public.loan_type not null default 'mortgage',
  principal         numeric(14,2),
  current_balance   numeric(14,2),
  monthly_payment   numeric(14,2) not null default 0,
  interest_rate     numeric(6,4),         -- e.g. 0.0499 = 4.99 %
  start_date        date,
  end_date          date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists loans_owner_id_idx        on public.loans(owner_id);
create index if not exists loans_property_id_idx     on public.loans(property_id);
create index if not exists loans_organization_id_idx on public.loans(organization_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger loans_updated_at
  before update on public.loans
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.loans enable row level security;

create policy "owner can manage own loans"
  on public.loans
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
