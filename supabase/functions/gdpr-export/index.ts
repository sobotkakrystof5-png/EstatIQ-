/**
 * gdpr-export — GDPR čl. 15/20 export osobních dat uživatele
 *
 * POST /functions/v1/gdpr-export
 *   Authorization: Bearer <USER_JWT>
 *
 * Vrací JSON archiv všech dat příslušejících přihlášenému uživateli.
 * Finanční záznamy (Payment, Expense, TaxExport) jsou zahrnuty — zákon
 * o účetnictví (zákon č. 563/1991 Sb.) vyžaduje jejich uchování 5–10 let.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Ověření identity uživatele ──────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Chybí autorizační token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Neplatný token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const userId = user.id

  // ── Fáze 1: nemovitosti (ostatní tabulky na nich závisí) ───────────────────
  const { data: propertiesData } = await admin
    .from('properties').select('*').eq('owner_id', userId)
  const propertyIds = (propertiesData ?? []).map((p: { id: string }) => p.id)

  // ── Fáze 2: nájmy (payments na nich závisí) ────────────────────────────────
  const { data: leasesData } = propertyIds.length > 0
    ? await admin.from('leases').select('*').in('property_id', propertyIds)
    : { data: [] }
  const leaseIds = (leasesData ?? []).map((l: { id: string }) => l.id)

  // ── Fáze 3: všechna zbývající data paralelně ────────────────────────────────
  const [
    profileRes,
    tenantsRes,
    paymentsRes,
    energyRes,
    docsRes,
    expensesRes,
    taxExportsRes,
    notificationsRes,
    subscriptionRes,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).single(),
    admin.from('tenants').select('*').eq('owner_id', userId),

    // payments: vazba přes lease_id, ne přímo na user
    leaseIds.length > 0
      ? admin.from('payments').select('*').in('lease_id', leaseIds)
      : Promise.resolve({ data: [] }),

    // energy_readings: vazba přes property_id
    propertyIds.length > 0
      ? admin.from('energy_readings').select('*').in('property_id', propertyIds)
      : Promise.resolve({ data: [] }),

    // documents: sloupec je uploaded_by, ne owner_id
    admin.from('documents').select('*').eq('uploaded_by', userId),

    // expenses: nemá owner_id, váže se přes property_id
    propertyIds.length > 0
      ? admin.from('expenses').select('*').in('property_id', propertyIds)
      : Promise.resolve({ data: [] }),

    // tax_exports: sloupec je user_id, ne owner_id
    admin.from('tax_exports').select('*').eq('user_id', userId),

    admin.from('notifications').select('*').eq('user_id', userId),
    admin.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id:         user.id,
      email:      user.email,
      created_at: user.created_at,
    },
    profile:        profileRes.data,
    subscription:   subscriptionRes.data,
    properties:     propertiesData ?? [],
    tenants:        tenantsRes.data ?? [],
    leases:         leasesData ?? [],
    payments:       paymentsRes.data ?? [],
    energy_readings: energyRes.data ?? [],
    documents:      docsRes.data ?? [],
    expenses:       expensesRes.data ?? [],
    tax_exports:    taxExportsRes.data ?? [],
    notifications:  notificationsRes.data ?? [],
  }

  const filename = `estatiq-export-${userId}-${new Date().toISOString().slice(0, 10)}.json`

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})
