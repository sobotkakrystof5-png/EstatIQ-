import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal } from '@/components/ui'
import { formatMonth, todayISO } from '@/lib/formatters'
import { useMarkAsPaid } from './hooks'
import type { PaymentWithContext } from './data'

interface MarkPaidModalProps {
  payment: PaymentWithContext | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MarkPaidModal({ payment, open, onOpenChange }: MarkPaidModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('payments.markPaidModal.title')}
      description={
        payment
          ? t('payments.markPaidModal.subtitle', {
              month: formatMonth(payment.due_date),
              tenant: payment.tenant.full_name ?? '',
            })
          : undefined
      }
    >
      {payment && (
        <MarkPaidForm payment={payment} onClose={() => onOpenChange(false)} />
      )}
    </Modal>
  )
}

function MarkPaidForm({
  payment,
  onClose,
}: {
  payment: PaymentWithContext
  onClose: () => void
}) {
  const { t } = useTranslation()
  const markPaid = useMarkAsPaid()
  const [paidAt, setPaidAt] = useState(todayISO)
  const [note, setNote] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    markPaid.mutate(
      { paymentId: payment.id, paid_at: new Date(paidAt).toISOString(), note: note.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('payments.markPaidModal.paidAt')}
        type="date"
        value={paidAt}
        onChange={(e) => setPaidAt(e.target.value)}
        required
      />
      <Input
        label={t('payments.markPaidModal.note')}
        placeholder={t('payments.markPaidModal.notePlaceholder')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={markPaid.isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={markPaid.isPending}>
          {t('payments.markPaidModal.confirm')}
        </Button>
      </div>
    </form>
  )
}
