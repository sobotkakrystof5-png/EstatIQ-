import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { TenantStatus } from './data'

const VARIANT: Record<TenantStatus, 'paid' | 'info' | 'default'> = {
  active: 'paid',
  invited: 'info',
  ended: 'default',
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const { t } = useTranslation()
  return <Badge variant={VARIANT[status]}>{t(`tenants.statusShort.${status}`)}</Badge>
}
