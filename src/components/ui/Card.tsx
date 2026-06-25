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
    <div
      className={cn(
        'rounded-xl bg-white shadow-card dark:bg-surface-900 dark:border dark:border-surface-800',
        (hover || onClick) && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        paddingStyles[padding],
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
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
