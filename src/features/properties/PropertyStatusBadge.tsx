import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { PropertyStatus } from '@/types/database'

const VARIANT: Record<PropertyStatus, 'paid' | 'pending' | 'info' | 'default'> = {
  active: 'paid',
  vacant: 'pending',
  maintenance: 'info',
  archived: 'default',
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const { t } = useTranslation()
  return <Badge variant={VARIANT[status]}>{t(`properties.status.${status}`)}</Badge>
}
