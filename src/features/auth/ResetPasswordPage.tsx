import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

type Phase = 'waiting' | 'form' | 'success' | 'invalid'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('waiting')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase JS v2 automatically parses the #access_token hash and emits
    // PASSWORD_RECOVERY when the URL contains type=recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPhase('form')
    })

    // Safety timeout — if no recovery event fires in 5 s, link is invalid/expired
    const timeout = setTimeout(() => {
      setPhase((current) => (current === 'waiting' ? 'invalid' : current))
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'success') return
    const timer = setTimeout(() => void navigate('/auth/login'), 2500)
    return () => clearTimeout(timer)
  }, [phase, navigate])

  function validate(): boolean {
    let valid = true
    setPasswordError('')
    setConfirmError('')

    if (password.length < 8) {
      setPasswordError(t('auth.resetPassword.passwordHint'))
      valid = false
    }
    if (password !== confirm) {
      setConfirmError(t('auth.resetPassword.passwordMismatch'))
      valid = false
    }
    return valid
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSubmitError('')

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      setSubmitError(t('auth.resetPassword.error'))
      return
    }

    setPhase('success')
  }

  // ── Waiting for Supabase to parse the token ──────────────────────────────────

  if (phase === 'waiting') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-surface-200 border-t-emerald-500 dark:border-surface-700 dark:border-t-emerald-400" />
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {t('auth.resetPassword.validating')}
        </p>
      </div>
    )
  }

  // ── Invalid / expired link ───────────────────────────────────────────────────

  if (phase === 'invalid') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('auth.resetPassword.invalidTitle')}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {t('auth.resetPassword.invalidMessage')}
          </p>
        </div>
        <Link
          to="/auth/forgot-password"
          className="block text-sm text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
        >
          {t('auth.resetPassword.requestNew')}
        </Link>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  if (phase === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('auth.resetPassword.successTitle')}
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {t('auth.resetPassword.successMessage')}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ animation: 'progress-fill 2.5s linear forwards' }} />
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('auth.resetPassword.title')}
      </h1>
      <p className="mb-8 text-sm text-surface-500 dark:text-surface-400">
        {t('auth.resetPassword.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Input
            label={t('auth.resetPassword.password')}
            type="password"
            autoComplete="new-password"
            required
            autoFocus
            value={password}
            error={passwordError}
            leftIcon={<Lock size={16} />}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!passwordError && (
            <p className="mt-1 text-xs text-surface-400">
              {t('auth.resetPassword.passwordHint')}
            </p>
          )}
        </div>
        <Input
          label={t('auth.resetPassword.passwordConfirm')}
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          error={confirmError}
          leftIcon={<Lock size={16} />}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {submitError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {submitError}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          {t('auth.resetPassword.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="text-sm text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
        >
          {t('auth.resetPassword.back')}
        </Link>
      </p>
    </div>
  )
}
