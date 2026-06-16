create table public.energy_imports (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  property_id    uuid references public.properties(id) on delete set null,
  provider       energy_provider,
  filename       text not null,
  rows_total     integer not null default 0,
  rows_imported  integer not null default 0,
  rows_skipped   integer not null default 0,
  status         text not null default 'completed' check (status in ('completed', 'failed')),
  created_at     timestamptz not null default now()
);

create index idx_energy_imports_user on public.energy_imports(user_id);

alter table public.energy_imports enable row level security;

create policy "Uživatel spravuje vlastní importy"
  on public.energy_imports for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
