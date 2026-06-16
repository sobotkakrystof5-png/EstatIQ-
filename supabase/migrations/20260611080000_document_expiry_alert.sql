-- ─────────────────────────────────────────────────────────────────────────────
-- Document expiry alert infrastructure (krok 3.4)
--
-- 1. documents.notification_sent_days int[] — nahrazuje alert_60/30/14_sent_at
--    (jeden zdroj pravdy; staré sloupce nikde v aplikaci nepoužívané)
-- 2. get_expiring_documents()      — dokumenty expirující přesně za 60/30/14 dní,
--                                    pro které daný threshold ještě nebyl notifikován
-- 3. mark_document_alert_sent()    — atomicky připíše threshold do pole
-- 4. pg_cron daily 06:00 UTC (= 07:00 CET, 08:00 CEST) → Edge Function přes pg_net
--
-- SETUP: service role key ve Vaultu pod názvem 'cron_service_role_key'
-- (stejný secret používá reminder-cron — přeskoč, pokud už existuje):
--   select vault.create_secret('eyJ...', 'cron_service_role_key');
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tracking pole — int[] thresholdů (60/30/14), pro které už alert odešel
alter table public.documents
  add column if not exists notification_sent_days int[] not null default '{}';

alter table public.documents
  drop column if exists alert_60_sent_at,
  drop column if exists alert_30_sent_at,
  drop column if exists alert_14_sent_at;

-- 2. Dokumenty k notifikaci — SECURITY DEFINER (service_role čte napříč RLS).
--    Vlastník se řeší přes property → owner, u dokumentů navázaných jen na lease
--    přes lease → property → owner, jinak fallback na uploaded_by.
create or replace function public.get_expiring_documents()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(row_to_json(r)),
    '[]'::jsonb
  )
  from (
    select
      d.id                                                 as document_id,
      d.name                                               as document_name,
      d.category::text                                     as category,
      d.expires_at,
      (d.expires_at - current_date)                        as days_before,
      coalesce(pr.name, pr2.name)                          as property_name,
      coalesce(pr.owner_id, pr2.owner_id, d.uploaded_by)   as owner_id,
      prof.email                                           as owner_email,
      prof.full_name                                       as owner_name
    from public.documents d
    left join public.properties pr   on pr.id  = d.property_id
    left join public.leases     l    on l.id   = d.lease_id
    left join public.properties pr2  on pr2.id = l.property_id
    join public.profiles prof
      on prof.id = coalesce(pr.owner_id, pr2.owner_id, d.uploaded_by)
    where d.expires_at is not null
      and (d.expires_at - current_date) in (60, 30, 14)
      and not ((d.expires_at - current_date) = any(d.notification_sent_days))
  ) r
$$;

grant execute on function public.get_expiring_documents() to service_role;

-- 3. Atomické označení odeslaného thresholdu (idempotentní)
create or replace function public.mark_document_alert_sent(
  p_document_id uuid,
  p_days        int
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.documents
  set notification_sent_days = array_append(notification_sent_days, p_days)
  where id = p_document_id
    and not (p_days = any(notification_sent_days));
$$;

grant execute on function public.mark_document_alert_sent(uuid, int) to service_role;

-- 4. pg_cron: denně 06:00 UTC = 07:00 CET (v létě 08:00 CEST — pg_cron běží v UTC)
--    Service role key z Vaultu — stejný vzor jako reminder-cron-daily.
select cron.schedule(
  'document-expiry-alert-daily',
  '0 6 * * *',
  $$
    select net.http_post(
      url     := 'https://mzuhyynwsnypqjvshyrb.supabase.co/functions/v1/document-expiry-alert',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'cron_service_role_key'
          limit 1
        )
      ),
      body    := '{}'::jsonb
    )
  $$
);
