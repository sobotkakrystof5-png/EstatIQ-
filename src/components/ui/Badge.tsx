import { cn } from '@/lib/utils'

type BadgeVariant = 'paid' | 'pending' | 'overdue' | 'canceled' | 'default' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  paid:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending:  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  overdue:  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  canceled: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-500',
  default:  'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  info:     'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {(variant === 'paid' || variant === 'pending' || variant === 'overdue') && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            variant === 'paid' && 'bg-emerald-500',
            variant === 'pending' && 'bg-amber-500',
            variant === 'overdue' && 'bg-red-500',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
