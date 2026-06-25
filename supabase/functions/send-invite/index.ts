/**
 * send-invite — pošle nájemníkovi e-mail s pozvánkou do EstatIQ.
 *
 * Voláno z klienta s uživatelským JWT (Authorization: Bearer <access_token>).
 * RESEND_API_KEY musí být nastaveno jako Supabase Secret:
 *   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
 *
 * Body (JSON):
 *   { email, tenant_name, property_name, invite_link, expires_at }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('resend_api_key') ?? null
const FROM_EMAIL        = 'EstatIQ <noreply@estatiq.cz>'

interface InvitePayload {
  email:         string
  tenant_name:   string
  property_name: string
  invite_link:   string
  expires_at:    string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return err('Method Not Allowed', 405)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return err('Unauthorized', 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth:   { persistSession: false },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  // ── Resend key check ──────────────────────────────────────────────────────
  if (!RESEND_API_KEY) {
    console.warn('[send-invite] RESEND_API_KEY není nastaven — e-mail přeskočen')
    return ok({ skipped: true, reason: 'RESEND_API_KEY not configured' })
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  let payload: InvitePayload
  try {
    payload = await req.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const { email, tenant_name, property_name, invite_link, expires_at } = payload
  if (!email || !invite_link) return err('Chybí povinné pole email nebo invite_link', 400)

  // ── Send via Resend ───────────────────────────────────────────────────────
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [email],
      subject: `Pozvánka do EstatIQ — ${esc(property_name)}`,
      html:    buildInviteEmail({ email, tenant_name, property_name, invite_link, expires_at }),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[send-invite] Resend chyba', res.status, body)
    return err(`Resend error ${res.status}`, 502)
  }

  console.log('[send-invite] odeslán na', email)
  return ok({ sent: true, to: email })
})

// ── Email template ────────────────────────────────────────────────────────────

function buildInviteEmail(p: InvitePayload): string {
  const expiry = p.expires_at
    ? new Date(p.expires_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  const body = `
    <h2 style="margin:0 0 8px;color:#1a1a2e">Jste pozváni do EstatIQ</h2>
    <p style="margin:0 0 24px;color:#6b7280">
      Váš pronajímatel vás zve ke správě nájmu pro nemovitost
      <strong>${esc(p.property_name)}</strong>.
      Přijměte pozvánku a získáte přístup k platbám, smlouvám a kontaktu s pronajímatelem.
    </p>

    <a href="${p.invite_link}"
       style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;
              padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;
              margin-bottom:24px">
      Přijmout pozvánku
    </a>

    <p style="margin:24px 0 8px;color:#6b7280;font-size:14px">
      Nebo zkopírujte a vložte tento odkaz do prohlížeče:
    </p>
    <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#4b5563">
      ${p.invite_link}
    </p>

    ${expiry ? `
    <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:24px">
      <p style="margin:0;color:#9ca3af;font-size:13px">
        Platnost pozvánky vyprší: <strong style="color:#6b7280">${expiry}</strong>
      </p>
    </div>` : ''}

    <p style="margin:0;color:#9ca3af;font-size:12px">
      Tato pozvánka je určena výhradně pro ${esc(p.email)}.
      Pokud jste tuto pozvánku neočekávali, e-mail ignorujte.
    </p>
  `

  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter',system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td>
      <table width="600" cellpadding="0" cellspacing="0" align="center"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,.06);max-width:100%">
        <tr>
          <td style="background:#0b0f19;padding:24px 32px">
            <span style="color:#10b981;font-weight:700;font-size:18px;letter-spacing:-.5px">EstatIQ</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">${body}</td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center">
            <span style="color:#d1d5db;font-size:12px">© 2026 EstatIQ · Pronájem, který se řídí sám.</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function err(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
