/**
 * reminder-cron — daily payment reminder dispatcher
 *
 * 3 passes per run (Europe/Prague timezone):
 *   T-5   → pending, due in 5 days  → email tenant  (QR code + CTA)
 *   T+7   → overdue, 7 days late    → email tenant  (firm reminder)
 *   T+14  → overdue, 14 days late   → email OWNER   (intervention request)
 *
 * RESEND_API_KEY: read from env when set, otherwise from Vault via the
 * service-role-only RPC get_resend_api_key(). Without a key the function
 * returns early — no DB writes, no crashes.
 *
 * Trigger: POST /functions/v1/reminder-cron
 *   Authorization: Bearer <SERVICE_ROLE_KEY>
 *   Body: {} (no params needed)
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── env ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
let RESEND_API_KEY: string | null =
  Deno.env.get('resend_api_key') ?? Deno.env.get('RESEND_API_KEY') ?? null

/** Vault fallback — Edge Function secrets nejsou propojené s Vaultem. */
async function resolveResendKey(supabase: SupabaseClient): Promise<string | null> {
  if (RESEND_API_KEY) return RESEND_API_KEY
  const { data, error } = await supabase.rpc('get_resend_api_key')
  if (error) {
    console.warn('[reminder-cron] get_resend_api_key error', error.message)
    return null
  }
  RESEND_API_KEY = (data as string | null) || null
  return RESEND_API_KEY
}

const FROM_EMAIL = 'EstatIQ <onboarding@resend.dev>'

// ─── types ────────────────────────────────────────────────────────────────────

interface TenantPaymentRow {
  payment_id:       string
  amount:           number
  due_date:         string
  qr_payload:       string | null
  variable_symbol:  string | null
  tenant_email:     string
  tenant_name:      string
  property_name:    string
  property_address: string
}

interface OwnerPaymentRow {
  payment_id:     string
  amount:         number
  due_date:       string
  tenant_name:    string
  property_name:  string
  property_address: string
  owner_email:    string
  owner_name:     string | null
}

interface PassResult {
  found:  number
  sent:   number
  errors: number
}

// ─── entry point ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  if (!(await resolveResendKey(supabase))) {
    console.warn('[reminder-cron] RESEND_API_KEY not set (env ani Vault) — emails skipped, no DB writes')
    return json({ skipped: true, reason: 'RESEND_API_KEY not configured' })
  }

  const [tMinus5, tPlus7, tPlus14] = await Promise.all([
    passTMinus5(supabase),
    passTPlus7(supabase),
    passTPlus14(supabase),
  ])

  const summary = { t_minus5: tMinus5, t_plus7: tPlus7, t_plus14: tPlus14 }
  console.log('[reminder-cron]', JSON.stringify(summary))
  return json({ success: true, ...summary })
})

// ─── Pass 1: T-5 → tenant reminder + QR code ─────────────────────────────────

async function passTMinus5(supabase: SupabaseClient): Promise<PassResult> {
  const { data, error } = await supabase.rpc('get_payments_t_minus5')
  if (error) {
    console.error('[T-5] query error', error.message)
    return { found: 0, sent: 0, errors: 1 }
  }

  const rows = (data ?? []) as TenantPaymentRow[]
  let sent = 0, errors = 0

  for (const row of rows) {
    try {
      await sendEmail({
        to:      row.tenant_email,
        subject: `Připomínáme platbu nájmu — ${fmtDate(row.due_date)}`,
        html:    templateTMinus5(row),
      })
      await markSent(supabase, row.payment_id, 'reminder_t_minus5_sent_at')
      sent++
    } catch (e) {
      console.error('[T-5] send error', row.payment_id, (e as Error).message)
      errors++
    }
  }

  return { found: rows.length, sent, errors }
}

// ─── Pass 2: T+7 → tenant overdue warning ────────────────────────────────────

async function passTPlus7(supabase: SupabaseClient): Promise<PassResult> {
  const { data, error } = await supabase.rpc('get_payments_t_plus7')
  if (error) {
    console.error('[T+7] query error', error.message)
    return { found: 0, sent: 0, errors: 1 }
  }

  const rows = (data ?? []) as TenantPaymentRow[]
  let sent = 0, errors = 0

  for (const row of rows) {
    try {
      await sendEmail({
        to:      row.tenant_email,
        subject: `Platba nájmu je po splatnosti — ${fmtDate(row.due_date)}`,
        html:    templateTPlus7(row),
      })
      await markSent(supabase, row.payment_id, 'reminder_t_plus7_sent_at')
      sent++
    } catch (e) {
      console.error('[T+7] send error', row.payment_id, (e as Error).message)
      errors++
    }
  }

  return { found: rows.length, sent, errors }
}

// ─── Pass 3: T+14 → owner intervention request ───────────────────────────────

async function passTPlus14(supabase: SupabaseClient): Promise<PassResult> {
  const { data, error } = await supabase.rpc('get_payments_t_plus14')
  if (error) {
    console.error('[T+14] query error', error.message)
    return { found: 0, sent: 0, errors: 1 }
  }

  const rows = (data ?? []) as OwnerPaymentRow[]
  let sent = 0, errors = 0

  for (const row of rows) {
    try {
      await sendEmail({
        to:      row.owner_email,
        subject: `Nájemník neplatí — ${row.property_name} (${row.tenant_name})`,
        html:    templateTPlus14(row),
      })
      await markSent(supabase, row.payment_id, 'reminder_t_plus14_sent_at')
      sent++
    } catch (e) {
      console.error('[T+14] send error', row.payment_id, (e as Error).message)
      errors++
    }
  }

  return { found: rows.length, sent, errors }
}

// ─── Resend ───────────────────────────────────────────────────────────────────

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [opts.to],
      subject: opts.subject,
      html:    opts.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

async function markSent(
  supabase: SupabaseClient,
  paymentId: string,
  column: 'reminder_t_minus5_sent_at' | 'reminder_t_plus7_sent_at' | 'reminder_t_plus14_sent_at',
): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({ [column]: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) throw new Error(`markSent: ${error.message}`)
}

// ─── Email templates ──────────────────────────────────────────────────────────

function templateTMinus5(row: TenantPaymentRow): string {
  const qrBlock = row.qr_payload
    ? `<p style="margin:24px 0 8px">QR kód pro rychlou platbu:</p>
       <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(row.qr_payload)}"
            alt="QR platba" width="200" height="200" style="border-radius:8px" />`
    : ''

  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1a1a2e">Připomínáme platbu nájmu</h2>
    <p style="margin:0 0 24px;color:#6b7280">Blíží se termín vaší platby nájmu.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Nemovitost</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${esc(row.property_name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Splatnost</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${fmtDate(row.due_date)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280">Částka</td>
        <td style="padding:12px 0;font-weight:700;font-size:20px;text-align:right;color:#10b981;font-variant-numeric:tabular-nums">${fmtAmount(row.amount)}</td>
      </tr>
      ${row.variable_symbol ? `<tr>
        <td style="padding:12px 0;color:#6b7280;border-top:1px solid #f0f0f0">Variabilní symbol</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-top:1px solid #f0f0f0;font-variant-numeric:tabular-nums">${esc(row.variable_symbol)}</td>
      </tr>` : ''}
    </table>

    ${qrBlock}

    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px">
      Tato zpráva byla odeslána automaticky systémem EstatIQ. Pokud jste platbu již odeslali, tento e-mail ignorujte.
    </p>
  `)
}

function templateTPlus7(row: TenantPaymentRow): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1a1a2e">Platba nájmu je po splatnosti</h2>
    <p style="margin:0 0 24px;color:#6b7280">
      Evidujeme nezaplacenou platbu nájmu za nemovitost <strong>${esc(row.property_name)}</strong>.
      Prosíme o neprodlené vyrovnání.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Splatnost</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${fmtDate(row.due_date)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Po splatnosti</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;color:#ef4444">7 dní</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280">Dlužná částka</td>
        <td style="padding:12px 0;font-weight:700;font-size:20px;text-align:right;color:#ef4444;font-variant-numeric:tabular-nums">${fmtAmount(row.amount)}</td>
      </tr>
      ${row.variable_symbol ? `<tr>
        <td style="padding:12px 0;color:#6b7280;border-top:1px solid #f0f0f0">Variabilní symbol</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-top:1px solid #f0f0f0;font-variant-numeric:tabular-nums">${esc(row.variable_symbol)}</td>
      </tr>` : ''}
    </table>

    ${row.qr_payload ? `<p style="margin:0 0 8px;color:#6b7280">QR kód pro platbu:</p>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(row.qr_payload)}"
         alt="QR platba" width="200" height="200" style="border-radius:8px;margin-bottom:24px" />` : ''}

    <p style="margin:0;color:#9ca3af;font-size:13px">
      Pokud jste platbu odeslali, dojde k automatickému zpracování. Máte-li dotaz, odpovězte na tento e-mail.
    </p>
  `)
}

function templateTPlus14(row: OwnerPaymentRow): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1a1a2e">Nájemník neprovedl platbu — vyžaduje vaši pozornost</h2>
    <p style="margin:0 0 24px;color:#6b7280">
      Platba za <strong>${esc(row.property_name)}</strong> je již <strong>14 dní po splatnosti</strong>.
      Doporučujeme přímý kontakt s nájemníkem.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Nájemník</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${esc(row.tenant_name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Nemovitost</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${esc(row.property_name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Splatnost</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${fmtDate(row.due_date)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280">Dlužná částka</td>
        <td style="padding:12px 0;font-weight:700;font-size:20px;text-align:right;color:#ef4444;font-variant-numeric:tabular-nums">${fmtAmount(row.amount)}</td>
      </tr>
    </table>

    <p style="margin:0;color:#9ca3af;font-size:13px">
      Celou historii plateb najdete v EstatIQ dashboardu. Tento e-mail byl odeslán automaticky.
    </p>
  `)
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter',system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td>
      <table width="600" cellpadding="0" cellspacing="0" align="center"
             style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);max-width:100%">
        <tr>
          <td style="background:#0b0f19;padding:24px 32px">
            <span style="color:#10b981;font-weight:700;font-size:18px;letter-spacing:-.5px">EstatIQ</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            ${content}
          </td>
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

// ─── utils ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtAmount(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency', currency: 'CZK', maximumFractionDigits: 0,
  }).format(amount)
}

/** Escape HTML special chars to prevent injection in email templates. */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
