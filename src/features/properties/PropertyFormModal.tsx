import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, PenLine, Search } from 'lucide-react'
import { Button, Input, Modal, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { PropertyStatus, PropertyType, PropertyWithStats } from '@/types/database'
import { useCreateProperty, useUpdateProperty } from './hooks'
import type { PropertyDraft } from './data'
import type { CuzkAddressData } from './CuzkSearchModal'
import { CuzkSearchModal } from './CuzkSearchModal'

// ── Typy a konstanty ─────────────────────────────────────────────────────────

type ModalTab = 'manual' | 'ai' | 'cuzk'
type AiSubTab = 'describe' | 'copy'

interface FormState {
  // 3.1 Základní
  name: string
  property_type: PropertyType
  street: string
  city: string
  zip: string
  region: string
  area: string
  disposition: string
  // 3.2 Hodnota
  purchase_price: string
  market_value: string
  // 3.3 Typologie
  ownership_type: string
  construction_type: string
  heating_type: string
  // 3.4 Umístění
  unit_number: string
  floor: string
  total_floors: string
  basement_floors: string
  // 3.5 Vybavení
  equipment: string[]
  // 3.6 Energie
  gas_eic_code: string
  electricity_ean_code: string
  // 3.7 Pojištění
  insurance_policy_number: string
  insurance_annual_premium: string
  insurance_note: string
  // Ostatní
  rent: string
  status: PropertyStatus
  notes: string
}

const EMPTY: FormState = {
  name: '', property_type: 'byt', street: '', city: '', zip: '', region: '',
  area: '', disposition: '',
  purchase_price: '', market_value: '',
  ownership_type: '', construction_type: '', heating_type: '',
  unit_number: '', floor: '', total_floors: '', basement_floors: '',
  equipment: [],
  gas_eic_code: '', electricity_ean_code: '',
  insurance_policy_number: '', insurance_annual_premium: '', insurance_note: '',
  rent: '', status: 'vacant', notes: '',
}

const EQUIPMENT_OPTIONS = [
  'elevator', 'parking', 'garage', 'balcony', 'loggia', 'terrace', 'cellar',
] as const

function fromProperty(p: PropertyWithStats): FormState {
  return {
    name: p.name,
    property_type: p.property_type ?? 'byt',
    street: p.address_street,
    city: p.address_city,
    zip: p.address_zip,
    region: p.region ?? '',
    area: p.floor_area_m2 != null ? String(p.floor_area_m2) : '',
    disposition: p.disposition ?? '',
    purchase_price: p.purchase_price != null ? String(p.purchase_price) : '',
    market_value: p.market_value != null ? String(p.market_value) : '',
    ownership_type: p.ownership_type ?? '',
    construction_type: p.construction_type ?? '',
    heating_type: p.heating_type ?? '',
    unit_number: p.unit_number ?? '',
    floor: p.floor != null ? String(p.floor) : '',
    total_floors: p.total_floors != null ? String(p.total_floors) : '',
    basement_floors: p.basement_floors != null ? String(p.basement_floors) : '',
    equipment: p.equipment ?? [],
    gas_eic_code: p.gas_eic_code ?? '',
    electricity_ean_code: p.electricity_ean_code ?? '',
    insurance_policy_number: p.insurance_policy_number ?? '',
    insurance_annual_premium: p.insurance_annual_premium != null ? String(p.insurance_annual_premium) : '',
    insurance_note: p.insurance_note ?? '',
    rent: String(p.monthly_rent),
    status: p.status === 'archived' ? 'vacant' : p.status,
    notes: p.notes ?? '',
  }
}

// ── Props ────────────────────────────────────────────────────────────────────

interface PropertyFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: PropertyWithStats
  initialAddress?: CuzkAddressData
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

export function PropertyFormModal({ open, onOpenChange, property, initialAddress }: PropertyFormModalProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(property)
  const [modalTab, setModalTab] = useState<ModalTab>(initialAddress ? 'cuzk' : 'manual')
  const [cuzkOpen, setCuzkOpen] = useState(false)
  const [pendingAddress, setPendingAddress] = useState<CuzkAddressData | undefined>(initialAddress)

  function handleCuzkConfirm(data: CuzkAddressData) {
    setPendingAddress(data)
    setModalTab('manual')
    setCuzkOpen(false)
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(v) => { if (!v) setPendingAddress(undefined); onOpenChange(v) }}
        title={isEdit ? t('properties.form.editTitle') : t('properties.form.createTitle')}
        description={isEdit ? t('properties.form.editSubtitle') : t('properties.form.createSubtitle')}
        className="max-w-2xl"
      >
        {!isEdit && (
          <div className="mb-5 flex gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
            {([
              { id: 'ai' as ModalTab, icon: Sparkles, label: t('properties.form.tabAi') },
              { id: 'manual' as ModalTab, icon: PenLine, label: t('properties.form.tabManual') },
              { id: 'cuzk' as ModalTab, icon: Search, label: t('properties.form.tabCuzk') },
            ] as { id: ModalTab; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => id === 'cuzk' ? setCuzkOpen(true) : setModalTab(id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  modalTab === id && id !== 'cuzk'
                    ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                    : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200',
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {modalTab === 'ai' && !isEdit ? (
          <AiTab onUseDraft={(draft) => {
            setPendingAddress({
              street: draft.address_street ?? '',
              city: draft.address_city ?? '',
              zip: draft.address_zip ?? '',
            })
            setModalTab('manual')
          }} />
        ) : (
          <PropertyForm
            property={property}
            initialAddress={pendingAddress}
            onClose={() => { setPendingAddress(undefined); onOpenChange(false) }}
          />
        )}
      </Modal>

      <CuzkSearchModal
        open={cuzkOpen}
        onOpenChange={setCuzkOpen}
        onConfirm={handleCuzkConfirm}
      />
    </>
  )
}

// ── AI záložka ─────────────────────────────────────────────────────────────────

function AiTab({ onUseDraft }: { onUseDraft: (d: Partial<PropertyDraft>) => void }) {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<AiSubTab>('describe')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!description.trim()) return
    setLoading(true)
    // TODO(fáze 2): Edge Function property-ai-draft
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    onUseDraft({})
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
        {(['describe', 'copy'] as AiSubTab[]).map((id) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
              subTab === id
                ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                : 'text-surface-500 hover:text-surface-700 dark:text-surface-400',
            )}
          >
            {t(`properties.form.aiSubTab.${id}`)}
          </button>
        ))}
      </div>

      {subTab === 'describe' ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {t('properties.form.aiDescribeLabel')}
            </label>
            <textarea
              rows={4}
              value={description}
              placeholder={t('properties.form.aiDescribePlaceholder')}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                'w-full resize-none rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm',
                'placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                'dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:placeholder:text-surface-500',
              )}
            />
          </div>

          <div className="rounded-xl bg-surface-50 p-4 text-sm text-surface-500 dark:bg-surface-900 dark:text-surface-400">
            <span className="font-medium text-surface-700 dark:text-surface-300">{t('properties.form.aiWillFill')}</span>{' '}
            {t('properties.form.aiWillFillDesc')}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              leftIcon={<Sparkles size={16} />}
              loading={loading}
              disabled={!description.trim()}
              onClick={() => void handleGenerate()}
            >
              {t('properties.form.aiGenerate')}
            </Button>
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-sm text-surface-400">
          {/* TODO(fáze 2): kopírovat existující nemovitost */}
          {t('properties.form.aiCopyComingSoon')}
        </div>
      )}
    </div>
  )
}

// ── Hlavní formulář ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 first:mt-0">
      {label}
    </p>
  )
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map(({ key, label }) => (
        <label
          key={key}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
            value.includes(key)
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'border-surface-200 text-surface-600 hover:border-surface-300 dark:border-surface-700 dark:text-surface-400',
          )}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={value.includes(key)}
            onChange={() => toggle(key)}
          />
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
              value.includes(key)
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-surface-300 dark:border-surface-600',
            )}
          >
            {value.includes(key) && (
              <svg viewBox="0 0 12 10" className="h-2.5 w-2.5 fill-white">
                <path d="M1 5l3 4L11 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {label}
        </label>
      ))}
    </div>
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
      return { ...EMPTY, street: initialAddress.street, city: initialAddress.city, zip: initialAddress.zip }
    }
    return EMPTY
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function patch(p: Partial<FormState>) { setForm((f) => ({ ...f, ...p })) }

  const propertyTypeOptions = (
    ['byt', 'dum', 'pozemek', 'komercni_prostor', 'garaz', 'kancelar', 'sklad', 'jine'] as PropertyType[]
  ).map((v) => ({ value: v, label: t(`properties.type.${v}`) }))

  const statusOptions = (['active', 'vacant', 'maintenance'] as const).map((s) => ({
    value: s, label: t(`properties.status.${s}`),
  }))

  const ownershipOptions = [
    { value: '', label: t('properties.form.selectType') },
    ...(['personal', 'cooperative', 'state', 'svj', 'other'] as const).map((v) => ({
      value: v, label: t(`properties.ownership.${v}`),
    })),
  ]

  const constructionOptions = [
    { value: '', label: t('properties.form.selectType') },
    ...(['panel', 'brick', 'timber', 'concrete', 'other'] as const).map((v) => ({
      value: v, label: t(`properties.construction.${v}`),
    })),
  ]

  const heatingOptions = [
    { value: '', label: t('properties.form.selectType') },
    ...(['central', 'floor', 'electric', 'gas', 'heat_pump', 'fireplace', 'other'] as const).map((v) => ({
      value: v, label: t(`properties.heating.${v}`),
    })),
  ]

  const equipmentItems = EQUIPMENT_OPTIONS.map((k) => ({ key: k, label: t(`properties.equipment.${k}`) }))

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = t('properties.form.nameRequired')
    if (!form.rent.replace(/\D/g, '')) next.rent = t('properties.form.rentRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    const draft: PropertyDraft = {
      name: form.name.trim(),
      property_type: form.property_type,
      address_street: form.street.trim(),
      address_city: form.city.trim(),
      address_zip: form.zip.trim(),
      region: form.region.trim() || null,
      rooms: null,
      floor_area_m2: form.area ? Number(form.area) : null,
      disposition: form.disposition.trim() || null,
      purchase_price: form.purchase_price ? Number(form.purchase_price.replace(/\D/g, '')) : null,
      market_value: form.market_value ? Number(form.market_value.replace(/\D/g, '')) : null,
      ownership_type: form.ownership_type || null,
      construction_type: form.construction_type || null,
      heating_type: form.heating_type || null,
      unit_number: form.unit_number.trim() || null,
      floor: form.floor ? Number(form.floor) : null,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      basement_floors: form.basement_floors ? Number(form.basement_floors) : null,
      equipment: form.equipment,
      gas_eic_code: form.gas_eic_code.trim() || null,
      electricity_ean_code: form.electricity_ean_code.trim() || null,
      insurance_policy_number: form.insurance_policy_number.trim() || null,
      insurance_annual_premium: form.insurance_annual_premium ? Number(form.insurance_annual_premium.replace(/\D/g, '')) : null,
      insurance_note: form.insurance_note.trim() || null,
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
    <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-1 space-y-1" noValidate>

      {/* 3.1 Základní údaje */}
      <SectionLabel label={t('properties.form.sectionBasic')} />
      <Input
        label={t('properties.form.name')}
        placeholder={t('properties.form.namePlaceholder')}
        value={form.name}
        error={errors.name}
        autoFocus
        onChange={(e) => patch({ name: e.target.value })}
      />
      <Select
        id="property-type"
        label={t('properties.form.propertyType')}
        value={form.property_type}
        onValueChange={(v) => patch({ property_type: v as PropertyType })}
        options={propertyTypeOptions}
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
          label={t('properties.form.region')}
          placeholder={t('properties.form.regionPlaceholder')}
          value={form.region}
          onChange={(e) => patch({ region: e.target.value })}
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
          label={t('properties.form.disposition')}
          placeholder="2+kk"
          value={form.disposition}
          onChange={(e) => patch({ disposition: e.target.value })}
        />
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
      </div>

      {/* 3.2 Hodnota nemovitosti */}
      <SectionLabel label={t('properties.form.sectionValue')} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('properties.form.purchasePrice')}
          value={form.purchase_price}
          inputMode="numeric"
          className="font-tabular"
          rightIcon={<span className="text-sm font-medium">Kč</span>}
          onChange={(e) => patch({ purchase_price: e.target.value })}
        />
        <Input
          label={t('properties.form.marketValue')}
          value={form.market_value}
          inputMode="numeric"
          className="font-tabular"
          rightIcon={<span className="text-sm font-medium">Kč</span>}
          onChange={(e) => patch({ market_value: e.target.value })}
        />
      </div>

      {/* 3.3 Typologie */}
      <SectionLabel label={t('properties.form.sectionTypology')} />
      <div className="grid grid-cols-3 gap-3">
        <Select
          id="ownership-type"
          label={t('properties.form.ownershipType')}
          value={form.ownership_type}
          onValueChange={(v) => patch({ ownership_type: v })}
          options={ownershipOptions}
        />
        <Select
          id="construction-type"
          label={t('properties.form.constructionType')}
          value={form.construction_type}
          onValueChange={(v) => patch({ construction_type: v })}
          options={constructionOptions}
        />
        <Select
          id="heating-type"
          label={t('properties.form.heatingType')}
          value={form.heating_type}
          onValueChange={(v) => patch({ heating_type: v })}
          options={heatingOptions}
        />
      </div>

      {/* 3.4 Umístění v domě */}
      <SectionLabel label={t('properties.form.sectionLocation')} />
      <div className="grid grid-cols-4 gap-3">
        <Input
          label={t('properties.form.unitNumber')}
          placeholder="12"
          value={form.unit_number}
          onChange={(e) => patch({ unit_number: e.target.value })}
        />
        <Input
          label={t('properties.form.floor')}
          value={form.floor}
          inputMode="numeric"
          className="font-tabular"
          onChange={(e) => patch({ floor: e.target.value.replace(/[^0-9-]/g, '') })}
        />
        <Input
          label={t('properties.form.totalFloors')}
          value={form.total_floors}
          inputMode="numeric"
          className="font-tabular"
          onChange={(e) => patch({ total_floors: e.target.value.replace(/\D/g, '') })}
        />
        <Input
          label={t('properties.form.basementFloors')}
          value={form.basement_floors}
          inputMode="numeric"
          className="font-tabular"
          onChange={(e) => patch({ basement_floors: e.target.value.replace(/\D/g, '') })}
        />
      </div>

      {/* 3.5 Vybavení */}
      <SectionLabel label={t('properties.form.sectionEquipment')} />
      <CheckboxGroup
        options={equipmentItems}
        value={form.equipment}
        onChange={(eq) => patch({ equipment: eq })}
      />

      {/* 3.6 Energie a měřidla */}
      <SectionLabel label={t('properties.form.sectionEnergy')} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('properties.form.gasEicCode')}
          placeholder="27ZG000000000001Q"
          value={form.gas_eic_code}
          onChange={(e) => patch({ gas_eic_code: e.target.value })}
        />
        <Input
          label={t('properties.form.electricityEanCode')}
          placeholder="8591824000001"
          value={form.electricity_ean_code}
          onChange={(e) => patch({ electricity_ean_code: e.target.value })}
        />
      </div>

      {/* 3.7 Pojištění */}
      <SectionLabel label={t('properties.form.sectionInsurance')} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('properties.form.insurancePolicyNumber')}
          value={form.insurance_policy_number}
          onChange={(e) => patch({ insurance_policy_number: e.target.value })}
        />
        <Input
          label={t('properties.form.insuranceAnnualPremium')}
          value={form.insurance_annual_premium}
          inputMode="numeric"
          className="font-tabular"
          rightIcon={<span className="text-sm font-medium">Kč</span>}
          onChange={(e) => patch({ insurance_annual_premium: e.target.value })}
        />
      </div>
      <Input
        label={t('properties.form.insuranceNote')}
        placeholder={t('properties.form.insuranceNotePlaceholder')}
        value={form.insurance_note}
        onChange={(e) => patch({ insurance_note: e.target.value })}
      />

      {/* 3.8 Poznámky */}
      <SectionLabel label={t('properties.form.sectionNotes')} />
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

      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-surface-100 bg-white pt-4 dark:border-surface-800 dark:bg-surface-950">
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
