import { supabase } from '@/lib/supabase'
import type { CadastrePatch } from './data'

// ── RÚIAN typy ────────────────────────────────────────────────────────────────

export interface RuianAttributes {
  StAddr: string      // ulice + číslo popisné, e.g. "Vinohradská 42"
  City: string        // obec, e.g. "Praha"
  Postal: string      // PSČ, e.g. "120 00"
  Region: string      // kraj
  Country: string
  Match_addr: string  // plná adresa
  StName: string      // název ulice
  AddNum: string      // číslo popisné
}

export interface RuianCandidate {
  address: string
  score: number
  location: { x: number; y: number }
  attributes: RuianAttributes
}

// ── ČÚZK WSDP typy ───────────────────────────────────────────────────────────

export interface CuzkPropertyResult extends CadastrePatch {
  address: string | null
  property_type: string | null
  area_m2: number | null
}

export interface CuzkSearchParams {
  lv: string
  ku_code: string
}

// ── RÚIAN — vyhledání adresy ─────────────────────────────────────────────────

const RUIAN_URL =
  'https://ags.cuzk.cz/arcgis/rest/services/RUIAN/Vyhledavani_nad_RUIAN_v2/MapServer/exts/GeocodeSOE/findAddressCandidates'

export async function searchRuianAddress(query: string): Promise<RuianCandidate[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    SingleLine: query,
    outFields: '*',
    f: 'json',
    maxLocations: '8',
    countryCode: 'CZE',
  })

  const res = await fetch(`${RUIAN_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`RÚIAN API chyba: ${res.status}`)

  const json = (await res.json()) as { candidates?: RuianCandidate[] }
  return (json.candidates ?? []).filter((c) => c.score >= 60)
}

// ── ČÚZK WSDP — detail nemovitosti přes Edge Function ────────────────────────

export async function fetchPropertyFromCuzk(params: CuzkSearchParams): Promise<CuzkPropertyResult> {
  const { data, error } = await supabase.functions.invoke<CuzkPropertyResult>('cuzk-property', {
    body: params,
  })

  if (error) throw new Error(await extractFunctionErrorMessage(error))
  if (!data) throw new Error('Prázdná odpověď z ČÚZK')
  return data
}

/** Edge Function vrací podrobnou chybu v JSON těle odpovědi — supabase-js ji
 * dává jen do `error.context` (Response), `error.message` je generická. */
async function extractFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const context = error.context
  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: string }
      if (body.error) return body.error
    } catch {
      // tělo není JSON — použij generickou zprávu
    }
  }
  return error.message
}

// ── Pomocné funkce ────────────────────────────────────────────────────────────

/** Z RÚIAN kandidáta vytvoří adresní data pro předvyplnění formuláře */
export function ruianToDraftAddress(candidate: RuianCandidate) {
  const attr = candidate.attributes
  return {
    street: attr.StAddr || candidate.address.split(',')[0]?.trim() || '',
    city: attr.City || '',
    zip: attr.Postal?.replace(/\s/g, '') || '',
  }
}
