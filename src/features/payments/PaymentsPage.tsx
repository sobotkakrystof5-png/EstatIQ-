import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, RotateCw, Search, Sparkles, Wallet } from 'lucide-react'
import { Button, EmptyState, Input, Segmented, SkeletonRow, type SegmentOption } from '@/components/ui'
import { formatCurrency, formatPercent, currentYYYYMM } from '@/lib/formatters'
import { buildCSV } from './data'
import type { PaymentWithContext } from './data'
import { usePayments } from './hooks'
import { PaymentRow } from './PaymentRow'
import { MarkPaidModal } from './MarkPaidModal'
import { GenerateModal } from './GenerateModal'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
type Filter = 'all' | 'paid' | 'pending' | 'overdue'

export default function PaymentsPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = usePayments()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [markPaidTarget, setMarkPaidTarget] = useState<PaymentWithContext | null>(null)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)

  const payments = useMemo(() => data ?? [], [data])

  // ── Stats ───────────────────────────────────────────────────────────────────
  const thisMonth = currentYYYYMM()
  const stats = useMemo(() => {
    const monthly = payments.filter((p) => p.due_date.startsWith(thisMonth))
    const expected = monthly.reduce((s, p) => s + p.amount, 0)
    const collected = monthly.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
    const overdueAmt = payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
    const rate = expected > 0 ? (collected / expected) * 100 : 0
    return { expected, collected, overdueAmt, rate }
  }, [payments, thisMonth])

  // ── Counts for filter tabs ───────────────────────────────────────────────────
  const counts = useMemo(() => {
    const base: Record<Filter, number> = { all: 0, paid: 0, pending: 0, overdue: 0 }
    for (const p of payments) {
      base.all += 1
      if (p.status === 'paid') base.paid += 1
      else if (p.status === 'pending') base.pending += 1
      else if (p.status === 'overdue') base.overdue += 1
    }
    return base
  }, [payments])

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter((p) => {
      const matchFilter = filter === 'all' || p.status === filter
      const matchQuery =
        !q ||
        (p.tenant.full_name ?? '').toLowerCase().includes(q) ||
        p.property.name.toLowerCase().includes(q) ||
        p.property.address_city.toLowerCase().includes(q)
      return matchFilter && matchQuery
    })
  }, [payments, filter, query])

  const filterOptions: SegmentOption<Filter>[] = useMemo(() => [
    { value: 'all', label: t('payments.filter.all'), count: counts.all },
    { value: 'paid', label: t('payments.filter.paid'), count: counts.paid },
    { value: 'pending', label: t('payments.filter.pending'), count: counts.pending },
    { value: 'overdue', label: t('payments.filter.overdue'), count: counts.overdue },
  ], [t, counts])

  function handleMarkPaid(payment: PaymentWithContext) {
    setMarkPaidTarget(payment)
    setMarkPaidOpen(true)
  }

  function handleExport() {
    const csv = buildCSV(filtered.length > 0 ? filtered : payments)
    const a = document.createElement('a')
    a.href = csv
    a.download = `platby-${thisMonth}.csv`
    a.click()
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('payments.title')}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {counts.all > 0
              ? t('payments.count', { count: counts.all })
              : t('payments.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={handleExport}
            disabled={payments.length === 0}
          >
            {t('payments.export')}
          </Button>
          <Button
            leftIcon={<Sparkles size={16} />}
            onClick={() => setGenerateOpen(true)}
          >
            {t('payments.generate')}
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      {!isLoading && !isError && payments.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={t('payments.stats.collected')}
            value={formatCurrency(stats.collected)}
            highlight="paid"
          />
          <StatCard
            label={t('payments.stats.expected')}
            value={formatCurrency(stats.expected)}
          />
          <StatCard
            label={t('payments.stats.overdueAmount')}
            value={formatCurrency(stats.overdueAmt)}
            highlight={stats.overdueAmt > 0 ? 'overdue' : undefined}
          />
          <StatCard
            label={t('payments.stats.rate')}
            value={formatPercent(stats.rate)}
            highlight={stats.rate >= 100 ? 'paid' : stats.rate < 60 ? 'overdue' : undefined}
          />
        </div>
      )}

      {/* Toolbar */}
      {!isLoading && !isError && payments.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:pb-0">
            <Segmented value={filter} onChange={setFilter} options={filterOptions} />
          </div>
          <div className="sm:w-64">
            <Input
              type="search"
              placeholder={t('payments.search')}
              value={query}
              leftIcon={<Search size={16} />}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('payments.search')}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-2xl border border-surface-100 bg-white px-4 dark:border-surface-800 dark:bg-surface-900">
            {Array.from({ length: 6 }).map((_, i) => (
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
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<Wallet size={26} />}
            title={t('payments.emptyState.title')}
            description={t('payments.emptyState.description')}
            action={
              <Button onClick={() => setGenerateOpen(true)} leftIcon={<Sparkles size={16} />}>
                {t('payments.emptyState.cta')}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title={t('payments.emptyFiltered.title')}
            description={
              query.trim()
                ? t('payments.searchEmpty', { query: query.trim() })
                : t('payments.emptyFiltered.description')
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: Math.min(i * 0.025, 0.1) }}
                  className={
                    i < filtered.length - 1
                      ? 'border-b border-surface-100 dark:border-surface-800'
                      : ''
                  }
                >
                  <PaymentRow payment={payment} onMarkPaid={handleMarkPaid} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <MarkPaidModal
        payment={markPaidTarget}
        open={markPaidOpen}
        onOpenChange={(open) => {
          setMarkPaidOpen(open)
          if (!open) setMarkPaidTarget(null)
        }}
      />
      <GenerateModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        payments={payments}
      />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'paid' | 'overdue'
}) {
  return (
    <div className="rounded-xl border border-surface-100 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
      <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
      <p
        className={`mt-1.5 font-tabular text-lg font-bold ${
          highlight === 'paid'
            ? 'text-paid'
            : highlight === 'overdue'
              ? 'text-overdue'
              : 'text-surface-900 dark:text-surface-50'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
