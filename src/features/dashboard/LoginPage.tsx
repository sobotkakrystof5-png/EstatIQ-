import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/app/dashboard'

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t('auth.login.error'))
      setLoading(false)
      return
    }

    void navigate(from, { replace: true })
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('auth.login.title')}
      </h1>
      <p className="mb-8 text-sm text-surface-500 dark:text-surface-400">
        {t('auth.login.subtitle')}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t('auth.login.email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
        />
        <div>
          <Input
            label={t('auth.login.password')}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
          />
          <div className="mt-1.5 flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-xs text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
        {t('auth.login.noAccount')}{' '}
        <Link to="/auth/register" className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400">
          {t('auth.login.register')}
        </Link>
      </p>
    </div>
  )
}
