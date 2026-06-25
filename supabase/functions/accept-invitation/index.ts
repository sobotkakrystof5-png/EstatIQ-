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

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface RequestBody {
  token: string
  name: string
  password: string
}

// Minimum password length for invited users
const MIN_PASSWORD_LENGTH = 8

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, origin)
  }

  try {
    const body: RequestBody = await req.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      return json({ error: 'missing_fields' }, 400, origin)
    }

    // Basic input validation
    if (name.trim().length < 2 || name.length > 255) {
      return json({ error: 'invalid_name' }, 400, origin)
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return json({ error: 'password_too_short' }, 400, origin)
    }

    // 1. Ověř pozvánku (service role obchází RLS)
    const { data: invitation, error: invErr } = await admin
      .from('invitations')
      .select('id, email, tenant_id, status, expires_at')
      .eq('token', token)
      .single()

    if (invErr || !invitation) return json({ error: 'not_found' }, 404, origin)
    if (invitation.status !== 'pending') return json({ error: 'used' }, 409, origin)
    if (new Date(invitation.expires_at) < new Date()) return json({ error: 'expired' }, 410, origin)

    // 2. Vytvoř auth uživatele
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      user_metadata: { full_name: name.trim() },
      email_confirm: false,
    })

    if (createErr) {
      const msg = createErr.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return json({ error: 'already_registered' }, 409, origin)
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

    return json({ needsConfirmation }, 200, origin)
  } catch (err) {
    console.error('[accept-invitation] chyba:', err)
    return json({ error: 'internal_error' }, 500, origin)
  }
})

function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
    },
  })
}
