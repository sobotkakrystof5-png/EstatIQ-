import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Archive,
  ArrowLeft,
  Building2,
  CalendarClock,
  DoorOpen,
  Layers,
  MapPin,
  Pencil,
  RefreshCw,
  Ruler,
  Users,
} from 'lucide-react'
import { Button, Card, EmptyState, Modal, Skeleton } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { PropertyWithStats } from '@/types/database'
import { useArchiveProperty, useProperty, useRefreshCadastre, useRestoreProperty } from './hooks'
import { PropertyStatusBadge } from './PropertyStatusBadge'
import { PropertyFormModal } from './PropertyFormModal'
import { fetchPropertyFromCuzk } from './cuzk'

function nextPaymentDate(day: number): Date {
  const today = new Date()
  const candidate = new Date(today.getFullYear(), today.getMonth(), day)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (candidate < startOfToday) return new Date(today.getFullYear(), today.getMonth() + 1, day)
  return candidate
}

export default function PropertyDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data, isLoading } = useProperty(id)
  const archive = useArchiveProperty()
  const restore = useRestoreProperty()
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  if (isLoading) return <DetailSkeleton />

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl p-6 sm:p-8">
        <BackLink />
        <EmptyState
          icon={<Building2 size={26} />}
          title={t('properties.detail.notFound')}
          description={t('properties.detail.notFoundDesc')}
          className="mt-6"
        />
      </div>
    )
  }

  const p = data
  const isArchived = p.status === 'archived'
  const nextPayment = p.active_lease ? nextPaymentDate(p.active_lease.payment_day) : null

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <BackLink />

      {/* Header */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
              {p.name}
            </h1>
            <PropertyStatusBadge status={p.status} />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
            <MapPin size={15} className="shrink-0" />
            {p.address_street}, {p.address_zip} {p.address_city}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={() => setEditOpen(true)} leftIcon={<Pencil size={16} />}>
            {t('properties.detail.edit')}
          </Button>
          {isArchived ? (
            <Button
              variant="secondary"
              loading={restore.isPending}
              onClick={() => restore.mutate(p.id)}
            >
              {t('properties.detail.restore')}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setArchiveOpen(true)}
              leftIcon={<Archive size={16} />}
            >
              {t('properties.detail.archive')}
            </Button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Overview */}
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-surface-500 dark:text-surface-400">
            {t('properties.detail.overview')}
          </h2>
          <dl className="space-y-1">
            <DetailRow icon={<MapPin size={16} />} label={t('properties.detail.address')}>
              {p.address_street}, {p.address_city}
            </DetailRow>
            {p.floor_area_m2 != null && (
              <DetailRow icon={<Ruler size={16} />} label={t('properties.detail.area')}>
                {t('properties.units.area', { value: p.floor_area_m2 })}
              </DetailRow>
            )}
            {p.rooms != null && (
              <DetailRow icon={<DoorOpen size={16} />} label={t('properties.detail.rooms')}>
                {t('properties.units.rooms', { count: p.rooms })}
              </DetailRow>
            )}
            {p.floor != null && (
              <DetailRow icon={<Layers size={16} />} label={t('properties.detail.floor')}>
                {t('properties.units.floor', { value: p.floor })}
              </DetailRow>
            )}
            <DetailRow icon={<Building2 size={16} />} label={t('properties.detail.rent')}>
              <span className="font-tabular font-semibold text-surface-900 dark:text-surface-50">
                {formatCurrency(p.monthly_rent)}
              </span>
            </DetailRow>
          </dl>
        </Card>

        {/* Tenants & payments */}
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-surface-500 dark:text-surface-400">
            {t('properties.detail.tenants')}
          </h2>
          <dl className="space-y-1">
            <DetailRow icon={<Users size={16} />} label={t('properties.detail.tenants')}>
              {p.tenant_count > 0
                ? t('properties.card.tenants', { count: p.tenant_count })
                : t('properties.card.noTenants')}
            </DetailRow>
            <DetailRow icon={<CalendarClock size={16} />} label={t('properties.detail.lastPayment')}>
              {p.last_payment_at ? formatDate(p.last_payment_at) : t('properties.detail.noPayment')}
            </DetailRow>
            {nextPayment && (
              <DetailRow icon={<CalendarClock size={16} />} label={t('properties.detail.nextPayment')}>
                {formatDate(nextPayment)}
              </DetailRow>
            )}
          </dl>
        </Card>

        {/* Notes */}
        <Card padding="lg" className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-surface-500 dark:text-surface-400">
            {t('properties.detail.notes')}
          </h2>
          <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300">
            {p.notes || <span className="text-surface-400">{t('properties.detail.noNotes')}</span>}
          </p>
        </Card>

        <CadastreCard property={p} />
      </div>

      <PropertyFormModal open={editOpen} onOpenChange={setEditOpen} property={p} />

      <Modal
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={t('properties.archiveDialog.title')}
        description={t('properties.archiveDialog.message', { name: p.name })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setArchiveOpen(false)} disabled={archive.isPending}>
              {t('properties.archiveDialog.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={archive.isPending}
              onClick={() => archive.mutate(p.id, { onSuccess: () => setArchiveOpen(false) })}
            >
              {t('properties.archiveDialog.confirm')}
            </Button>
          </>
        }
      >
        <div className="sr-only" />
      </Modal>
    </div>
  )
}

// ── Cadastre card ────────────────────────────────────────────────────────────────

function CadastreCard({ property: p }: { property: PropertyWithStats }) {
  const { t } = useTranslation()
  const refreshCadastre = useRefreshCadastre()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const canRefresh = Boolean(p.cadastre_ku_code && p.cadastre_lv)
  const hasData = Boolean(p.cadastre_lv || p.cadastre_ku || p.cadastre_parcel || p.cadastre_owners?.length)

  async function handleRefresh() {
    if (!p.cadastre_ku_code || !p.cadastre_lv) return
    setRefreshing(true)
    setRefreshError(null)
    try {
      const result = await fetchPropertyFromCuzk({ ku_code: p.cadastre_ku_code, lv: p.cadastre_lv })
      await refreshCadastre.mutateAsync({ id: p.id, patch: result })
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : t('cuzk.error.wsdpFailed'))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card padding="lg" className="lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400">
            {t('cuzk.detail.title')}
          </h2>
          {p.cadastre_refreshed_at && (
            <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
              {t('cuzk.detail.refreshed', { date: formatDate(p.cadastre_refreshed_at) })}
            </p>
          )}
        </div>
        {canRefresh && (
          <Button
            variant="outline"
            loading={refreshing || refreshCadastre.isPending}
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void handleRefresh()}
          >
            {t('cuzk.detail.refresh')}
          </Button>
        )}
      </div>

      {refreshError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{refreshError}</p>
      )}

      {!hasData ? (
        <p className="text-sm text-surface-400 dark:text-surface-500">{t('cuzk.detail.noData')}</p>
      ) : (
        <dl className="space-y-1">
          {p.cadastre_lv && (
            <DetailRow icon={<Building2 size={16} />} label={t('cuzk.detail.lv')}>
              {p.cadastre_lv}
            </DetailRow>
          )}
          {p.cadastre_ku && (
            <DetailRow icon={<MapPin size={16} />} label={t('cuzk.detail.ku')}>
              {p.cadastre_ku}
              {p.cadastre_ku_code && (
                <span className="ml-1 text-surface-400 dark:text-surface-500">({p.cadastre_ku_code})</span>
              )}
            </DetailRow>
          )}
          {p.cadastre_parcel && (
            <DetailRow icon={<Layers size={16} />} label={t('cuzk.detail.parcel')}>
              {p.cadastre_parcel}
            </DetailRow>
          )}
          {p.cadastre_owners && p.cadastre_owners.length > 0 && (
            <DetailRow icon={<Users size={16} />} label={t('cuzk.detail.owners')}>
              <span className="text-right">
                {p.cadastre_owners.map((o, i) => (
                  <span key={i} className="block">
                    {o.name}{' '}
                    <span className="text-surface-400 dark:text-surface-500">({o.share})</span>
                  </span>
                ))}
              </span>
            </DetailRow>
          )}
          {p.cadastre_encumbrances != null && (
            <DetailRow icon={<Layers size={16} />} label={t('cuzk.detail.encumbrances')}>
              {p.cadastre_encumbrances.length === 0 ? (
                <span className="text-surface-400 dark:text-surface-500">
                  {t('cuzk.detail.noEncumbrances')}
                </span>
              ) : (
                p.cadastre_encumbrances.join(', ')
              )}
            </DetailRow>
          )}
        </dl>
      )}
    </Card>
  )
}

// ── Bits ────────────────────────────────────────────────────────────────────────

function BackLink() {
  const { t } = useTranslation()
  return (
    <Link
      to="/app/properties"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-surface-400 dark:hover:text-surface-200"
    >
      <ArrowLeft size={16} />
      {t('properties.detail.back')}
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
        <span className="text-surface-400 dark:text-surface-500">{icon}</span>
        {label}
      </dt>
      <dd className="text-right text-sm text-surface-800 dark:text-surface-200">{children}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-5 h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-48" />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  )
}
