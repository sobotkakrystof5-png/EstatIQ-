import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Lock, Mail, MailCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

type InviteType = 'tenant' | 'member'

interface InviteData {
  id: string
  token: string
  type: InviteType
  email: string
  tenantId: string | null
}

// ── Supabase helpers ───────────────────────────────────────────────────────────

async function fetchInvite(token: string): Promise<InviteData> {
  if (!token) throw new Error('missing')

  const { data, error } = await supabase
    .from('invitations')
    .select('id, email, tenant_id, status, expires_at')
    .eq('token', token)
    .single()

  if (error || !data) throw new Error('not_found')
  if (data.status !== 'pending') throw new Error('used')
  if (new Date(data.expires_at) < new Date()) throw new Error('expired')

  return {
    id: data.id,
    token,
    type: data.tenant_id ? 'tenant' : 'member',
    email: data.email,
    tenantId: data.tenant_id,
  }
}

async function acceptInvite(
  invite: InviteData,
  name: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  // Vše se provádí v Edge Function se service role, aby se obešel RLS na invitations a tenants.
  const { data, error } = await supabase.functions.invoke('accept-invitation', {
    body: { token: invite.token, name, password },
  })

  if (error) throw error

  const result = data as { needsConfirmation?: boolean; error?: string }
  if (result.error) throw new Error(result.error)

  // Pokud email confirmation není potřeba, přihlásíme uživatele rovnou.
  if (!result.needsConfirmation) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password,
    })
    if (signInError) throw signInError
  }

  return { needsConfirmation: result.needsConfirmation ?? false }
}

// ── Component ──────────────────────────────────────────────────────────────────

type Phase = 'validating' | 'invalid' | 'form' | 'awaiting_confirmation' | 'success'

export default function AcceptInvitePage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [phase, setPhase] = useState<Phase>('validating')
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInvite(token)
      .then((data) => {
        setInvite(data)
        setPhase('form')
      })
      .catch(() => setPhase('invalid'))
  }, [token])

  useEffect(() => {
    if (phase !== 'success' || !invite) return
    const timer = setTimeout(
      () => void navigate(invite.type === 'tenant' ? '/tenant/dashboard' : '/app/b2b'),
      1800,
    )
    return () => clearTimeout(timer)
  }, [phase, invite, navigate])

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = t('auth.acceptInvite.name') + ' ' + t('common.required', { defaultValue: 'je povinné' })
    if (password.length < 8) next.password = t('auth.acceptInvite.passwordHint')
    if (password !== confirm) next.confirm = t('auth.acceptInvite.passwordMismatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!invite || !validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { needsConfirmation } = await acceptInvite(invite, name.trim(), password)
      setPhase(needsConfirmation ? 'awaiting_confirmation' : 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      setSubmitError(
        msg.includes('already registered')
          ? t('auth.acceptInvite.errorAlreadyRegistered')
          : t('auth.acceptInvite.submitError'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Validating ─────────────────────────────────────────────────────────────

  if (phase === 'validating') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-surface-200 border-t-emerald-500 dark:border-surface-700 dark:border-t-emerald-400" />
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {t('auth.acceptInvite.validating')}
        </p>
      </div>
    )
  }

  // ── Invalid / expired ──────────────────────────────────────────────────────

  if (phase === 'invalid') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('auth.acceptInvite.invalidTitle')}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {t('auth.acceptInvite.invalidMessage')}
          </p>
        </div>
        <Link
          to="/auth/login"
          className="block text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
        >
          {t('auth.acceptInvite.backToLogin')}
        </Link>
      </div>
    )
  }

  // ── Awaiting email confirmation ────────────────────────────────────────────

  if (phase === 'awaiting_confirmation') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
          <MailCheck size={28} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('auth.acceptInvite.confirmEmailTitle')}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {t('auth.acceptInvite.confirmEmailMessage', { email: invite?.email ?? '' })}
          </p>
        </div>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (phase === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('auth.acceptInvite.successTitle')}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {t('auth.acceptInvite.successMessage')}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ animation: 'progress-fill 1.8s linear forwards' }}
          />
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  const isTenant = invite?.type === 'tenant'
  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {isTenant ? t('auth.acceptInvite.tenantTitle') : t('auth.acceptInvite.memberTitle')}
      </h1>
      <p className="mb-8 text-sm text-surface-500 dark:text-surface-400">
        {isTenant ? t('auth.acceptInvite.tenantSubtitle') : t('auth.acceptInvite.memberSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t('auth.acceptInvite.name')}
          autoComplete="name"
          required
          value={name}
          error={errors.name}
          autoFocus
          leftIcon={<User size={16} />}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={t('auth.acceptInvite.email')}
          type="email"
          autoComplete="email"
          readOnly
          value={invite?.email ?? ''}
          leftIcon={<Mail size={16} />}
          className="opacity-60"
        />
        <div>
          <Input
            label={t('auth.acceptInvite.password')}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            error={errors.password}
            leftIcon={<Lock size={16} />}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!errors.password && (
            <p className="mt-1 text-xs text-surface-400">
              {t('auth.acceptInvite.passwordHint')}
            </p>
          )}
        </div>
        <Input
          label={t('auth.acceptInvite.passwordConfirm')}
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          error={errors.confirm}
          leftIcon={<Lock size={16} />}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {submitError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
          {t('auth.acceptInvite.submit')}
        </Button>
      </form>
    </div>
  )
}
