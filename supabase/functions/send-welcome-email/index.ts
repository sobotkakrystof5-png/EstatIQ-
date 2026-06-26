/**
 * send-welcome-email — pošle uvítací e-mail po úspěšném ověření registrace.
 *
 * Voláno klientem ihned po verifyOtp(), s Authorization: Bearer <access_token>.
 * RESEND_API_KEY musí být nastaven jako Supabase Secret.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? Deno.env.get('resend_api_key') ?? null
const FROM_EMAIL        = 'EstatIQ <noreply@estatiq.cz>'

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }
  if (req.method !== 'POST') return err('Method Not Allowed', 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return err('Unauthorized', 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth:   { persistSession: false },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  if (!RESEND_API_KEY) {
    console.warn('[send-welcome-email] RESEND_API_KEY není nastaven')
    return ok({ skipped: true })
  }

  const name = (user.user_metadata?.full_name as string | undefined) ?? 'pronajímateli'
  const email = user.email!

  const html = buildEmail(name)

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [email],
      subject: 'Vítejte v EstatIQ — pronájem, který se řídí sám.',
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[send-welcome-email] Resend error:', body)
    return err('Failed to send email', 500)
  }

  return ok({ sent: true })
})

function buildEmail(name: string): string {
  const firstName = name.split(' ')[0]
  const body = `
    <h1 style="margin:0 0 8px;color:#0b0f19;font-size:24px;font-weight:700;line-height:1.3">
      Vítejte, ${esc(firstName)}!
    </h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
      Váš účet EstatIQ je ověřen a připraven k použití. Teď stačí přidat první nemovitost a EstatIQ začne pracovat za vás.
    </p>

    <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0 0 12px;color:#166534;font-weight:600;font-size:14px">Co vás čeká v prvních 5 minutách:</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#374151;font-size:14px;line-height:2">
        <li>Přidejte svou první nemovitost</li>
        <li>Vytvořte nájemní smlouvu a pozvěte nájemníka</li>
        <li>Platby a upomínky pak jedou automaticky</li>
      </ul>
    </div>

    <a href="https://app.estatiq.cz/onboarding"
       style="display:inline-block;background:#10b981;color:#ffffff;font-weight:600;
              font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;
              margin-bottom:28px">
      Začít teď →
    </a>

    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">
      Pokud jste si účet nevytvořili vy, kontaktujte nás na
      <a href="mailto:support@estatiq.cz" style="color:#10b981">support@estatiq.cz</a>.
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
            <span style="color:#10b981;font-weight:700;font-size:18px;letter-spacing:-.5px">Estat<span style="color:#ffffff">IQ</span></span>
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

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function err(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
