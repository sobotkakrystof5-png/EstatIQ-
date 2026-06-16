import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarClock,
  Mail,
  Phone,
  RefreshCw,
  UserX,
} from 'lucide-react'
import { Button, Card, EmptyState, Modal, Skeleton } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { useTenant, useEndTenancy, useResendInvite } from './hooks'
import { TenantAvatar } from './TenantAvatar'
import { TenantStatusBadge } from './TenantStatusBadge'

export default function TenantDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data, isLoading } = useTenant(id)
  const endTenancy = useEndTenancy()
  const resendInvite = useResendInvite()
  const [endDialogOpen, setEndDialogOpen] = useState(false)

  if (isLoading) return <DetailSkeleton />

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6 sm:p-8">
        <BackLink />
        <EmptyState
          icon={<UserX size={26} />}
          title={t('tenants.detail.notFound')}
          description={t('tenants.detail.notFoundDesc')}
          className="mt-6"
        />
      </div>
    )
  }

  const { user, lease, invitation, status, property_name, property_id, monthly_rent } = data
  const inviteExpired =
    status === 'invited' &&
    invitation?.expires_at &&
    new Date(invitation.expires_at) < new Date()

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <BackLink />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <TenantAvatar name={user.full_name} avatarUrl={user.avatar_url} size="lg" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
                {user.full_name ?? user.email}
              </h1>
              <TenantStatusBadge status={status} />
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
              <Building2 size={14} className="shrink-0" />
              <Link
                to={`/app/properties/${property_id}`}
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {property_name}
              </Link>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {status === 'invited' && (
            <Button
              variant="outline"
              loading={resendInvite.isPending}
              leftIcon={<RefreshCw size={15} />}
              onClick={() => resendInvite.mutate(data.tenant.id)}
            >
              {t('tenants.detail.resendInvite')}
            </Button>
          )}
          {status === 'active' && (
            <Button
              variant="ghost"
              leftIcon={<UserX size={15} />}
              onClick={() => setEndDialogOpen(true)}
            >
              {t('tenants.detail.endTenancy')}
            </Button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {/* Contact */}
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-surface-500 dark:text-surface-400">
            {t('tenants.detail.contact')}
          </h2>
          <dl className="space-y-1">
            <DetailRow icon={<Mail size={15} />} label={t('tenants.detail.email')}>
              <a
                href={`mailto:${user.email}`}
                className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {user.email}
              </a>
            </DetailRow>
            <DetailRow icon={<Phone size={15} />} label={t('tenants.detail.phone')}>
              {user.phone ? (
                <a
                  href={`tel:${user.phone}`}
                  className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
                >
                  {user.phone}
                </a>
              ) : (
                <span className="text-surface-400">{t('tenants.detail.noPhone')}</span>
              )}
            </DetailRow>
          </dl>
        </Card>

        {/* Lease / Invitation */}
        <Card padding="lg">
          {lease ? (
            <>
              <h2 className="mb-4 text-sm font-semibold text-surface-500 dark:text-surface-400">
                {t('tenants.detail.lease')}
              </h2>
              <dl className="space-y-1">
                <DetailRow icon={<Building2 size={15} />} label={t('tenants.detail.property')}>
                  {property_name}
                </DetailRow>
                <DetailRow icon={<CalendarClock size={15} />} label={t('tenants.detail.rent')}>
                  <span className="font-tabular font-semibold text-surface-900 dark:text-surface-50">
                    {formatCurrency(monthly_rent)}
                  </span>
                </DetailRow>
                {lease.deposit > 0 && (
                  <DetailRow icon={<CalendarClock size={15} />} label={t('tenants.detail.deposit')}>
                    <span className="font-tabular">{formatCurrency(lease.deposit)}</span>
                  </DetailRow>
                )}
                <DetailRow icon={<Calendar size={15} />} label={t('tenants.detail.leaseStart')}>
                  {formatDate(lease.start_date)}
                </DetailRow>
                <DetailRow icon={<Calendar size={15} />} label={t('tenants.detail.leaseEnd')}>
                  {lease.end_date ? formatDate(lease.end_date) : t('tenants.detail.leaseIndefinite')}
                </DetailRow>
                <DetailRow icon={<CalendarClock size={15} />} label={t('tenants.detail.paymentDay')}>
                  {t('tenants.detail.paymentDay', { day: lease.payment_day })}
                </DetailRow>
              </dl>
            </>
          ) : invitation ? (
            <>
              <h2 className="mb-4 text-sm font-semibold text-surface-500 dark:text-surface-400">
                {t('tenants.detail.invitation')}
              </h2>
              <dl className="space-y-1">
                <DetailRow icon={<Mail size={15} />} label={t('tenants.detail.inviteSent')}>
                  {formatDate(invitation.created_at)}
                </DetailRow>
                <DetailRow icon={<Calendar size={15} />} label={t('tenants.detail.inviteExpires')}>
                  <span className={inviteExpired ? 'font-medium text-overdue' : ''}>
                    {inviteExpired
                      ? t('tenants.detail.inviteExpired')
                      : formatDate(invitation.expires_at)}
                  </span>
                </DetailRow>
                <DetailRow icon={<Building2 size={15} />} label={t('tenants.detail.property')}>
                  {property_name}
                </DetailRow>
                <DetailRow icon={<CalendarClock size={15} />} label={t('tenants.detail.rent')}>
                  <span className="font-tabular font-semibold text-surface-900 dark:text-surface-50">
                    {formatCurrency(monthly_rent)}
                  </span>
                </DetailRow>
              </dl>
            </>
          ) : null}
        </Card>
      </div>

      {/* End tenancy confirmation */}
      <Modal
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        title={t('tenants.endDialog.title')}
        description={t('tenants.endDialog.message', { name: user.full_name ?? user.email })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEndDialogOpen(false)} disabled={endTenancy.isPending}>
              {t('tenants.endDialog.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={endTenancy.isPending}
              onClick={() =>
                endTenancy.mutate(data.tenant.id, { onSuccess: () => setEndDialogOpen(false) })
              }
            >
              {t('tenants.endDialog.confirm')}
            </Button>
          </>
        }
      >
        <div className="sr-only" />
      </Modal>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function BackLink() {
  const { t } = useTranslation()
  return (
    <Link
      to="/app/tenants"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-surface-400 dark:hover:text-surface-200"
    >
      <ArrowLeft size={16} />
      {t('tenants.detail.back')}
    </Link>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-surface-100 py-2.5 last:border-0 dark:border-surface-800">
      <dt className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
        <span className="shrink-0 text-surface-400 dark:text-surface-500">{icon}</span>
        {label}
      </dt>
      <dd className="text-right text-sm text-surface-800 dark:text-surface-200">{children}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <Skeleton className="h-4 w-32" />
      <div className="mt-5 flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )
}
