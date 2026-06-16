import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  TrendingDown,
  Building2,
  AlertCircle,
  ArrowRight,
  Wallet,
  Clock,
  Bell,
  X,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDateShort } from '@/lib/formatters'
import { useAuth } from '@/features/auth/AuthContext'
import {
  useDashboardStats,
  useRecentPayments,
  useIncomeChart,
  useNotifications,
  useMarkNotificationRead,
} from './hooks'

// ── Count-up fade ─────────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4 }}
      className="font-tabular"
    >
      {prefix}{value}{suffix}
    </motion.span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string
  trend?: { value: number; label: string }
  icon: React.ReactNode
  iconBg: string
  valueSuffix?: string
  loading?: boolean
}

function StatCard({ title, value, trend, icon, iconBg, valueSuffix, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      {loading ? (
        <Skeleton className="mb-2 h-9 w-32" />
      ) : (
        <p className="mb-1 font-display text-3xl font-bold text-surface-900 dark:text-surface-50">
          <AnimatedNumber value={value} suffix={valueSuffix} />
        </p>
      )}
      {trend && !loading && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend.value >= 0 ? (
            <TrendingUp size={12} className="text-emerald-500" />
          ) : (
            <TrendingDown size={12} className="text-red-500" />
          )}
          <span className={trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
            {trend.value >= 0 ? '+' : ''}{trend.value} %
          </span>
          <span className="text-surface-400">{trend.label}</span>
        </div>
      )}
      {loading && <Skeleton className="h-4 w-24" />}
    </Card>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-surface-100 bg-white p-3 shadow-card dark:border-surface-800 dark:bg-surface-900">
      <p className="mb-2 text-xs font-semibold text-surface-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-tabular text-sm font-medium text-surface-900 dark:text-surface-50">
          {entry.name === 'income' ? formatCurrency(entry.value) : `${entry.value} %`}
        </p>
      ))}
    </div>
  )
}

// ── Notification type → icon color ────────────────────────────────────────────

function notificationDot(type: string) {
  if (type.includes('overdue') || type.includes('energy')) return 'bg-red-400'
  if (type.includes('expir') || type.includes('reminder')) return 'bg-amber-400'
  return 'bg-indigo-400'
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentPayments, isLoading: paymentsLoading } = useRecentPayments()
  const { data: chartData, isLoading: chartLoading } = useIncomeChart()
  const { data: notifications, isLoading: notificationsLoading } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  const hour = new Date().getHours()
  const greetingKey =
    hour < 12
      ? 'dashboard.greeting.morning'
      : hour < 18
        ? 'dashboard.greeting.afternoon'
        : 'dashboard.greeting.evening'

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-display mb-1 text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {t(greetingKey)} {firstName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-sm text-surface-500 dark:text-surface-400"
        >
          {formatDateShort(new Date())}
        </motion.p>
      </div>

      {/* Stat cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
        className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {/* Celkový příjem */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title={t('dashboard.cards.income.title')}
            value={formatCurrency(stats?.incomeThisMonth ?? 0)}
            trend={
              stats
                ? { value: stats.incomeTrend, label: t('dashboard.cards.income.trend') }
                : undefined
            }
            icon={<Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            loading={statsLoading}
          />
        </motion.div>

        {/* Čeká na platbu */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title={t('dashboard.cards.pending.title')}
            value={formatCurrency(stats?.pendingAmount ?? 0)}
            icon={<Clock size={18} className="text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            loading={statsLoading}
          />
        </motion.div>

        {/* Po splatnosti */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title={t('dashboard.cards.overdue.title')}
            value={formatCurrency(stats?.overdueAmount ?? 0)}
            icon={<AlertCircle size={18} className="text-red-500 dark:text-red-400" />}
            iconBg="bg-red-50 dark:bg-red-900/20"
            loading={statsLoading}
          />
        </motion.div>

        {/* Obsazenost */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard
            title={t('dashboard.cards.occupancy.title')}
            value={String(stats?.occupancyPct ?? 0)}
            valueSuffix={` %  (${stats?.propertiesOccupied ?? 0} / ${stats?.propertiesTotal ?? 0})`}
            icon={<Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />}
            iconBg="bg-indigo-50 dark:bg-indigo-900/20"
            loading={statsLoading}
          />
        </motion.div>
      </motion.div>

      {/* Chart + Recent payments */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2" padding="lg">
          <CardHeader>
            <CardTitle>{t('dashboard.occupancyChart.title')}</CardTitle>
          </CardHeader>
          {chartLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={chartData ?? []}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent payments */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>{t('dashboard.recentPayments.title')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/payments">{t('dashboard.recentPayments.viewAll')}</Link>
            </Button>
          </CardHeader>

          {paymentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : !recentPayments?.length ? (
            <p className="py-6 text-center text-sm text-surface-400">
              {t('dashboard.emptyState.title')}
            </p>
          ) : (
            <ul
              className="space-y-0 divide-y divide-surface-100 dark:divide-surface-800"
              role="list"
            >
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-semibold text-surface-500 dark:bg-surface-800">
                    {p.tenantName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                      {p.tenantName}
                    </p>
                    <p className="truncate text-xs text-surface-400">{p.propertyName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-tabular text-sm font-semibold text-surface-900 dark:text-surface-50">
                      {formatCurrency(p.amount)}
                    </span>
                    <Badge variant={p.status}>{t(`payments.status.${p.status}`)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-surface-100 pt-4 dark:border-surface-800">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/app/payments">
                {t('dashboard.recentPayments.viewAll')}
                <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-surface-500" />
            <CardTitle>{t('dashboard.notifications.title')}</CardTitle>
            {notifications && notifications.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                {notifications.length}
              </span>
            )}
          </div>
        </CardHeader>

        {notificationsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-1">
                <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {t('dashboard.notifications.empty')}
            </p>
            <p className="mt-1 text-xs text-surface-400">
              {t('dashboard.emptyState.description')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-100 dark:divide-surface-800" role="list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notificationDot(n.type)}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 truncate text-xs text-surface-400">{n.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-surface-400">
                    {formatDateShort(new Date(n.createdAt))}
                  </p>
                </div>
                <button
                  onClick={() => markRead(n.id)}
                  className="shrink-0 rounded p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300"
                  aria-label={t('dashboard.notifications.markRead')}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
