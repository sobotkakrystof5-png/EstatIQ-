# EstatIQ

PropTech platforma pro správu nájmů. Řeší fragmentaci (Excel, WhatsApp, papírové faktury) a vytváří Single Source of Truth pro celý životní cyklus nájmu — od smlouvy po daňový export.

Live demo: https://estat-iq.vercel.app

---

## Tech stack

| Vrstva | Technologie |
|---|---|
| Frontend | React 18 + Vite, TypeScript (strict) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Animace | Framer Motion |
| Komponenty | Radix UI / Headless UI |
| Grafy | Recharts |
| Data fetching | TanStack Query (React Query) |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage, RLS) |
| Platby | Stripe |
| E-maily | Resend + React Email |
| Hosting | Vercel |
| i18n | react-i18next (cs, en, de, fr, es, zh, sk, ru) |

---

## Lokální setup

### 1. Závislosti

```bash
npm install
```

### 2. Proměnné prostředí

Zkopíruj `.env.example` do `.env.local` a vyplň hodnoty:

```bash
cp .env.example .env.local
```

Povinné proměnné:

| Proměnná | Kde získat |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |

Serverové proměnné (nastavit jako Supabase Edge Function Secrets, **nikdy** do `.env.local`):

```bash
supabase secrets set CUZK_USERNAME=...
supabase secrets set CUZK_PASSWORD=...
supabase secrets set RESEND_API_KEY=re_...
```

### 3. Supabase (lokální vývoj)

```bash
npx supabase start          # spustí lokální Supabase stack (Docker)
npx supabase db reset       # aplikuje migrace + seed
npx supabase gen types typescript --local > src/types/supabase.ts
```

Po každé změně schématu vždy znovu vygeneruj typy.

### 4. Spuštění

```bash
npm run dev        # Vite dev server na http://localhost:5173
npm run build      # produkční build (musí projít bez chyb)
npm run lint       # ESLint — vyžaduje 0 errors, 0 warnings
npm run typecheck  # tsc --noEmit
```

---

## Struktura projektu

```
src/
  app/              # routing, layouty (AppShell, AuthLayout, TenantLayout)
  components/ui/    # design systém (Button, Card, Input, Dialog, …)
  features/         # moduly podle domény:
    auth/           #   přihlášení, registrace, ochrana rout
    dashboard/      #   hlavní přehled, landing, login stránky
    properties/     #   nemovitosti + ČÚZK vyhledávání
    tenants/        #   nájemníci, pozvánky
    payments/       #   platební engine, QR kódy, exporty
    energy/         #   odečty měřičů, anomálie
    documents/      #   nahrávání, kategorizace, expiry alerts
    settings/       #   profil, tarify, GDPR, 2FA
    tenant-portal/  #   portál nájemníka (platby, smlouvy, závady)
    onboarding/     #   4-krokový wizard pro nové pronajímatele
    b2b/            #   B2B panel pro správcovské firmy
  hooks/            # sdílené hooky (useTheme, useCurrency, useProfile, …)
  i18n/             # config + locales/{cs,en,de,fr,es,zh,sk,ru}.json
  lib/              # supabase client, stripe, formatters, utils
  types/            # generované Supabase typy + doménové typy
supabase/
  migrations/       # SQL migrace (chronologické)
  functions/        # Edge Functions:
                    #   payment-scheduler, reminder-cron,
                    #   energy-anomaly-check, document-expiry-alert,
                    #   subscription-enforcement, gdpr-export
```

---

## Klíčové konvence

- **RLS je zapnuté na všech tabulkách** — každý dotaz musí respektovat hierarchii rolí (Super-Admin / Správce / Vlastník / Pronajímatel / Nájemník).
- **Žádná byznys logika v komponentách** — vše do hooků a `lib/`. Automatizované workflow výhradně do `supabase/functions/`.
- **i18n povinné** — žádný text natvrdo v JSX, vše přes `t('klic')`.
- **Částky vždy `tabular-nums`** + formátování přes `lib/formatters` (Intl).
- **TypeScript strict** — `any` je zakázané, build musí vždy projít.
- Commity: `feat:` / `fix:` / `refactor:` / `style:` / `chore:` / `i18n:`.
