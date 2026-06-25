-- Audit log pro GDPR operace (čl. 5 odst. 2 GDPR — zásada odpovědnosti)
-- Záznamy jsou uchovávány po dobu 5 let (zákon č. 563/1991 Sb.)

create table if not exists public.audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete set null,
  action      text        not null,
  metadata    jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

-- Index pro rychlé vyhledávání dle uživatele a data
create index audit_logs_user_id_idx  on public.audit_logs (user_id);
create index audit_logs_created_idx  on public.audit_logs (created_at desc);
create index audit_logs_action_idx   on public.audit_logs (action);

-- RLS: uživatel vidí pouze vlastní záznamy
alter table public.audit_logs enable row level security;

create policy "Uživatel vidí vlastní audit logy"
  on public.audit_logs for select
  using (user_id = auth.uid());

-- Pouze service role smí vkládat (žádná insert policy pro authenticated)
-- Tím je zajištěno, že záznamy nelze falšovat z klienta.

comment on table public.audit_logs is
  'Auditní záznamy pro GDPR operace. Uchovávat min. 5 let.';
comment on column public.audit_logs.action is
  'Typ akce: gdpr_data_exported, gdpr_account_deleted, login_failed, ...';
comment on column public.audit_logs.ip_address is
  'IP adresa z Cloudflare CF-Connecting-IP nebo X-Forwarded-For';
