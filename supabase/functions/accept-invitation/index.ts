/**
 * accept-invitation — zpracuje přijetí pozvánky nájemníkem nebo členem organizace.
 *
 * verify_jwt je záměrně false — tuto funkci volají nepřihlášení uživatelé,
 * kteří si teprve vytváří účet. Autentizace je zajištěna jednorazovým
 * invitation tokenem (platnost 72 h, single-use).
 *
 * Bezpečnostní vrstva bez JWT:
 *   1. Dynamický CORS whitelist (ALLOWED_ORIGINS)
 *   2. IP-based rate limiting — max 10 pokusů/hod na IP (audit_logs)
 *   3. Validace vstupu (délka jména, min. délka hesla)
 *   4. Token: single-use (status → accepted), expiry check
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

const MIN_PASSWORD_LENGTH = 8
const RATE_LIMIT_MAX = 10
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getClientIp(req: Request): string | null {
  return (
    req.headers.get('CF-Connecting-IP') ??
    req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    null
  )
}

async function isRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'invitation_failed')
    .eq('ip_address', ip)
    .gte('created_at', since)
  return (count ?? 0) >= RATE_LIMIT_MAX
}

async function logAttempt(
  action: 'invitation_accepted' | 'invitation_failed',
  ip: string | null,
  meta: Record<string, unknown>,
) {
  await admin.from('audit_logs').insert({
    user_id: null,
    action,
    metadata: meta,
    ip_address: ip,
  }).maybeSingle()
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin')
  const ip = getClientIp(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, origin)
  }

  // ── Rate limit check ────────────────────────────────────────────────────────
  if (await isRateLimited(ip)) {
    await logAttempt('invitation_failed', ip, { reason: 'rate_limited' })
    return json({ error: 'too_many_attempts' }, 429, origin)
  }

  try {
    const body: RequestBody = await req.json()
    const { token, name, password } = body

    if (!token || !name || !password) {
      await logAttempt('invitation_failed', ip, { reason: 'missing_fields' })
      return json({ error: 'missing_fields' }, 400, origin)
    }

    // ── Input validation ──────────────────────────────────────────────────────
    if (name.trim().length < 2 || name.length > 255) {
      await logAttempt('invitation_failed', ip, { reason: 'invalid_name' })
      return json({ error: 'invalid_name' }, 400, origin)
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      await logAttempt('invitation_failed', ip, { reason: 'password_too_short' })
      return json({ error: 'password_too_short' }, 400, origin)
    }

    // ── Token verification ────────────────────────────────────────────────────
    const { data: invitation, error: invErr } = await admin
      .from('invitations')
      .select('id, email, tenant_id, status, expires_at')
      .eq('token', token)
      .single()

    if (invErr || !invitation) {
      await logAttempt('invitation_failed', ip, { reason: 'not_found' })
      return json({ error: 'not_found' }, 404, origin)
    }
    if (invitation.status !== 'pending') {
      await logAttempt('invitation_failed', ip, { reason: 'already_used' })
      return json({ error: 'used' }, 409, origin)
    }
    if (new Date(invitation.expires_at) < new Date()) {
      await logAttempt('invitation_failed', ip, { reason: 'expired' })
      return json({ error: 'expired' }, 410, origin)
    }

    // ── Create auth user ──────────────────────────────────────────────────────
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      user_metadata: { full_name: name.trim() },
      email_confirm: false,
    })

    if (createErr) {
      const msg = createErr.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        await logAttempt('invitation_failed', ip, { reason: 'already_registered' })
        return json({ error: 'already_registered' }, 409, origin)
      }
      throw createErr
    }

    const userId = userData.user.id
    const needsConfirmation = !userData.user.email_confirmed_at

    // ── Mark invitation as used (single-use) ─────────────────────────────────
    await admin
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // ── Link tenant record ────────────────────────────────────────────────────
    if (invitation.tenant_id) {
      await admin
        .from('tenants')
        .update({ user_id: userId })
        .eq('id', invitation.tenant_id)
    }

    await logAttempt('invitation_accepted', ip, {
      user_id: userId,
      invitation_id: invitation.id,
    })

    return json({ needsConfirmation }, 200, origin)
  } catch (err) {
    console.error('[accept-invitation] chyba:', err)
    await logAttempt('invitation_failed', ip, { reason: 'internal_error' })
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
