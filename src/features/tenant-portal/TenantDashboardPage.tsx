import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, FileText, Home } from 'lucide-react'
import { Card, CardHeader, CardTitle, SkeletonRow } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { PaymentStatusBadge } from '@/features/payments/PaymentStatusBadge'
import { DocumentTypeBadge } from '@/features/documents/DocumentTypeBadge'
import { useTenantContext, useTenantDocuments, useTenantPayments } from './hooks'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function TenantDashboardPage() {
  const { t } = useTranslation()
  const { data: ctx, isLoading: ctxLoading } = useTenantContext()
  const { data: payments } = useTenantPayments()
  const { data: documents } = useTenantDocuments()

  const nextPayment = useMemo(
    () => payments?.find((p) => p.status === 'pending' || p.status === 'overdue'),
    [payments],
  )

  const recentDocs = useMemo(() => (documents ?? []).slice(0, 3), [documents])

  const lease = ctx?.lease

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
      >
        {ctxLoading ? (
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
        ) : (
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('tenant.welcome', { name: ctx?.full_name ?? '' })}
          </h1>
        )}
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Next payment card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.05 }}
        >
          <Card className="h-full p-5">
            <div className="flex items-start justify-between gap-2">
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
                  <CreditCard size={15} className="text-emerald-500" />
                  {t('tenant.dashboard.nextPayment.title')}
                </CardTitle>
              </CardHeader>
              {nextPayment && <PaymentStatusBadge status={nextPayment.status} />}
            </div>

            {nextPayment ? (
              <div className="mt-4">
                <p className="font-display text-3xl font-bold tabular-nums text-surface-900 dark:text-surface-50">
                  {formatCurrency(nextPayment.amount, nextPayment.currency)}
                </p>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  {t('tenant.dashboard.nextPayment.dueOn', {
                    date: formatDate(nextPayment.due_date),
                  })}
                </p>
              </div>
            ) : payments !== undefined ? (
              <div className="mt-4">
                <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                  {t('tenant.dashboard.nextPayment.allPaid')}
                </p>
              </div>
            ) : (
              <div className="mt-4 h-10 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800" />
            )}
          </Card>
        </motion.div>

        {/* Lease info card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.1 }}
        >
          <Card className="h-full p-5">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
                <Home size={15} className="text-emerald-500" />
                {t('tenant.dashboard.lease.title')}
              </CardTitle>
            </CardHeader>

            {lease ? (
              <dl className="mt-4 space-y-2.5">
                <Row
                  label={t('tenant.dashboard.lease.since')}
                  value={formatDate(lease.start_date)}
                />
                <Row
                  label={lease.end_date
                    ? t('tenant.dashboard.lease.untilDate', { date: formatDate(lease.end_date) })
                    : t('tenant.dashboard.lease.indefinite')}
                  value=""
                  noSep
                />
                <div className="my-1.5 border-t border-surface-100 dark:border-surface-800" />
                <Row
                  label={t('tenant.dashboard.lease.monthlyRent')}
                  value={formatCurrency(lease.monthly_rent, lease.currency)}
                  bold
                />
                <Row
                  label={t('tenant.dashboard.lease.paymentDay')}
                  value={t('tenant.dashboard.lease.paymentDayValue', { day: lease.payment_day })}
                />
              </dl>
            ) : (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent documents */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.15 }}
      >
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
                <FileText size={15} className="text-emerald-500" />
                {t('tenant.dashboard.recentDocs.title')}
              </CardTitle>
            </CardHeader>
            <Link
              to="/tenant/documents"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {t('tenant.dashboard.recentDocs.viewAll')}
            </Link>
          </div>

          {documents === undefined ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : recentDocs.length === 0 ? (
            <p className="mt-4 text-sm text-surface-400">{t('tenant.dashboard.recentDocs.empty')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-surface-100 dark:divide-surface-800">
              {recentDocs.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 py-2.5">
                  <DocumentTypeBadge category={doc.category} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-surface-800 dark:text-surface-200">
                    {doc.name}
                  </span>
                  <span className="shrink-0 text-xs text-surface-400">{formatDate(doc.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  noSep,
}: {
  label: string
  value: string
  bold?: boolean
  noSep?: boolean
}) {
  if (noSep) {
    return (
      <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
    )
  }
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-sm text-surface-500 dark:text-surface-400">{label}</dt>
      <dd className={`tabular-nums text-sm ${bold ? 'font-semibold text-surface-900 dark:text-surface-50' : 'text-surface-700 dark:text-surface-300'}`}>
        {value}
      </dd>
    </div>
  )
}
