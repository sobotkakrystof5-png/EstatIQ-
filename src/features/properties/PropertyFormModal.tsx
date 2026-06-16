import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { PropertyStatus, PropertyWithStats } from '@/types/database'
import { useCreateProperty, useUpdateProperty } from './hooks'
import type { PropertyDraft } from './data'
import type { CuzkAddressData } from './CuzkSearchModal'

interface FormState {
  name: string
  street: string
  city: string
  zip: string
  rooms: string
  area: string
  rent: string
  status: PropertyStatus
  notes: string
}

const EMPTY: FormState = {
  name: '',
  street: '',
  city: '',
  zip: '',
  rooms: '',
  area: '',
  rent: '',
  status: 'vacant',
  notes: '',
}

function fromProperty(p: PropertyWithStats): FormState {
  return {
    name: p.name,
    street: p.address_street,
    city: p.address_city,
    zip: p.address_zip,
    rooms: p.rooms != null ? String(p.rooms) : '',
    area: p.floor_area_m2 != null ? String(p.floor_area_m2) : '',
    rent: String(p.monthly_rent),
    status: p.status === 'archived' ? 'vacant' : p.status,
    notes: p.notes ?? '',
  }
}

interface PropertyFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: PropertyWithStats
  /** Předvyplnění adresy z ČÚZK vyhledávání */
  initialAddress?: CuzkAddressData
}

export function PropertyFormModal({ open, onOpenChange, property, initialAddress }: PropertyFormModalProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(property)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('properties.form.editTitle') : t('properties.form.createTitle')}
      description={isEdit ? t('properties.form.editSubtitle') : t('properties.form.createSubtitle')}
    >
      {/* Mounts fresh each time the modal opens, so state seeds from props — no effect needed. */}
      <PropertyForm property={property} initialAddress={initialAddress} onClose={() => onOpenChange(false)} />
    </Modal>
  )
}

function PropertyForm({
  property,
  initialAddress,
  onClose,
}: {
  property?: PropertyWithStats
  initialAddress?: CuzkAddressData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const isEdit = Boolean(property)
  const create = useCreateProperty()
  const update = useUpdateProperty()

  const [form, setForm] = useState<FormState>(() => {
    if (property) return fromProperty(property)
    if (initialAddress) {
      return {
        ...EMPTY,
        street: initialAddress.street,
        city: initialAddress.city,
        zip: initialAddress.zip,
      }
    }
    return EMPTY
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const statusOptions = (['active', 'vacant', 'maintenance'] as const).map((s) => ({
    value: s,
    label: t(`properties.status.${s}`),
  }))

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }))
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = t('properties.form.nameRequired')
    if (!form.rent.replace(/\D/g, '')) next.rent = t('properties.form.rentRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const draft: PropertyDraft = {
      name: form.name.trim(),
      address_street: form.street.trim(),
      address_city: form.city.trim(),
      address_zip: form.zip.trim(),
      rooms: form.rooms ? Number(form.rooms) : null,
      floor_area_m2: form.area ? Number(form.area) : null,
      monthly_rent: Number(form.rent.replace(/\D/g, '')),
      status: form.status,
      notes: form.notes.trim() || null,
      ...(!isEdit && initialAddress
        ? {
            cadastre_ku: initialAddress.cadastre_ku ?? null,
            cadastre_ku_code: initialAddress.cadastre_ku_code ?? null,
            cadastre_lv: initialAddress.cadastre_lv ?? null,
            cadastre_parcel: initialAddress.cadastre_parcel ?? null,
          }
        : {}),
    }

    if (isEdit && property) {
      update.mutate({ id: property.id, draft }, { onSuccess: onClose })
    } else {
      create.mutate(draft, { onSuccess: onClose })
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label={t('properties.form.name')}
        placeholder={t('properties.form.namePlaceholder')}
        value={form.name}
        error={errors.name}
        autoFocus
        onChange={(e) => patch({ name: e.target.value })}
      />
      <Input
        label={t('properties.form.street')}
        placeholder={t('properties.form.streetPlaceholder')}
        value={form.street}
        onChange={(e) => patch({ street: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('properties.form.city')}
          placeholder={t('properties.form.cityPlaceholder')}
          value={form.city}
          onChange={(e) => patch({ city: e.target.value })}
        />
        <Input
          label={t('properties.form.zip')}
          placeholder={t('properties.form.zipPlaceholder')}
          value={form.zip}
          inputMode="numeric"
          onChange={(e) => patch({ zip: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('properties.form.rooms')}
          value={form.rooms}
          inputMode="numeric"
          className="font-tabular"
          onChange={(e) => patch({ rooms: e.target.value.replace(/\D/g, '') })}
        />
        <Input
          label={t('properties.form.area')}
          value={form.area}
          inputMode="numeric"
          className="font-tabular"
          onChange={(e) => patch({ area: e.target.value.replace(/\D/g, '') })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('properties.form.rent')}
          placeholder="18 500"
          value={form.rent}
          error={errors.rent}
          inputMode="numeric"
          className="font-tabular"
          rightIcon={<span className="text-sm font-medium">Kč</span>}
          onChange={(e) => patch({ rent: e.target.value })}
        />
        <Select
          id="property-status"
          label={t('properties.form.status')}
          value={form.status}
          onValueChange={(v) => patch({ status: v as PropertyStatus })}
          options={statusOptions}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="property-notes"
          className="text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {t('properties.form.notes')}
        </label>
        <textarea
          id="property-notes"
          rows={2}
          value={form.notes}
          placeholder={t('properties.form.notesPlaceholder')}
          onChange={(e) => patch({ notes: e.target.value })}
          className={cn(
            'w-full resize-none rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900',
            'placeholder:text-surface-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:placeholder:text-surface-500',
          )}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={pending}>
          {isEdit ? t('properties.form.save') : t('properties.form.create')}
        </Button>
      </div>
    </form>
  )
}
