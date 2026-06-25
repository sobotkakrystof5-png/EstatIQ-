import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, Building2, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

type Role = 'landlord' | 'manager'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>('landlord')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  useEffect(() => {
    if (session) void navigate('/onboarding')
  }, [session, navigate])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role === 'landlord' ? 'pronajimatel' : 'spravce',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setCheckEmail(true)
      setLoading(false)
    }
    // If auto-confirmed: useEffect above navigates when session appears in context
  }

  if (checkEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
          <Mail size={26} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="font-display mb-2 text-xl font-bold text-surface-900 dark:text-surface-50">
          {t('auth.register.checkEmail.title')}
        </h2>
        <p className="mb-6 text-sm text-surface-500 dark:text-surface-400">
          {t('auth.register.checkEmail.body', { email })}
        </p>
        <Link
          to="/auth/login"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          {t('auth.register.checkEmail.backToLogin')}
        </Link>
      </div>
    )
  }

  const roles: { value: Role; icon: React.ReactNode; label: string; description: string }[] = [
    {
      value: 'landlord',
      icon: <Home size={20} />,
      label: t('auth.register.role.landlord'),
      description: t('auth.register.role.landlordDesc'),
    },
    {
      value: 'manager',
      icon: <Building2 size={20} />,
      label: t('auth.register.role.manager'),
      description: t('auth.register.role.managerDesc'),
    },
  ]

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('auth.register.title')}
      </h1>
      <p className="mb-6 text-sm text-surface-500 dark:text-surface-400">
        {t('auth.register.subtitle')}
      </p>

      {/* Role selector */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {roles.map(({ value, icon, label, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            aria-pressed={role === value}
            className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              role === value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600 dark:hover:bg-surface-800'
            }`}
          >
            <span className={role === value ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-500 dark:text-surface-400'}>
              {icon}
            </span>
            <span className={`text-sm font-semibold ${role === value ? 'text-emerald-700 dark:text-emerald-300' : 'text-surface-800 dark:text-surface-200'}`}>
              {label}
            </span>
            <span className="text-xs leading-tight text-surface-400 dark:text-surface-500">
              {description}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t('auth.register.name')}
          type="text"
          autoComplete="name"
          autoFocus
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User size={16} />}
        />
        <Input
          label={t('auth.register.email')}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
        />
        <Input
          label={t('auth.register.password')}
          type="password"
          autoComplete="new-password"
          required
          hint={t('auth.register.passwordHint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
        />

        <label className="flex items-start gap-2.5 text-sm text-surface-600 dark:text-surface-400">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-surface-300 accent-emerald-600"
          />
          <span>{t('auth.register.terms')}</span>
        </label>

        <Button type="submit" loading={loading} className="w-full">
          {t('auth.register.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
        {t('auth.register.hasAccount')}{' '}
        <Link
          to="/auth/login"
          className="font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
        >
          {t('auth.register.login')}
        </Link>
      </p>
    </div>
  )
}
