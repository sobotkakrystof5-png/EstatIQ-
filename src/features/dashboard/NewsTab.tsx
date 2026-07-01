import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { RefreshCw, ExternalLink, Newspaper } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type NewsCategory = 'all' | 'market' | 'legislation' | 'finance' | 'tips'

interface NewsItem {
  id: number
  source: string
  timeAgo: string
  title: string
  excerpt: string
  category: Exclude<NewsCategory, 'all'>
  url: string
}

// Statická ukázková data — v budoucnu Edge Function s AI kategorizací (TODO fáze 2)
const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    source: 'ČTK Ekonomika',
    timeAgo: 'přibližně před 8 hodinami',
    title: 'Průměrné nájemné v Praze překonalo 400 Kč/m²',
    excerpt: 'Ceny nájmů v hlavním městě pokračují v růstu. Průměrné nájemné dosáhlo nového rekordu.',
    category: 'market',
    url: '#',
  },
  {
    id: 2,
    source: 'iDNES Reality',
    timeAgo: 'před 1 dnem',
    title: 'Změny v zákoně o nájmu bytů od 1. 1. 2027',
    excerpt: 'Parlament schválil novelu občanského zákoníku v části upravující nájemní vztahy.',
    category: 'legislation',
    url: '#',
  },
  {
    id: 3,
    source: 'ČNB',
    timeAgo: 'před 2 dny',
    title: 'ČNB snižuje úrokové sazby o 25 bazických bodů',
    excerpt: 'Bankovní rada České národní banky rozhodla o dalším snížení základní úrokové sazby.',
    category: 'finance',
    url: '#',
  },
  {
    id: 4,
    source: 'EstatIQ Blog',
    timeAgo: 'před 3 dny',
    title: '5 tipů, jak zvýšit výnos z pronájmu bez renovace',
    excerpt: 'Vyšší nájemné nemusí znamenat drahou rekonstrukci. Přinášíme prověřené postupy.',
    category: 'tips',
    url: '#',
  },
]

const CATEGORY_VARIANTS: Record<NewsCategory, string> = {
  all: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300',
  market: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  legislation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  finance: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  tips: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

export function NewsTab() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all')
  const [refreshing, setRefreshing] = useState(false)

  const categories: NewsCategory[] = ['all', 'market', 'legislation', 'finance', 'tips']

  const counts: Record<NewsCategory, number> = {
    all: MOCK_NEWS.length,
    market: MOCK_NEWS.filter((n) => n.category === 'market').length,
    legislation: MOCK_NEWS.filter((n) => n.category === 'legislation').length,
    finance: MOCK_NEWS.filter((n) => n.category === 'finance').length,
    tips: MOCK_NEWS.filter((n) => n.category === 'tips').length,
  }

  const filtered = activeCategory === 'all'
    ? MOCK_NEWS
    : MOCK_NEWS.filter((n) => n.category === activeCategory)

  async function handleRefresh() {
    setRefreshing(true)
    // TODO(fáze 2): Edge Function pro agregaci zpráv
    await new Promise((r) => setTimeout(r, 1000))
    setRefreshing(false)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Hlavička */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-xl font-bold text-surface-900 dark:text-surface-50"
        >
          {t('news.title')}
        </motion.h2>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />}
          loading={refreshing}
          onClick={() => void handleRefresh()}
        >
          {t('news.refresh')}
        </Button>
      </div>

      {/* Filter chipy */}
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
              activeCategory === cat
                ? CATEGORY_VARIANTS[cat] + ' ring-2 ring-offset-1 ring-current'
                : CATEGORY_VARIANTS[cat] + ' opacity-70 hover:opacity-100',
            )}
          >
            {t(`news.category.${cat}`)}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-white/10">
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Zprávy */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Newspaper size={36} className="text-surface-300 dark:text-surface-600" />
          <p className="text-sm text-surface-400">{t('news.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card padding="lg" className="hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-surface-400">{item.source}</span>
                      <span className="text-xs text-surface-300 dark:text-surface-600">·</span>
                      <span className="text-xs text-surface-400">{item.timeAgo}</span>
                    </div>
                    <h3 className="mb-1 font-semibold text-surface-900 dark:text-surface-50">{item.title}</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{item.excerpt}</p>
                    <div className="mt-2">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', CATEGORY_VARIANTS[item.category])}>
                        {t(`news.category.${item.category}`)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.title}
                    className="shrink-0 rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors dark:hover:bg-surface-800"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
