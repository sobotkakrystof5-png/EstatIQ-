import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

type Theme = 'light' | 'dark' | 'system'

const THEMES: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light',  icon: Sun,     labelKey: 'theme.light' },
  { value: 'dark',   icon: Moon,    labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
]

function CurrentIcon({ theme }: { theme: Theme }) {
  const Icon = THEMES.find((t) => t.value === theme)?.icon ?? Monitor
  return <Icon size={18} />
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('theme.toggle')}
          className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        >
          <CurrentIcon theme={theme} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[148px] overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-modal',
            'dark:border-surface-700 dark:bg-surface-900',
            'origin-top-right transition-all duration-150',
            'data-[state=open]:opacity-100 data-[state=open]:scale-100',
            'data-[state=closed]:opacity-0 data-[state=closed]:scale-95',
          )}
        >
          {THEMES.map(({ value, icon: Icon, labelKey }) => {
            const isActive = theme === value
            return (
              <DropdownMenu.Item
                key={value}
                onSelect={() => setTheme(value)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
                  'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
                  isActive && 'font-semibold text-emerald-700 dark:text-emerald-400',
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1">{t(labelKey)}</span>
                {isActive && <Check size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
