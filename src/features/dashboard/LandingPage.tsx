import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Star,
  CheckCircle2,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  Users,
  Zap,
  Shield,
  AlertCircle,
  Globe,
  Receipt,
  X,
  LayoutDashboard,
  CreditCard,
  Mail,
  Clock,
  Heart,
  Lock,
  Phone,
  Menu,
  Check,
  Minus,
  Home,
  Target,
  Lightbulb,
  MapPin,
  HeadphonesIcon,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cn } from '@/lib/utils'

// ── Animation constants ────────────────────────────────────────────────────────
const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE_OUT } },
}

const slideRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE_OUT } },
}

// ── Scroll helper ─────────────────────────────────────────────────────────────
function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

// ── InView section wrapper ────────────────────────────────────────────────────
function InViewSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      id={id}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'paid' | 'pending' | 'overdue' }) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    overdue: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const labels = { paid: 'Zaplaceno', pending: 'Čeká', overdue: 'Po splatnosti' }
  return (
    <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}

function Initials({ chars, color = 'emerald' }: { chars: string; color?: 'emerald' | 'indigo' | 'amber' }) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  }
  return (
    <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold', colors[color])}>
      {chars}
    </div>
  )
}

function Eyebrow({ label, dark = false }: { label: string; dark?: boolean }) {
  if (dark) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-900/30 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
      {label}
    </span>
  )
}

// ── Mock UI: Payments list ────────────────────────────────────────────────────
function PaymentsMockup() {
  const rows = [
    { chars: 'JN', color: 'emerald' as const, name: 'Jan Novák', prop: 'Vinohradská 42', amount: '18 500 Kč', status: 'paid' as const },
    { chars: 'MS', color: 'amber' as const, name: 'Marie Svobodová', prop: 'Korunní 8', amount: '12 000 Kč', status: 'overdue' as const },
    { chars: 'PD', color: 'indigo' as const, name: 'Petr Dvořák', prop: 'Mánesova 15', amount: '15 000 Kč', status: 'pending' as const },
    { chars: 'LH', color: 'emerald' as const, name: 'Lucie Horáčková', prop: 'Belgická 21', amount: '22 000 Kč', status: 'paid' as const },
  ]
  return (
    <motion.div variants={slideRight} className="relative w-full max-w-md">
      <div className="absolute -inset-6 rounded-3xl bg-emerald-500/6 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-surface-900 dark:border dark:border-surface-700">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-800">
          <span className="font-semibold text-surface-900 dark:text-surface-50">Platby — červen 2026</span>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp size={12} />
            <span className="tabular-nums">43 200 Kč</span>
          </div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-surface-50 px-5 py-3.5 last:border-0 dark:border-surface-800">
            <Initials chars={r.chars} color={r.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{r.name}</p>
              <p className="truncate text-xs text-surface-400">{r.prop}</p>
            </div>
            <span className="mr-2 tabular-nums text-sm font-semibold text-surface-900 dark:text-surface-50">{r.amount}</span>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Mock UI: Tenant portal ────────────────────────────────────────────────────
function TenantMockup() {
  return (
    <motion.div variants={slideLeft} className="relative w-full max-w-sm">
      <div className="absolute -inset-6 rounded-3xl bg-indigo-500/6 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-surface-900 dark:border dark:border-surface-700">
        <div className="bg-surface-950 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <span className="text-xs font-bold text-white">JN</span>
            </div>
            <div>
              <p className="text-[11px] text-surface-500">Portál nájemníka</p>
              <p className="text-sm font-semibold text-white">Jan Novák</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
            <p className="mb-0.5 text-xs text-emerald-600 dark:text-emerald-400">Příští platba</p>
            <p className="font-display text-2xl font-bold tabular-nums text-surface-900 dark:text-surface-50">18 500 Kč</p>
            <p className="mt-0.5 text-xs text-surface-500">Splatnost 1. 7. 2026</p>
            <div className="mt-3 rounded-lg bg-emerald-600 py-1.5 text-center text-xs font-medium text-white">
              Zaplatit přes QR kód
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-800/60">
            <span className="text-sm text-surface-600 dark:text-surface-300">Byt Vinohradská 42</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Aktivní</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-800/60">
            <FileText size={14} className="flex-shrink-0 text-surface-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-surface-600 dark:text-surface-300">Nájemní smlouva 2026.pdf</span>
            <ArrowRight size={12} className="flex-shrink-0 text-surface-400" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Mock UI: Energy chart ─────────────────────────────────────────────────────
function EnergyMockup() {
  const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
  const values = [42, 48, 38, 35, 30, 28, 25, 29, 34, 89, 72, 58]
  const maxVal = Math.max(...values)
  return (
    <motion.div variants={slideRight} className="relative w-full max-w-md">
      <div className="absolute -inset-6 rounded-3xl bg-amber-500/6 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-surface-900 dark:border dark:border-surface-700">
        <div className="px-5 pb-3 pt-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-400">Spotřeba elektřiny</p>
              <p className="font-semibold text-surface-900 dark:text-surface-50">Vinohradská 42</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              Anomálie
            </span>
          </div>
          <div className="flex h-28 items-end gap-1">
            {values.map((v, i) => {
              const isAnomaly = i === 9
              const pct = (v / maxVal) * 100
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                  <div
                    className={cn('w-full rounded-t-sm', isAnomaly ? 'bg-amber-500' : 'bg-emerald-400/50')}
                    style={{ height: `${pct}%` }}
                  />
                  {i % 3 === 0 && (
                    <span className="text-[9px] text-surface-400">{months[i]}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Spotřeba o 43 % nad průměrem</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">Říjen 2026 · Zkontrolujte nemovitost</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Mock UI: Documents list ───────────────────────────────────────────────────
function DocumentsMockup() {
  const docs = [
    { Icon: FileText, name: 'Nájemní smlouva — Novák', category: 'Smlouva', expires: '31. 12. 2026', warn: false },
    { Icon: Shield, name: 'Pojistka — Vinohradská 42', category: 'Pojistka', expires: '15. 3. 2026', warn: true },
    { Icon: FileText, name: 'Předávací protokol 2024', category: 'Protokol', expires: null, warn: false },
    { Icon: Receipt, name: 'Faktura — opravy 06/2026', category: 'Faktura', expires: null, warn: false },
  ]
  return (
    <motion.div variants={slideLeft} className="relative w-full max-w-md">
      <div className="absolute -inset-6 rounded-3xl bg-indigo-500/6 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-surface-900 dark:border dark:border-surface-700">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-800">
          <span className="font-semibold text-surface-900 dark:text-surface-50">Dokumenty</span>
          <span className="text-xs text-surface-400">4 soubory</span>
        </div>
        {docs.map((d, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-surface-50 px-5 py-3.5 last:border-0 dark:border-surface-800">
            <div className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
              d.warn ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-surface-100 dark:bg-surface-800'
            )}>
              <d.Icon size={14} className={d.warn ? 'text-amber-600 dark:text-amber-400' : 'text-surface-400'} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{d.name}</p>
              <p className="text-xs text-surface-400">
                {d.category}{d.expires ? ` · Vyprší ${d.expires}` : ''}
              </p>
            </div>
            {d.warn && (
              <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                30 dní
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Mock UI: Full dashboard ───────────────────────────────────────────────────
function DashboardMockup() {
  const statCards = [
    { label: 'Příjmy (červen)', value: '67 500 Kč', detail: '+8 %', color: 'emerald' },
    { label: 'Obsazenost', value: '6 / 7', detail: 'nemovitostí', color: 'indigo' },
    { label: 'Čekající platby', value: '2', detail: 'platby', color: 'amber' },
    { label: 'Platební morálka', value: '94 %', detail: 'za 3 měsíce', color: 'emerald' },
  ]
  const incomeMonths = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn']
  const incomeData = [42000, 55000, 48000, 61000, 58000, 67500]
  const maxIncome = Math.max(...incomeData)
  const sidebarIcons = [LayoutDashboard, Building2, Users, CreditCard, FileText, Zap]
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-800 bg-surface-950 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-surface-800 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/50" />
          <div className="h-3 w-3 rounded-full bg-amber-500/50" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
        </div>
        <span className="ml-2 text-xs text-surface-500">EstatIQ — Přehled</span>
      </div>
      <div className="flex">
        <div className="flex w-12 flex-shrink-0 flex-col items-center gap-3 border-r border-surface-800 py-4">
          {sidebarIcons.map((Icon, i) => (
            <div
              key={i}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                i === 0 ? 'bg-emerald-900/40 text-emerald-400' : 'text-surface-600',
              )}
            >
              <Icon size={14} />
            </div>
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="mb-4 grid grid-cols-4 gap-2">
            {statCards.map((s, i) => (
              <div key={i} className="rounded-xl border border-surface-800 bg-surface-900 p-3">
                <p className="text-[10px] text-surface-500">{s.label}</p>
                <p className="mt-1 font-display text-sm font-bold tabular-nums text-surface-50">{s.value}</p>
                <p className={cn(
                  'mt-0.5 text-[10px]',
                  s.color === 'emerald' ? 'text-emerald-400' :
                  s.color === 'amber' ? 'text-amber-400' : 'text-indigo-400',
                )}>{s.detail}</p>
              </div>
            ))}
          </div>
          <div className="mb-3 rounded-xl border border-surface-800 bg-surface-900 p-4">
            <p className="mb-3 text-[10px] text-surface-400">Příjmy — posledních 6 měsíců</p>
            <div className="flex h-16 items-end gap-2">
              {incomeData.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn('w-full rounded-t-sm', i === 5 ? 'bg-emerald-500' : 'bg-surface-700')}
                    style={{ height: `${(v / maxIncome) * 100}%` }}
                  />
                  <span className="text-[9px] text-surface-600">{incomeMonths[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-surface-800 bg-surface-900 p-3">
            <p className="mb-2 text-[10px] text-surface-400">Poslední platby</p>
            {[
              { n: 'Jan Novák', a: '18 500 Kč', paid: true },
              { n: 'Marie Svobodová', a: '12 000 Kč', paid: false },
              { n: 'Petr Dvořák', a: '15 000 Kč', paid: true },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-surface-400">{p.n}</span>
                <span className="tabular-nums text-[11px] text-surface-300">{p.a}</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px]',
                  p.paid ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400',
                )}>
                  {p.paid ? 'Zaplaceno' : 'Po splatnosti'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feature section template ──────────────────────────────────────────────────
interface FeaturePoint { title: string; desc: string }

function FeatureSection({
  eyebrow, title, subtitle, points, visual, reverse = false, bg = 'white', id,
}: {
  eyebrow: string; title: string; subtitle: string; points: FeaturePoint[]
  visual: React.ReactNode; reverse?: boolean; bg?: 'white' | 'gray'; id?: string
}) {
  return (
    <InViewSection id={id} className={cn('py-24', bg === 'gray' ? 'bg-surface-50 dark:bg-surface-900/40' : 'bg-white dark:bg-surface-950')}>
      <div className="mx-auto max-w-6xl px-6">
        <div className={cn('grid items-center gap-16 lg:grid-cols-2', reverse && 'lg:[&>*:first-child]:order-last')}>
          <div className="space-y-6">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                {eyebrow}
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold leading-tight tracking-tight text-surface-900 dark:text-surface-50">
              {title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg leading-relaxed text-surface-500 dark:text-surface-400">
              {subtitle}
            </motion.p>
            <motion.ul variants={stagger} className="space-y-4">
              {points.map((pt, i) => (
                <motion.li key={i} variants={fadeUp} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">{pt.title}</span>
                    <span className="text-sm text-surface-500 dark:text-surface-400"> — {pt.desc}</span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
          <div className="flex items-center justify-center">{visual}</div>
        </div>
      </div>
    </InViewSection>
  )
}

// ── Pricing section ───────────────────────────────────────────────────────────
const B2C_PLANS = [
  { key: 'free',      monthlyPrice: 0,   yearlyPrice: 0,    icon: CheckCircle2, isPopular: false },
  { key: 'starter',   monthlyPrice: 199, yearlyPrice: 1990, icon: Zap,          isPopular: false },
  { key: 'growth',    monthlyPrice: 349, yearlyPrice: 3490, icon: TrendingUp,   isPopular: false },
  { key: 'pro',       monthlyPrice: 549, yearlyPrice: 5490, icon: BarChart3,    isPopular: true  },
  { key: 'portfolio', monthlyPrice: 999, yearlyPrice: 9990, icon: Building2,    isPopular: false },
] as const

type B2cPlanKey = (typeof B2C_PLANS)[number]['key']

function PricingSection() {
  const { t } = useTranslation()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const b2bTierKeys = ['start', 'growth', 'scale', 'enterprise'] as const

  return (
    <InViewSection id="pricing" className="bg-surface-50 py-24 dark:bg-surface-900/40">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div variants={fadeUp} className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            {t('landing.footer.pricing')}
          </span>
          <h2 className="font-display mb-3 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-surface-500 dark:text-surface-400">{t('landing.pricing.subtitle')}</p>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-8 flex justify-center">
          <div className="flex items-center gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
            {(['monthly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                  billingCycle === cycle
                    ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                    : 'text-surface-500 hover:text-surface-700 dark:text-surface-400',
                )}
              >
                {t(`landing.pricing.billing${cycle.charAt(0).toUpperCase() + cycle.slice(1)}`)}
                {cycle === 'yearly' && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {t('landing.pricing.saveLabel')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {B2C_PLANS.map((plan, i) => {
            const Icon = plan.icon
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            const priceSuffix = billingCycle === 'yearly' ? t('landing.pricing.perYear') : t('landing.pricing.perMonth')
            const planKey = plan.key as B2cPlanKey
            return (
              <motion.div
                key={plan.key}
                variants={fadeUp}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  'relative flex flex-col rounded-2xl p-5',
                  plan.isPopular
                    ? 'bg-surface-950 text-surface-50 dark:bg-indigo-950 dark:border dark:border-indigo-800'
                    : 'bg-white shadow-card dark:bg-surface-900 dark:border dark:border-surface-800',
                )}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    {t('landing.pricing.badge')}
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg',
                    plan.isPopular
                      ? 'bg-indigo-800/60 text-indigo-300'
                      : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
                  )}>
                    <Icon size={14} />
                  </span>
                  <p className={cn('font-semibold', plan.isPopular ? 'text-white' : 'text-surface-900 dark:text-surface-50')}>
                    {t(`landing.pricing.${planKey}.name`)}
                  </p>
                </div>
                <div className="mb-1">
                  <span className={cn(
                    'font-display text-3xl font-bold tabular-nums',
                    plan.isPopular ? 'text-white' : 'text-surface-900 dark:text-surface-50',
                  )}>
                    {price === 0 ? '0' : price.toLocaleString('cs-CZ')}
                    {price > 0 && <span className="ml-0.5 text-base font-normal"> Kč</span>}
                  </span>
                </div>
                <p className={cn('mb-1 text-xs', plan.isPopular ? 'text-indigo-300' : 'text-surface-400')}>
                  {price === 0 ? t('landing.pricing.free.description') : priceSuffix}
                </p>
                <p className={cn('mb-4 text-xs font-medium', plan.isPopular ? 'text-indigo-200' : 'text-surface-500 dark:text-surface-400')}>
                  {t(`landing.pricing.${planKey}.limit`)}
                </p>
                <div className="mt-auto">
                  <Button variant={plan.isPopular ? 'primary' : 'outline'} size="sm" className="w-full" asChild>
                    <Link to="/auth/register">{t(`landing.pricing.${planKey}.cta`)}</Link>
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div variants={fadeUp} className="mt-8 overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
          <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center">
            <div className="flex-1">
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">{t('landing.pricing.b2b.title')}</p>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('landing.pricing.b2b.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {b2bTierKeys.map((tier) => (
                <span key={tier} className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-2 text-sm font-medium text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
                  {t(`landing.pricing.b2b.tiers.${tier}.name`)}
                  <span className="ml-1.5 text-surface-400">{t(`landing.pricing.b2b.tiers.${tier}.limit`)}</span>
                </span>
              ))}
            </div>
            <Button size="lg" className="flex-shrink-0" asChild>
              <Link to="/auth/register">{t('landing.pricing.b2b.cta')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </InViewSection>
  )
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-surface-100 dark:border-surface-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="pr-4 font-medium text-surface-900 dark:text-surface-50">{q}</span>
        <ChevronDown
          size={18}
          className={cn('flex-shrink-0 text-surface-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-surface-500 dark:text-surface-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Comparison table ──────────────────────────────────────────────────────────
type ComparisonValue = 'yes' | 'no' | 'partial'

const COMPARISON_DATA: { key: string; excel: ComparisonValue; other: ComparisonValue; estatiq: ComparisonValue }[] = [
  { key: '1', excel: 'no',      other: 'yes',     estatiq: 'yes' },
  { key: '2', excel: 'no',      other: 'no',      estatiq: 'yes' },
  { key: '3', excel: 'no',      other: 'partial', estatiq: 'yes' },
  { key: '4', excel: 'no',      other: 'no',      estatiq: 'yes' },
  { key: '5', excel: 'no',      other: 'partial', estatiq: 'yes' },
  { key: '6', excel: 'no',      other: 'partial', estatiq: 'yes' },
  { key: '7', excel: 'no',      other: 'yes',     estatiq: 'yes' },
  { key: '8', excel: 'no',      other: 'yes',     estatiq: 'yes' },
  { key: '9', excel: 'no',      other: 'partial', estatiq: 'yes' },
]

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (value === 'yes') return (
    <div className="flex justify-center">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
  )
  if (value === 'no') return (
    <div className="flex justify-center">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <X size={13} className="text-red-400" />
      </div>
    </div>
  )
  return (
    <div className="flex justify-center">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
        <Minus size={13} className="text-amber-500" />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useTranslation()
  const scrolled = useScrolled()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const featPaymentsPoints: FeaturePoint[] = (
    ['auto', 'qr', 'reminders', 'status'] as const
  ).map((k) => ({
    title: t(`landing.featurePayments.points.${k}.title`),
    desc: t(`landing.featurePayments.points.${k}.desc`),
  }))

  const featTenantsPoints: FeaturePoint[] = (
    ['invite', 'portal', 'docs', 'comms'] as const
  ).map((k) => ({
    title: t(`landing.featureTenants.points.${k}.title`),
    desc: t(`landing.featureTenants.points.${k}.desc`),
  }))

  const featEnergyPoints: FeaturePoint[] = (
    ['reading', 'chart', 'alert', 'import'] as const
  ).map((k) => ({
    title: t(`landing.featureEnergy.points.${k}.title`),
    desc: t(`landing.featureEnergy.points.${k}.desc`),
  }))

  const featDocsPoints: FeaturePoint[] = (
    ['storage', 'expiry', 'tax', 'categories'] as const
  ).map((k) => ({
    title: t(`landing.featureDocuments.points.${k}.title`),
    desc: t(`landing.featureDocuments.points.${k}.desc`),
  }))

  const faqKeys = ['1', '2', '3', '4', '5', '6', '7', '8'] as const
  const problemKeys = ['excel', 'contracts', 'reminders', 'taxes'] as const
  const howItWorksKeys = ['property', 'tenant', 'payments', 'relax'] as const

  const navLinks = [
    { href: '#what-we-do', label: t('landing.whatWeDo.eyebrow') },
    { href: '#features', label: t('landing.footer.features') },
    { href: '#why-us', label: t('landing.whyUs.eyebrow') },
    { href: '#pricing', label: t('landing.footer.pricing') },
    { href: '#about', label: t('landing.footer.about') },
    { href: '#contact', label: t('landing.contact.eyebrow') },
  ]

  return (
    <div className="min-h-screen bg-white text-surface-900 dark:bg-surface-950 dark:text-surface-50">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-surface-100/80 bg-white/90 backdrop-blur-md dark:border-surface-800/80 dark:bg-surface-950/90 shadow-sm'
          : 'bg-transparent',
      )}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className={cn(
              'font-display text-xl font-bold transition-colors',
              scrolled ? 'text-surface-900 dark:text-surface-50' : 'text-white',
            )}
          >
            Estat<span className="text-emerald-500">IQ</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors',
                  scrolled
                    ? 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50'
                    : 'text-surface-300 hover:text-white',
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                'hidden sm:inline-flex',
                !scrolled && 'text-surface-200 hover:bg-white/10 hover:text-white',
              )}
            >
              <Link to="/auth/login">{t('auth.login.submit')}</Link>
            </Button>
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/auth/register">
                {t('landing.cta.button')}
                <ChevronRight size={14} />
              </Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-400 hover:text-surface-600 lg:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-surface-100 bg-white/95 backdrop-blur-md dark:border-surface-800 dark:bg-surface-950/95 lg:hidden"
            >
              <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-3 flex gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to="/auth/login">{t('auth.login.submit')}</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link to="/auth/register">{t('landing.cta.button')}</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B0F19] pb-24 pt-32 md:pb-36 md:pt-44">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[100px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-indigo-600/8 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center">
            <motion.div variants={fadeUp}>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-900/25 px-4 py-1.5 text-xs font-medium text-emerald-400">
                <Star size={11} className="fill-current" />
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl"
            >
              {t('landing.hero.headline')}
            </motion.h1>

            <motion.p variants={fadeUp} className="mb-10 max-w-xl text-lg leading-relaxed text-surface-400">
              {t('landing.hero.subheadline')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth/register">
                  {t('landing.hero.cta')}
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-surface-700 bg-transparent text-surface-300 hover:border-surface-500 hover:bg-surface-800/60 hover:text-white"
              >
                <a href="#what-we-do">{t('landing.hero.ctaSecondary')}</a>
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-6 text-sm text-surface-500">
              <CheckCircle2 size={13} className="mr-1.5 inline text-emerald-500" />
              {t('landing.hero.socialProof')}
            </motion.p>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.75, ease: EASE_OUT }}
            className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              { v: t('landing.stats.landlords'), l: t('landing.stats.landlordsLabel') },
              { v: t('landing.stats.payments'), l: t('landing.stats.paymentsLabel') },
              { v: t('landing.stats.properties'), l: t('landing.stats.propertiesLabel') },
              { v: t('landing.stats.saved'), l: t('landing.stats.savedLabel') },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-surface-800 bg-surface-900/50 px-5 py-5 text-center backdrop-blur-sm">
                <p className="font-display text-2xl font-bold text-white">{s.v}</p>
                <p className="mt-1 text-xs text-surface-500">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Co je EstatIQ ────────────────────────────────────────────────────── */}
      <InViewSection id="what-we-do" className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.whatWeDo.eyebrow')} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.whatWeDo.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg leading-relaxed text-surface-500 dark:text-surface-400">
              {t('landing.whatWeDo.subtitle')}
            </motion.p>
          </div>

          <motion.div variants={stagger} className="grid gap-6 md:grid-cols-3">
            {([
              { key: '1', Icon: Home, color: 'emerald' },
              { key: '2', Icon: Zap, color: 'indigo' },
              { key: '3', Icon: FileText, color: 'amber' },
            ] as const).map(({ key, Icon, color }) => (
              <motion.div
                key={key}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-2xl border border-surface-100 bg-white p-8 shadow-card transition-all hover:shadow-lg dark:border-surface-800 dark:bg-surface-900"
              >
                <div className={cn(
                  'mb-5 flex h-12 w-12 items-center justify-center rounded-xl',
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : color === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  <Icon size={22} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-surface-900 dark:text-surface-50">
                  {t(`landing.whatWeDo.cards.${key}.title`)}
                </h3>
                <p className="text-base leading-relaxed text-surface-500 dark:text-surface-400">
                  {t(`landing.whatWeDo.cards.${key}.desc`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </InViewSection>

      {/* ── Problem section ──────────────────────────────────────────────────── */}
      <InViewSection id="features" className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <motion.div variants={fadeUp}>
            <span className="mb-4 inline-block rounded-full border border-surface-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
              {t('landing.problem.eyebrow')}
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display mb-4 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            {t('landing.problem.title')}
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mb-12 max-w-xl text-lg text-surface-500 dark:text-surface-400">
            {t('landing.problem.subtitle')}
          </motion.p>
          <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {problemKeys.map((k) => (
              <motion.div
                key={k}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-2xl bg-white p-5 text-left shadow-card dark:bg-surface-900 dark:border dark:border-surface-800"
              >
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                  <X size={11} className="text-red-500" />
                </div>
                <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300">
                  {t(`landing.problem.items.${k}`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Sparkles size={14} />
              EstatIQ toto vše řeší automaticky — bez vaší práce.
            </div>
          </motion.div>
        </div>
      </InViewSection>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <InViewSection id="how-it-works" className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.howItWorks.eyebrow')} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.howItWorks.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-lg text-lg text-surface-500 dark:text-surface-400">
              {t('landing.howItWorks.subtitle')}
            </motion.p>
          </div>
          <motion.div variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksKeys.map((k, i) => (
              <motion.div key={k} variants={fadeUp} className="relative">
                {i < howItWorksKeys.length - 1 && (
                  <div className="absolute -right-3 top-9 hidden h-px w-6 bg-surface-200 dark:bg-surface-700 lg:block" />
                )}
                <div className="rounded-2xl border border-surface-100 bg-white p-6 shadow-card dark:border-surface-800 dark:bg-surface-900">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-950 dark:bg-emerald-900/30">
                    <span className="font-display text-sm font-bold text-white dark:text-emerald-400">
                      {t(`landing.howItWorks.steps.${k}.number`)}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold text-surface-900 dark:text-surface-50">
                    {t(`landing.howItWorks.steps.${k}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                    {t(`landing.howItWorks.steps.${k}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </InViewSection>

      {/* ── Feature: Payments ────────────────────────────────────────────────── */}
      <FeatureSection
        id="payments"
        eyebrow={t('landing.featurePayments.eyebrow')}
        title={t('landing.featurePayments.title')}
        subtitle={t('landing.featurePayments.subtitle')}
        points={featPaymentsPoints}
        visual={<PaymentsMockup />}
        bg="gray"
      />

      {/* ── Feature: Tenants ─────────────────────────────────────────────────── */}
      <FeatureSection
        eyebrow={t('landing.featureTenants.eyebrow')}
        title={t('landing.featureTenants.title')}
        subtitle={t('landing.featureTenants.subtitle')}
        points={featTenantsPoints}
        visual={<TenantMockup />}
        reverse
        bg="white"
      />

      {/* ── Feature: Energy ──────────────────────────────────────────────────── */}
      <FeatureSection
        id="energy"
        eyebrow={t('landing.featureEnergy.eyebrow')}
        title={t('landing.featureEnergy.title')}
        subtitle={t('landing.featureEnergy.subtitle')}
        points={featEnergyPoints}
        visual={<EnergyMockup />}
        bg="gray"
      />

      {/* ── Feature: Documents & Taxes ───────────────────────────────────────── */}
      <FeatureSection
        eyebrow={t('landing.featureDocuments.eyebrow')}
        title={t('landing.featureDocuments.title')}
        subtitle={t('landing.featureDocuments.subtitle')}
        points={featDocsPoints}
        visual={<DocumentsMockup />}
        reverse
        bg="white"
      />

      {/* ── Time Savings ─────────────────────────────────────────────────────── */}
      <InViewSection id="time-savings" className="bg-[#0B0F19] py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.timeSavings.eyebrow')} dark />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
              {t('landing.timeSavings.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg leading-relaxed text-surface-400">
              {t('landing.timeSavings.subtitle')}
            </motion.p>
          </div>

          {/* Stats grid */}
          <motion.div variants={stagger} className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {([
              { v: t('landing.timeSavings.stats.hours'), l: t('landing.timeSavings.stats.hoursLabel'), color: 'emerald' },
              { v: t('landing.timeSavings.stats.payments'), l: t('landing.timeSavings.stats.paymentsLabel'), color: 'emerald' },
              { v: t('landing.timeSavings.stats.setup'), l: t('landing.timeSavings.stats.setupLabel'), color: 'indigo' },
              { v: t('landing.timeSavings.stats.reminders'), l: t('landing.timeSavings.stats.remindersLabel'), color: 'emerald' },
            ] as const).map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="rounded-2xl border border-surface-800 bg-surface-900/60 p-6 text-center">
                <p className={cn(
                  'font-display mb-1 text-4xl font-bold tabular-nums',
                  s.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400',
                )}>
                  {s.v}
                </p>
                <p className="text-sm text-surface-400">{s.l}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Detail cards */}
          <motion.div variants={stagger} className="grid gap-6 md:grid-cols-3">
            {(['1', '2', '3'] as const).map((k, i) => {
              const icons = [Clock, Mail, BarChart3]
              const Icon = icons[i]
              return (
                <motion.div key={k} variants={fadeUp} className="rounded-2xl border border-surface-800 bg-surface-900/40 p-7">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/40">
                    <Icon size={18} className="text-emerald-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">
                    {t(`landing.timeSavings.items.${k}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-surface-400">
                    {t(`landing.timeSavings.items.${k}.desc`)}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </InViewSection>

      {/* ── Why Us — 6 výhod ─────────────────────────────────────────────────── */}
      <InViewSection id="why-us" className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.whyUs.eyebrow')} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.whyUs.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-lg text-lg text-surface-500 dark:text-surface-400">
              {t('landing.whyUs.subtitle')}
            </motion.p>
          </div>

          <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([
              { key: '1', Icon: Home, color: 'emerald' },
              { key: '2', Icon: Zap, color: 'indigo' },
              { key: '3', Icon: Lock, color: 'emerald' },
              { key: '4', Icon: Users, color: 'indigo' },
              { key: '5', Icon: BarChart3, color: 'emerald' },
              { key: '6', Icon: HeadphonesIcon, color: 'indigo' },
            ] as const).map(({ key, Icon, color }) => (
              <motion.div
                key={key}
                variants={fadeUp}
                className="flex gap-4 rounded-2xl border border-surface-100 bg-white p-6 shadow-card dark:border-surface-800 dark:bg-surface-900"
              >
                <div className={cn(
                  'mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                  color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                )}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="mb-1.5 font-semibold text-surface-900 dark:text-surface-50">
                    {t(`landing.whyUs.advantages.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                    {t(`landing.whyUs.advantages.${key}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </InViewSection>

      {/* ── Comparison table ──────────────────────────────────────────────────── */}
      <InViewSection id="comparison" className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.comparison.eyebrow')} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.comparison.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-xl text-lg text-surface-500 dark:text-surface-400">
              {t('landing.comparison.subtitle')}
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card dark:border-surface-800 dark:bg-surface-900">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] border-b border-surface-100 dark:border-surface-800">
              <div className="p-5" />
              <div className="w-28 border-l border-surface-100 p-4 text-center dark:border-surface-800 md:w-36">
                <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">{t('landing.comparison.colExcel')}</p>
              </div>
              <div className="w-28 border-l border-surface-100 p-4 text-center dark:border-surface-800 md:w-36">
                <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">{t('landing.comparison.colOther')}</p>
              </div>
              <div className="w-28 border-l border-emerald-100 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-900/10 md:w-36">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Estat<span className="text-emerald-500">IQ</span>
                </p>
              </div>
            </div>

            {/* Table rows */}
            {COMPARISON_DATA.map((row, i) => (
              <div
                key={row.key}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto_auto] border-b border-surface-50 last:border-0 dark:border-surface-800/50',
                  i % 2 === 1 && 'bg-surface-50/50 dark:bg-surface-800/20',
                )}
              >
                <div className="flex items-center px-5 py-4">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {t(`landing.comparison.features.${row.key}`)}
                  </p>
                </div>
                <div className="w-28 border-l border-surface-100 p-4 dark:border-surface-800 md:w-36">
                  <ComparisonCell value={row.excel} />
                </div>
                <div className="w-28 border-l border-surface-100 p-4 dark:border-surface-800 md:w-36">
                  <ComparisonCell value={row.other} />
                </div>
                <div className="w-28 border-l border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/20 dark:bg-emerald-900/5 md:w-36">
                  <ComparisonCell value={row.estatiq} />
                </div>
              </div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-center text-xs text-surface-400">
            {t('landing.comparison.note')}
          </motion.p>
        </div>
      </InViewSection>

      {/* ── Dashboard preview ────────────────────────────────────────────────── */}
      <InViewSection className="bg-[#0B0F19] py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.dashboardPreview.eyebrow')} dark />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-white">
              {t('landing.dashboardPreview.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-lg text-lg text-surface-400">
              {t('landing.dashboardPreview.subtitle')}
            </motion.p>
          </div>
          <motion.div variants={fadeUp}>
            <DashboardMockup />
          </motion.div>
        </div>
      </InViewSection>

      {/* ── B2B section ──────────────────────────────────────────────────────── */}
      <InViewSection id="b2b" className="bg-indigo-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-700/50 bg-indigo-900/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  {t('landing.b2bFeature.eyebrow')}
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-display mb-5 mt-5 text-4xl font-bold tracking-tight text-white">
                {t('landing.b2bFeature.title')}
              </motion.h2>
              <motion.p variants={fadeUp} className="mb-8 text-lg leading-relaxed text-indigo-300">
                {t('landing.b2bFeature.subtitle')}
              </motion.p>
              <motion.ul variants={stagger} className="mb-10 space-y-4">
                {(['multiTenant', 'roles', 'clientPortal', 'reports'] as const).map((k) => (
                  <motion.li key={k} variants={fadeUp} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-800">
                      <CheckCircle2 size={11} className="text-indigo-300" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{t(`landing.b2bFeature.points.${k}.title`)}</span>
                      <span className="text-sm text-indigo-300"> — {t(`landing.b2bFeature.points.${k}.desc`)}</span>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp}>
                <Button size="lg" asChild>
                  <Link to="/auth/register">{t('landing.b2bFeature.cta')}</Link>
                </Button>
              </motion.div>
            </div>

            <motion.div variants={stagger} className="grid grid-cols-2 gap-4">
              {(['start', 'growth', 'scale', 'enterprise'] as const).map((tier, i) => (
                <motion.div
                  key={tier}
                  variants={fadeUp}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-indigo-800/60 bg-indigo-900/40 p-5 backdrop-blur"
                >
                  <p className="mb-1 font-semibold text-white">{t(`landing.pricing.b2b.tiers.${tier}.name`)}</p>
                  <p className="mb-3 text-xs text-indigo-400">{t(`landing.pricing.b2b.tiers.${tier}.limit`)}</p>
                  <p className="font-display text-xl font-bold tabular-nums text-indigo-200">
                    {t(`landing.pricing.b2b.tiers.${tier}.price`)}
                    {tier !== 'enterprise' && (
                      <span className="ml-1 text-sm font-normal text-indigo-400"> Kč/měs.</span>
                    )}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </InViewSection>

      {/* ── Founding Members ─────────────────────────────────────────────────── */}
      <InViewSection className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.foundingMembers.eyebrow')} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.foundingMembers.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-xl text-lg text-surface-500 dark:text-surface-400">
              {t('landing.foundingMembers.subtitle')}
            </motion.p>
          </div>

          <motion.div variants={stagger} className="mb-12 grid gap-6 md:grid-cols-3">
            {([
              { key: '1', Icon: Lock, color: 'emerald' },
              { key: '2', Icon: Phone, color: 'indigo' },
              { key: '3', Icon: Target, color: 'emerald' },
            ] as const).map(({ key, Icon, color }) => (
              <motion.div
                key={key}
                variants={fadeUp}
                className="flex flex-col rounded-2xl border border-surface-100 bg-white p-8 shadow-card dark:border-surface-800 dark:bg-surface-900"
              >
                <div className={cn(
                  'mb-5 flex h-12 w-12 items-center justify-center rounded-xl',
                  color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
                )}>
                  <Icon size={22} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-surface-900 dark:text-surface-50">
                  {t(`landing.foundingMembers.benefits.${key}.title`)}
                </h3>
                <p className="flex-1 text-base leading-relaxed text-surface-500 dark:text-surface-400">
                  {t(`landing.foundingMembers.benefits.${key}.desc`)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertCircle size={14} />
              {t('landing.foundingMembers.urgency')}
            </div>
            <div>
              <Button size="lg" asChild>
                <Link to="/auth/register">
                  {t('landing.foundingMembers.cta')}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </InViewSection>

      {/* ── About + Mission ───────────────────────────────────────────────────── */}
      <InViewSection id="about" className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Founder story */}
            <div>
              <motion.div variants={fadeUp}>
                <Eyebrow label={t('landing.about.eyebrow')} />
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-display mb-6 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
                {t('landing.about.title')}
              </motion.h2>
              <motion.div variants={fadeUp} className="relative">
                <div className="absolute -left-4 top-0 h-full w-0.5 bg-emerald-100 dark:bg-emerald-900/30" />
                <p className="pl-6 text-lg leading-relaxed text-surface-600 dark:text-surface-400 italic">
                  &ldquo;{t('landing.about.story')}&rdquo;
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  KS
                </div>
                <div>
                  <p className="font-semibold text-surface-900 dark:text-surface-50">{t('landing.about.signature')}</p>
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <MapPin size={11} />
                    {t('landing.about.location')}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mission + values */}
            <div>
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                  {t('landing.about.missionEyebrow')}
                </span>
              </motion.div>
              <motion.h3 variants={fadeUp} className="font-display mb-4 mt-5 text-2xl font-bold text-surface-900 dark:text-surface-50">
                {t('landing.about.missionTitle')}
              </motion.h3>
              <motion.p variants={fadeUp} className="mb-8 text-base leading-relaxed text-surface-500 dark:text-surface-400">
                {t('landing.about.missionDesc')}
              </motion.p>
              <motion.div variants={stagger} className="space-y-4">
                {(['1', '2', '3'] as const).map((k, i) => {
                  const icons = [Lightbulb, Heart, Target]
                  const Icon = icons[i]
                  return (
                    <motion.div key={k} variants={fadeUp} className="flex gap-4 rounded-xl border border-surface-100 p-4 dark:border-surface-800">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-surface-50">{t(`landing.about.values.${k}.title`)}</p>
                        <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">{t(`landing.about.values.${k}.desc`)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </InViewSection>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <InViewSection className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <motion.div variants={fadeUp}>
              <span className="mb-4 inline-block rounded-full border border-surface-200 bg-surface-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                {t('landing.faq.eyebrow')}
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mt-4 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.faq.title')}
            </motion.h2>
          </div>
          <motion.div variants={fadeUp}>
            {faqKeys.map((k) => (
              <FAQItem key={k} q={t(`landing.faq.items.${k}.q`)} a={t(`landing.faq.items.${k}.a`)} />
            ))}
          </motion.div>
        </div>
      </InViewSection>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <InViewSection id="contact" className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <motion.div variants={fadeUp}>
              <Eyebrow label={t('landing.contact.eyebrow')} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display mb-4 mt-5 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.contact.title')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-xl text-lg text-surface-500 dark:text-surface-400">
              {t('landing.contact.subtitle')}
            </motion.p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Contact info cards */}
            <motion.div variants={stagger} className="space-y-4 lg:col-span-2">
              {[
                { Icon: Mail, label: t('landing.contact.emailLabel'), value: t('landing.contact.emailValue'), href: `mailto:${t('landing.contact.emailValue')}` },
                { Icon: Phone, label: t('landing.contact.phoneLabel'), value: t('landing.contact.phoneValue'), href: `tel:${t('landing.contact.phoneValue')}` },
                { Icon: Clock, label: t('landing.contact.hoursLabel'), value: t('landing.contact.hoursValue'), href: null },
                { Icon: Zap, label: t('landing.contact.responseLabel'), value: t('landing.contact.responseValue'), href: null },
              ].map(({ Icon, label, value, href }, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-center gap-4 rounded-xl border border-surface-100 bg-white p-4 shadow-card dark:border-surface-800 dark:bg-surface-900">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-surface-400">{label}</p>
                    {href ? (
                      <a href={href} className="font-semibold text-surface-900 hover:text-emerald-600 dark:text-surface-50 dark:hover:text-emerald-400 transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="font-semibold text-surface-900 dark:text-surface-50">{value}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Demo CTA */}
              <motion.div variants={fadeUp} className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800/50 dark:bg-indigo-900/20">
                <p className="mb-1 font-semibold text-indigo-900 dark:text-indigo-100">{t('landing.contact.demoTitle')}</p>
                <p className="mb-3 text-sm text-indigo-600 dark:text-indigo-300">{t('landing.contact.demoDesc')}</p>
                <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700">
                  <Link to="/auth/register">{t('landing.contact.demoCta')}</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Contact form */}
            <motion.div variants={fadeUp} className="lg:col-span-3">
              <div className="rounded-2xl border border-surface-100 bg-white p-8 shadow-card dark:border-surface-800 dark:bg-surface-900">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      {t('landing.contact.formName')}
                    </label>
                    <input
                      type="text"
                      placeholder="Jan Novák"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50 dark:placeholder-surface-500 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      {t('landing.contact.formEmail')}
                    </label>
                    <input
                      type="email"
                      placeholder="jan@firma.cz"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50 dark:placeholder-surface-500 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      {t('landing.contact.formMessage')}
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ahoj, chtěl bych se zeptat..."
                      className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50 dark:placeholder-surface-500 dark:focus:border-emerald-500"
                    />
                  </div>
                  <Button size="lg" className="w-full">
                    {t('landing.contact.formSubmit')}
                    <ArrowRight size={16} />
                  </Button>
                  <p className="text-center text-xs text-surface-400">
                    {t('landing.contact.formNote')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </InViewSection>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <InViewSection className="bg-surface-950 py-28">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/8 blur-[90px]" />
          </div>
          <motion.div variants={fadeUp}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-900/25 px-4 py-1.5 text-xs font-medium text-emerald-400">
              <Star size={11} className="fill-current" />
              {t('landing.hero.socialProof')}
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display mb-5 mt-3 text-5xl font-bold tracking-tight text-white">
            {t('landing.cta.headline')}
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-8 text-lg text-surface-400">
            {t('landing.cta.subheadline')}
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button size="lg" asChild>
              <Link to="/auth/register">
                {t('landing.hero.cta')}
                <ArrowRight size={17} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </InViewSection>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-100 bg-white py-16 dark:border-surface-800 dark:bg-surface-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
            <div className="col-span-2 md:col-span-2">
              <p className="font-display mb-3 text-lg font-bold text-surface-900 dark:text-surface-50">
                Estat<span className="text-emerald-500">IQ</span>
              </p>
              <p className="mb-5 max-w-xs text-sm leading-relaxed text-surface-400">{t('landing.footer.tagline')}</p>
              <div className="flex gap-2">
                {[Globe, Mail].map((Icon, i) => (
                  <div key={i} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-surface-200 text-surface-400 transition-colors hover:text-surface-600 dark:border-surface-700 dark:hover:text-surface-300">
                    <Icon size={14} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                {t('landing.footer.product')}
              </p>
              <ul className="space-y-2 text-sm text-surface-500 dark:text-surface-400">
                <li><a href="#what-we-do" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.whatWeDo.eyebrow')}</a></li>
                <li><a href="#features" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.features')}</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.pricing')}</a></li>
                <li><a href="#comparison" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.comparison.eyebrow')}</a></li>
                <li><a href="#b2b" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">B2B</a></li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                {t('landing.footer.company')}
              </p>
              <ul className="space-y-2 text-sm text-surface-500 dark:text-surface-400">
                <li><a href="#about" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.about')}</a></li>
                <li><a href="#why-us" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.whyUs.eyebrow')}</a></li>
                <li><a href="#" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.blog')}</a></li>
                <li><a href="#contact" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.contact.eyebrow')}</a></li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                {t('landing.footer.legal')}
              </p>
              <ul className="space-y-2 text-sm text-surface-500 dark:text-surface-400">
                <li><Link to="/zasady-ochrany-soukromi" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.privacy')}</Link></li>
                <li><Link to="/podminky-pouziti" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.terms')}</Link></li>
                <li><Link to="/zasady-ochrany-soukromi#cookies" className="transition-colors hover:text-surface-900 dark:hover:text-surface-50">{t('landing.footer.gdpr')}</Link></li>
              </ul>
              <div className="mt-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-400">Kontakt</p>
                <a href={`mailto:${t('landing.contact.emailValue')}`} className="text-sm text-surface-500 transition-colors hover:text-emerald-600 dark:text-surface-400 dark:hover:text-emerald-400">
                  {t('landing.contact.emailValue')}
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-100 pt-8 text-xs text-surface-400 dark:border-surface-800 sm:flex-row">
            <p>© {new Date().getFullYear()} EstatIQ. {t('landing.footer.rights')}</p>
            <p>{t('landing.footer.madeIn')} 🇨🇿</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
