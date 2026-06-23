import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

interface LaunchEmailCopy {
  subject: string
  title: string
  body1: string
  cta: string
  body2: string
}

const LAUNCH_COPY: Record<string, LaunchEmailCopy> = {
  cs: {
    subject: '🎉 EstatIQ je živé — váš přístup čeká',
    title: '🎉 Je to tady!',
    body1: 'Čekali jste a dočkali se. EstatIQ je spuštěný — a vy jste první na řadě.',
    cta: 'Vytvořit účet zdarma →',
    body2: 'Váš e-mail byl rezervován. Přihlaste se přes novou registraci.',
  },
  en: {
    subject: '🎉 EstatIQ is live — your access is ready',
    title: "🎉 It's live!",
    body1: "You waited. It's here. EstatIQ is live — and you're first in line.",
    cta: 'Create free account →',
    body2: 'Your email was reserved. Sign up with this address.',
  },
  de: {
    subject: '🎉 EstatIQ ist live — Ihr Zugang wartet',
    title: '🎉 Es ist live!',
    body1: 'Sie haben gewartet. Es ist da. EstatIQ ist live — und Sie sind an erster Stelle.',
    cta: 'Kostenloses Konto erstellen →',
    body2: 'Ihre E-Mail wurde reserviert. Registrieren Sie sich mit dieser Adresse.',
  },
  sk: {
    subject: '🎉 EstatIQ je živé — váš prístup čaká',
    title: '🎉 Je to tu!',
    body1: 'Čakali ste a dočkali sa. EstatIQ je spustený — a vy ste prví na rade.',
    cta: 'Vytvoriť účet zadarmo →',
    body2: 'Váš e-mail bol rezervovaný. Prihláste sa cez novú registráciu.',
  },
  fr: {
    subject: '🎉 EstatIQ est en ligne — votre accès vous attend',
    title: "🎉 C'est en ligne !",
    body1: "Vous avez attendu. C'est là. EstatIQ est en ligne — et vous êtes en tête de liste.",
    cta: 'Créer un compte gratuit →',
    body2: 'Votre e-mail a été réservé. Inscrivez-vous avec cette adresse.',
  },
  es: {
    subject: '🎉 EstatIQ está en vivo — tu acceso te espera',
    title: '🎉 ¡Ya está aquí!',
    body1: 'Esperaste. Ya está. EstatIQ está en vivo — y tú eres el primero.',
    cta: 'Crear cuenta gratis →',
    body2: 'Tu correo fue reservado. Regístrate con esta dirección.',
  },
  ru: {
    subject: '🎉 EstatIQ запущен — ваш доступ ждёт',
    title: '🎉 Уже работает!',
    body1: 'Вы ждали. Вот оно. EstatIQ запущен — и вы первые в очереди.',
    cta: 'Создать бесплатный аккаунт →',
    body2: 'Ваша почта зарезервирована. Зарегистрируйтесь с этим адресом.',
  },
  zh: {
    subject: '🎉 EstatIQ已上线——您的访问权限已就绪',
    title: '🎉 已上线！',
    body1: 'EstatIQ已上线——您排在最前面。',
    cta: '创建免费账户 →',
    body2: '您的邮箱已被预留。请使用此地址注册。',
  },
}

const SAFE_LOCALES = Object.keys(LAUNCH_COPY)

function buildLaunchEmail(locale: string, appUrl: string): string {
  const c = LAUNCH_COPY[locale] ?? LAUNCH_COPY['en']!
  const year = new Date().getFullYear()
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><style>
    body{font-family:-apple-system,sans-serif;background:#f8fafc;margin:0;padding:40px 20px}
    .card{background:#fff;border-radius:16px;padding:40px;max-width:520px;margin:0 auto}
    .logo{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:24px}
    .logo span{color:#10b981}
    h1{font-size:26px;font-weight:700;color:#0f172a;margin:0 0 16px}
    p{font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px}
    .cta{display:inline-block;background:#10b981;color:#fff !important;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin:8px 0 24px}
    .footer{font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px;margin-top:32px}
  </style></head><body><div class="card">
    <div class="logo">Estat<span>IQ</span></div>
    <h1>${c.title}</h1>
    <p>${c.body1}</p>
    <a class="cta" href="${appUrl}/auth/register">${c.cta}</a>
    <p>${c.body2}</p>
    <div class="footer">© ${year} EstatIQ</div>
  </div></body></html>`
}

interface Subscriber {
  email: string
  locale: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.headers['x-launch-secret']
  if (secret !== process.env.LAUNCH_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (req.method !== 'POST') return res.status(405).end()

  const sql = neon(process.env.DATABASE_URL!)
  const APP_URL = process.env.APP_URL ?? 'https://estat-iq.vercel.app'

  const subscribers = await sql`
    SELECT email, locale FROM waitlist_subscribers ORDER BY created_at ASC
  ` as Subscriber[]

  if (!subscribers.length) {
    return res.status(200).json({ sent: 0, total: 0 })
  }

  let sent = 0

  for (let i = 0; i < subscribers.length; i += 50) {
    const batch = subscribers.slice(i, i + 50)

    await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch.map(({ email, locale }) => {
        const safeLocale = SAFE_LOCALES.includes(locale) ? locale : 'en'
        const c = LAUNCH_COPY[safeLocale]!
        return {
          from: 'EstatIQ <noreply@yourdomain.com>',
          to: email,
          subject: c.subject,
          html: buildLaunchEmail(safeLocale, APP_URL),
        }
      })),
    })

    sent += batch.length

    if (i + 50 < subscribers.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return res.status(200).json({ sent, total: subscribers.length })
}
