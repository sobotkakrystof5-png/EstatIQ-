import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCircle2, MailWarning } from 'lucide-react'
import { formatCurrency, formatDate, formatMonth } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { TenantAvatar } from '@/features/tenants/TenantAvatar'
import type { PaymentWithContext } from './data'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { useSendReminder } from './hooks'

function DueDateLabel({ payment }: { payment: PaymentWithContext }) {
  const { t } = useTranslation()

  if (payment.status === 'paid' && payment.paid_at) {
    return (
      <p className="text-xs font-medium text-paid">
        {t('payments.row.paidOn', { date: formatDate(payment.paid_at) })}
      </p>
    )
  }

  const due = new Date(payment.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0)
    return <p className="text-xs font-medium text-pending">{t('payments.row.dueToday')}</p>
  if (diff > 0)
    return (
      <p className="text-xs text-surface-400">{t('payments.row.dueIn', { count: diff })}</p>
    )
  return (
    <p className="text-xs font-medium text-overdue">
      {t('payments.row.overdueDays', { count: Math.abs(diff) })}
    </p>
  )
}

interface PaymentRowProps {
  payment: PaymentWithContext
  onMarkPaid: (payment: PaymentWithContext) => void
}

function PaymentRowInner({ payment, onMarkPaid }: PaymentRowProps) {
  const { t } = useTranslation()
  const canMarkPaid = payment.status === 'pending' || payment.status === 'overdue'
  const canRemind = payment.status === 'pending'
  const canDunning = payment.status === 'overdue'

  const { mutate: sendReminder, isPending: reminding } = useSendReminder()
  const [reminded, setReminded] = useState(false)

  function handleRemind() {
    sendReminder(payment.id, {
      onSuccess: () => {
        setReminded(true)
        setTimeout(() => setReminded(false), 2500)
      },
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
      {/* Avatar */}
      <TenantAvatar name={payment.tenant.full_name} avatarUrl={payment.tenant.avatar_url} />

      {/* Name + property */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
          {payment.tenant.full_name}
        </p>
        <p className="truncate text-xs text-surface-400">
          {payment.property.name}, {payment.property.address_city}
        </p>
      </div>

      {/* Month — hidden on mobile */}
      <div className="hidden w-28 text-center sm:block">
        <p className="truncate text-xs font-medium text-surface-600 dark:text-surface-400">
          {formatMonth(payment.due_date)}
        </p>
      </div>

      {/* Amount + due date */}
      <div className="text-right">
        <p className="font-tabular text-sm font-semibold text-surface-900 dark:text-surface-50">
          {formatCurrency(payment.amount)}
        </p>
        <DueDateLabel payment={payment} />
      </div>

      {/* Status badge */}
      <PaymentStatusBadge status={payment.status} />

      {/* Remind / dunning button */}
      {(canRemind || canDunning) && (
        <button
          onClick={handleRemind}
          disabled={reminding || reminded}
          aria-label={canDunning ? t('payments.row.dunning') : t('payments.row.remind')}
          title={reminded
            ? (canDunning ? t('payments.row.dunningSent') : t('payments.row.remindSent'))
            : (canDunning ? t('payments.row.dunning') : t('payments.row.remind'))}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2',
            reminded
              ? 'text-emerald-500 dark:text-emerald-400'
              : canDunning
                ? 'text-surface-400 hover:bg-red-50 hover:text-red-500 focus-visible:ring-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-400'
                : 'text-surface-400 hover:bg-amber-50 hover:text-amber-500 focus-visible:ring-amber-400 dark:hover:bg-amber-950/20 dark:hover:text-amber-400',
          )}
        >
          {reminded
            ? <CheckCircle2 size={16} />
            : canDunning
              ? <MailWarning size={16} />
              : <Bell size={16} />}
        </button>
      )}

      {/* Mark paid button */}
      <button
        onClick={() => onMarkPaid(payment)}
        disabled={!canMarkPaid}
        aria-label={t('payments.row.markPaid')}
        title={canMarkPaid ? t('payments.row.markPaid') : undefined}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          canMarkPaid
            ? 'text-surface-400 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400'
            : 'invisible',
        )}
      >
        <CheckCircle2 size={18} />
      </button>
    </div>
  )
}

export const PaymentRow = memo(PaymentRowInner)
