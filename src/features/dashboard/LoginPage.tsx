import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/app/dashboard'

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Navigate once AuthContext confirms the session — avoids race condition where
  // navigate() fires before setSession() is committed in the context
  useEffect(() => {
    if (session) void navigate(from, { replace: true })
  }, [session, navigate, from])

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    })
  }

  async function handleAppleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    })
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t('auth.login.error'))
      setLoading(false)
    }
    // Navigation handled by useEffect above when session updates in AuthContext
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('auth.login.title')}
      </h1>
      <p className="mb-8 text-sm text-surface-500 dark:text-surface-400">
        {t('auth.login.subtitle')}
      </p>

      {/* Social sign-in buttons */}
      <div className="mb-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.login.google')}
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          {t('auth.login.apple')}
        </button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-100 dark:bg-surface-800" />
        <span className="text-xs text-surface-400 dark:text-surface-500">{t('auth.login.orEmail')}</span>
        <div className="h-px flex-1 bg-surface-100 dark:bg-surface-800" />
      </div>

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
