create type notification_type as enum (
  'payment_reminder',
  'payment_overdue',
  'lease_expiry',
  'document_expiry',
  'energy_anomaly',
  'invite_sent',
  'system'
);

create type notification_channel as enum ('in_app', 'email', 'sms');

create table public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          notification_type not null,
  channel       notification_channel not null default 'in_app',
  title         text not null,
  body          text,
  is_read       boolean not null default false,
  sent_at       timestamptz,
  related_id    uuid,
  related_table text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_notifications_user    on public.notifications(user_id);
create index idx_notifications_unread  on public.notifications(user_id) where is_read = false;
create index idx_notifications_type    on public.notifications(type);

create trigger notifications_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;

create policy "Uživatel vidí vlastní notifikace"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Uživatel aktualizuje vlastní notifikace"
  on public.notifications for update
  using (user_id = auth.uid());

-- Edge Functions mohou vkládat notifikace přes service role (bez RLS)
-- Proto není potřeba INSERT policy pro anon/authenticated

-- Tax exports

create type export_format as enum ('pdf', 'csv', 'xlsx');
create type export_status  as enum ('pending', 'processing', 'done', 'failed');

create table public.tax_exports (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  property_id   uuid references public.properties(id) on delete set null,
  format        export_format not null default 'pdf',
  status        export_status not null default 'pending',
  period_year   smallint not null,
  period_month  smallint check (period_month between 1 and 12),
  file_url      text,
  error_message text,
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_tax_exports_user   on public.tax_exports(user_id);
create index idx_tax_exports_period on public.tax_exports(period_year, period_month);

create trigger tax_exports_updated_at
  before update on public.tax_exports
  for each row execute function public.set_updated_at();

alter table public.tax_exports enable row level security;

create policy "Uživatel vidí vlastní exporty"
  on public.tax_exports for select
  using (user_id = auth.uid());

create policy "Uživatel vytváří exporty"
  on public.tax_exports for insert
  with check (user_id = auth.uid());

create policy "Uživatel maže exporty"
  on public.tax_exports for delete
  using (user_id = auth.uid());
