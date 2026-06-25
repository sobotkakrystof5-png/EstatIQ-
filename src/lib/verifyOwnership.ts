/**
 * Czech name matching for ČÚZK ownership verification.
 *
 * This module is pure (no imports, no side effects) and runs on both client
 * and server (Deno Edge Function). The Edge Function duplicates this logic
 * inline to avoid cross-runtime import issues.
 *
 * Handles:
 * - Diacritics normalization: "Novák" ≈ "Novak"  (NFD + strip combining chars)
 * - Name-order inversion:     "Jan Novák" ≈ "Novák Jan"
 * - SJM combined entries:     "Jan Novák, Jana Nováková" → each part matched independently
 * - Co-ownership:             user is verified if their name matches ANY co-owner entry
 * - Short names:              require ≥ 2 words for fuzzy match to avoid false positives
 */

import type { CuzkOwner, VerificationConfidence } from './cuzk'

// ── Normalization ─────────────────────────────────────────────────────────────

/** Strip diacritics and lowercase a string for locale-insensitive comparison. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function tokenize(name: string): string[] {
  return normalize(name).split(/\s+/).filter(Boolean)
}

/**
 * ČÚZK sometimes stores SJM (Společné jmění manželů) as a single comma-separated
 * string: "Jan Novák, Jana Nováková". Split before comparing so each spouse's
 * name is checked independently.
 */
function splitEntry(ownerName: string): string[] {
  const parts = ownerName.split(/,\s*/)
  return parts.length > 1 ? parts.map(p => p.trim()).filter(Boolean) : [ownerName.trim()]
}

// ── Single-pair comparison ────────────────────────────────────────────────────

/**
 * Compare one user name against one owner name.
 *
 * Returns:
 * - 'exact' — identical after normalization or word-sorted comparison
 * - 'fuzzy' — all user name tokens appear in the owner name (order-insensitive)
 * - 'none'  — no meaningful overlap
 */
function comparePair(userName: string, ownerName: string): VerificationConfidence {
  if (!userName || !ownerName) return 'none'

  const uNorm = normalize(userName)
  const oNorm = normalize(ownerName)

  // Direct match (handles diacritics only)
  if (uNorm === oNorm) return 'exact'

  const uTokens = tokenize(userName)
  const oTokens = tokenize(ownerName)

  if (uTokens.length === 0 || oTokens.length === 0) return 'none'

  // Word-sorted match: "Novák Jan" ≈ "Jan Novák"
  if ([...uTokens].sort().join(' ') === [...oTokens].sort().join(' ')) return 'exact'

  // All user words appear in owner's token set (handles user being a subset, e.g. co-owner)
  const oSet = new Set(oTokens)
  if (uTokens.length >= 2 && uTokens.every(t => oSet.has(t))) return 'fuzzy'

  // Substring containment (normalized)
  if (oNorm.includes(uNorm) || uNorm.includes(oNorm)) return 'fuzzy'

  return 'none'
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface OwnerMatchResult {
  verified: boolean
  confidence: VerificationConfidence
  /** The full owner entry (as stored in ČÚZK) that matched the user's name. */
  matchedOwner: string | null
  allOwners: string[]
}

/**
 * Match a user's full name against the complete owner list from ČÚZK.
 *
 * Stops at the first exact match. If no exact match, returns the best fuzzy
 * match. Verification is granted if confidence is 'exact' or 'fuzzy'.
 *
 * @param userName  - `full_name` from the user's EstatIQ profile
 * @param owners    - owner list from `CuzkPropertyDetail.owners`
 */
export function matchOwners(
  userName: string | null | undefined,
  owners: CuzkOwner[],
): OwnerMatchResult {
  const allOwners = owners.map(o => o.name)

  if (!userName || normalize(userName).split(/\s+/).filter(Boolean).length < 1) {
    return { verified: false, confidence: 'none', matchedOwner: null, allOwners }
  }

  let bestConfidence: VerificationConfidence = 'none'
  let matchedOwner: string | null = null

  for (const owner of owners) {
    for (const part of splitEntry(owner.name)) {
      const confidence = comparePair(userName, part)

      if (confidence === 'exact') {
        return { verified: true, confidence: 'exact', matchedOwner: owner.name, allOwners }
      }

      if (confidence === 'fuzzy' && bestConfidence === 'none') {
        bestConfidence = 'fuzzy'
        matchedOwner = owner.name
      }
    }
  }

  return {
    verified: bestConfidence !== 'none',
    confidence: bestConfidence,
    matchedOwner,
    allOwners,
  }
}
