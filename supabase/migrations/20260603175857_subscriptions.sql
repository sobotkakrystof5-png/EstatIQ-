create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'paused');
create type subscription_tier  as enum (
  'free', 'starter', 'pro', 'portfolio',
  'b2b_start', 'b2b_growth', 'b2b_scale', 'enterprise'
);
create type billing_cycle as enum ('monthly', 'yearly');

create table public.subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.profiles(id) on delete cascade,
  organization_id     uuid references public.organizations(id) on delete cascade,
  tier                subscription_tier not null default 'free',
  status              subscription_status not null default 'active',
  billing_cycle       billing_cycle not null default 'monthly',
  unit_limit          integer not null default 1,
  unit_count          integer not null default 0,
  stripe_customer_id  text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  canceled_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_subscription_owner check (
    (user_id is not null) <> (organization_id is not null)
  )
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_org  on public.subscriptions(organization_id);
create index idx_subscriptions_stripe_sub on public.subscriptions(stripe_subscription_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, tier, unit_limit)
  values (new.id, 'free', 1);
  return new;
end;
$$;

create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_subscription();

alter table public.subscriptions enable row level security;

create policy "Uživatel vidí vlastní subscription"
  on public.subscriptions for select
  using (
    user_id = auth.uid()
    or organization_id in (select public.my_organization_ids())
  );

create policy "Pouze systém (service_role) upravuje subscription"
  on public.subscriptions for update
  using (false);
