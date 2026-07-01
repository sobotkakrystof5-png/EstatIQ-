import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Workspace } from './types'

const WORKSPACES: { id: Workspace; badge?: string }[] = [
  { id: 'manage' },
  { id: 'crm' },
  { id: 'airbnb' },
  { id: 'svj' },
]

interface WorkspaceSwitcherProps {
  value: Workspace
  onChange: (w: Workspace) => void
  className?: string
}

export function WorkspaceSwitcher({ value, onChange, className }: WorkspaceSwitcherProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex gap-1 overflow-x-auto scrollbar-none', className)}>
      {WORKSPACES.map(({ id }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            value === id
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700',
          )}
        >
          {t(`workspace.${id}`)}
        </button>
      ))}
    </div>
  )
}
