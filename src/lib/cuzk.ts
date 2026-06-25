/**
 * ČÚZK KN API — Czech Land Registry (Katastr Nemovitostí) client.
 *
 * Architecture: every call to the KN API goes through the `cuzk-property`
 * Edge Function, which holds CUZK_API_KEY server-side and enforces rate limits.
 * This module contains shared types and thin wrappers around that function.
 *
 * ČÚZK KN REST API base: https://api-kn.cuzk.gov.cz
 * Requires registration at https://registrace.cuzk.gov.cz to obtain an API key.
 * Swagger spec available at /swagger after login.
 *
 * ⚠ Legal note: The free KN REST API returns raw structured data. It is not a
 *   legally signed výpis z katastru. For court/notary use, obtain a signed výpis
 *   via the paid ČÚZK WSDP service (https://wsdptrial.cuzk.gov.cz).
 *
 * Glossary:
 *   LV  — List vlastnictví: the ownership ledger tying a property to its owners.
 *   KÚ  — Katastrální území: cadastral district (sub-municipal registry unit).
 *   SJM — Společné jmění manželů: matrimonial co-ownership (appears as one entry).
 */

import { supabase } from '@/lib/supabase'

// ── Shared types ──────────────────────────────────────────────────────────────

/**
 * The three entity types in the Czech Land Registry:
 * - budova:   building (dům, bytový dům, nebytový objekt)
 * - parcela:  land parcel (pozemek)
 * - jednotka: apartment unit within a budova (byt, nebytový prostor)
 */
export type CuzkPropertyType = 'budova' | 'parcela' | 'jednotka'

/** A candidate property returned from the address search step. */
export interface CuzkAddressCandidate {
  /** ČÚZK internal numeric ID for the object (used in detail lookup). */
  cuzkId: string
  type: CuzkPropertyType
  /** Human-readable label for the autocomplete dropdown. */
  label: string
  address: string
  katastralniUzemi: string
  /** Numeric code of the katastrální území — required for LV queries. */
  kuCode: string
  /** Parcel number or house/unit number displayed alongside the address. */
  propertyNumber: string
  /** LV number if already known from the search response (may be null). */
  lv: string | null
}

/**
 * A single entry from the list vlastnictví (LV).
 * SJM entries appear as one combined string (e.g. "Jan Novák, Jana Nováková").
 */
export interface CuzkOwner {
  name: string
  /** Ownership fraction, e.g. "1/2". SJM typically shows "1/1". */
  share: string
}

export interface CuzkPropertyDetail {
  cuzkId: string
  type: CuzkPropertyType
  address: string
  katastralniUzemi: string
  kuCode: string
  /** Číslo listu vlastnictví; null when the property has no LV (state-owned land, etc.). */
  lv: string | null
  owners: CuzkOwner[]
  /** Zástavy a věcná břemena as free-text strings. */
  encumbrances: string[]
}

export type VerificationConfidence = 'exact' | 'fuzzy' | 'none'
export type VerificationStatus = 'verified' | 'not_found' | 'name_mismatch' | 'error'

export interface VerificationResult {
  verified: boolean
  confidence: VerificationConfidence
  /** The matched owner name as stored in ČÚZK — shown only to the requesting user. */
  matchedOwner: string | null
  /** All owner names from ČÚZK for this property (transient — not persisted in DB). */
  allOwners: string[]
  propertyDetail: CuzkPropertyDetail | null
  /** UUID of the `property_verifications` row created by this call. */
  verificationId: string | null
}

// ── Edge Function request shapes ──────────────────────────────────────────────

interface CuzkSearchRequest {
  action: 'search'
  address: string
}

interface CuzkVerifyRequest {
  action: 'verify'
  cuzkId: string
  type: CuzkPropertyType
  /** EstatIQ property UUID to link the verification record and update cadastre fields. */
  propertyId?: string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const EDGE_FN_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cuzk-property`

async function callEdgeFn<T>(
  body: CuzkSearchRequest | CuzkVerifyRequest,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Uživatel není přihlášen')

  const res = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? `Chyba serveru (${res.status})`)
  }

  return data as T
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search for properties by address text. Calls the ČÚZK KN API server-side.
 * Returns up to 15 candidates across budova / parcela / jednotka types.
 *
 * Requires CUZK_API_KEY to be configured in Supabase Secrets. Returns an
 * empty array (not an error) when no results match.
 */
export async function searchByAddress(
  address: string,
): Promise<CuzkAddressCandidate[]> {
  if (address.trim().length < 4) return []
  return callEdgeFn<CuzkAddressCandidate[]>({ action: 'search', address })
}

/**
 * Fetch the ownership record for a specific ČÚZK property and compare it
 * against the logged-in user's full name (from their EstatIQ profile).
 *
 * Rate-limited to 10 calls per user per hour (enforced in the Edge Function).
 *
 * If `propertyId` is provided and the verification succeeds, the matching
 * `properties` row is updated with the fresh cadastre data from ČÚZK.
 */
export async function getPropertyOwners(
  unitId: string,
  type: CuzkPropertyType,
): Promise<CuzkOwner[]> {
  const result = await callEdgeFn<VerificationResult>({
    action: 'verify',
    cuzkId: unitId,
    type,
  })
  return result.propertyDetail?.owners ?? []
}

/**
 * Full ownership verification: fetch owners + match against user's profile name.
 * This is the primary function used by `usePropertyVerification`.
 */
export async function verifyOwnership(
  cuzkId: string,
  type: CuzkPropertyType,
  propertyId?: string,
): Promise<VerificationResult> {
  return callEdgeFn<VerificationResult>({
    action: 'verify',
    cuzkId,
    type,
    propertyId,
  })
}
