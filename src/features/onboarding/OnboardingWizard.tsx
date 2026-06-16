import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MapPin,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useOnboardingCreate } from './hooks'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type StepId = 'welcome' | 'property' | 'tenant' | 'done'
const STEPS: StepId[] = ['welcome', 'property', 'tenant', 'done']

const FORM_STEP_INDEX: Partial<Record<StepId, number>> = { property: 1, tenant: 2 }
const FORM_STEP_TOTAL = 2

interface PropertyDraft {
  name: string
  street: string
  city: string
  zip: string
  rent: string
}

interface TenantDraft {
  name: string
  email: string
}

export default function OnboardingWizard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const [[index, direction], setStep] = useState<[number, number]>([0, 0])
  const step = STEPS[index]

  const [property, setProperty] = useState<PropertyDraft>({
    name: '',
    street: '',
    city: '',
    zip: '',
    rent: '',
  })
  const [tenant, setTenant] = useState<TenantDraft>({ name: '', email: '' })
  const [tenantSkipped, setTenantSkipped] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const createMutation = useOnboardingCreate()

  const slide: Variants = useMemo(
    () => ({
      enter: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir >= 0 ? 36 : -36 }),
      center: { opacity: 1, x: 0 },
      exit: (dir: number) => ({ opacity: 0, x: reduce ? 0 : dir >= 0 ? -36 : 36 }),
    }),
    [reduce],
  )

  function go(dir: number) {
    setErrors({})
    setStep(([i]) => [Math.min(Math.max(i + dir, 0), STEPS.length - 1), dir])
  }

  function validateProperty(): boolean {
    const next: Record<string, string> = {}
    if (!property.name.trim()) next.name = t('onboarding.property.nameRequired')
    if (!property.rent.replace(/\D/g, '')) next.rent = t('onboarding.property.rentRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleNext() {
    if (step === 'property') {
      if (!validateProperty()) return
      go(1)
      return
    }

    if (step === 'tenant') {
      if (!tenant.name.trim()) {
        setErrors({ name: t('onboarding.tenant.nameRequired') })
        return
      }
      if (!EMAIL_RE.test(tenant.email.trim())) {
        setErrors({ email: t('onboarding.tenant.emailInvalid') })
        return
      }
      setTenantSkipped(false)
      go(1)
      return
    }

    go(1)
  }

  function handleSkipTenant() {
    setErrors({})
    setTenantSkipped(true)
    setTenant({ name: '', email: '' })
    setInviteLink(null)
    go(1)
  }

  async function markOnboardingComplete() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id)
    }
  }

  async function handleSkipSetup() {
    await markOnboardingComplete()
    void navigate('/app/dashboard')
  }

  function handleFinish() {
    if (createMutation.isPending) return

    if (createMutation.isSuccess) {
      void navigate('/app/dashboard')
      return
    }

    createMutation.mutate(
      {
        property: {
          name: property.name.trim(),
          street: property.street.trim(),
          city: property.city.trim(),
          zip: property.zip.trim(),
        },
        tenant: tenantSkipped
          ? null
          : {
              full_name: tenant.name.trim(),
              email: tenant.email.trim(),
              monthly_rent: parseRent(property.rent),
            },
      },
      {
        onSuccess: (data) => {
          setInviteLink(data.inviteLink)
          void markOnboardingComplete()
        },
      },
    )
  }

  const stepNumber = FORM_STEP_INDEX[step]

  return (
    <div className="relative flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-600/10" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/10" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          to="/"
          className="font-display text-xl font-bold text-surface-900 dark:text-surface-50"
        >
          Estat<span className="text-emerald-600 dark:text-emerald-500">IQ</span>
        </Link>
        {step !== 'done' && (
          <Button variant="ghost" size="sm" onClick={() => void handleSkipSetup()}>
            {t('onboarding.skipSetup')}
          </Button>
        )}
      </header>

      {/* Stage */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8" aria-hidden="true">
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <span key={s} className={cnBar(i <= index)} />
              ))}
            </div>
            {stepNumber && (
              <p className="mt-2.5 text-xs font-medium text-surface-400">
                {t('onboarding.stepLabel', { current: stepNumber, total: FORM_STEP_TOTAL })}
              </p>
            )}
          </div>

          {/* Step card */}
          <div className="rounded-2xl bg-white p-7 shadow-card dark:border dark:border-surface-800 dark:bg-surface-900 sm:p-9">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: EASE_OUT }}
              >
                {step === 'welcome' && <WelcomeStep />}

                {step === 'property' && (
                  <PropertyStep
                    value={property}
                    errors={errors}
                    onChange={(patch) => setProperty((p) => ({ ...p, ...patch }))}
                  />
                )}

                {step === 'tenant' && (
                  <TenantStep
                    value={tenant}
                    errors={errors}
                    onChange={(patch) => setTenant((tn) => ({ ...tn, ...patch }))}
                  />
                )}

                {step === 'done' && (
                  <DoneStep
                    propertyName={property.name.trim()}
                    rent={parseRent(property.rent)}
                    tenantEmail={tenant.email.trim()}
                    tenantSkipped={tenantSkipped}
                    inviteLink={inviteLink}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            {step === 'done' && createMutation.error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {createMutation.error.message === 'unit_limit_exceeded' ? t('onboarding.error.unitLimitExceeded') : (createMutation.error.message || t('onboarding.error.generic'))}
              </p>
            )}

            {/* Footer actions */}
            <div className="mt-8 flex items-center gap-3">
              {step === 'welcome' && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => go(1)}
                  rightIcon={<ArrowRight size={18} />}
                >
                  {t('onboarding.welcome.cta')}
                </Button>
              )}

              {(step === 'property' || step === 'tenant') && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => go(-1)}
                    leftIcon={<ArrowLeft size={16} />}
                    disabled={createMutation.isPending}
                  >
                    {t('onboarding.back')}
                  </Button>
                  <div className="flex-1" />
                  {step === 'tenant' && (
                    <Button
                      variant="outline"
                      onClick={handleSkipTenant}
                      disabled={createMutation.isPending}
                    >
                      {t('onboarding.skip')}
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={createMutation.isPending}
                    rightIcon={
                      createMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowRight size={16} />
                      )
                    }
                  >
                    {t('onboarding.next')}
                  </Button>
                </>
              )}

              {step === 'done' && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleFinish}
                  disabled={createMutation.isPending}
                  rightIcon={
                    createMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )
                  }
                >
                  {createMutation.isPending
                    ? t('onboarding.done.creating')
                    : t('onboarding.done.cta')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function WelcomeStep() {
  const { t } = useTranslation()
  const points = [
    { icon: Building2, text: t('onboarding.welcome.points.property') },
    { icon: UserPlus, text: t('onboarding.welcome.points.tenant') },
    { icon: Sparkles, text: t('onboarding.welcome.points.relax') },
  ]
  return (
    <div>
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Sparkles size={22} />
      </div>
      <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('onboarding.welcome.title')}
      </h1>
      <p className="mt-2 text-surface-500 dark:text-surface-400">
        {t('onboarding.welcome.subtitle')}
      </p>
      <ul className="mt-6 space-y-3">
        {points.map(({ icon: Icon, text }, i) => (
          <li
            key={i}
            className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400">
              <Icon size={16} />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PropertyStep({
  value,
  errors,
  onChange,
}: {
  value: PropertyDraft
  errors: Record<string, string>
  onChange: (patch: Partial<PropertyDraft>) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      <StepHeading
        icon={<Building2 size={22} />}
        title={t('onboarding.property.title')}
        subtitle={t('onboarding.property.subtitle')}
      />
      <div className="mt-6 space-y-4">
        <Input
          label={t('onboarding.property.name')}
          placeholder={t('onboarding.property.namePlaceholder')}
          value={value.name}
          error={errors.name}
          autoFocus
          leftIcon={<Building2 size={16} />}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Input
          label={t('onboarding.property.street')}
          placeholder={t('onboarding.property.streetPlaceholder')}
          value={value.street}
          leftIcon={<MapPin size={16} />}
          onChange={(e) => onChange({ street: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('onboarding.property.city')}
            placeholder={t('onboarding.property.cityPlaceholder')}
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
          <Input
            label={t('onboarding.property.zip')}
            placeholder={t('onboarding.property.zipPlaceholder')}
            value={value.zip}
            inputMode="numeric"
            onChange={(e) => onChange({ zip: e.target.value })}
          />
        </div>
        <Input
          label={t('onboarding.property.rent')}
          placeholder={t('onboarding.property.rentPlaceholder')}
          value={value.rent}
          error={errors.rent}
          inputMode="numeric"
          className="font-tabular"
          leftIcon={<Banknote size={16} />}
          rightIcon={<span className="text-sm font-medium">Kč</span>}
          onChange={(e) => onChange({ rent: e.target.value })}
        />
      </div>
    </div>
  )
}

function TenantStep({
  value,
  errors,
  onChange,
}: {
  value: TenantDraft
  errors: Record<string, string>
  onChange: (patch: Partial<TenantDraft>) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      <StepHeading
        icon={<UserPlus size={22} />}
        title={t('onboarding.tenant.title')}
        subtitle={t('onboarding.tenant.subtitle')}
      />
      <div className="mt-6 space-y-4">
        <Input
          label={t('onboarding.tenant.name')}
          placeholder={t('onboarding.tenant.namePlaceholder')}
          value={value.name}
          error={errors.name}
          autoFocus
          leftIcon={<User size={16} />}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Input
          label={t('onboarding.tenant.email')}
          placeholder={t('onboarding.tenant.emailPlaceholder')}
          value={value.email}
          error={errors.email}
          type="email"
          autoComplete="off"
          leftIcon={<Mail size={16} />}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>
      <p className="mt-4 rounded-lg bg-surface-50 px-3.5 py-3 text-xs leading-relaxed text-surface-500 dark:bg-surface-800/50 dark:text-surface-400">
        {t('onboarding.tenant.inviteNote')}
      </p>
      <p className="mt-3 text-xs text-surface-400">{t('onboarding.tenant.skipHint')}</p>
    </div>
  )
}

function DoneStep({
  propertyName,
  rent,
  tenantEmail,
  tenantSkipped,
  inviteLink,
}: {
  propertyName: string
  rent: number
  tenantEmail: string
  tenantSkipped: boolean
  inviteLink: string | null
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [copied, setCopied] = useState(false)

  function copyLink() {
    if (!inviteLink) return
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const rows = [
    {
      done: true,
      text: t('onboarding.done.summary.property', {
        name: propertyName || t('onboarding.property.title'),
      }),
      meta: rent > 0 ? formatCurrency(rent) : undefined,
    },
    {
      done: !tenantSkipped && Boolean(tenantEmail),
      text:
        !tenantSkipped && tenantEmail
          ? t('onboarding.done.summary.tenant', { email: tenantEmail })
          : t('onboarding.done.summary.tenantSkipped'),
    },
    { done: true, text: t('onboarding.done.summary.automation') },
  ]

  return (
    <div className="text-center">
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
      >
        <CheckCircle2 size={34} strokeWidth={2.2} />
      </motion.div>
      <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('onboarding.done.title')}
      </h1>
      <p className="mt-2 text-surface-500 dark:text-surface-400">{t('onboarding.done.subtitle')}</p>

      <ul className="mt-7 space-y-2.5 text-left">
        {rows.map((row, i) => (
          <motion.li
            key={i}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.08, duration: 0.3, ease: EASE_OUT }}
            className="flex items-center gap-3 rounded-xl border border-surface-100 bg-surface-50/60 px-4 py-3 dark:border-surface-800 dark:bg-surface-800/40"
          >
            <span
              className={
                row.done
                  ? 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-400 dark:bg-surface-700'
              }
            >
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="flex-1 text-sm text-surface-700 dark:text-surface-300">{row.text}</span>
            {row.meta && (
              <span className="font-tabular text-sm font-semibold text-surface-900 dark:text-surface-100">
                {row.meta}
              </span>
            )}
          </motion.li>
        ))}
      </ul>

      {/* Invite link (copy-paste fallback — zobrazeno dokud není RESEND_API_KEY) */}
      {inviteLink && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.3, ease: EASE_OUT }}
          className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-left dark:border-emerald-900/30 dark:bg-emerald-900/10"
        >
          <p className="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {t('onboarding.done.inviteLink.label')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-white px-3 py-2 font-mono text-xs text-surface-700 dark:bg-surface-900 dark:text-surface-300">
              {inviteLink}
            </code>
            <button
              type="button"
              onClick={copyLink}
              aria-label={t('onboarding.done.inviteLink.copy')}
              className="shrink-0 rounded-md p-2 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            >
              {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-surface-400">{t('onboarding.done.inviteLink.hint')}</p>
        </motion.div>
      )}
    </div>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────────

function StepHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div>
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        {icon}
      </div>
      <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">{title}</h1>
      <p className="mt-2 text-surface-500 dark:text-surface-400">{subtitle}</p>
    </div>
  )
}

function cnBar(active: boolean) {
  return `h-1.5 flex-1 rounded-full transition-colors duration-300 ${
    active ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-800'
  }`
}

function parseRent(raw: string): number {
  return Number(raw.replace(/\D/g, '')) || 0
}
