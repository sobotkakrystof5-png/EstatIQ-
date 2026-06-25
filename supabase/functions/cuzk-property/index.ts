/**
 * cuzk-property — ČÚZK KN REST API proxy + ownership verification
 *
 * Routes (all POST):
 *   { action: 'search', address }               → full-text property search in KN API
 *   { action: 'verify', cuzkId, type, propertyId? } → fetch owners, match profile name, persist result
 *
 * Required Supabase Secrets (set via `supabase secrets set KEY=value`):
 *   CUZK_API_KEY — API key from https://api-kn.cuzk.gov.cz registration
 *
 * Auto-injected by Supabase Edge runtime:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * ── ČÚZK KN API endpoint notes ──────────────────────────────────────────────
 * Base URL: https://api-kn.cuzk.gov.cz
 * Auth:     ApiKey header (value from CUZK_API_KEY)
 * Spec:     https://api-kn.cuzk.gov.cz/swagger (requires login)
 *
 * Endpoint paths used here follow the confirmed pattern /Jednotka/Vyhledani and
 * the standard Czech cadastre naming conventions (Parcela, Budova, Jednotka).
 * Response field names (own naming from ČÚZK) are inferred and annotated below.
 * Verify all paths and field names against the live Swagger spec before go-live.
 *
 * Known confirmed: /Jednotka/Vyhledani (documented in API landing page)
 * Assumed by pattern: /Parcela/Vyhledani, /Budova/Vyhledani, /{Type}/{id}
 *
 * ── Legal ────────────────────────────────────────────────────────────────────
 * The free KN REST API provides raw structured data only. It is NOT a signed
 * výpis z katastru nemovitostí. For legal-grade evidence use the paid ČÚZK WSDP
 * service (https://wsdptrial.cuzk.gov.cz).
 *
 * ── GDPR ─────────────────────────────────────────────────────────────────────
 * Owner names from ČÚZK are stored only in `property_verifications.matched_owner`
 * which is protected by RLS (user sees only their own row). The full allOwners
 * array is returned transiently in the API response but not persisted.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS: string[] = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://estat-iq.vercel.app,http://localhost:5173,http://localhost:3000'
).split(',').map((s) => s.trim()).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(body: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

// ── KN API helpers ────────────────────────────────────────────────────────────

const KN_BASE = 'https://api-kn.cuzk.gov.cz'

async function knGet<T>(path: string, apiKey: string): Promise<T | null> {
  const res = await fetch(`${KN_BASE}${path}`, {
    headers: {
      'ApiKey': apiKey,
      'Accept': 'application/json',
    },
  })

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`KN API ${res.status}: ${text.slice(0, 300)}`)
  }

  return res.json() as Promise<T>
}

// ── KN API response types ─────────────────────────────────────────────────────
// Field names are ČÚZK's own Czech naming — verify against live Swagger spec.

interface KnSubject {
  /** Legal entity name or natural person's full name */
  nazev?: string
  /** First name (natural persons — may appear instead of nazev) */
  jmeno?: string
  /** Surname (natural persons — may appear instead of nazev) */
  prijmeni?: string
}

interface KnOwnerEntry {
  opravnenySubjekt?: KnSubject
  /** Fractional share as object */
  podil?: { citatel?: number; jmenovatel?: number } | null
  /** Fractional share as pre-formatted string (alternative field) */
  podilText?: string
}

interface KnAddress {
  textovaAdresa?: string
}

interface KnKatastralni {
  kod?: number | string
  nazev?: string
}

interface KnLv {
  cisloLv?: number | string
  /** Owners attached to this LV entry */
  vlastnici?: KnOwnerEntry[]
  /** Encumbrances/liens in text form */
  zavady?: string[]
}

interface KnPropertyBase {
  id?: number | string
  parcelniCislo?: string       // parcela
  cisloDomovni?: number | string // budova
  cisloJednotky?: string       // jednotka
  adresa?: KnAddress
  katastralniUzemi?: KnKatastralni
  listyVlastnictvi?: KnLv[]
  /** Owners may appear directly on the object (alternate structure) */
  vlastnici?: KnOwnerEntry[]
  zavady?: string[]
}

interface KnDetailResponse {
  data?: KnPropertyBase
}

interface KnSearchResponse {
  data?: KnPropertyBase[]
}

// ── Response parsers ──────────────────────────────────────────────────────────

function parseOwnerName(entry: KnOwnerEntry): string {
  const s = entry.opravnenySubjekt
  if (!s) return ''
  if (s.nazev) return s.nazev
  // Natural persons may be split into jmeno + prijmeni
  const parts = [s.jmeno, s.prijmeni].filter(Boolean)
  return parts.join(' ')
}

function parseShare(entry: KnOwnerEntry): string {
  if (entry.podilText) return entry.podilText
  const p = entry.podil
  if (p?.citatel != null && p?.jmenovatel != null) return `${p.citatel}/${p.jmenovatel}`
  return '?'
}

function extractOwners(obj: KnPropertyBase): Array<{ name: string; share: string }> {
  const entries: KnOwnerEntry[] = []

  // Owners may live directly on the object or nested per LV
  if (Array.isArray(obj.vlastnici)) {
    entries.push(...obj.vlastnici)
  }
  if (Array.isArray(obj.listyVlastnictvi)) {
    for (const lv of obj.listyVlastnictvi) {
      if (Array.isArray(lv.vlastnici)) entries.push(...lv.vlastnici)
    }
  }

  return entries
    .map(e => ({ name: parseOwnerName(e), share: parseShare(e) }))
    .filter(o => o.name.length > 0)
}

function extractEncumbrances(obj: KnPropertyBase): string[] {
  const out: string[] = []
  if (Array.isArray(obj.zavady)) {
    out.push(...obj.zavady.filter((z): z is string => typeof z === 'string'))
  }
  if (Array.isArray(obj.listyVlastnictvi)) {
    for (const lv of obj.listyVlastnictvi) {
      if (Array.isArray(lv.zavady)) {
        out.push(...lv.zavady.filter((z): z is string => typeof z === 'string'))
      }
    }
  }
  return out
}

function extractLv(obj: KnPropertyBase): string | null {
  const first = obj.listyVlastnictvi?.[0]
  if (first?.cisloLv != null) return String(first.cisloLv)
  return null
}

function buildCandidate(
  item: KnPropertyBase,
  type: 'budova' | 'parcela' | 'jednotka',
) {
  const kuCode = String(item.katastralniUzemi?.kod ?? '')
  const kuName = item.katastralniUzemi?.nazev ?? ''
  const propertyNumber =
    item.parcelniCislo ?? item.cisloJednotky ?? String(item.cisloDomovni ?? '')
  const address = item.adresa?.textovaAdresa ?? ''
  const lv = extractLv(item)
  const typeLabel = { budova: 'budova', parcela: 'parcela', jednotka: 'jednotka' }[type]

  return {
    cuzkId: String(item.id ?? ''),
    type,
    label: [address, kuName && `(${kuName}, ${typeLabel})`].filter(Boolean).join(' '),
    address,
    katastralniUzemi: kuName,
    kuCode,
    propertyNumber,
    lv,
  }
}

// ── Name matching (duplicated from src/lib/verifyOwnership.ts for Deno compat) ─

type Confidence = 'exact' | 'fuzzy' | 'none'

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

function comparePair(userName: string, ownerName: string): Confidence {
  if (!userName || !ownerName) return 'none'

  const uNorm = normalize(userName)
  const oNorm = normalize(ownerName)

  if (uNorm === oNorm) return 'exact'

  const uTokens = tokenize(userName)
  const oTokens = tokenize(ownerName)

  if (uTokens.length === 0 || oTokens.length === 0) return 'none'

  if ([...uTokens].sort().join(' ') === [...oTokens].sort().join(' ')) return 'exact'

  const oSet = new Set(oTokens)
  if (uTokens.length >= 2 && uTokens.every(t => oSet.has(t))) return 'fuzzy'

  if (oNorm.includes(uNorm) || uNorm.includes(oNorm)) return 'fuzzy'

  return 'none'
}

function matchOwners(
  userName: string,
  owners: Array<{ name: string; share: string }>,
): { verified: boolean; confidence: Confidence; matchedOwner: string | null } {
  if (!userName?.trim()) return { verified: false, confidence: 'none', matchedOwner: null }

  let best: Confidence = 'none'
  let matched: string | null = null

  for (const o of owners) {
    // Split SJM combined entries: "Jan Novák, Jana Nováková"
    const parts = o.name.split(/,\s*/)
    for (const part of parts) {
      const c = comparePair(userName, part.trim())
      if (c === 'exact') return { verified: true, confidence: 'exact', matchedOwner: o.name }
      if (c === 'fuzzy' && best !== 'exact') { best = 'fuzzy'; matched = o.name }
    }
  }

  return { verified: best !== 'none', confidence: best, matchedOwner: matched }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

async function isWithinRateLimit(
  sb: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await sb
    .from('verification_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)

  return (count ?? 0) < RATE_LIMIT
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin)
  }

  // ── Check API key ────────────────────────────────────────────────────────────
  const apiKey = Deno.env.get('CUZK_API_KEY')
  if (!apiKey) {
    return json({
      error: 'ČÚZK API key není nakonfigurován. Kontaktujte správce aplikace.',
    }, 503, origin)
  }

  // ── Authenticate user ────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice(7)

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401, origin)

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin)
  }

  const { action } = body

  try {
    // ── SEARCH ───────────────────────────────────────────────────────────────────
    if (action === 'search') {
      const address = String(body.address ?? '').trim()
      if (address.length < 3) return json({ error: 'Adresa musí mít alespoň 3 znaky' }, 400, origin)

      const encoded = encodeURIComponent(address)

      // Search all three entity types in parallel; tolerate individual failures
      const [rJednotky, rParcely, rBudovy] = await Promise.allSettled([
        knGet<KnSearchResponse>(
          // TODO(fáze 2): verify exact param name against live Swagger spec at /swagger
          `/Jednotka/Vyhledani?textovaAdresa=${encoded}&pocetNavrhu=5`,
          apiKey,
        ),
        knGet<KnSearchResponse>(
          `/Parcela/Vyhledani?textovaAdresa=${encoded}&pocetNavrhu=5`,
          apiKey,
        ),
        knGet<KnSearchResponse>(
          `/Budova/Vyhledani?textovaAdresa=${encoded}&pocetNavrhu=5`,
          apiKey,
        ),
      ])

      const candidates: ReturnType<typeof buildCandidate>[] = []

      const append = (
        result: PromiseSettledResult<KnSearchResponse | null>,
        type: 'jednotka' | 'parcela' | 'budova',
      ) => {
        if (result.status !== 'fulfilled' || !result.value?.data) return
        for (const item of result.value.data) {
          if (!item.id) continue
          candidates.push(buildCandidate(item, type))
        }
      }

      append(rJednotky, 'jednotka')
      append(rParcely, 'parcela')
      append(rBudovy, 'budova')

      return json(candidates, 200, origin)
    }

    // ── VERIFY ───────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const cuzkId    = String(body.cuzkId ?? '').trim()
      const type      = String(body.type ?? '') as 'budova' | 'parcela' | 'jednotka'
      const propertyId = typeof body.propertyId === 'string' ? body.propertyId : undefined

      if (!cuzkId) return json({ error: 'cuzkId je povinný' }, 400, origin)
      if (!['budova', 'parcela', 'jednotka'].includes(type)) {
        return json({ error: 'type musí být budova, parcela nebo jednotka' }, 400, origin)
      }

      // Rate limit check
      if (!(await isWithinRateLimit(sb, user.id))) {
        return json({ error: 'Překročen limit 10 ověření za hodinu. Zkuste to za hodinu.' }, 429, origin)
      }

      // Record the attempt before the KN call so even failed calls count
      await sb.from('verification_attempts').insert({ user_id: user.id })

      // Fetch property detail
      const typeSegment = { budova: 'Budova', parcela: 'Parcela', jednotka: 'Jednotka' }[type]
      const detail = await knGet<KnDetailResponse>(`/${typeSegment}/${cuzkId}`, apiKey)

      if (!detail?.data) {
        await sb.from('property_verifications').insert({
          user_id:       user.id,
          property_id:   propertyId ?? null,
          cuzk_id:       cuzkId,
          property_type: type,
          status:        'not_found',
          confidence:    'none',
        })
        return json({
          verified: false,
          confidence: 'none',
          matchedOwner: null,
          allOwners: [],
          propertyDetail: null,
          verificationId: null,
        }, 200, origin)
      }

      const obj = detail.data
      const owners       = extractOwners(obj)
      const encumbrances = extractEncumbrances(obj)
      const kuCode       = String(obj.katastralniUzemi?.kod ?? '')
      const kuName       = obj.katastralniUzemi?.nazev ?? ''
      const lv           = extractLv(obj)
      const address      = obj.adresa?.textovaAdresa ?? ''

      // Resolve user's full name from profile (preferred) or auth metadata
      const { data: profile } = await sb
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const userName: string =
        profile?.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        ''

      const matchResult = matchOwners(userName, owners)

      const status =
        owners.length === 0     ? 'not_found' :
        matchResult.verified     ? 'verified'  :
                                   'name_mismatch'

      const { data: verRow } = await sb
        .from('property_verifications')
        .insert({
          user_id:          user.id,
          property_id:      propertyId ?? null,
          cuzk_id:          cuzkId,
          property_type:    type,
          address,
          katastralni_uzemi: kuName,
          ku_code:          kuCode,
          lv,
          status,
          confidence:       matchResult.confidence,
          matched_owner:    matchResult.matchedOwner,
          all_owners_count: owners.length,
          verified_at:      matchResult.verified ? new Date().toISOString() : null,
        })
        .select('id')
        .single()

      // If verified and linked to a property, refresh its cadastre columns
      if (propertyId && matchResult.verified) {
        await sb
          .from('properties')
          .update({
            cadastre_ku:           kuName,
            cadastre_ku_code:      kuCode,
            cadastre_lv:           lv,
            cadastre_owners:       owners,
            cadastre_encumbrances: encumbrances,
            cadastre_refreshed_at: new Date().toISOString(),
          })
          .eq('id', propertyId)
          .eq('owner_id', user.id)  // guard: only update own properties
      }

      return json({
        verified:        matchResult.verified,
        confidence:      matchResult.confidence,
        matchedOwner:    matchResult.matchedOwner,
        allOwners:       owners.map(o => o.name),
        propertyDetail:  {
          cuzkId,
          type,
          address,
          katastralniUzemi: kuName,
          kuCode,
          lv,
          owners,
          encumbrances,
        },
        verificationId: verRow?.id ?? null,
      }, 200, origin)
    }

    return json({ error: `Neznámá akce: ${String(action)}` }, 400, origin)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interní chyba'
    console.error('[cuzk-property]', message)
    return json({ error: 'Interní chyba serveru' }, 500, origin)
  }
})
