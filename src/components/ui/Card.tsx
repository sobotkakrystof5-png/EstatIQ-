import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  children,
  className,
  hover = false,
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <motion.div
      whileHover={
        hover || onClick
          ? {
              y: -2,
              boxShadow: '0 12px 40px -8px rgb(0 0 0 / 0.14), 0 2px 8px -2px rgb(0 0 0 / 0.08)',
            }
          : undefined
      }
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-xl bg-white shadow-card dark:bg-surface-900 dark:border dark:border-surface-800',
        (hover || onClick) && 'cursor-pointer',
        paddingStyles[padding],
        className,
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('text-sm font-semibold text-surface-500 dark:text-surface-400', className)}>
      {children}
    </h3>
  )
}
