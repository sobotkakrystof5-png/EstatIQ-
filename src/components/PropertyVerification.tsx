/**
 * PropertyVerification — ČÚZK ownership verification widget (3-step flow).
 *
 * Step 1: Address search with debounced autocomplete suggestions from ČÚZK KN API.
 * Step 2: User selects the correct property from the results list.
 * Step 3: Verification result — verified ✓ / name mismatch / not found.
 *
 * Usage:
 *   <PropertyVerification propertyId="uuid" onVerified={(result) => { ... }} />
 *
 * Props:
 *   propertyId  — EstatIQ property UUID; when provided, a successful verification
 *                 also writes fresh cadastre data into the `properties` row.
 *   onVerified  — called with the VerificationResult when status becomes 'done'.
 *   className   — optional extra classes for the outer wrapper.
 */

import { useId, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, AlertCircle, Search, Building2, MapPin, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePropertyVerification } from '@/hooks/usePropertyVerification'
import type { CuzkAddressCandidate, VerificationResult } from '@/lib/cuzk'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PropertyVerificationProps {
  propertyId?: string
  onVerified?: (result: VerificationResult) => void
  className?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICON = {
  budova:   <Building2 className="h-4 w-4 shrink-0" />,
  parcela:  <MapPin    className="h-4 w-4 shrink-0" />,
  jednotka: <Home      className="h-4 w-4 shrink-0" />,
}

const stepVariants = {
  enter:  { opacity: 0, y: 8  },
  center: { opacity: 1, y: 0  },
  exit:   { opacity: 0, y: -8 },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerificationBadge({
  verified,
  confidence,
}: {
  verified: boolean
  confidence: 'exact' | 'fuzzy' | 'none'
}) {
  const { t } = useTranslation()

  if (verified && confidence === 'exact') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        {t('cuzk.result.confidence_exact')}
      </span>
    )
  }

  if (verified && confidence === 'fuzzy') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <CheckCircle2 className="h-4 w-4" />
        {t('cuzk.result.confidence_fuzzy')}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="h-4 w-4" />
      {t('cuzk.result.not_verified')}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PropertyVerification({
  propertyId,
  onVerified,
  className = '',
}: PropertyVerificationProps) {
  const { t } = useTranslation()
  const inputId = useId()

  const [address, setAddress] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { status, candidates, selectedCandidate, result, error, search, verify, reset } =
    usePropertyVerification()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Open dropdown when candidates arrive
  useEffect(() => {
    if (candidates.length > 0) setDropdownOpen(true)
    else setDropdownOpen(false)
  }, [candidates])

  // Notify parent when verification completes
  useEffect(() => {
    if (status === 'done' && result) onVerified?.(result)
  }, [status, result, onVerified])

  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setAddress(value)
    search(value)
  }

  function handleSelectCandidate(candidate: CuzkAddressCandidate) {
    setDropdownOpen(false)
    setAddress(candidate.address || candidate.label)
    verify(candidate, propertyId)
  }

  function handleReset() {
    setAddress('')
    reset()
  }

  const isSearching  = status === 'searching'
  const isVerifying  = status === 'verifying'
  const isDone       = status === 'done'
  const isError      = status === 'error'
  const showResult   = isDone || isError

  return (
    <div className={`w-full space-y-4 ${className}`}>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        {[1, 2, 3].map((step) => {
          const active =
            step === 1 ? !selectedCandidate :
            step === 2 ? !!selectedCandidate && !isDone :
                         isDone
          return (
            <span key={step} className="flex items-center gap-2">
              <span className={[
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
                active
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
              ].join(' ')}>
                {step}
              </span>
              <span className={active ? 'text-slate-700 dark:text-slate-300' : ''}>
                {t(`cuzk.steps.step${step}`)}
              </span>
              {step < 3 && <span>·</span>}
            </span>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1 + 2: Search + Candidates ── */}
        {!showResult && (
          <motion.div
            key="search-step"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Address search input */}
            <div className="relative">
              <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('cuzk.search.label')}
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  ref={inputRef}
                  id={inputId}
                  value={address}
                  onChange={handleAddressChange}
                  onFocus={() => candidates.length > 0 && setDropdownOpen(true)}
                  placeholder={t('cuzk.search.placeholder')}
                  disabled={isVerifying}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>

              {/* Autocomplete dropdown */}
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  {isSearching ? (
                    <div className="space-y-2 p-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : candidates.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {t('cuzk.search.no_results')}
                    </p>
                  ) : (
                    <ul role="listbox" aria-label={t('cuzk.search.select_property')}>
                      {candidates.map((c) => (
                        <li key={c.cuzkId}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => handleSelectCandidate(c)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                          >
                            <span className="mt-0.5 text-slate-400 dark:text-slate-500">
                              {TYPE_ICON[c.type]}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                {c.address || c.label}
                              </span>
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                {t(`cuzk.candidates.type_${c.type}`)}
                                {c.katastralniUzemi && ` · ${c.katastralniUzemi}`}
                                {c.propertyNumber && ` · č. ${c.propertyNumber}`}
                                {c.lv && ` · LV ${c.lv}`}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              {t('cuzk.candidates.select')}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Searching skeleton */}
            {isSearching && !dropdownOpen && (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            )}

            {/* Verifying state */}
            {isVerifying && selectedCandidate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-900/40 dark:bg-indigo-950/30"
              >
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600 dark:border-indigo-700 dark:border-t-indigo-400" />
                <span className="text-sm text-indigo-700 dark:text-indigo-300">
                  {t('cuzk.verify.verifying')}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Result ── */}
        {showResult && (
          <motion.div
            key="result-step"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Error state */}
            {isError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {t('cuzk.errors.generic')}
                  </p>
                  {error && (
                    <p className="mt-0.5 text-xs text-red-600/70 dark:text-red-400/70">{error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Verification result card */}
            {isDone && result && (
              <div className={[
                'rounded-xl border px-5 py-4',
                result.verified
                  ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20',
              ].join(' ')}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className={[
                      'font-semibold',
                      result.verified ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300',
                    ].join(' ')}>
                      {result.verified
                        ? t('cuzk.result.verified')
                        : result.allOwners.length === 0
                          ? t('cuzk.result.not_found')
                          : t('cuzk.result.name_mismatch')}
                    </p>
                    {result.matchedOwner && (
                      <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
                        {result.matchedOwner}
                      </p>
                    )}
                  </div>
                  <VerificationBadge verified={result.verified} confidence={result.confidence} />
                </div>

                {/* Show all owners on mismatch so user understands why it failed */}
                {!result.verified && result.allOwners.length > 0 && (
                  <div className="mt-3 border-t border-red-100 pt-3 dark:border-red-900/30">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-red-600/70 dark:text-red-400/70">
                      {t('cuzk.result.owners_found')}
                    </p>
                    <ul className="space-y-0.5">
                      {result.allOwners.map((name, i) => (
                        <li key={i} className="text-sm text-red-800 dark:text-red-300">
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Property detail summary */}
                {result.propertyDetail && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-current/10 pt-3 text-xs text-slate-500 dark:text-slate-400">
                    {result.propertyDetail.katastralniUzemi && (
                      <span>{t('cuzk.result.ku')}: {result.propertyDetail.katastralniUzemi}</span>
                    )}
                    {result.propertyDetail.lv && (
                      <span>LV {result.propertyDetail.lv}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Legal disclaimer */}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t('cuzk.result.legal_note')}
            </p>

            {/* Reset button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full"
            >
              {t('cuzk.reset')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
