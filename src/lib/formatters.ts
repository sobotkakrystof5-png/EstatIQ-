import i18n from '@/i18n/config'
import { getStoredCurrency } from '@/hooks/useCurrency'

const LOCALE_MAP: Record<string, string> = {
  cs: 'cs-CZ',
  en: 'en-GB',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  zh: 'zh-CN',
  sk: 'sk-SK',
  ru: 'ru-RU',
}

function getLocale(): string {
  return LOCALE_MAP[i18n.language] ?? 'cs-CZ'
}

export function formatCurrency(
  amount: number,
  currency?: string,
  options?: Intl.NumberFormatOptions,
): string {
  const resolvedCurrency = currency ?? getStoredCurrency()
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: resolvedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  return formatDate(date, { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return i18n.t('dashboard.upcomingPayments.dueToday')
  if (diffDays > 0) return i18n.t('dashboard.upcomingPayments.dueIn', { days: diffDays })
  return i18n.t('dashboard.upcomingPayments.overdue', { days: Math.abs(diffDays) })
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const s = new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function currentYYYYMM(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}
