import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'estatiq_cookie_consent_v1'

type ConsentState = 'accepted' | 'rejected' | null

export function CookieConsent() {
  const { t } = useTranslation()
  const [consent, setConsent] = useState<ConsentState>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null
    if (!stored) {
      // Slight delay so the banner doesn't flash on initial render
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
    setConsent(stored)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setConsent('accepted')
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setConsent('rejected')
    setVisible(false)
  }

  if (consent !== null || !visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="dialog"
        aria-label={t('cookies.banner.ariaLabel')}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl border border-surface-200 bg-white p-4 shadow-2xl dark:border-surface-700 dark:bg-surface-900 sm:bottom-6 sm:left-6 sm:right-auto sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Cookie size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="mb-1 text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('cookies.banner.title')}
            </p>
            <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
              {t('cookies.banner.description')}{' '}
              <a
                href="/zasady-ochrany-soukromi"
                className="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                {t('cookies.banner.learnMore')}
              </a>
            </p>
          </div>

          <button
            onClick={reject}
            aria-label={t('cookies.banner.reject')}
            className="ml-1 shrink-0 rounded-lg p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex gap-2 pl-12">
          <button
            onClick={reject}
            className="flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800"
          >
            {t('cookies.banner.reject')}
          </button>
          <button
            onClick={accept}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            {t('cookies.banner.accept')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/** Vrátí true pokud uživatel schválil cookies. Použij pro podmíněné načítání analytics. */
export function hasCookieConsent(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'accepted'
}
