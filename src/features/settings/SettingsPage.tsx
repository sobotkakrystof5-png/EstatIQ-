import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  Download,
  Trash2,
  Building2,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui'
import { Segmented, type SegmentOption } from '@/components/ui'
import { Select } from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'
import { useProfile } from '@/hooks/useProfile'
import { useCurrency, type SupportedCurrency } from '@/hooks/useCurrency'
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage'
import { redirectToCheckout, redirectToPortal } from '@/lib/stripe'
import i18n from '@/i18n/config'
import { cn } from '@/lib/utils'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">{description}</p>
      )}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
  id: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-surface-800 dark:text-surface-200">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-surface-400">{hint}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          checked ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-700',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
            'transform transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}

// ── Plan types ────────────────────────────────────────────────────────────────

type B2cTier = 'free' | 'starter' | 'growth' | 'pro' | 'portfolio'

interface PlanInfo {
  key: B2cTier
  monthlyPrice: number
  yearlyPrice: number
  icon: React.ElementType
  features: string[]
  isCurrent: boolean
  isPopular: boolean
}

// ── Current plan card ─────────────────────────────────────────────────────────

function CurrentPlanCard({
  plan,
  onShowPlans,
  onCancel,
}: {
  plan: PlanInfo
  onShowPlans: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const Icon = plan.icon

  return (
    <Card className="p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Icon size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                {t(`landing.pricing.${plan.key}.name`)}
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t('settings.billing.active')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-surface-400">
              {t(`landing.pricing.${plan.key}.limit`)}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="tabular-nums text-lg font-bold text-surface-900 dark:text-surface-50">
            {plan.monthlyPrice === 0 ? t('landing.pricing.free.price') : `${plan.monthlyPrice.toLocaleString('cs-CZ')} Kč`}
          </p>
          {plan.monthlyPrice > 0 && (
            <p className="text-[11px] text-surface-400">{t('landing.pricing.perMonth')}</p>
          )}
        </div>
      </div>

      {/* Features — compact 2-column */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
            <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
            <span className="truncate">{feature}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-surface-100 dark:border-surface-800" />

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="sm" onClick={onShowPlans}>
          <ArrowUpRight size={14} />
          {t('settings.billing.upgradePlan')}
        </Button>

        {plan.monthlyPrice > 0 && (
          <button
            onClick={onCancel}
            className="text-sm text-surface-400 transition-colors hover:text-red-500"
          >
            {t('settings.billing.cancel')}
          </button>
        )}
      </div>
    </Card>
  )
}

// ── Upgrade plan row (compact) ─────────────────────────────────────────────────

function UpgradePlanRow({
  plan,
  billingCycle,
  onUpgrade,
  isLoading,
}: {
  plan: PlanInfo
  billingCycle: 'monthly' | 'yearly'
  onUpgrade: () => void
  isLoading?: boolean
}) {
  const { t } = useTranslation()
  const Icon = plan.icon
  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors',
        plan.isPopular
          ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800/50 dark:bg-indigo-950/20'
          : 'border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          plan.isPopular
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
            : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
        )}>
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-surface-900 dark:text-surface-50">
              {t(`landing.pricing.${plan.key}.name`)}
            </p>
            {plan.isPopular && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
                {t('landing.pricing.badge')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-surface-400 truncate">
            {t(`landing.pricing.${plan.key}.limit`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="tabular-nums text-sm font-semibold text-surface-700 dark:text-surface-300">
            {price.toLocaleString('cs-CZ')} Kč
          </p>
          <p className="text-[10px] text-surface-400">
            {billingCycle === 'yearly' ? t('landing.pricing.perYear') : t('landing.pricing.perMonth')}
          </p>
        </div>
        <Button
          variant={plan.isPopular ? 'primary' : 'outline'}
          size="sm"
          onClick={onUpgrade}
          disabled={isLoading}
        >
          {isLoading ? '…' : t(`landing.pricing.${plan.key}.cta`)}
        </Button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const { profile, loading: profileLoading, updateProfile } = useProfile()

  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    quietHours: true,
  })

  const { data: subUsage, isLoading: subLoading } = useSubscriptionUsage()
  const currentTier = (subUsage?.tier ?? 'free') as B2cTier

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [showPlans, setShowPlans] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)

  const [language, setLanguage] = useState(i18n.language.slice(0, 2))

  // Sync form fields once profile loads
  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name ?? '')
      setProfilePhone(profile.phone ?? '')
      setLanguage(profile.locale ?? i18n.language.slice(0, 2))
      if (profile.currency_preference) {
        setCurrency(profile.currency_preference as SupportedCurrency)
      }
    }
  }, [profile])

  const themeOptions: SegmentOption<string>[] = [
    { value: 'light', label: t('settings.appearance.light') },
    { value: 'dark', label: t('settings.appearance.dark') },
    { value: 'system', label: t('settings.appearance.system') },
  ]

  const languageOptions = [
    { value: 'cs', label: 'Čeština' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'sk', label: 'Slovenčina' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ]

  const currencyOptions = [
    { value: 'CZK', label: 'Kč — Česká koruna' },
    { value: 'EUR', label: '€ — Euro' },
    { value: 'USD', label: '$ — US Dollar' },
    { value: 'GBP', label: '£ — British Pound' },
    { value: 'PLN', label: 'zł — Polský zlotý' },
  ]

  const plans: PlanInfo[] = [
    {
      key: 'free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: CheckCircle2,
      features: t('settings.billing.features.free', { returnObjects: true }) as string[],
      isCurrent: currentTier === 'free',
      isPopular: false,
    },
    {
      key: 'starter',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      icon: Zap,
      features: t('settings.billing.features.starter', { returnObjects: true }) as string[],
      isCurrent: currentTier === 'starter',
      isPopular: false,
    },
    {
      key: 'growth',
      monthlyPrice: 349,
      yearlyPrice: 3490,
      icon: TrendingUp,
      features: t('settings.billing.features.growth', { returnObjects: true }) as string[],
      isCurrent: currentTier === 'growth',
      isPopular: false,
    },
    {
      key: 'pro',
      monthlyPrice: 549,
      yearlyPrice: 5490,
      icon: BarChart3,
      features: t('settings.billing.features.pro', { returnObjects: true }) as string[],
      isCurrent: currentTier === 'pro',
      isPopular: true,
    },
    {
      key: 'portfolio',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      icon: Building2,
      features: t('settings.billing.features.portfolio', { returnObjects: true }) as string[],
      isCurrent: currentTier === 'portfolio',
      isPopular: false,
    },
  ]

  async function handleSaveProfile() {
    setProfileError(null)
    const { error } = await updateProfile({ full_name: profileName, phone: profilePhone })
    if (error) { setProfileError(error); return }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  async function handleLanguageChange(lang: string) {
    setLanguage(lang)
    void i18n.changeLanguage(lang)
    await updateProfile({ locale: lang })
  }

  async function handleCurrencyChange(value: string) {
    setCurrency(value as SupportedCurrency)
    await updateProfile({ currency_preference: value })
  }

  async function handleThemeChange(value: string) {
    setTheme(value as 'light' | 'dark' | 'system')
    await updateProfile({ theme_preference: value })
  }

  async function handleUpgrade(planKey: B2cTier) {
    if (planKey === 'free') return
    setStripeError(null)
    setUpgradeLoading(planKey)
    try {
      await redirectToCheckout(planKey, billingCycle)
    } catch (e) {
      setStripeError((e as Error).message)
    } finally {
      setUpgradeLoading(null)
    }
  }

  async function handleManageSubscription() {
    setStripeError(null)
    try {
      await redirectToPortal()
    } catch (e) {
      setStripeError((e as Error).message)
    }
  }

  function handleExport() {
    // TODO(fáze 2): call Supabase Edge Function to generate GDPR export
  }

  function handleDeleteAccount() {
    // TODO(fáze 2): confirm dialog → delete all data → sign out
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-5 sm:p-8">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50"
      >
        {t('settings.title')}
      </motion.h1>

      {/* ── Profile ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.05 }}
      >
        <SectionHeader title={t('settings.profile.title')} />
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {profileLoading
                ? '…'
                : (profile?.full_name ?? profile?.email ?? '?')
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-surface-900 dark:text-surface-50">
                {profileLoading ? '…' : (profile?.full_name || t('settings.profile.unnamed'))}
              </p>
              <p className="text-sm text-surface-400">{profile?.email ?? ''}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label={t('settings.profile.name')}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
            <Input
              label={t('settings.profile.email')}
              value={profile?.email ?? ''}
              disabled
              hint="E-mail nelze změnit (přihlašovací identita)"
            />
            <Input
              label={t('settings.profile.phone')}
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              type="tel"
            />
          </div>

          {profileError && (
            <p className="mt-3 text-xs text-red-500">{profileError}</p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={profileLoading}>
              {profileSaved ? (
                <><Check size={14} className="text-white" />{t('settings.saveSuccess')}</>
              ) : t('settings.profile.save')}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Language & region ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.08 }}
      >
        <SectionHeader title={t('settings.language.title')} />
        <Card className="p-5">
          <div className="space-y-4">
            <Select
              label={t('settings.language.language')}
              value={language}
              onValueChange={handleLanguageChange}
              options={languageOptions}
            />
            <Select
              label={t('settings.language.currency')}
              value={currency}
              onValueChange={handleCurrencyChange}
              options={currencyOptions}
            />
          </div>
        </Card>
      </motion.div>

      {/* ── Appearance ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.11 }}
      >
        <SectionHeader title={t('settings.appearance.title')} />
        <Card className="p-5">
          <p className="mb-3 text-sm text-surface-500 dark:text-surface-400">
            {t('settings.appearance.theme')}
          </p>
          <Segmented
            options={themeOptions}
            value={theme}
            onChange={(v) => void handleThemeChange(v)}
          />
        </Card>
      </motion.div>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.14 }}
      >
        <SectionHeader title={t('settings.notifications.title')} />
        <Card className="divide-y divide-surface-100 px-5 dark:divide-surface-800">
          <Toggle
            id="notif-email"
            label={t('settings.notifications.email')}
            hint={t('settings.notifications.emailHint')}
            checked={notifications.email}
            onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
          />
          <Toggle
            id="notif-push"
            label={t('settings.notifications.push')}
            hint={t('settings.notifications.pushHint')}
            checked={notifications.push}
            onChange={(v) => setNotifications((n) => ({ ...n, push: v }))}
          />
          <Toggle
            id="notif-quiet"
            label={t('settings.notifications.quietHours')}
            hint={t('settings.notifications.quietHoursHint')}
            checked={notifications.quietHours}
            onChange={(v) => setNotifications((n) => ({ ...n, quietHours: v }))}
          />
        </Card>
      </motion.div>

      {/* ── Billing ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.17 }}
      >
        <SectionHeader title={t('settings.billing.title')} />

        {/* Stripe error */}
        {stripeError && (
          <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
            {stripeError}
          </div>
        )}

        {/* Current plan card */}
        {subLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
        ) : (
          <CurrentPlanCard
            plan={plans.find((p) => p.isCurrent) ?? plans[0]}
            onShowPlans={() => setShowPlans((v) => !v)}
            onCancel={() => void handleManageSubscription()}
          />
        )}

        {/* Upgrade plans — expandable */}
        {showPlans && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="mt-4 space-y-2"
          >
            {/* Billing cycle toggle */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-surface-400">{t('settings.billing.annualSaving')}</p>
              <div className="flex items-center gap-1 rounded-xl bg-surface-100 p-0.5 dark:bg-surface-800">
                {(['monthly', 'yearly'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                      billingCycle === cycle
                        ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                        : 'text-surface-500 hover:text-surface-700 dark:text-surface-400',
                    )}
                  >
                    {t(`landing.pricing.billing${cycle.charAt(0).toUpperCase() + cycle.slice(1)}`)}
                    {cycle === 'yearly' && (
                      <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        −2 mes.
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {plans.filter((p) => !p.isCurrent).map((plan) => (
              <UpgradePlanRow
                key={plan.key}
                plan={plan}
                billingCycle={billingCycle}
                onUpgrade={() => void handleUpgrade(plan.key)}
                isLoading={upgradeLoading === plan.key}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.2 }}
      >
        <SectionHeader title={t('settings.danger.title')} />
        <Card className="divide-y divide-surface-100 p-0 dark:divide-surface-800">
          {/* Export */}
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                {t('settings.danger.exportData')}
              </p>
              <p className="mt-0.5 text-xs text-surface-400">{t('settings.danger.exportDescription')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} />
              {t('settings.danger.exportData')}
            </Button>
          </div>

          {/* Delete */}
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {t('settings.danger.deleteAccount')}
              </p>
              <p className="mt-0.5 text-xs text-surface-400">{t('settings.danger.deleteWarning')}</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
              <Trash2 size={14} />
              {t('settings.danger.deleteAccount')}
            </Button>
          </div>
        </Card>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 dark:bg-amber-950/20">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{t('settings.danger.deleteWarning')}</p>
        </div>
      </motion.div>

      {/* Bottom spacing for mobile */}
      <div className="h-6" />
    </div>
  )
}
