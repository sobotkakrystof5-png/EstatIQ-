import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TrendingUp, Percent, Wallet, Building2, Sparkles, RefreshCw } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// ── Typ pro cashflow data ─────────────────────────────────────────────────────

interface CashflowEntry {
  month: string
  income: number
  expenses: number
}

// Placeholder data — nahradit real hook v budoucnu
const MOCK_CASHFLOW: CashflowEntry[] = [
  { month: 'led', income: 0, expenses: 0 },
  { month: 'úno', income: 0, expenses: 0 },
  { month: 'bře', income: 0, expenses: 0 },
  { month: 'dub', income: 0, expenses: 0 },
  { month: 'kvě', income: 0, expenses: 0 },
  { month: 'čvn', income: 0, expenses: 0 },
]

type Period = '1y' | '2y' | '3y' | '5y'

// ── KPI karta ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconBg)}>
          {icon}
        </div>
      </CardHeader>
      <p className="mb-0.5 font-display text-3xl font-bold tabular-nums text-surface-900 dark:text-surface-50">
        {value}
      </p>
      <p className="text-xs text-surface-400">{sub}</p>
    </Card>
  )
}

// ── Tooltip pro cashflow graf ──────────────────────────────────────────────────

function CashflowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-surface-100 bg-white p-3 shadow-card dark:border-surface-800 dark:bg-surface-900">
      <p className="mb-2 text-xs font-semibold text-surface-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-sm font-medium text-surface-900 dark:text-surface-50">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="font-tabular">{formatCurrency(entry.value)}</span>
          <span className="text-xs text-surface-400">
            {entry.name === 'income' ? t('analytics.cashflow.income') : t('analytics.cashflow.expenses')}
          </span>
        </p>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AnalyticsTab() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>('3y')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiEstimate, setAiEstimate] = useState<string | null>(null)

  const PERIODS: { id: Period; label: string }[] = [
    { id: '1y',  label: t('analytics.period.1y') },
    { id: '2y',  label: t('analytics.period.2y') },
    { id: '3y',  label: t('analytics.period.3y') },
    { id: '5y',  label: t('analytics.period.5y') },
  ]

  async function handleAiEstimate() {
    setAiLoading(true)
    // TODO(fáze 2): Edge Function pro AI odhad portfolia
    await new Promise((r) => setTimeout(r, 1200))
    setAiEstimate(t('analytics.aiEstimate.placeholder'))
    setAiLoading(false)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Hlavička + period selector */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {t('analytics.title')}
        </motion.h2>
        <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
          {PERIODS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                period === id
                  ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                  : 'text-surface-500 hover:text-surface-700 dark:text-surface-400',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
        className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            icon: <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />,
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            label: t('analytics.kpi.growth'),
            value: '+0 %',
            sub: t('analytics.kpi.growthSub'),
          },
          {
            icon: <Percent size={18} className="text-indigo-600 dark:text-indigo-400" />,
            iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
            label: t('analytics.kpi.roi'),
            value: '0 %',
            sub: t('analytics.kpi.roiSub'),
          },
          {
            icon: <Wallet size={18} className="text-amber-600 dark:text-amber-400" />,
            iconBg: 'bg-amber-50 dark:bg-amber-900/20',
            label: t('analytics.kpi.netIncome'),
            value: formatCurrency(0),
            sub: t('analytics.kpi.netIncomeSub'),
          },
          {
            icon: <Building2 size={18} className="text-rose-600 dark:text-rose-400" />,
            iconBg: 'bg-rose-50 dark:bg-rose-900/20',
            label: t('analytics.kpi.portfolio'),
            value: formatCurrency(0),
            sub: t('analytics.kpi.portfolioSub'),
          },
        ].map((kpi, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </motion.div>

      {/* Cashflow graf + AI predikce */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <CardHeader>
            <div>
              <CardTitle>{t('analytics.cashflow.title')}</CardTitle>
              <p className="mt-0.5 text-xs text-surface-400">
                {t('analytics.cashflow.avg')}: <span className="font-tabular font-medium">{formatCurrency(0)}</span>
              </p>
            </div>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_CASHFLOW} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CashflowTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value: string) => value === 'income' ? t('analytics.cashflow.income') : t('analytics.cashflow.expenses')}
              />
              <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AI predikce */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>{t('analytics.aiPrediction.title')}</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>

          {aiEstimate ? (
            <p className="text-sm text-surface-600 dark:text-surface-400">{aiEstimate}</p>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {aiLoading ? (
                <>
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <Sparkles size={32} className="text-surface-300 dark:text-surface-600" />
                  <p className="text-sm text-surface-400">{t('analytics.aiPrediction.empty')}</p>
                </>
              )}
            </div>
          )}

          <div className="mt-4 border-t border-surface-100 pt-4 dark:border-surface-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              loading={aiLoading}
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void handleAiEstimate()}
            >
              {t('analytics.aiPrediction.refresh')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
