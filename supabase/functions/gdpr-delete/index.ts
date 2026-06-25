/**
 * gdpr-delete — GDPR čl. 17 právo na výmaz
 *
 * POST /functions/v1/gdpr-delete
 *   Authorization: Bearer <USER_JWT>
 *   Body: { "confirm": "SMAZAT" }
 *
 * Strategie: anonymizace osobních atributů + smazání auth účtu.
 * Finanční záznamy (Payment, Expense, TaxExport, Lease) zůstávají — zákon
 * č. 563/1991 Sb. ukládá archivaci 5–10 let; osobní data jsou z nich odstraněna.
 *
 * Pořadí kroků:
 * 1. Ověřit JWT a požadavek na potvrzení
 * 2. Vložit audit log záznam (před smazáním, aby byl dohledatelný)
 * 3. Anonymizovat profil (full_name, phone → null; email setrvá jen v auth.users)
 * 4. Anonymizovat nájemníky (full_name → "Anonymizovaný nájemník", email/phone → null)
 * 5. Smazat dokumenty / notifikace / pozvánky (nevyžadovány zákonem)
 * 6. Smazat auth.users záznam → kaskádou smaže profiles row
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!

const ALLOWED_ORIGINS: string[] = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://estat-iq.vercel.app,http://localhost:5173,http://localhost:3000'
).split(',').map((s) => s.trim()).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function err(msg: string, status = 400, origin: string | null = null) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') return err('Metoda není povolena', 405, origin)

  // ── Ověření identity ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return err('Chybí autorizační token', 401, origin)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return err('Neplatný token', 401, origin)

  // ── Povinné potvrzení ────────────────────────────────────────────────────────
  let body: { confirm?: string } = {}
  try { body = await req.json() } catch { /* prázdné tělo */ }
  if (body.confirm !== 'SMAZAT') {
    return err('Potvrzení vyžadováno: body.confirm musí být "SMAZAT"', 400, origin)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const userId = user.id

  // ── Audit log — zaznamenat PŘED smazáním (GDPR čl. 5 odst. 2) ───────────────
  await admin.from('audit_logs').insert({
    user_id:    userId,
    action:     'gdpr_account_deleted',
    metadata:   { email: user.email, requested_at: new Date().toISOString() },
    ip_address: req.headers.get('CF-Connecting-IP') ?? req.headers.get('X-Forwarded-For') ?? null,
  }).maybeSingle()

  // ── 1. Zjistit vlastněné property IDs ────────────────────────────────────────
  const { data: properties } = await admin
    .from('properties')
    .select('id')
    .eq('owner_id', userId)
  const propertyIds = (properties ?? []).map((p: { id: string }) => p.id)

  // ── 2. Anonymizovat profil ───────────────────────────────────────────────────
  await admin
    .from('profiles')
    .update({ full_name: null, phone: null, avatar_url: null })
    .eq('id', userId)

  // ── 3. Anonymizovat nájemníky (osobní data) ──────────────────────────────────
  if (propertyIds.length > 0) {
    await admin
      .from('tenants')
      .update({
        full_name: 'Anonymizovaný nájemník',
        email: null,
        phone: null,
        id_number: null,
      })
      .eq('owner_id', userId)
  }

  // ── 4. Smazat záznamy bez zákonné retenční povinnosti ────────────────────────
  await admin.from('notifications').delete().eq('user_id', userId)
  await admin.from('invitations').delete().eq('invited_by', userId)

  if (propertyIds.length > 0) {
    const { data: leases } = await admin
      .from('leases')
      .select('id')
      .in('property_id', propertyIds)
    const leaseIds = (leases ?? []).map((l: { id: string }) => l.id)

    if (leaseIds.length > 0) {
      await admin.from('documents').delete().in('lease_id', leaseIds)
    }
    await admin.from('documents').delete().eq('uploaded_by', userId)
  }

  // ── 5. Smazat auth účet (kaskádou smaže profiles) ───────────────────────────
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteErr) {
    console.error('[gdpr-delete] deleteUser error', deleteErr.message)
    return err('Nepodařilo se smazat účet', 500, origin)
  }

  return new Response(JSON.stringify({ deleted: true }), {
    status: 200,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
})
