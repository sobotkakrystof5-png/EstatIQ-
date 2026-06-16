import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { EmptyState, SkeletonRow } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { PaymentStatusBadge } from '@/features/payments/PaymentStatusBadge'
import { useTenantPayments } from './hooks'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function TenantPaymentsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useTenantPayments()
  const payments = data ?? []

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('tenant.payments.title')}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {!isLoading && payments.length > 0
            ? t('tenant.payments.count', { count: payments.length })
            : t('tenant.payments.subtitle')}
        </p>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white px-4 dark:border-surface-800 dark:bg-surface-900">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={26} />}
            title={t('tenant.payments.emptyState.title')}
            description={t('tenant.payments.emptyState.description')}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {payments.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.02 }}
                  className={
                    i < payments.length - 1
                      ? 'border-b border-surface-100 dark:border-surface-800'
                      : ''
                  }
                >
                  <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
                    {/* Period */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {formatDate(payment.due_date)}
                      </p>
                      {payment.paid_at && (
                        <p className="text-xs text-surface-400">
                          {t('payments.row.paidOn', { date: formatDate(payment.paid_at) })}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <p className="tabular-nums text-sm font-semibold text-surface-800 dark:text-surface-200">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>

                    {/* Status */}
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
