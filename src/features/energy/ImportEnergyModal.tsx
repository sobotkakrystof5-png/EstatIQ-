import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
  ChevronDown,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatDateShort } from '@/lib/formatters'
import { ENERGY_TYPE_LABELS, ENERGY_PROVIDER_LABELS, type EnergyProvider } from './data'
import { parseEnergyFile } from './parsers'
import type { ParsedRow } from './parsers/types'
import { useImportEnergyReadings } from './hooks'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED = '.csv,.txt'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

const PROVIDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'auto', label: 'Automaticky detekovat' },
  { value: 'cez',              label: ENERGY_PROVIDER_LABELS.cez },
  { value: 'eon',              label: ENERGY_PROVIDER_LABELS.eon },
  { value: 'pre',              label: ENERGY_PROVIDER_LABELS.pre },
  { value: 'innogy',           label: ENERGY_PROVIDER_LABELS.innogy },
  { value: 'prazska_teplarenska', label: ENERGY_PROVIDER_LABELS.prazska_teplarenska },
  { value: 'jiny',             label: ENERGY_PROVIDER_LABELS.jiny },
]

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

// ── Steps ─────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'done'

// ── Dropzone ──────────────────────────────────────────────────────────────────

function Dropzone({
  onFile,
  disabled,
}: {
  onFile: (f: File) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (f: File) => {
      if (f.size > MAX_BYTES) return
      if (!f.name.match(/\.(csv|txt)$/i)) return
      onFile(f)
    },
    [onFile],
  )

  return (
    <label
      className={[
        'relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        dragging
          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20'
          : 'border-surface-200 hover:border-emerald-300 hover:bg-surface-50 dark:border-surface-700 dark:hover:border-emerald-700 dark:hover:bg-surface-800/50',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
      }}
    >
      <Upload size={28} className="text-emerald-500" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
          {t('energy.import.dropzone.title')}
        </p>
        <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
          {t('energy.import.dropzone.hint')}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        disabled={disabled}
        aria-label={t('energy.import.dropzone.title')}
      />
    </label>
  )
}

// ── Preview table ─────────────────────────────────────────────────────────────

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rows : rows.slice(0, 8)

  return (
    <div className="overflow-hidden rounded-xl border border-surface-100 dark:border-surface-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/60">
              {(['energy.import.preview.date', 'energy.import.preview.type', 'energy.import.preview.value', 'energy.import.preview.consumption'] as const).map((k) => (
                <th key={k} className="px-3 py-2 text-left font-semibold text-surface-500 dark:text-surface-400">
                  {t(k)}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-semibold text-surface-500 dark:text-surface-400">
                {t('energy.import.preview.meterId')}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-white dark:bg-surface-900' : 'bg-surface-50/50 dark:bg-surface-800/30'}
              >
                <td className="px-3 py-2 font-tabular text-surface-700 dark:text-surface-300">
                  {formatDateShort(new Date(row.reading_date))}
                </td>
                <td className="px-3 py-2 text-surface-600 dark:text-surface-400">
                  {ENERGY_TYPE_LABELS[row.type]}
                </td>
                <td className="px-3 py-2 font-tabular text-surface-900 dark:text-surface-100">
                  {row.reading_value.toFixed(3)}
                </td>
                <td className="px-3 py-2 font-tabular text-surface-500 dark:text-surface-400">
                  {row.consumption != null ? `+${row.consumption.toFixed(3)}` : '—'}
                </td>
                <td className="px-3 py-2 text-surface-400 dark:text-surface-500">
                  {row.meter_id ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-surface-100 py-2 text-xs text-surface-400 transition-colors hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800/40"
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded
            ? t('energy.import.preview.showLess')
            : t('energy.import.preview.showMore', { count: rows.length - 8 })}
        </button>
      )}
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultPropertyId?: string
  properties: { id: string; name: string }[]
}

export function ImportEnergyModal({ open, onOpenChange, defaultPropertyId, properties }: Props) {
  const { t } = useTranslation()
  const { mutateAsync: importReadings, isPending: importing } = useImportEnergyReadings()

  const [step, setStep] = useState<Step>('upload')
  const [providerHint, setProviderHint] = useState<string>('auto')
  const [propertyId, setPropertyId] = useState<string>(defaultPropertyId ?? properties[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [detectedProvider, setDetectedProvider] = useState<EnergyProvider | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  const reset = () => {
    setStep('upload')
    setFile(null)
    setParsing(false)
    setParseError(null)
    setParsed([])
    setParseWarnings([])
    setDetectedProvider(null)
    setImportResult(null)
  }

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setParsing(true)
    setParseError(null)

    try {
      const override = providerHint !== 'auto' ? (providerHint as EnergyProvider) : null
      const result = await parseEnergyFile(f, override)

      if (result.rows.length === 0) {
        setParseError(result.errors[0] ?? t('energy.import.error.noRows'))
        setParsing(false)
        return
      }

      setParsed(result.rows)
      setDetectedProvider(result.detectedProvider)
      setParseWarnings(result.errors.slice(0, 5))
      setStep('preview')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : t('energy.import.error.parse'))
    } finally {
      setParsing(false)
    }
  }, [providerHint, t])

  const handleConfirm = async () => {
    if (!propertyId) return
    try {
      const result = await importReadings({ rows: parsed, propertyId, filename: file?.name ?? 'import.csv', provider: detectedProvider })
      setImportResult(result)
      setStep('done')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const propertyOptions = properties.map((p) => ({ value: p.id, label: p.name }))

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none dark:bg-surface-900"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-surface-900 dark:text-surface-50">
                {t('energy.import.title')}
              </Dialog.Title>
              <p className="mt-0.5 text-sm text-surface-400 dark:text-surface-500">
                {t('energy.import.subtitle')}
              </p>
            </div>
            <Dialog.Close
              className="shrink-0 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-surface-800"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* ── Step: upload ── */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="mt-5 space-y-4"
              >
                {/* Provider + property selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                      {t('energy.import.provider')}
                    </label>
                    <Select
                      value={providerHint}
                      onValueChange={setProviderHint}
                      options={PROVIDER_OPTIONS}
                    />
                  </div>
                  {properties.length > 1 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                        {t('energy.import.property')}
                      </label>
                      <Select
                        value={propertyId}
                        onValueChange={setPropertyId}
                        options={propertyOptions}
                      />
                    </div>
                  )}
                </div>

                <Dropzone onFile={handleFile} disabled={parsing} />

                {parsing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-surface-400">
                    <Loader2 size={15} className="animate-spin" />
                    {t('energy.import.parsing')}
                  </div>
                )}

                {parseError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {parseError}
                  </div>
                )}

                <p className="text-center text-xs text-surface-400 dark:text-surface-500">
                  {t('energy.import.supported')}
                </p>
              </motion.div>
            )}

            {/* ── Step: preview ── */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="mt-5 space-y-4"
              >
                {/* Summary bar */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-800/60">
                  <FileText size={15} className="text-surface-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate max-w-[180px]">
                    {file?.name}
                  </span>
                  <span className="ml-auto text-xs text-surface-500">
                    {t('energy.import.preview.rowCount', { count: parsed.length })}
                  </span>
                  {detectedProvider && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {ENERGY_PROVIDER_LABELS[detectedProvider]}
                    </span>
                  )}
                </div>

                {/* Warnings */}
                {parseWarnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-900/20">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {t('energy.import.preview.warnings', { count: parseWarnings.length })}
                    </p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {parseWarnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <PreviewTable rows={parsed} />

                {parseError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {parseError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" className="flex-1" onClick={reset} disabled={importing}>
                    {t('common.back')}
                  </Button>
                  <Button className="flex-1" onClick={handleConfirm} disabled={importing}>
                    {importing
                      ? <><Loader2 size={15} className="animate-spin" /> {t('energy.import.importing')}</>
                      : t('energy.import.confirm', { count: parsed.length })}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step: done ── */}
            {step === 'done' && importResult && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="mt-8 flex flex-col items-center gap-4 pb-2 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {t('energy.import.done.title')}
                  </p>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    {t('energy.import.done.summary', {
                      imported: importResult.imported,
                      skipped: importResult.skipped,
                    })}
                  </p>
                </div>
                <Button
                  className="mt-2 w-full"
                  onClick={() => { reset(); onOpenChange(false) }}
                >
                  {t('energy.import.done.close')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
