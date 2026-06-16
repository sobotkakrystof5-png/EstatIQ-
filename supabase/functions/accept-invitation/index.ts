/**
 * accept-invitation — zpracuje přijetí pozvánky nájemníkem nebo členem organizace.
 *
 * Provádí se se service role, aby obešel RLS na tabulkách invitations a tenants.
 * Klient nevolá supabase.auth.signUp() přímo — vše se odehraje zde.
 *
 * POST body: { token: string, name: string, password: string }
 * Response:  { needsConfirmation: boolean }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface RequestBody {
  token: string
  name: string
  password: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  try {
    const body: RequestBody = await req.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      return json({ error: 'missing_fields' }, 400)
    }

    // 1. Ověř pozvánku (service role obchází RLS)
    const { data: invitation, error: invErr } = await admin
      .from('invitations')
      .select('id, email, tenant_id, status, expires_at')
      .eq('token', token)
      .single()

    if (invErr || !invitation) return json({ error: 'not_found' }, 404)
    if (invitation.status !== 'pending') return json({ error: 'used' }, 409)
    if (new Date(invitation.expires_at) < new Date()) return json({ error: 'expired' }, 410)

    // 2. Vytvoř auth uživatele (email_confirm: false = respektuje nastavení projektu)
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      user_metadata: { full_name: name },
      email_confirm: false,
    })

    if (createErr) {
      const msg = createErr.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return json({ error: 'already_registered' }, 409)
      }
      throw createErr
    }

    const userId = userData.user.id
    const needsConfirmation = !userData.user.email_confirmed_at

    // 3. Označ pozvánku jako přijatou — token je tím spotřebován
    await admin
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // 4. Propoj tenant záznam s novým auth uživatelem
    if (invitation.tenant_id) {
      await admin
        .from('tenants')
        .update({ user_id: userId })
        .eq('id', invitation.tenant_id)
    }

    return json({ needsConfirmation }, 200)
  } catch (err) {
    console.error('[accept-invitation] chyba:', err)
    return json({ error: 'internal_error' }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
