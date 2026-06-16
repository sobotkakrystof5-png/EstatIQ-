import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Flame,
  Droplets,
  Plus,
  RotateCw,
  Thermometer,
  TrendingUp,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Segmented, type SegmentOption } from '@/components/ui/Segmented'
import { formatDateShort } from '@/lib/formatters'
import {
  useEnergyReadings,
  useEnergyProperties,
  useDeleteEnergyReading,
  useEnergyAnomalyNotifications,
  useDismissEnergyNotifications,
} from './hooks'
import {
  buildEnergyChartData,
  ENERGY_TYPE_LABELS,
  ENERGY_TYPE_UNITS,
  type EnergyAnomalyNotification,
  type EnergyChartPoint,
  type EnergyReadingWithMeta,
  type EnergyType,
} from './data'
import { EnergyReadingModal } from './EnergyReadingModal'
import { ImportEnergyModal } from './ImportEnergyModal'

// ── Constants ─────────────────────────────────────────────────────────────────

type TypeFilter = 'all' | 'elektrina' | 'plyn' | 'voda' | 'teplo'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

const CHART_COLORS: Record<string, string> = {
  elektrina:    '#D97706',
  plyn:         '#EA580C',
  voda_studena: '#0284C7',
  voda_tepla:   '#2563EB',
  teplo:        '#E11D48',
  voda:         '#0EA5E9',
}

// ── AnomalyBanner ─────────────────────────────────────────────────────────────

function AnomalyBanner({
  notifications,
  onDismiss,
}: {
  notifications: EnergyAnomalyNotification[]
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const count = notifications.length
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      className="mb-6 overflow-hidden"
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {t('energy.anomalyBanner.title', { count })}
          </p>
          <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">
            {t('energy.anomalyBanner.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-medium text-amber-700 underline-offset-2 hover:underline focus-visible:outline-none dark:text-amber-400"
        >
          {t('energy.anomalyBanner.dismiss')}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('common.close')}
          className="shrink-0 rounded p-0.5 text-amber-600 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-amber-900/40"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

// ── EnergyTypeIcon ────────────────────────────────────────────────────────────

function EnergyTypeIcon({ type }: { type: EnergyType }) {
  const configs: Record<EnergyType, { icon: React.ReactNode; bg: string; text: string }> = {
    elektrina: {
      icon: <Zap size={16} />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
    },
    plyn: {
      icon: <Flame size={16} />,
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
    },
    voda_studena: {
      icon: <Droplets size={16} />,
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-600 dark:text-sky-400',
    },
    voda_tepla: {
      icon: <Droplets size={16} />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    teplo: {
      icon: <Thermometer size={16} />,
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      text: 'text-rose-600 dark:text-rose-400',
    },
  }
  const { icon, bg, text } = configs[type]
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg} ${text}`}
    >
      {icon}
    </span>
  )
}

// ── ReadingRow ────────────────────────────────────────────────────────────────

function ReadingRow({ reading }: { reading: EnergyReadingWithMeta }) {
  const { t } = useTranslation()
  const { mutate: deleteReading, isPending } = useDeleteEnergyReading()
  const unit = ENERGY_TYPE_UNITS[reading.type]

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <EnergyTypeIcon type={reading.type} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
            {ENERGY_TYPE_LABELS[reading.type]}
          </span>
          {reading.property_name !== '—' && (
            <span className="text-xs text-surface-400">{reading.property_name}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-surface-400">
          {formatDateShort(new Date(reading.reading_date))}
          {reading.note && ` · ${reading.note}`}
        </p>
      </div>

      {reading.consumption !== null && (
        <div className="hidden items-center gap-1 text-sm sm:flex">
          <TrendingUp size={14} className="text-surface-300 dark:text-surface-600" />
          <span className="font-tabular text-surface-500 dark:text-surface-400">
            +{reading.consumption.toFixed(2)} {unit}
          </span>
        </div>
      )}

      <div className="text-right">
        <p className="font-tabular text-sm font-semibold text-surface-900 dark:text-surface-50">
          {reading.reading_value.toFixed(2)}{' '}
          <span className="text-xs font-normal text-surface-400">{unit}</span>
        </p>
        {reading.is_anomaly && (
          <Badge variant="overdue" className="mt-0.5 gap-1 text-[11px]">
            <AlertTriangle size={9} />
            {t('energy.anomaly')}
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={() => deleteReading(reading.id)}
        disabled={isPending}
        aria-label={t('common.delete')}
        className="shrink-0 rounded-lg p-1.5 text-surface-300 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 dark:text-surface-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── EnergyChart ───────────────────────────────────────────────────────────────

interface ChartLine {
  key: string
  name: string
  color: string
  unit: string
}

function getChartLines(typeFilter: TypeFilter): ChartLine[] {
  const all: ChartLine[] = [
    { key: 'elektrina',    name: ENERGY_TYPE_LABELS.elektrina,    color: CHART_COLORS.elektrina,    unit: ENERGY_TYPE_UNITS.elektrina },
    { key: 'plyn',         name: ENERGY_TYPE_LABELS.plyn,         color: CHART_COLORS.plyn,         unit: ENERGY_TYPE_UNITS.plyn },
    { key: 'voda_studena', name: ENERGY_TYPE_LABELS.voda_studena, color: CHART_COLORS.voda_studena, unit: ENERGY_TYPE_UNITS.voda_studena },
    { key: 'voda_tepla',   name: ENERGY_TYPE_LABELS.voda_tepla,   color: CHART_COLORS.voda_tepla,   unit: ENERGY_TYPE_UNITS.voda_tepla },
    { key: 'teplo',        name: ENERGY_TYPE_LABELS.teplo,        color: CHART_COLORS.teplo,        unit: ENERGY_TYPE_UNITS.teplo },
  ]
  if (typeFilter === 'all') return all
  if (typeFilter === 'voda') return [{ key: 'voda', name: 'Voda', color: CHART_COLORS.voda, unit: 'm³' }]
  return all.filter((l) => l.key === typeFilter)
}

type ChartDatum = EnergyChartPoint & { voda?: number | null }

function sumNullable(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null
  return (a ?? 0) + (b ?? 0)
}

function EnergyChart({
  readings,
  typeFilter,
}: {
  readings: EnergyReadingWithMeta[]
  typeFilter: TypeFilter
}) {
  const { t } = useTranslation()

  const chartData: ChartDatum[] = useMemo(() => {
    const raw = buildEnergyChartData(readings)
    if (typeFilter !== 'voda') return raw
    return raw.map((p) => ({ ...p, voda: sumNullable(p.voda_studena, p.voda_tepla) }))
  }, [readings, typeFilter])

  const lines = useMemo(() => getChartLines(typeFilter), [typeFilter])

  const hasData = chartData.some((p) =>
    lines.some((l) => {
      const v = (p as unknown as Record<string, unknown>)[l.key]
      return v !== null && v !== undefined
    }),
  )

  if (!hasData) {
    return (
      <Card className="mt-6" padding="md">
        <p className="py-6 text-center text-sm text-surface-400 dark:text-surface-500">
          {t('energy.chart.noData')}
        </p>
      </Card>
    )
  }

  return (
    <Card className="mt-6" padding="none">
      <div className="px-5 pt-4">
        <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
          {t('energy.chart.title')}
        </p>
      </div>
      <div className="h-52 px-2 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              strokeOpacity={0.7}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              dy={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                padding: '8px 12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4, color: '#1e293b' }}
              formatter={
                // Recharts ValueType/NameType not re-exported from main entry; cast to satisfy overloaded prop
                ((value: number | string | readonly (number | string)[] | undefined, name: string | number | undefined) => {
                  const num = typeof value === 'number' ? value : NaN
                  const key = typeof name === 'string' ? name : ''
                  const line = lines.find((l) => l.key === key)
                  return [isNaN(num) ? '—' : `${num.toFixed(2)} ${line?.unit ?? ''}`, line?.name ?? key]
                }) as never
              }
            />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.key}
                stroke={l.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: l.color }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EnergyPage() {
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<TypeFilter>('all')

  const { data: properties = [] } = useEnergyProperties()
  const { data: readings = [], isLoading, isError, refetch } = useEnergyReadings(
    selectedProperty !== 'all' ? selectedProperty : undefined,
  )
  const { data: anomalyNotifs = [] } = useEnergyAnomalyNotifications()
  const { mutate: dismissAll } = useDismissEnergyNotifications()

  const filtered = useMemo(() => {
    if (selectedType === 'all') return readings
    if (selectedType === 'voda')
      return readings.filter((r) => r.type === 'voda_studena' || r.type === 'voda_tepla')
    return readings.filter((r) => r.type === selectedType)
  }, [readings, selectedType])

  const typeOptions: SegmentOption<TypeFilter>[] = useMemo(
    () => [
      { value: 'all',      label: t('energy.typeFilter.all') },
      { value: 'elektrina',label: t('energy.typeFilter.elektrina') },
      { value: 'plyn',     label: t('energy.typeFilter.plyn') },
      { value: 'voda',     label: t('energy.typeFilter.voda') },
      { value: 'teplo',    label: t('energy.typeFilter.teplo') },
    ],
    [t],
  )

  const propertyOptions = useMemo(
    () => [
      { value: 'all', label: t('energy.filter.allProperties') },
      ...properties.map((p) => ({ value: p.id, label: p.name })),
    ],
    [properties, t],
  )

  const defaultPropertyId =
    selectedProperty !== 'all' ? selectedProperty : properties[0]?.id

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      {/* Anomaly banner */}
      <AnimatePresence>
        {anomalyNotifs.length > 0 && (
          <AnomalyBanner
            key="anomaly-banner"
            notifications={anomalyNotifs}
            onDismiss={() => dismissAll(anomalyNotifs.map((n) => n.id))}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('energy.title')}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {t('energy.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} leftIcon={<Upload size={16} />}>
            {t('energy.import.button')}
          </Button>
          <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={16} />}>
            {t('energy.addReading')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:pb-0">
          <Segmented value={selectedType} onChange={setSelectedType} options={typeOptions} />
        </div>
        {properties.length > 1 && (
          <div className="w-52 shrink-0">
            <Select
              value={selectedProperty}
              onValueChange={setSelectedProperty}
              options={propertyOptions}
            />
          </div>
        )}
      </div>

      {/* Chart */}
      {!isLoading && !isError && readings.length > 0 && (
        <EnergyChart readings={readings} typeFilter={selectedType} />
      )}

      {/* Reading list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<RotateCw size={26} />}
            title={t('common.error')}
            action={
              <Button
                variant="outline"
                onClick={() => void refetch()}
                leftIcon={<RotateCw size={16} />}
              >
                {t('common.retry')}
              </Button>
            }
          />
        ) : readings.length === 0 ? (
          <EmptyState
            icon={<Zap size={26} />}
            title={t('energy.emptyState.title')}
            description={t('energy.emptyState.description')}
            action={
              <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={16} />}>
                {t('energy.addReading')}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Zap size={26} />}
            title={t('energy.emptyFiltered.title')}
            description={t('energy.emptyFiltered.description')}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((reading, i) => (
                <motion.div
                  key={reading.id}
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
                  <ReadingRow reading={reading} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <EnergyReadingModal
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultPropertyId={defaultPropertyId}
      />

      <ImportEnergyModal
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultPropertyId={defaultPropertyId}
        properties={properties}
      />
    </div>
  )
}
