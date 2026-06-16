import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCw, Search, UserPlus, Users } from 'lucide-react'
import { Button, EmptyState, Input, Segmented, SkeletonRow, type SegmentOption } from '@/components/ui'
import type { TenantStatus } from './data'
import { useTenants } from './hooks'
import { TenantRow } from './TenantRow'
import { InviteTenantModal } from './InviteTenantModal'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
type Filter = 'all' | TenantStatus

export default function TenantsPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useTenants()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

  const tenants = useMemo(() => data ?? [], [data])

  const counts = useMemo(() => {
    const base: Record<Filter, number> = { all: 0, active: 0, invited: 0, ended: 0 }
    for (const t of tenants) {
      base.all += 1
      base[t.status] += 1
    }
    return base
  }, [tenants])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tenants.filter((ctx) => {
      const matchesFilter = filter === 'all' || ctx.status === filter
      const matchesQuery =
        !q ||
        (ctx.user.full_name ?? '').toLowerCase().includes(q) ||
        ctx.tenant.email.toLowerCase().includes(q) ||
        ctx.property_name.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [tenants, filter, query])

  const filterOptions: SegmentOption<Filter>[] = [
    { value: 'all', label: t('tenants.filter.all'), count: counts.all },
    { value: 'active', label: t('tenants.filter.active'), count: counts.active },
    { value: 'invited', label: t('tenants.filter.invited'), count: counts.invited },
    { value: 'ended', label: t('tenants.filter.ended'), count: counts.ended },
  ]

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('tenants.title')}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {counts.all > 0
              ? t('tenants.count', { count: counts.all })
              : t('tenants.subtitle')}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus size={18} />}>
          {t('tenants.invite')}
        </Button>
      </div>

      {/* Toolbar */}
      {!isLoading && !isError && tenants.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:pb-0">
            <Segmented value={filter} onChange={setFilter} options={filterOptions} />
          </div>
          <div className="sm:w-64">
            <Input
              type="search"
              placeholder={t('tenants.search')}
              value={query}
              leftIcon={<Search size={16} />}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('tenants.search')}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-2xl border border-surface-100 bg-white px-4 dark:border-surface-800 dark:bg-surface-900">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<RotateCw size={26} />}
            title={t('common.error')}
            action={
              <Button variant="outline" onClick={() => void refetch()} leftIcon={<RotateCw size={16} />}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title={t('tenants.emptyState.title')}
            description={t('tenants.emptyState.description')}
            action={
              <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus size={18} />}>
                {t('tenants.emptyState.cta')}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title={t('tenants.emptyFiltered.title')}
            description={
              query.trim()
                ? t('tenants.searchEmpty', { query: query.trim() })
                : t('tenants.emptyFiltered.description')
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((ctx, i) => (
                <motion.div
                  key={ctx.tenant.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.03 }}
                  className={
                    i < filtered.length - 1
                      ? 'border-b border-surface-100 dark:border-surface-800'
                      : ''
                  }
                >
                  <TenantRow ctx={ctx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <InviteTenantModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
