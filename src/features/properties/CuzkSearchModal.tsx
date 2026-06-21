import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, ChevronRight, Loader2, MapPin, Search, TriangleAlert } from 'lucide-react'
import { Button, Input, Modal } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  fetchPropertyFromCuzk,
  ruianToDraftAddress,
  searchRuianAddress,
  type CuzkPropertyResult,
  type RuianCandidate,
} from './cuzk'

type Tab = 'address' | 'lv'

export interface CuzkAddressData {
  street: string
  city: string
  zip: string
  cadastre_ku?: string
  cadastre_ku_code?: string
  cadastre_lv?: string
  cadastre_parcel?: string
}

interface CuzkSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: CuzkAddressData) => void
}

export function CuzkSearchModal({ open, onOpenChange, onConfirm }: CuzkSearchModalProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('address')

  // Při zavření resetovat stav
  function handleOpenChange(next: boolean) {
    if (!next) setTab('address')
    onOpenChange(next)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={t('cuzk.modal.title')}
      description={t('cuzk.modal.description')}
      className="max-w-xl"
    >
      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
        {(['address', 'lv'] as Tab[]).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
              tab === id
                ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200',
            )}
          >
            {t(`cuzk.modal.tab.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'address' ? (
        <AddressTab onConfirm={onConfirm} onClose={() => handleOpenChange(false)} />
      ) : (
        <LvTab onConfirm={onConfirm} onClose={() => handleOpenChange(false)} />
      )}
    </Modal>
  )
}

// ── Záložka: vyhledání podle adresy ──────────────────────────────────────────

function AddressTab({
  onConfirm,
  onClose,
}: {
  onConfirm: (data: CuzkAddressData) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<RuianCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<RuianCandidate | null>(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (selected || !query.trim()) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await searchRuianAddress(query)
        setCandidates(results)
        setOpen(results.length > 0)
      } catch {
        setError(t('cuzk.error.ruianFailed'))
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selected, t])

  function handleSelect(c: RuianCandidate) {
    setSelected(c)
    setQuery(c.address)
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setCandidates([])
  }

  function handleConfirm() {
    if (!selected) return
    const addr = ruianToDraftAddress(selected)
    onConfirm({
      street: addr.street,
      city: addr.city,
      zip: addr.zip,
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          label={t('cuzk.modal.addressLabel')}
          placeholder={t('cuzk.modal.addressPlaceholder')}
          value={query}
          leftIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          autoFocus
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            if (selected) setSelected(null)
            if (!v.trim()) {
              setCandidates([])
              setOpen(false)
            }
          }}
        />

        {/* Dropdown kandidátů */}
        <AnimatePresence>
          {open && candidates.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-surface-200 bg-white py-1 shadow-modal dark:border-surface-700 dark:bg-surface-900"
            >
              {candidates.map((c, i) => (
                <li key={i}>
                  <button
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(c)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    <MapPin size={15} className="mt-0.5 shrink-0 text-surface-400" />
                    <span className="text-surface-800 dark:text-surface-200">{c.address}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Chyba */}
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert size={15} />
          {error}
        </p>
      )}

      {/* Náhled vybrané nemovitosti */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/60 dark:bg-emerald-900/20"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-800/40">
                <Building2 size={16} className="text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-surface-900 dark:text-surface-50">
                  {selected.attributes.StAddr || selected.address.split(',')[0]}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {selected.attributes.Postal} {selected.attributes.City}
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="mt-2 text-xs text-surface-400 underline-offset-2 hover:underline dark:text-surface-500"
            >
              {t('cuzk.modal.changeAddress')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          disabled={!selected}
          rightIcon={<ChevronRight size={16} />}
          onClick={handleConfirm}
        >
          {t('cuzk.modal.confirm')}
        </Button>
      </div>
    </div>
  )
}

// ── Záložka: vyhledání podle LV / parcelního čísla ───────────────────────────

function LvTab({
  onConfirm,
  onClose,
}: {
  onConfirm: (data: CuzkAddressData) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [kuCode, setKuCode] = useState('')
  const [lv, setLv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CuzkPropertyResult | null>(null)

  async function handleSearch() {
    const kuTrimmed = kuCode.trim()
    const lvTrimmed = lv.trim()
    if (!kuTrimmed || !lvTrimmed) return

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await fetchPropertyFromCuzk({ ku_code: kuTrimmed, lv: lvTrimmed })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cuzk.error.wsdpFailed'))
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (!result) return
    const parts = (result.address ?? '').split(',')
    onConfirm({
      street: parts[0]?.trim() ?? '',
      city: parts[1]?.trim() ?? '',
      zip: '',
      cadastre_ku: result.cadastre_ku ?? undefined,
      cadastre_ku_code: kuCode.trim() || undefined,
      cadastre_lv: result.cadastre_lv ?? undefined,
      cadastre_parcel: result.cadastre_parcel ?? undefined,
    })
    onClose()
  }

  const canSearch = kuCode.trim().length > 0 && lv.trim().length > 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">{t('cuzk.modal.lvHint')}</p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('cuzk.modal.kuCode')}
          placeholder="620985"
          value={kuCode}
          inputMode="numeric"
          autoFocus
          onChange={(e) => { setKuCode(e.target.value.replace(/\D/g, '')); setResult(null) }}
        />
        <Input
          label={t('cuzk.modal.lvNumber')}
          placeholder="42"
          value={lv}
          inputMode="numeric"
          onChange={(e) => { setLv(e.target.value.replace(/\D/g, '')); setResult(null) }}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        loading={loading}
        disabled={!canSearch}
        leftIcon={<Search size={16} />}
        onClick={() => void handleSearch()}
        className="w-full"
      >
        {t('cuzk.modal.search')}
      </Button>

      {/* Chyba */}
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert size={15} />
          {error}
        </p>
      )}

      {/* Výsledek */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/60 dark:bg-emerald-900/20"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-800/40">
                <Building2 size={16} className="text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                {result.address && (
                  <p className="font-medium text-surface-900 dark:text-surface-50">{result.address}</p>
                )}
                {result.cadastre_ku && (
                  <p className="text-sm text-surface-500">
                    {t('cuzk.detail.ku')}: {result.cadastre_ku}
                  </p>
                )}
                {result.cadastre_lv && (
                  <p className="text-sm text-surface-500">
                    {t('cuzk.detail.lv')}: {result.cadastre_lv}
                  </p>
                )}
                {result.area_m2 && (
                  <p className="text-sm text-surface-500">
                    {t('properties.detail.area')}: {result.area_m2} m²
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          disabled={!result}
          rightIcon={<ChevronRight size={16} />}
          onClick={handleConfirm}
        >
          {t('cuzk.modal.confirm')}
        </Button>
      </div>
    </div>
  )
}
