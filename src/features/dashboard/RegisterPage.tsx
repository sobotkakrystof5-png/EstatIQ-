import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, User, Phone, MapPin, Locate, ExternalLink, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import type { SupportedCurrency } from '@/hooks/useCurrency'

type Role = 'landlord' | 'tenant' | 'manager'
type LocationStatus = 'idle' | 'loading' | 'success' | 'error'

interface NominatimResponse {
  address?: {
    country_code?: string
    city?: string
    town?: string
    village?: string
    road?: string
    house_number?: string
  }
}

// TODO(fáze 2): internationalize country names via i18next-iso-countries
const COUNTRIES = [
  { value: 'CZ', label: 'Česká republika' },
  { value: 'SK', label: 'Slovensko' },
  { value: 'DE', label: 'Německo' },
  { value: 'AT', label: 'Rakousko' },
  { value: 'PL', label: 'Polsko' },
  { value: 'HU', label: 'Maďarsko' },
  { value: 'GB', label: 'Velká Británie' },
  { value: 'FR', label: 'Francie' },
  { value: 'ES', label: 'Španělsko' },
  { value: 'IT', label: 'Itálie' },
  { value: 'NL', label: 'Nizozemsko' },
  { value: 'BE', label: 'Belgie' },
  { value: 'CH', label: 'Švýcarsko' },
  { value: 'SE', label: 'Švédsko' },
  { value: 'NO', label: 'Norsko' },
  { value: 'DK', label: 'Dánsko' },
  { value: 'FI', label: 'Finsko' },
  { value: 'RO', label: 'Rumunsko' },
  { value: 'HR', label: 'Chorvatsko' },
  { value: 'RU', label: 'Rusko' },
  { value: 'UA', label: 'Ukrajina' },
  { value: 'US', label: 'USA' },
  { value: 'CA', label: 'Kanada' },
  { value: 'AU', label: 'Austrálie' },
  { value: 'CN', label: 'Čína' },
]

const CURRENCIES: { value: SupportedCurrency; label: string }[] = [
  { value: 'CZK', label: 'CZK — Česká koruna' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Americký dolar' },
  { value: 'GBP', label: 'GBP — Britská libra' },
  { value: 'PLN', label: 'PLN — Polský zlotý' },
  { value: 'RUB', label: 'RUB — Ruský rubl' },
  { value: 'CNY', label: 'CNY — Čínský jüan' },
]

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

  // Navigate once AuthContext confirms the session — avoids race condition
  useEffect(() => {
    if (session) void navigate(role === 'landlord' ? '/onboarding' : '/app/dashboard')
  }, [session, navigate, role])

  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('CZ')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>('CZK')
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { 'Accept-Language': 'cs', 'User-Agent': 'EstatIQ/1.0 (contact@estatiq.cz)' } },
          )
          const data = (await res.json()) as NominatimResponse
          const addr = data.address ?? {}
          if (addr.country_code) setCountry(addr.country_code.toUpperCase())
          setCity(addr.city ?? addr.town ?? addr.village ?? '')
          setStreet(addr.road ?? '')
          setHouseNumber(addr.house_number ?? '')
          setLocationStatus('success')
        } catch {
          setLocationStatus('error')
        }
      },
      () => setLocationStatus('error'),
    )
  }

  function openCadastre() {
    const address = `${street} ${houseNumber}, ${city}`.trim()
    window.open(
      `https://nahlizenidokn.cuzk.cz/?adresa=${encodeURIComponent(address)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

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
          role: role === 'landlord' ? 'pronajimatel' : role === 'manager' ? 'spravce' : 'najemnik',
          phone,
          country,
          city,
          street,
          house_number: houseNumber,
          preferred_currency: preferredCurrency,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If Supabase requires email confirmation, data.session is null
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setCheckEmail(true)
      setLoading(false)
      return
    }
    // If auto-confirmed: useEffect above navigates when session appears in context
  }

  const roles: { value: Role; label: string }[] = [
    { value: 'landlord', label: t('auth.register.role.landlord') },
    { value: 'tenant', label: t('auth.register.role.tenant') },
    { value: 'manager', label: t('auth.register.role.manager') },
  ]

  const hasCzAddress = country === 'CZ' && (street || city)

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
        <Link to="/auth/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
          {t('auth.register.checkEmail.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('auth.register.title')}
      </h1>
      <p className="mb-6 text-sm text-surface-500 dark:text-surface-400">
        {t('auth.register.subtitle')}
      </p>

      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
          {t('auth.register.role.label')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {roles.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                role === value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800'
              }`}
              aria-pressed={role === value}
            >
              {label}
            </button>
          ))}
        </div>
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

        {/* Contact & location section */}
        <div className="pt-1">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            <Building2 size={13} />
            {t('auth.register.contactSection')}
          </p>

          <div className="space-y-4">
            <Input
              label={t('auth.register.phone')}
              type="tel"
              autoComplete="tel"
              placeholder="+420 123 456 789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={16} />}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={detectLocation}
                disabled={locationStatus === 'loading'}
                className="flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 disabled:cursor-wait disabled:opacity-60 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800"
              >
                <Locate size={14} />
                {locationStatus === 'loading'
                  ? t('auth.register.detectingLocation')
                  : t('auth.register.detectLocation')}
              </button>
              {locationStatus === 'success' && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {t('auth.register.locationSuccess')}
                </span>
              )}
              {locationStatus === 'error' && (
                <span className="text-xs text-red-500 dark:text-red-400">
                  {t('auth.register.locationError')}
                </span>
              )}
            </div>

            <Select
              label={t('auth.register.country')}
              id="country"
              value={country}
              onValueChange={setCountry}
              options={COUNTRIES}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('auth.register.city')}
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin size={16} />}
              />
              <Input
                label={t('auth.register.houseNumber')}
                type="text"
                autoComplete="address-line2"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={t('auth.register.street')}
                  type="text"
                  autoComplete="street-address"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              {hasCzAddress && (
                <button
                  type="button"
                  onClick={openCadastre}
                  title={t('auth.register.checkCadastre')}
                  className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800"
                >
                  <ExternalLink size={14} />
                  ČÚZK
                </button>
              )}
            </div>

            <Select
              label={t('auth.register.preferredCurrency')}
              id="preferredCurrency"
              value={preferredCurrency}
              onValueChange={(v) => setPreferredCurrency(v as SupportedCurrency)}
              options={CURRENCIES}
            />
          </div>
        </div>

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
