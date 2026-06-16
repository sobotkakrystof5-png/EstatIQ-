import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Database, Plus, RotateCw, Search } from 'lucide-react'
import {
  Button,
  EmptyState,
  Input,
  Segmented,
  SkeletonCard,
  UnitLimitBanner,
  type SegmentOption,
} from '@/components/ui'
import type { PropertyStatus } from '@/types/database'
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage'
import { useProperties } from './hooks'
import { PropertyCard } from './PropertyCard'
import { PropertyFormModal } from './PropertyFormModal'
import { CuzkSearchModal, type CuzkAddressData } from './CuzkSearchModal'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
type Filter = 'all' | PropertyStatus

export default function PropertiesPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useProperties()
  const { data: usage } = useSubscriptionUsage()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [cuzkOpen, setCuzkOpen] = useState(false)
  const [cuzkAddress, setCuzkAddress] = useState<CuzkAddressData | undefined>()

  const properties = useMemo(() => data ?? [], [data])

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: 0,
      active: 0,
      vacant: 0,
      maintenance: 0,
      archived: 0,
    }
    for (const p of properties) {
      base[p.status] += 1
      if (p.status !== 'archived') base.all += 1
    }
    return base
  }, [properties])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return properties.filter((p) => {
      // "All" shows everything except archived; archived lives behind its own filter.
      const matchesFilter = filter === 'all' ? p.status !== 'archived' : p.status === filter
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.address_street.toLowerCase().includes(q) ||
        p.address_city.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [properties, filter, query])

  const filterOptions: SegmentOption<Filter>[] = [
    { value: 'all', label: t('properties.filter.all'), count: counts.all },
    { value: 'active', label: t('properties.filter.active'), count: counts.active },
    { value: 'vacant', label: t('properties.filter.vacant'), count: counts.vacant },
    { value: 'maintenance', label: t('properties.filter.maintenance'), count: counts.maintenance },
    { value: 'archived', label: t('properties.filter.archived'), count: counts.archived },
  ]

  const canAddProperty = !usage?.isAtLimit && (usage?.isActive ?? true)

  return (
    <div className="mx-auto max-w-7xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('properties.title')}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {counts.all > 0 ? t('properties.count', { count: counts.all }) : t('properties.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCuzkOpen(true)}
            leftIcon={<Database size={16} />}
            disabled={!canAddProperty}
            title={!canAddProperty ? t('subscription.banner.atLimit', { limit: usage?.unit_limit ?? 1 }) : undefined}
          >
            {t('properties.addFromCuzk')}
          </Button>
          <Button
            onClick={() => { setCuzkAddress(undefined); setCreateOpen(true) }}
            leftIcon={<Plus size={18} />}
            disabled={!canAddProperty}
            title={!canAddProperty ? t('subscription.banner.atLimit', { limit: usage?.unit_limit ?? 1 }) : undefined}
          >
            {t('properties.add')}
          </Button>
        </div>
      </div>

      {/* Subscription limit banner — shown at 80%+ usage */}
      <UnitLimitBanner className="mt-4" />

      {/* Toolbar */}
      {!isLoading && !isError && properties.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:pb-0">
            <Segmented value={filter} onChange={setFilter} options={filterOptions} />
          </div>
          <div className="sm:w-64">
            <Input
              type="search"
              placeholder={t('properties.search')}
              value={query}
              leftIcon={<Search size={16} />}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('properties.search')}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
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
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<Building2 size={26} />}
            title={t('properties.emptyState.title')}
            description={t('properties.emptyState.description')}
            action={
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={18} />}>
                {t('properties.emptyState.cta')}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title={t('properties.emptyFiltered.title')}
            description={
              query.trim()
                ? t('properties.searchEmpty', { query: query.trim() })
                : t('properties.emptyFiltered.description')
            }
          />
        ) : (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  <PropertyCard property={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <PropertyFormModal
        open={createOpen}
        onOpenChange={(open) => { if (!open) setCuzkAddress(undefined); setCreateOpen(open) }}
        initialAddress={cuzkAddress}
      />

      <CuzkSearchModal
        open={cuzkOpen}
        onOpenChange={setCuzkOpen}
        onConfirm={(data) => {
          setCuzkAddress(data)
          setCuzkOpen(false)
          setCreateOpen(true)
        }}
      />
    </div>
  )
}
