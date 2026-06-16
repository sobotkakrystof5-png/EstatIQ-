import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, type Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  ArrowRight,
  BarChart3,
  FileText,
  Users,
  Zap,
  Shield,
  Smartphone,
  ChevronRight,
  Star,
  CheckCircle2,
  Building2,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cn } from '@/lib/utils'

// ── Animation variants ────────────────────────────────────────────────────────
// Use cubic-bezier arrays to avoid Framer Motion v12 string-Easing type mismatch
const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

// ── Floating payment card (Hero visual) ───────────────────────────────────────
function PaymentCard() {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-sm"
    >
      {/* Glow */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-emerald-500/20 blur-3xl" />

      {/* Main card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl bg-white p-5 shadow-modal dark:bg-surface-900 dark:border dark:border-surface-700"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" size={18} />
            </div>
            <div>
              <p className="text-xs text-surface-500 dark:text-surface-400">{t('landing.hero.paymentCard.title')}</p>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{t('landing.hero.paymentCard.tenant')}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('payments.status.paid')}
          </span>
        </div>

        {/* Amount */}
        <p className="mb-1 font-display text-3xl font-bold tabular-nums text-surface-900 dark:text-surface-50">
          {t('landing.hero.paymentCard.amount')}
        </p>
        <p className="mb-4 text-xs text-surface-400">{t('landing.hero.paymentCard.property')}</p>

        {/* Divider */}
        <div className="mb-4 h-px bg-surface-100 dark:bg-surface-800" />

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-surface-400">
          <span>{t('landing.hero.paymentCard.date')}</span>
          <span className="font-medium text-emerald-600">+18 500 Kč</span>
        </div>
      </motion.div>

      {/* Secondary mini card */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
        className="absolute -right-4 -top-4 rounded-xl bg-white p-3 shadow-card dark:bg-surface-900 dark:border dark:border-surface-700"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-900/30">
            <BarChart3 size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-surface-900 dark:text-surface-50">+12 %</p>
            <p className="text-[10px] text-surface-400">{t('dashboard.cards.income.trend')}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Feature icon map ──────────────────────────────────────────────────────────
const featureIcons = {
  payments: Zap,
  tenants: Users,
  analytics: BarChart3,
  taxes: FileText,
  documents: Shield,
  mobile: Smartphone,
}

// ── Section wrapper with inView animation ─────────────────────────────────────
function Section({
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
      variants={staggerChildren}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ── Pricing data ──────────────────────────────────────────────────────────────

const B2C_PLANS = [
  { key: 'free',      monthlyPrice: 0,   yearlyPrice: 0,    icon: CheckCircle2, isPopular: false },
  { key: 'starter',   monthlyPrice: 199, yearlyPrice: 1990, icon: Zap,          isPopular: false },
  { key: 'growth',    monthlyPrice: 349, yearlyPrice: 3490, icon: TrendingUp,   isPopular: false },
  { key: 'pro',       monthlyPrice: 549, yearlyPrice: 5490, icon: BarChart3,    isPopular: true  },
  { key: 'portfolio', monthlyPrice: 999, yearlyPrice: 9990, icon: Building2,    isPopular: false },
] as const

type B2cPlanKey = (typeof B2C_PLANS)[number]['key']

// ── Pricing section ───────────────────────────────────────────────────────────

function PricingSection() {
  const { t } = useTranslation()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const b2bTierKeys = ['start', 'growth', 'scale', 'enterprise'] as const

  return (
    <motion.section
      ref={ref}
      id="pricing"
      variants={staggerChildren}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-10 text-center">
          <h2 className="font-display mb-3 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-surface-500 dark:text-surface-400">{t('landing.pricing.subtitle')}</p>
        </motion.div>

        {/* Billing toggle */}
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

        {/* B2C plan cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {B2C_PLANS.map((plan, i) => {
            const Icon = plan.icon
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            const priceSuffix = billingCycle === 'yearly'
              ? t('landing.pricing.perYear')
              : t('landing.pricing.perMonth')
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
                  <Button
                    variant={plan.isPopular ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link to="/auth/register">{t(`landing.pricing.${planKey}.cta`)}</Link>
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* B2B callout */}
        <motion.div
          variants={fadeUp}
          className="mt-8 rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-700 dark:bg-surface-900"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <p className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                {t('landing.pricing.b2b.title')}
              </p>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {t('landing.pricing.b2b.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {b2bTierKeys.map((tier) => (
                <span
                  key={tier}
                  className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300"
                >
                  {t(`landing.pricing.b2b.tiers.${tier}.name`)}
                  <span className="ml-1.5 text-surface-400">
                    {t(`landing.pricing.b2b.tiers.${tier}.limit`)}
                  </span>
                </span>
              ))}
            </div>
            <Button size="lg" className="px-10 py-3 text-base font-semibold" asChild>
              <Link to="/auth/register">{t('landing.pricing.b2b.cta')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useTranslation()
  const featureKeys = ['payments', 'tenants', 'analytics', 'taxes', 'documents', 'mobile'] as const

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-100/80 bg-white/80 backdrop-blur-md dark:border-surface-800/80 dark:bg-surface-950/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl font-bold text-surface-900 dark:text-surface-50">
            Estat<span className="text-emerald-600">IQ</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-surface-600 dark:text-surface-400 md:flex">
            <a href="#features" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.features')}</a>
            <a href="#pricing" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.pricing.title')}</a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth/login">{t('auth.login.submit')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth/register">
                {t('landing.cta.button')}
                <ChevronRight size={14} />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/8 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left copy */}
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="max-w-xl"
            >
              <motion.div variants={fadeUp}>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <Star size={12} className="fill-current" />
                  {t('landing.hero.badge')}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-display mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-surface-900 dark:text-surface-50 lg:text-6xl"
              >
                {t('landing.hero.headline')}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mb-8 text-lg leading-relaxed text-surface-500 dark:text-surface-400"
              >
                {t('landing.hero.subheadline')}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link to="/auth/register">
                    {t('landing.hero.cta')}
                    <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#features">{t('landing.hero.ctaSecondary')}</a>
                </Button>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-5 text-sm text-surface-400"
              >
                <CheckCircle size={14} className="mr-1.5 inline text-emerald-500" />
                {t('landing.hero.socialProof')}
              </motion.p>
            </motion.div>

            {/* Right visual */}
            <div className="flex justify-center lg:justify-end">
              <PaymentCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <Section id="features" className="py-24 bg-surface-50 dark:bg-surface-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={fadeUp} className="mb-16 text-center">
            <h2 className="font-display mb-4 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              {t('landing.features.title')}
            </h2>
            <p className="mx-auto max-w-lg text-lg text-surface-500 dark:text-surface-400">
              {t('landing.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((key) => {
              const Icon = featureIcons[key]
              return (
                <motion.div key={key} variants={fadeUp}>
                  <div className="group rounded-2xl bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover dark:bg-surface-900 dark:border dark:border-surface-800">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                      <Icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-surface-900 dark:text-surface-50">
                      {t(`landing.features.items.${key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                      {t(`landing.features.items.${key}.description`)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <Section className="py-24 bg-surface-950 dark:bg-surface-900">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.h2
            variants={fadeUp}
            className="font-display mb-4 text-5xl font-bold tracking-tight text-white"
          >
            {t('landing.cta.headline')}
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-8 text-lg text-surface-400">
            {t('landing.cta.subheadline')}
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button size="lg" asChild>
              <Link to="/auth/register">
                {t('landing.cta.button')}
                <ArrowRight size={16} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-100 bg-white py-16 dark:border-surface-800 dark:bg-surface-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <p className="font-display mb-3 text-lg font-bold text-surface-900 dark:text-surface-50">
                Estat<span className="text-emerald-600">IQ</span>
              </p>
              <p className="text-sm text-surface-400">{t('landing.footer.tagline')}</p>
            </div>
            {(['product', 'company', 'legal'] as const).map((group) => (
              <div key={group}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                  {t(`landing.footer.${group}`)}
                </p>
                <ul className="space-y-2 text-sm text-surface-500 dark:text-surface-400">
                  {group === 'product' && (
                    <>
                      <li><a href="#features" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.features')}</a></li>
                      <li><a href="#pricing" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.pricing.title')}</a></li>
                    </>
                  )}
                  {group === 'company' && (
                    <>
                      <li><a href="#" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.about')}</a></li>
                      <li><a href="#" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.blog')}</a></li>
                    </>
                  )}
                  {group === 'legal' && (
                    <>
                      <li><a href="#" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.privacy')}</a></li>
                      <li><a href="#" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.terms')}</a></li>
                      <li><a href="#" className="hover:text-surface-900 dark:hover:text-surface-50 transition-colors">{t('landing.footer.gdpr')}</a></li>
                    </>
                  )}
                </ul>
              </div>
            ))}
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
