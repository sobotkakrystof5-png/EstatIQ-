import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle, Building2, FileText, BarChart3, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { PrelaunchSplash } from './PrelaunchSplash'

const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const SPLASH_SEEN_KEY = 'estatiq_prelaunch_splash_seen'

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

const AVATAR_COLORS = [
  { bg: '#059669', text: '#d1fae5' },
  { bg: '#4338ca', text: '#e0e7ff' },
  { bg: '#b45309', text: '#fef3c7' },
  { bg: '#9d174d', text: '#fce7f3' },
] as const

const FEATURE_KEYS = [
  { icon: Zap,       key: 'payments'   },
  { icon: Building2, key: 'properties' },
  { icon: FileText,  key: 'documents'  },
  { icon: BarChart3, key: 'taxes'      },
] as const

export default function PrelaunchPage() {
  const { t, i18n } = useTranslation()

  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem(SPLASH_SEEN_KEY)
  )
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [count, setCount] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    setShowSplash(false)
  }, [])

  useEffect(() => {
    fetch('/api/waitlist-count')
      .then(r => r.json())
      .then((data: { count: number }) => setCount(data.count || null))
      .catch(() => setCount(null))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/waitlist-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale: i18n.language }),
      })

      const data = await res.json() as { success?: boolean; count?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Server error')

      setStatus('success')
      if (data.count) setCount(data.count + 200)

    } catch {
      setStatus('error')
      setErrorMsg(t('prelaunch.errorMsg'))
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <PrelaunchSplash onDone={handleSplashDone} />}
      </AnimatePresence>

      <motion.div
        className="min-h-screen bg-surface-950 text-surface-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
      >
        {/* Navbar */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-surface-800/60">
          <span className="font-display text-xl font-bold">
            Estat<span className="text-emerald-500">IQ</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="dark">
              <LanguageSwitcher />
            </div>
            <span className="hidden sm:inline-flex text-xs font-semibold text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-3 py-1 rounded-full tracking-wider uppercase">
              Coming Soon
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center relative">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
            aria-hidden="true"
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 70%)' }}
            />
          </div>

          <div className="w-full max-w-2xl mx-auto px-6 py-20 text-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={showSplash ? 'hidden' : 'visible'}
            >
              {/* Eyebrow badge */}
              <motion.div variants={fadeUp} className="mb-8">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  {t('prelaunch.eyebrow')}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="font-display text-5xl md:text-6xl font-bold leading-[1.06] tracking-tight text-surface-50 mb-6"
              >
                {(() => {
                  const headline = t('landing.hero.headline')
                  const commaIdx = headline.indexOf(',')
                  const dotIdx = headline.indexOf('.')
                  const splitIdx = commaIdx !== -1 ? commaIdx : dotIdx
                  if (splitIdx !== -1) {
                    return (
                      <>
                        {headline.slice(0, splitIdx)}
                        <span className="text-emerald-400">{headline.slice(splitIdx)}</span>
                      </>
                    )
                  }
                  return <span className="text-emerald-400">{headline}</span>
                })()}
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                className="text-lg leading-relaxed text-surface-400 max-w-lg mx-auto mb-10"
              >
                {t('prelaunch.subheadline')}
              </motion.p>

              {/* Form / success state */}
              <motion.div variants={fadeUp} className="max-w-md mx-auto mb-8">
                {status === 'success' ? (
                  <div className="flex items-start gap-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-4 text-left">
                    <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-300 mb-0.5">
                        {t('prelaunch.successTitle')}
                      </p>
                      <p className="text-sm text-emerald-500/80">
                        {t('prelaunch.successBody')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('prelaunch.emailPlaceholder')}
                      required
                      aria-label="E-mail"
                      className="flex-1 bg-surface-800/60 border border-surface-700 rounded-xl px-4 py-3.5 text-sm text-surface-50 placeholder-surface-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-3.5 rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                      {status === 'loading' ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>{t('prelaunch.cta')} <ArrowRight size={15} aria-hidden="true" /></>
                      )}
                    </button>
                  </form>
                )}
                {errorMsg && (
                  <p className="mt-2 text-sm text-red-400 text-center" role="alert">{errorMsg}</p>
                )}
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-16">
                <div className="flex -space-x-1.5" aria-hidden="true">
                  {(['MN', 'JP', 'KS', 'TK'] as const).map((initials, i) => (
                    <div
                      key={initials}
                      className="w-6 h-6 rounded-full border-2 border-surface-950 flex items-center justify-center text-[9px] font-semibold"
                      style={{
                        background: AVATAR_COLORS[i]?.bg,
                        color: AVATAR_COLORS[i]?.text,
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                {count !== null && (
                  <span className="text-sm text-surface-400">
                    <span className="text-surface-200 font-semibold tabular-nums">{count}</span>
                    {' '}{t('prelaunch.socialProof')}
                  </span>
                )}
              </motion.div>

              {/* Feature grid */}
              <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FEATURE_KEYS.map(({ icon: Icon, key }) => (
                  <motion.div
                    key={key}
                    variants={fadeUp}
                    className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-4 text-left hover:border-surface-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center mb-3">
                      <Icon size={16} className="text-emerald-400" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-semibold text-surface-200 mb-1">
                      {t(`prelaunch.features.${key}.title`)}
                    </p>
                    <p className="text-xs text-surface-500 leading-snug">
                      {t(`prelaunch.features.${key}.desc`)}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-800/60 px-6 py-5 flex items-center justify-between text-xs text-surface-600">
          <span>© {new Date().getFullYear()} EstatIQ</span>
          <span>{t('prelaunch.footer')}</span>
        </footer>
      </motion.div>
    </>
  )
}
