import { motion } from 'framer-motion'
import { Zap, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage'

interface UnitLimitBannerProps {
  /** Called when the user clicks the upgrade button */
  onUpgrade?: () => void
  className?: string
}

export function UnitLimitBanner({ onUpgrade, className }: UnitLimitBannerProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useSubscriptionUsage()

  // Don't render anything while loading or when there's plenty of headroom
  if (isLoading || !data) return null
  const { unit_count, unit_limit, fill, isAtLimit, isActive } = data

  // Only show when at 80%+ usage
  const showWarning = fill >= 0.8
  if (!showWarning) return null

  const atLimit = isAtLimit
  const locked = !isActive

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm',
        atLimit || locked
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-300',
        className,
      )}
    >
      {atLimit || locked ? (
        <AlertTriangle size={16} className="shrink-0" aria-hidden />
      ) : (
        <Zap size={16} className="shrink-0" aria-hidden />
      )}

      <span className="flex-1">
        {locked
          ? t('subscription.banner.locked')
          : atLimit
            ? t('subscription.banner.atLimit', { limit: unit_limit })
            : t('subscription.banner.nearLimit', { count: unit_count, limit: unit_limit })}
      </span>

      {/* Progress bar */}
      <div
        className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 sm:block"
        aria-hidden
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            atLimit ? 'bg-red-500' : 'bg-amber-500',
          )}
          style={{ width: `${fill * 100}%` }}
        />
      </div>

      <Button
        size="sm"
        variant={atLimit || locked ? 'primary' : 'outline'}
        onClick={onUpgrade}
        className="shrink-0"
      >
        {t('subscription.banner.upgradeCta')}
      </Button>
    </motion.div>
  )
}
