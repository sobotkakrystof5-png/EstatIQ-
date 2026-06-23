import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

// ── E-mail translations ───────────────────────────────────────────────────────
interface EmailCopy {
  subject: string
  badge: string
  title: string
  body1: string
  body2: string
  f1: string
  f2: string
  f3: string
  footer: string
}

const EMAIL_COPY: Record<string, EmailCopy> = {
  cs: {
    subject: 'Jste na listině — EstatIQ',
    badge: '✓ POTVRZENO',
    title: 'Jste na listině!',
    body1: 'Děkujeme. Zařadili jsme vás do waitlistu EstatIQ.',
    body2: 'Jakmile spustíme — dostanete přístup jako jedni z prvních. Žádný marketing, jen jedno oznámení: „Je to tady."',
    f1: 'Platby, upomínky a QR kódy — automaticky každý měsíc',
    f2: 'Daňový export připravený pro účetního — kliknutím',
    f3: 'Nájemnický portál — transparentnost bez WhatsAppu',
    footer: 'Pokud jste si waitlist neobjednali, tento e-mail ignorujte.',
  },
  en: {
    subject: "You're on the list — EstatIQ",
    badge: '✓ CONFIRMED',
    title: "You're on the list!",
    body1: "Thank you. We've added you to the EstatIQ waitlist.",
    body2: "When we launch, you'll be among the very first to get in. No spam — just one email: \"It's live.\"",
    f1: 'Payments, reminders and QR codes — automatic every month',
    f2: 'Tax export ready for your accountant — one click',
    f3: 'Tenant portal — transparency without WhatsApp',
    footer: "If you didn't sign up for the waitlist, please ignore this email.",
  },
  de: {
    subject: 'Sie sind auf der Liste — EstatIQ',
    badge: '✓ BESTÄTIGT',
    title: 'Sie sind auf der Liste!',
    body1: 'Danke. Wir haben Sie zur EstatIQ-Warteliste hinzugefügt.',
    body2: 'Wenn wir starten, gehören Sie zu den Ersten. Kein Spam — nur eine E-Mail: „Es ist live."',
    f1: 'Zahlungen, Erinnerungen und QR-Codes — automatisch jeden Monat',
    f2: 'Steuerexport fertig für den Buchhalter — ein Klick',
    f3: 'Mieterportal — Transparenz ohne WhatsApp',
    footer: 'Falls Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail.',
  },
  sk: {
    subject: 'Ste na zozname — EstatIQ',
    badge: '✓ POTVRDENÉ',
    title: 'Ste na zozname!',
    body1: 'Ďakujeme. Zaradili sme vás do waitlistu EstatIQ.',
    body2: 'Keď spustíme — dostanete prístup ako jedni z prvých. Žiadny marketing, len jedno oznámenie: „Je to tu."',
    f1: 'Platby, pripomienky a QR kódy — automaticky každý mesiac',
    f2: 'Daňový export pripravený pre účtovníka — kliknutím',
    f3: 'Nájomníčky portál — transparentnosť bez WhatsAppu',
    footer: 'Ak ste si waitlist neobjednali, tento e-mail ignorujte.',
  },
  fr: {
    subject: 'Vous êtes sur la liste — EstatIQ',
    badge: '✓ CONFIRMÉ',
    title: 'Vous êtes sur la liste !',
    body1: "Merci. Nous vous avons ajouté à la liste d'attente EstatIQ.",
    body2: "Au lancement, vous serez parmi les premiers à y accéder. Pas de spam — juste un e-mail : « C'est en ligne. »",
    f1: 'Paiements, rappels et QR codes — automatiques chaque mois',
    f2: 'Export fiscal prêt pour le comptable — en un clic',
    f3: 'Portail locataire — transparence sans WhatsApp',
    footer: "Si vous ne vous êtes pas inscrit, ignorez cet e-mail.",
  },
  es: {
    subject: 'Estás en la lista — EstatIQ',
    badge: '✓ CONFIRMADO',
    title: '¡Estás en la lista!',
    body1: 'Gracias. Te hemos añadido a la lista de espera de EstatIQ.',
    body2: "Cuando lancemos, serás de los primeros en acceder. Sin spam — solo un correo: «Ya está online.»",
    f1: 'Pagos, recordatorios y códigos QR — automáticos cada mes',
    f2: 'Exportación fiscal lista para el contable — un clic',
    f3: 'Portal del inquilino — transparencia sin WhatsApp',
    footer: "Si no te registraste, ignora este correo.",
  },
  ru: {
    subject: 'Вы в списке — EstatIQ',
    badge: '✓ ПОДТВЕРЖДЕНО',
    title: 'Вы в списке!',
    body1: 'Спасибо. Мы добавили вас в лист ожидания EstatIQ.',
    body2: "При запуске вы будете в числе первых. Никакого спама — только одно письмо: «Уже работает.»",
    f1: 'Платежи, напоминания и QR-коды — автоматически каждый месяц',
    f2: 'Налоговый экспорт готов для бухгалтера — одним кликом',
    f3: 'Портал арендатора — прозрачность без WhatsApp',
    footer: 'Если вы не регистрировались, проигнорируйте это письмо.',
  },
  zh: {
    subject: '您已加入候补名单 — EstatIQ',
    badge: '✓ 已确认',
    title: '您已加入候补名单！',
    body1: '感谢您。我们已将您添加到EstatIQ候补名单。',
    body2: '上线时，您将是最先获得访问权限的人。没有垃圾邮件——只有一封邮件："已上线。"',
    f1: '每月自动生成付款、提醒和二维码',
    f2: '一键生成会计税务报告PDF',
    f3: '租户门户——无需WhatsApp的透明沟通',
    footer: '如果您没有注册，请忽略此邮件。',
  },
}

const SUPPORTED_LOCALES = Object.keys(EMAIL_COPY)

function getCopy(locale: string): EmailCopy {
  return EMAIL_COPY[locale] ?? EMAIL_COPY['en']!
}

function buildConfirmEmail(email: string, locale: string): string {
  const c = getCopy(locale)
  const year = new Date().getFullYear()
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><style>
    body{font-family:-apple-system,sans-serif;background:#f8fafc;margin:0;padding:40px 20px}
    .card{background:#fff;border-radius:16px;padding:40px;max-width:520px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.06)}
    .logo{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:32px}
    .logo span{color:#10b981}
    .badge{display:inline-block;background:#ecfdf5;color:#059669;font-size:12px;font-weight:600;padding:5px 12px;border-radius:99px;margin-bottom:20px;letter-spacing:.04em}
    h1{font-size:24px;font-weight:700;color:#0f172a;margin:0 0 12px}
    p{font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px}
    .hl{color:#0f172a;font-weight:600}
    .features{background:#f8fafc;border-radius:12px;padding:20px 24px;margin:24px 0}
    .feature{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;font-size:14px;color:#475569}
    .feature:last-child{margin-bottom:0}
    .check{color:#10b981;font-weight:700;flex-shrink:0}
    .footer{margin-top:32px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px}
  </style></head><body><div class="card">
    <div class="logo">Estat<span>IQ</span></div>
    <div class="badge">${c.badge}</div>
    <h1>${c.title}</h1>
    <p>${c.body1} <span class="hl">${email}</span></p>
    <p>${c.body2}</p>
    <div class="features">
      <div class="feature"><span class="check">✓</span><span>${c.f1}</span></div>
      <div class="feature"><span class="check">✓</span><span>${c.f2}</span></div>
      <div class="feature"><span class="check">✓</span><span>${c.f3}</span></div>
    </div>
    <div class="footer">© ${year} EstatIQ · ${c.footer}</div>
  </div></body></html>`
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, locale = 'cs' } = req.body as { email?: string; locale?: string }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en'

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO waitlist_subscribers (email, locale, confirmed)
      VALUES (${normalizedEmail}, ${safeLocale}, true)
      ON CONFLICT (email) DO NOTHING
    `

    const [row] = await sql`
      SELECT COUNT(*)::int AS count FROM waitlist_subscribers
    ` as [{ count: number }]

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EstatIQ <noreply@yourdomain.com>',
        to: normalizedEmail,
        subject: getCopy(safeLocale).subject,
        html: buildConfirmEmail(normalizedEmail, safeLocale),
      }),
    })

    return res.status(200).json({ success: true, count: row.count })

  } catch (err) {
    console.error('waitlist-join error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
