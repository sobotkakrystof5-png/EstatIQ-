-- ─────────────────────────────────────────────────────────────────────────────
-- Cron auth via Supabase Vault (replaces unusable ALTER DATABASE settings)
--
-- The managed postgres role cannot run ALTER DATABASE SET app.* (error 42501),
-- so HTTP cron jobs authenticate with secrets stored in Vault instead:
--   • cron_service_role_key — the project service role key (sb_secret_… format;
--     must match what the platform injects into Edge Functions as
--     SUPABASE_SERVICE_ROLE_KEY)
--   • RESEND_API_KEY        — read by Edge Functions via get_resend_api_key(),
--     because Vault secrets are NOT exposed as Deno.env vars
--
-- Supersedes the cron.schedule + SETUP sections in:
--   20260611060000_reminder_cron.sql
--   20260611080000_document_expiry_alert.sql
--
-- On a fresh environment, recreate both secrets first:
--   select vault.create_secret('<value>', 'cron_service_role_key');
--   select vault.create_secret('<value>', 'RESEND_API_KEY');
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. RESEND key getter — service_role only (Edge Functions fallback when env unset)
create or replace function public.get_resend_api_key()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'RESEND_API_KEY'
  limit 1
$$;

revoke execute on function public.get_resend_api_key() from public, anon, authenticated;
grant execute on function public.get_resend_api_key() to service_role;

-- 2. reminder-cron daily 07:00 UTC — Vault-authenticated (idempotent re-schedule)
select cron.schedule(
  'reminder-cron-daily',
  '0 7 * * *',
  $$
    select net.http_post(
      url     := 'https://mzuhyynwsnypqjvshyrb.supabase.co/functions/v1/reminder-cron',
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

-- 3. document-expiry-alert daily 06:00 UTC — Vault-authenticated
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
