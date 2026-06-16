import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Hash, Zap } from 'lucide-react'
import { Modal } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatFileSize } from '@/lib/formatters'
import { useEnergyProperties, useCreateEnergyReading } from './hooks'
import {
  ENERGY_TYPE_LABELS,
  ENERGY_TYPE_UNITS,
  ENERGY_PROVIDER_LABELS,
  type EnergyType,
  type EnergyProvider,
} from './data'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPropertyId?: string
}

const ENERGY_TYPE_OPTIONS = Object.entries(ENERGY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const PROVIDER_OPTIONS = [
  { value: '', label: '—' },
  ...Object.entries(ENERGY_PROVIDER_LABELS).map(([value, label]) => ({ value, label })),
]

export function EnergyReadingModal({ open, onOpenChange, defaultPropertyId }: Props) {
  const { t } = useTranslation()
  const { data: properties = [] } = useEnergyProperties()
  const { mutateAsync, isPending } = useCreateEnergyReading()
  const photoRef = useRef<HTMLInputElement>(null)

  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? '')
  const [type, setType] = useState<EnergyType>('elektrina')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [meterId, setMeterId] = useState('')
  const [provider, setProvider] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [valueError, setValueError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Auto-select first property when list loads and no default given
  useEffect(() => {
    if (!propertyId && properties.length > 0) {
      setPropertyId(defaultPropertyId ?? properties[0].id)
    }
  }, [properties]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset fields on close
  useEffect(() => {
    if (!open) {
      setValue('')
      setMeterId('')
      setProvider('')
      setNote('')
      setPhoto(null)
      setValueError(undefined)
      setSubmitError(null)
    }
  }, [open])

  const unit = ENERGY_TYPE_UNITS[type]

  async function handleSubmit() {
    if (!propertyId) {
      setSubmitError(t('energy.modal.propertyRequired'))
      return
    }
    const num = parseFloat(value.replace(',', '.'))
    if (isNaN(num) || num < 0) {
      setValueError(t('energy.modal.valueRequired'))
      return
    }

    setValueError(undefined)
    setSubmitError(null)
    try {
      await mutateAsync({
        property_id: propertyId,
        type,
        reading_value: num,
        reading_date: date,
        note: note.trim() || null,
        meter_id: meterId.trim() || null,
        provider: (provider as EnergyProvider) || null,
        photo_file: photo,
      })
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const propertyOptions = properties.map((p) => ({ value: p.id, label: p.name }))

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('energy.modal.title')}
      description={t('energy.modal.description')}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {t('energy.modal.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Nemovitost */}
        {properties.length > 1 && (
          <Select
            label={t('energy.modal.property')}
            value={propertyId}
            onValueChange={(v) => { setPropertyId(v); setSubmitError(null) }}
            options={propertyOptions}
          />
        )}

        {/* Typ energie */}
        <Select
          label={t('energy.modal.type')}
          value={type}
          onValueChange={(v) => setType(v as EnergyType)}
          options={ENERGY_TYPE_OPTIONS}
        />

        {/* Stav měřiče + Datum odečtu */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`${t('energy.modal.value')} (${unit})`}
            placeholder="0.00"
            value={value}
            inputMode="decimal"
            className="font-tabular"
            leftIcon={<Zap size={16} />}
            error={valueError}
            onChange={(e) => { setValue(e.target.value); setValueError(undefined) }}
          />
          <Input
            label={t('energy.modal.date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* ID měřiče + Dodavatel */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`${t('energy.modal.meterId')} (${t('common.optional')})`}
            placeholder={t('energy.modal.meterIdPlaceholder')}
            value={meterId}
            leftIcon={<Hash size={16} />}
            onChange={(e) => setMeterId(e.target.value)}
          />
          <Select
            label={`${t('energy.modal.provider')} (${t('common.optional')})`}
            value={provider}
            onValueChange={setProvider}
            options={PROVIDER_OPTIONS}
          />
        </div>

        {/* Poznámka */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {`${t('energy.modal.note')} (${t('common.optional')})`}
          </label>
          <textarea
            value={note}
            rows={2}
            placeholder={t('energy.modal.notePlaceholder')}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-colors duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:placeholder:text-surface-500"
          />
        </div>

        {/* Foto dokladu */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {`${t('energy.modal.photo')} (${t('common.optional')})`}
          </p>
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-400"
          >
            <Camera size={16} className="shrink-0" />
            <span className="truncate">
              {photo
                ? t('energy.modal.photoSelected', {
                    name: photo.name,
                    size: formatFileSize(photo.size),
                  })
                : t('energy.modal.photoPlaceholder')}
            </span>
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Chybová hláška */}
        {submitError && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {submitError}
          </p>
        )}
      </div>
    </Modal>
  )
}
