import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import DashboardPage from './DashboardPage'
import { AnalyticsTab } from './AnalyticsTab'
import { SubsidiesTab } from './SubsidiesTab'
import { NewsTab } from './NewsTab'

type DashboardTab = 'overview' | 'analytics' | 'subsidies' | 'news'

const TABS: { id: DashboardTab }[] = [
  { id: 'overview' },
  { id: 'analytics' },
  { id: 'subsidies' },
  { id: 'news' },
]

export default function DashboardShell() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<DashboardTab>('overview')

  return (
    <div className="flex flex-col">
      {/* Tab row */}
      <div className="sticky top-0 z-10 border-b border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950">
        <div className="flex gap-0 overflow-x-auto px-4 md:px-8 scrollbar-none">
          {TABS.map(({ id }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                tab === id
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200',
              )}
            >
              {t(`dashboard.tabs.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview'   && <DashboardPage />}
      {tab === 'analytics'  && <AnalyticsTab />}
      {tab === 'subsidies'  && <SubsidiesTab />}
      {tab === 'news'       && <NewsTab />}
    </div>
  )
}
