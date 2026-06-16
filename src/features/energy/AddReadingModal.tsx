import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import { Modal } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useEnergyProperties, useCreateEnergyReading } from './hooks'
import { ENERGY_TYPE_LABELS, ENERGY_TYPE_UNITS, type EnergyType } from './data'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPropertyId?: string
}

const ENERGY_TYPES = Object.entries(ENERGY_TYPE_LABELS).map(([value, label]) => ({ value, label }))

export default function AddReadingModal({ open, onOpenChange, defaultPropertyId }: Props) {
  const { t } = useTranslation()
  const { data: properties = [] } = useEnergyProperties()
  const { mutateAsync, isPending } = useCreateEnergyReading()

  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.id ?? '')
  const [type, setType] = useState<EnergyType>('elektrina')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sync propertyId when properties load (if no default given)
  if (!propertyId && properties.length > 0) setPropertyId(properties[0].id)

  const unit = ENERGY_TYPE_UNITS[type]

  async function handleSubmit() {
    if (!propertyId) {
      setError(t('energy.modal.propertyRequired'))
      return
    }
    const num = parseFloat(value.replace(',', '.'))
    if (isNaN(num) || num < 0) {
      setError(t('energy.modal.valueRequired'))
      return
    }

    setError(null)
    try {
      await mutateAsync({
        property_id: propertyId,
        type,
        reading_value: num,
        reading_date: date,
        note: note.trim() || null,
      })
      onOpenChange(false)
      setValue('')
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    }
  }

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
        {properties.length > 1 && (
          <Select
            label={t('energy.modal.property')}
            value={propertyId}
            onValueChange={setPropertyId}
            options={properties.map((p) => ({ value: p.id, label: p.name }))}
          />
        )}

        <Select
          label={t('energy.modal.type')}
          value={type}
          onValueChange={(v) => setType(v as EnergyType)}
          options={ENERGY_TYPES}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`${t('energy.modal.value')} (${unit})`}
            placeholder="0.00"
            value={value}
            inputMode="decimal"
            className="font-tabular"
            leftIcon={<Zap size={16} />}
            onChange={(e) => setValue(e.target.value)}
          />
          <Input
            label={t('energy.modal.date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <Input
          label={`${t('energy.modal.note')} (${t('common.optional') ?? 'volitelné'})`}
          placeholder={t('energy.modal.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
