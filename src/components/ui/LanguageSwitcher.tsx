import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'cs', label: 'Čeština',    flag: '🇨🇿' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'zh', label: '中文',       flag: '🇨🇳' },
] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={`Jazyk: ${current.label}`}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        >
          <Globe size={16} />
          <span className="hidden sm:inline">{current.flag} {current.code.toUpperCase()}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[160px] overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-modal',
            'dark:border-surface-700 dark:bg-surface-900',
            'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
          )}
        >
          {LANGUAGES.map(({ code, label, flag }) => {
            const isActive = i18n.language === code
            return (
              <DropdownMenu.Item
                key={code}
                onSelect={() => void i18n.changeLanguage(code)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
                  'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
                  isActive && 'font-semibold text-emerald-700 dark:text-emerald-400',
                )}
              >
                <span className="text-base leading-none">{flag}</span>
                <span className="flex-1">{label}</span>
                {isActive && <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
