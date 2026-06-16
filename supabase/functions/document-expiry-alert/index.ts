/**
 * document-expiry-alert — daily document expiry dispatcher
 *
 * 1 pass per run, 3 thresholds (60 / 30 / 14 days before expires_at):
 *   • in-app notification for the owner — ALWAYS (primary record)
 *   • email via Resend — only when RESEND_API_KEY is configured (best effort)
 *
 * Dedup: documents.notification_sent_days int[] — each threshold fires once.
 * Marked via mark_document_alert_sent() right after the notification insert,
 * so a failed email never causes duplicate notifications the next day.
 *
 * Trigger: POST /functions/v1/document-expiry-alert (pg_cron, 06:00 UTC)
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
    console.warn('[document-expiry-alert] get_resend_api_key error', error.message)
    return null
  }
  RESEND_API_KEY = (data as string | null) || null
  return RESEND_API_KEY
}

const FROM_EMAIL = 'EstatIQ <onboarding@resend.dev>'

// ─── types ────────────────────────────────────────────────────────────────────

interface ExpiringDocumentRow {
  document_id:   string
  document_name: string
  category:      string
  expires_at:    string
  days_before:   number
  property_name: string | null
  owner_id:      string
  owner_email:   string
  owner_name:    string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  najemni_smlouva:    'Nájemní smlouva',
  predavaci_protokol: 'Předávací protokol',
  pojistka:           'Pojistka',
  faktura:            'Faktura',
  korespondence:      'Korespondence',
  revize:             'Revize',
  jine:               'Dokument',
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

  await resolveResendKey(supabase)

  const { data, error } = await supabase.rpc('get_expiring_documents')
  if (error) {
    console.error('[document-expiry-alert] query error', error.message)
    return json({ error: error.message }, 500)
  }

  const rows = (data ?? []) as ExpiringDocumentRow[]
  let notified = 0, emailsSent = 0, errors = 0

  for (const row of rows) {
    const label = CATEGORY_LABELS[row.category] ?? 'Dokument'

    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        user_id:   row.owner_id,
        type:      'document_expiry',
        channel:   'in_app',
        title:     `${label} vyprší za ${row.days_before} dní`,
        body:      `${label} „${row.document_name}"${row.property_name ? ` (${row.property_name})` : ''} vyprší ${fmtDate(row.expires_at)}. Zkontrolujte ji a včas obnovte.`,
        ref_table: 'documents',
        ref_id:    row.document_id,
        metadata:  {
          document_id: row.document_id,
          days_before: row.days_before,
          expires_at:  row.expires_at,
          category:    row.category,
        },
      })

    if (notifErr) {
      console.error('[document-expiry-alert] notification insert error', row.document_id, notifErr.message)
      errors++
      continue
    }

    // Mark immediately — the in-app notification is the primary record;
    // a failed email below must not re-fire this threshold tomorrow.
    const { error: markErr } = await supabase.rpc('mark_document_alert_sent', {
      p_document_id: row.document_id,
      p_days:        row.days_before,
    })
    if (markErr) {
      console.error('[document-expiry-alert] mark error', row.document_id, markErr.message)
      errors++
      continue
    }
    notified++

    if (!RESEND_API_KEY) continue

    try {
      await sendEmail({
        to:      row.owner_email,
        subject: `${label} vyprší za ${row.days_before} dní — ${row.document_name}`,
        html:    templateExpiry(row, label),
      })
      emailsSent++
    } catch (e) {
      console.error('[document-expiry-alert] email error', row.document_id, (e as Error).message)
      errors++
    }
  }

  const summary = {
    found:       rows.length,
    notified,
    emails_sent: emailsSent,
    emails_skipped: RESEND_API_KEY ? 0 : notified,
    errors,
  }
  console.log('[document-expiry-alert]', JSON.stringify(summary))
  return json({ success: true, ...summary })
})

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

// ─── Email template ───────────────────────────────────────────────────────────

function templateExpiry(row: ExpiringDocumentRow, label: string): string {
  const urgencyColor = row.days_before <= 14 ? '#ef4444' : row.days_before <= 30 ? '#f59e0b' : '#10b981'

  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1a1a2e">${esc(label)} brzy vyprší</h2>
    <p style="margin:0 0 24px;color:#6b7280">
      Dokument <strong>${esc(row.document_name)}</strong> vyprší
      <strong style="color:${urgencyColor}">za ${row.days_before} dní</strong>.
      Doporučujeme včas zajistit obnovu.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Dokument</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${esc(row.document_name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Kategorie</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${esc(label)}</td>
      </tr>
      ${row.property_name ? `<tr>
        <td style="padding:12px 0;color:#6b7280;border-bottom:1px solid #f0f0f0">Nemovitost</td>
        <td style="padding:12px 0;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0">${esc(row.property_name)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:12px 0;color:#6b7280">Platnost do</td>
        <td style="padding:12px 0;font-weight:700;font-size:18px;text-align:right;color:${urgencyColor};font-variant-numeric:tabular-nums">${fmtDate(row.expires_at)}</td>
      </tr>
    </table>

    <p style="margin:0;color:#9ca3af;font-size:13px">
      Detail dokumentu najdete v EstatIQ dashboardu. Tento e-mail byl odeslán automaticky.
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
