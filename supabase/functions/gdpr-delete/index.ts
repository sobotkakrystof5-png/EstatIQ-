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
 * 2. Anonymizovat profil (full_name, phone → null; email setrvá jen v auth.users)
 * 3. Anonymizovat nájemníky (full_name → "Anonymizovaný nájemník", email/phone → null)
 * 4. Smazat dokumenty / notifikace / pozvánky (nevyžadovány zákonem)
 * 5. Smazat auth.users záznam → kaskádou smaže profiles row
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY        = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return err('Metoda není povolena', 405)

  // ── Ověření identity ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return err('Chybí autorizační token', 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return err('Neplatný token', 401)

  // ── Povinné potvrzení ────────────────────────────────────────────────────────
  let body: { confirm?: string } = {}
  try { body = await req.json() } catch { /* prázdné tělo */ }
  if (body.confirm !== 'SMAZAT') {
    return err('Potvrzení vyžadováno: body.confirm musí být "SMAZAT"')
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const userId = user.id

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
        id_number: null,  // schema: id_number, not national_id
      })
      .eq('owner_id', userId)
  }

  // ── 4. Smazat záznamy bez zákonné retenční povinnosti ────────────────────────
  await admin.from('notifications').delete().eq('user_id', userId)
  await admin.from('invitations').delete().eq('invited_by', userId)

  if (propertyIds.length > 0) {
    // Dokumenty jsou smazány (žádný zákon nevyžaduje uchovávat naskenované kopie)
    const { data: leases } = await admin
      .from('leases')
      .select('id')
      .in('property_id', propertyIds)
    const leaseIds = (leases ?? []).map((l: { id: string }) => l.id)

    if (leaseIds.length > 0) {
      await admin.from('documents').delete().in('lease_id', leaseIds)
    }
    // documents: uploaded_by je správný sloupec (schema nemá owner_id)
    await admin.from('documents').delete().eq('uploaded_by', userId)
  }

  // ── 5. Smazat auth účet (kaskádou smaže profiles) ───────────────────────────
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteErr) {
    console.error('[gdpr-delete] deleteUser error', deleteErr.message)
    return err('Nepodařilo se smazat účet: ' + deleteErr.message, 500)
  }

  return new Response(JSON.stringify({ deleted: true, user_id: userId }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
