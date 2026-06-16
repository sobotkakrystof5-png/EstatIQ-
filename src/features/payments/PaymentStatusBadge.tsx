import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { PaymentStatus } from '@/types/database'

const VARIANT: Record<PaymentStatus, 'paid' | 'pending' | 'overdue' | 'default'> = {
  paid: 'paid',
  pending: 'pending',
  overdue: 'overdue',
  canceled: 'default',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation()
  return <Badge variant={VARIANT[status]}>{t(`payments.status.${status}`)}</Badge>
}
