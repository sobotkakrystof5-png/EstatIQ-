/**
 * usePropertyVerification — state machine for ČÚZK ownership verification flow.
 *
 * Step flow:
 *   idle → searching (address search) → idle (candidates ready, user picks one)
 *        → verifying (ownership call)  → done | error
 *
 * The hook tracks the address search and the verification call separately so
 * the UI can show granular loading states for each.
 */

import { useCallback, useRef, useState } from 'react'
import {
  searchByAddress,
  verifyOwnership,
  type CuzkAddressCandidate,
  type VerificationResult,
} from '@/lib/cuzk'

export type VerificationStep = 'idle' | 'searching' | 'verifying' | 'done' | 'error'

export interface UsePropertyVerificationReturn {
  /** Current step in the verification flow. */
  status: VerificationStep
  /** Autocomplete candidates from the last address search. */
  candidates: CuzkAddressCandidate[]
  /** The candidate the user selected before verification started. */
  selectedCandidate: CuzkAddressCandidate | null
  /** Verification outcome — available when status === 'done'. */
  result: VerificationResult | null
  /** Error message — available when status === 'error'. */
  error: string | null
  /** Trigger a debounced address search (300 ms). */
  search: (address: string) => void
  /** Verify ownership for the given candidate. Pass `propertyId` to link the result. */
  verify: (candidate: CuzkAddressCandidate, propertyId?: string) => Promise<void>
  /** Reset the hook to its initial state. */
  reset: () => void
}

const DEBOUNCE_MS = 300

export function usePropertyVerification(): UsePropertyVerificationReturn {
  const [status, setStatus] = useState<VerificationStep>('idle')
  const [candidates, setCandidates] = useState<CuzkAddressCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<CuzkAddressCandidate | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks in-flight search so stale responses are discarded
  const searchTokenRef = useRef(0)

  const search = useCallback((address: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (address.trim().length < 4) {
      setCandidates([])
      setStatus('idle')
      return
    }

    debounceRef.current = setTimeout(async () => {
      const token = ++searchTokenRef.current

      setStatus('searching')
      setError(null)

      try {
        const results = await searchByAddress(address)
        if (token !== searchTokenRef.current) return  // stale response — discard

        setCandidates(results)
        setStatus('idle')
      } catch (e) {
        if (token !== searchTokenRef.current) return
        setError(e instanceof Error ? e.message : 'Vyhledávání selhalo')
        setCandidates([])
        setStatus('error')
      }
    }, DEBOUNCE_MS)
  }, [])

  const verify = useCallback(async (
    candidate: CuzkAddressCandidate,
    propertyId?: string,
  ): Promise<void> => {
    setStatus('verifying')
    setSelectedCandidate(candidate)
    setResult(null)
    setError(null)

    try {
      const res = await verifyOwnership(candidate.cuzkId, candidate.type, propertyId)
      setResult(res)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ověření selhalo')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    searchTokenRef.current++
    setStatus('idle')
    setCandidates([])
    setSelectedCandidate(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    status,
    candidates,
    selectedCandidate,
    result,
    error,
    search,
    verify,
    reset,
  }
}
