import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(t('auth.forgotPassword.error'))
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
        </div>
        <h1 className="font-display mb-2 text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('auth.forgotPassword.successTitle')}
        </h1>
        <p className="mb-6 text-sm text-surface-500 dark:text-surface-400">
          {t('auth.forgotPassword.successMessage')}
        </p>
        <Link
          to="/auth/login"
          className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
        >
          {t('auth.forgotPassword.back')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('auth.forgotPassword.title')}
      </h1>
      <p className="mb-8 text-sm text-surface-500 dark:text-surface-400">
        {t('auth.forgotPassword.subtitle')}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t('auth.forgotPassword.email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
        />

        <Button type="submit" loading={loading} className="w-full">
          {t('auth.forgotPassword.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          to="/auth/login"
          className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
        >
          {t('auth.forgotPassword.back')}
        </Link>
      </p>
    </div>
  )
}
