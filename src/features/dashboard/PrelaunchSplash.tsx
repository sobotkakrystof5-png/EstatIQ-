import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Props {
  onDone: () => void
}

const EASE_OUT = [0, 0, 0.2, 1] as [number, number, number, number]
const EASE_IN = [0.4, 0, 1, 1] as [number, number, number, number]

export function PrelaunchSplash({ onDone }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(onDone, 2200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 0.97,
        transition: { duration: 0.55, ease: EASE_IN },
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-950"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(16,185,129,0.10) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
          className="font-display text-5xl font-bold tracking-tight text-surface-50"
        >
          Estat<span className="text-emerald-400">IQ</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.4 }}
          className="font-display text-xl font-medium text-surface-400 tracking-tight mt-4"
        >
          {t('landing.hero.headline')}
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-14 h-px overflow-hidden rounded-full bg-surface-800">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, ease: 'linear', delay: 0.8 }}
        />
      </div>
    </motion.div>
  )
}
