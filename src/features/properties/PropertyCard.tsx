import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/lib/formatters'
import type { PropertyWithStats } from '@/types/database'
import { PropertyStatusBadge } from './PropertyStatusBadge'

export function PropertyCard({ property }: { property: PropertyWithStats }) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/app/properties/${property.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      <Card hover padding="none" className="overflow-hidden">
        {/* Cover */}
        <div className="relative h-28 bg-gradient-to-br from-emerald-500/15 via-surface-100 to-indigo-500/15 dark:from-emerald-500/10 dark:via-surface-800 dark:to-indigo-500/10">
          <div className="absolute inset-0 flex items-center justify-center text-surface-300 dark:text-surface-600">
            <Building2 size={40} strokeWidth={1.5} />
          </div>
          <div className="absolute right-3 top-3">
            <PropertyStatusBadge status={property.status} />
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="font-display truncate text-base font-bold text-surface-900 dark:text-surface-50">
            {property.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">
              {property.address_street}, {property.address_city}
            </span>
          </p>

          {(property.rooms || property.floor_area_m2) && (
            <div className="mt-3 flex items-center gap-3 text-xs text-surface-400">
              {property.rooms != null && (
                <span>{t('properties.units.rooms', { count: property.rooms })}</span>
              )}
              {property.floor_area_m2 != null && (
                <span>{t('properties.units.area', { value: property.floor_area_m2 })}</span>
              )}
            </div>
          )}

          <div className="mt-4 flex items-end justify-between border-t border-surface-100 pt-4 dark:border-surface-800">
            <div>
              <p className="font-tabular text-lg font-bold text-surface-900 dark:text-surface-50">
                {formatCurrency(property.monthly_rent)}
              </p>
              <p className="text-xs text-surface-400">{t('properties.card.rentPerMonth')}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1.5 text-sm text-surface-600 dark:text-surface-300">
                <Users size={14} />
                {property.tenant_count > 0
                  ? t('properties.card.tenants', { count: property.tenant_count })
                  : t('properties.card.noTenants')}
              </p>
              {property.unpaid_count > 0 && (
                <p className="mt-1 text-xs font-medium text-overdue">
                  {t('properties.card.unpaid', { count: property.unpaid_count })}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
