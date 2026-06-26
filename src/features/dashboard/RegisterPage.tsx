import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, Building2, Home, ShieldCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'

type Role = 'landlord' | 'manager'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

async function sendWelcomeEmail(accessToken: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    // welcome email is non-critical
  }
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()

  // Registration form state
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>('landlord')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // OTP verification state
  const [showOtp, setShowOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (session) void navigate('/onboarding')
  }, [session, navigate])

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  function startResendCooldown() {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: role === 'landlord' ? 'pronajimatel' : 'spravce' },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setShowOtp(true)
      startResendCooldown()
      setLoading(false)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    }
    // auto-confirmed → useEffect navigates
  }

  function handleOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[index] = digit
    setOtpDigits(next)
    if (digit && index < 5) otpInputRefs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) {
      void handleVerifyOtp(next.join(''))
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) otpInputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) otpInputRefs.current[index + 1]?.focus()
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = [...otpDigits]
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d })
    setOtpDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    otpInputRefs.current[focusIdx]?.focus()
    if (pasted.length === 6) void handleVerifyOtp(pasted)
  }

  async function handleVerifyOtp(code?: string) {
    const token = code ?? otpDigits.join('')
    if (token.length < 6) return
    setOtpError(null)
    setOtpLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })

    if (error) {
      setOtpError(t('auth.register.otp.error'))
      setOtpLoading(false)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50)
      return
    }

    if (data.session) {
      void sendWelcomeEmail(data.session.access_token)
    }
    // useEffect handles navigation when AuthContext session updates
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    await supabase.auth.resend({ type: 'signup', email })
    startResendCooldown()
    setOtpDigits(['', '', '', '', '', ''])
    setOtpError(null)
    setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
  }

  // ── OTP screen ─────────────────────────────────────────────────────────────
  if (showOtp) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
          <ShieldCheck size={26} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('auth.register.otp.title')}
        </h2>
        <p className="mb-2 text-sm text-surface-500 dark:text-surface-400">
          {t('auth.register.otp.subtitle')}
        </p>
        <p className="mb-8 text-sm font-medium text-surface-700 dark:text-surface-300">{email}</p>

        {otpError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            {otpError}
          </div>
        )}

        {/* 6-digit boxes */}
        <div className="mb-6 flex justify-center gap-2" onPaste={handleOtpPaste} role="group" aria-label={t('auth.register.otp.ariaLabel')}>
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              ref={el => { otpInputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpDigit(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              disabled={otpLoading}
              aria-label={`${t('auth.register.otp.digitLabel')} ${i + 1}`}
              className="h-14 w-11 rounded-xl border border-surface-200 bg-white text-center text-xl font-bold tabular-nums text-surface-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:focus:border-emerald-400"
            />
          ))}
        </div>

        {otpLoading && (
          <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">
            {t('auth.register.otp.verifying')}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="flex items-center gap-1.5 mx-auto text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:text-surface-400 disabled:cursor-not-allowed dark:text-emerald-400 dark:disabled:text-surface-600 transition-colors"
        >
          <RefreshCw size={14} />
          {resendCooldown > 0
            ? t('auth.register.otp.resendCooldown', { seconds: resendCooldown })
            : t('auth.register.otp.resend')}
        </button>

        <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-800">
          <Link
            to="/auth/login"
            className="text-sm text-surface-400 transition-colors hover:text-surface-600 dark:hover:text-surface-300"
          >
            {t('auth.register.checkEmail.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  // ── Registration form ──────────────────────────────────────────────────────
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

      {/* Social sign-up buttons */}
      <div className="mb-4 flex flex-col gap-3">
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
          {t('auth.register.google')}
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-surface-600 dark:hover:bg-surface-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          {t('auth.register.apple')}
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-100 dark:bg-surface-800" />
        <span className="text-xs text-surface-400 dark:text-surface-500">{t('auth.login.orEmail')}</span>
        <div className="h-px flex-1 bg-surface-100 dark:bg-surface-800" />
      </div>

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
