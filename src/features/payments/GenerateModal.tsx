import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@/components/ui'
import { currentYYYYMM, formatMonth } from '@/lib/formatters'
import { useGeneratePayments } from './hooks'
import type { PaymentWithContext } from './data'

interface GenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payments: PaymentWithContext[]
}

export function GenerateModal({ open, onOpenChange, payments }: GenerateModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('payments.generateDialog.title')}
      description={t('payments.generateDialog.subtitle')}
    >
      <GenerateForm payments={payments} onClose={() => onOpenChange(false)} />
    </Modal>
  )
}

function GenerateForm({
  payments,
  onClose,
}: {
  payments: PaymentWithContext[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const generate = useGeneratePayments()

  // Distinct lease_ids across all payments = proxy for number of active leases
  const totalLeases = useMemo(
    () => new Set(payments.map((p) => p.lease_id)).size,
    [payments],
  )

  const defaultMonth = useMemo(() => {
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = payments.filter((p) => p.due_date.startsWith(yyyymm)).length
      if (totalLeases === 0 || existing < totalLeases) return yyyymm
    }
    return currentYYYYMM()
  }, [payments, totalLeases])

  const [month, setMonth] = useState(defaultMonth)

  const existingCount = useMemo(
    () => payments.filter((p) => p.due_date.startsWith(`${month}-`)).length,
    [payments, month],
  )
  const allExist = totalLeases > 0 && existingCount >= totalLeases
  const willCreate = Math.max(0, totalLeases - existingCount)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (allExist) return
    generate.mutate(month, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {t('payments.generateDialog.month')}
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="block w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
        />
      </div>

      {allExist ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          {t('payments.generateDialog.alreadyExists', { month: formatMonth(`${month}-01`) })}
        </p>
      ) : (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Vytvoří se {willCreate} {willCreate === 1 ? 'platba' : willCreate < 5 ? 'platby' : 'plateb'} pro{' '}
          {formatMonth(`${month}-01`)}.
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={generate.isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={generate.isPending} disabled={allExist}>
          {t('payments.generateDialog.confirm')}
        </Button>
      </div>
    </form>
  )
}
