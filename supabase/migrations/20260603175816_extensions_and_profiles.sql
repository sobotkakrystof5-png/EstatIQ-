-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enum: user role hierarchy
create type user_role as enum (
  'super_admin',
  'spravce',
  'vlastnik',
  'pronajimatel',
  'najemnik'
);

-- Profiles — rozšíření auth.users (1:1)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  phone        text,
  avatar_url   text,
  role         user_role not null default 'pronajimatel',
  locale       text not null default 'cs',
  onboarding_completed_at timestamptz,
  two_factor_enabled boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Uživatel vidí vlastní profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Uživatel upravuje vlastní profil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
