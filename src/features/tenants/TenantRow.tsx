import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { TenantWithContext } from './data'
import { TenantAvatar } from './TenantAvatar'
import { TenantStatusBadge } from './TenantStatusBadge'

export function TenantRow({ ctx }: { ctx: TenantWithContext }) {
  const { t } = useTranslation()

  const inviteExpiresAt = ctx.invitation?.expires_at
  const inviteExpired =
    ctx.status === 'invited' && inviteExpiresAt && new Date(inviteExpiresAt) < new Date()

  return (
    <Link
      to={`/app/tenants/${ctx.tenant.id}`}
      className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset dark:hover:bg-surface-800/60"
    >
      {/* Avatar */}
      <TenantAvatar name={ctx.user.full_name} avatarUrl={ctx.user.avatar_url} />

      {/* Name + property */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
          {ctx.user.full_name ?? ctx.tenant.email}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-surface-400">
          <Building2 size={12} className="shrink-0" />
          {ctx.property_name}
        </p>
      </div>

      {/* Rent */}
      <div className="hidden text-right sm:block">
        {ctx.monthly_rent > 0 ? (
          <p className="font-tabular text-sm font-semibold text-surface-900 dark:text-surface-50">
            {formatCurrency(ctx.monthly_rent)}
          </p>
        ) : (
          <p className="text-xs text-surface-400">—</p>
        )}
        <p className="text-xs text-surface-400">{t('tenants.row.rent')}</p>
      </div>

      {/* Invite / payment status */}
      <div className="hidden text-right md:block">
        {ctx.status === 'invited' ? (
          <p
            className={`text-xs ${inviteExpired ? 'font-medium text-overdue' : 'text-surface-400'}`}
          >
            {inviteExpired
              ? t('tenants.row.inviteExpired')
              : inviteExpiresAt
                ? t('tenants.row.inviteExpires', { date: formatDate(inviteExpiresAt) })
                : null}
          </p>
        ) : ctx.status === 'active' ? (
          ctx.unpaid_count > 0 ? (
            <p className="text-xs font-medium text-overdue">
              {t('tenants.row.unpaid', { count: ctx.unpaid_count })}
            </p>
          ) : (
            <p className="text-xs font-medium text-paid">{t('tenants.row.paid')}</p>
          )
        ) : null}
      </div>

      {/* Status badge */}
      <TenantStatusBadge status={ctx.status} />
    </Link>
  )
}
