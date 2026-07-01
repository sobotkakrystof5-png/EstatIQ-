import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ExternalLink, TrendingDown, CalendarClock } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateShort } from '@/lib/formatters'

// Statická data — v budoucnu nahradit scheduled Edge Function (TODO fáze 2)
const SUBSIDIES = [
  { id: 1, name: 'Nová zelená úsporám', expires: '2027-12-31', url: 'https://novazelenausporam.cz' },
  { id: 2, name: 'Kotlíkové dotace', expires: '2027-12-31', url: 'https://kotliky.cz' },
  { id: 3, name: 'Oprav dům po babičce', expires: '2026-12-31', url: 'https://opravdum.cz' },
  { id: 4, name: 'PANEL 2013+', expires: '2026-12-31', url: 'https://sfrb.cz/panel' },
  { id: 5, name: 'Dostupné bydlení', expires: '2027-06-30', url: 'https://mmr.cz' },
]

const MORTGAGE_RATE = { value: '4,18 %', trend: 'down' as const }

export function SubsidiesTab() {
  const { t } = useTranslation()

  return (
    <div className="p-6 lg:p-8">
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 font-display text-2xl font-bold text-surface-900 dark:text-surface-50"
      >
        {t('subsidies.title')}
      </motion.h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dotace */}
        <Card padding="lg">
          <CardHeader>
            <div>
              <CardTitle>{t('subsidies.available.title')}</CardTitle>
            </div>
            <Badge variant="paid" className="text-xs">
              {SUBSIDIES.length} {t('subsidies.available.count')}
            </Badge>
          </CardHeader>

          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {SUBSIDIES.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-surface-400">
                    <CalendarClock size={11} />
                    {t('subsidies.available.expires')}: {formatDateShort(new Date(s.expires))}
                  </p>
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="shrink-0 rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors dark:hover:bg-surface-800 dark:hover:text-surface-200"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        </Card>

        {/* Hypoteční sazby */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>{t('subsidies.mortgage.title')}</CardTitle>
          </CardHeader>

          <div className="flex items-end gap-3 py-4">
            <p className="font-display text-4xl font-bold tabular-nums text-surface-900 dark:text-surface-50">
              {t('subsidies.mortgage.from')} {MORTGAGE_RATE.value}
            </p>
            <div className="mb-1 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
              <TrendingDown size={16} />
              <span>{t('subsidies.mortgage.declining')}</span>
            </div>
          </div>

          <p className="text-xs text-surface-400">{t('subsidies.mortgage.note')}</p>
        </Card>
      </div>
    </div>
  )
}
