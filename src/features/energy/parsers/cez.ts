/**
 * ČEZ (MůjČEZ) export CSV parser.
 *
 * Typical export from mojecez.cz — semicolon-delimited, Czech headers, Windows-1250 encoding.
 * Columns may vary by product/tariff; we match by lowercase header fragments.
 *
 * Example headers:
 *   "Datum odečtu";"Číslo měřiče";"EAN";"Stav (kWh)";"Spotřeba (kWh)"
 *   "Datum odečtu";"Číslo měřiče";"EAN";"Stav (m3)";"Spotřeba (m3)"
 */

import type { ParseResult, ParsedRow } from './types'
import { parseDate, parseDecimal } from './types'

const CEZ_DATE_COLS  = ['datum odečtu', 'datum', 'date']
const CEZ_VALUE_COLS = ['stav', 'stav měřiče', 'hodnota', 'value']
const CEZ_METER_COLS = ['číslo měřiče', 'číslo', 'meter', 'sériové číslo']
const CEZ_CONS_COLS  = ['spotřeba', 'consumption', 'odběr']

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[()]/g, '').trim()
}

function findCol(headers: string[], candidates: string[]): number {
  for (const h of headers) {
    const n = normalizeHeader(h)
    if (candidates.some((c) => n.includes(c))) return headers.indexOf(h)
  }
  return -1
}

/** Detect energy type from header unit hints or a type column value */
function detectTypeFromHeaders(headers: string[]): import('../data').EnergyType {
  const joined = headers.join(' ').toLowerCase()
  if (joined.includes('m3') || joined.includes('m³') || joined.includes('plyn')) return 'plyn'
  if (joined.includes('gj') || joined.includes('teplo')) return 'teplo'
  if (joined.includes('voda')) return 'voda_studena'
  return 'elektrina'
}

export function parseCez(rows: Record<string, string>[]): ParseResult {
  const errors: string[] = []
  const parsed: ParsedRow[] = []
  let skipped = 0

  if (!rows.length) return { rows: [], skipped: 0, errors: ['Soubor neobsahuje žádná data.'], detectedProvider: 'cez' }

  const headers = Object.keys(rows[0])
  const dateIdx  = findCol(headers, CEZ_DATE_COLS)
  const valueIdx = findCol(headers, CEZ_VALUE_COLS)
  const meterIdx = findCol(headers, CEZ_METER_COLS)
  const consIdx  = findCol(headers, CEZ_CONS_COLS)

  if (dateIdx === -1 || valueIdx === -1) {
    return {
      rows: [],
      skipped: rows.length,
      errors: ['Nepodařilo se identifikovat sloupce Datum a Stav měřiče. Zkontrolujte formát souboru.'],
      detectedProvider: 'cez',
    }
  }

  const energyType = detectTypeFromHeaders(headers)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const vals = Object.values(row)

    const rawDate  = vals[dateIdx] ?? ''
    const rawValue = vals[valueIdx] ?? ''

    const date = parseDate(rawDate)
    if (!date) { skipped++; errors.push(`Řádek ${i + 2}: neplatné datum "${rawDate}"`); continue }

    const value = parseDecimal(rawValue)
    if (isNaN(value)) { skipped++; errors.push(`Řádek ${i + 2}: neplatná hodnota "${rawValue}"`); continue }

    const item: ParsedRow = {
      reading_date: date,
      reading_value: value,
      type: energyType,
      meter_id: meterIdx !== -1 ? (vals[meterIdx] ?? '').trim() || undefined : undefined,
      consumption: consIdx !== -1 ? parseDecimal(vals[consIdx] ?? '') || undefined : undefined,
    }

    parsed.push(item)
  }

  return { rows: parsed, skipped, errors, detectedProvider: 'cez' }
}

/** Returns true when the CSV headers look like a ČEZ export */
export function isCezFormat(headers: string[]): boolean {
  const joined = headers.map((h) => normalizeHeader(h)).join(' ')
  return joined.includes('stav') && (joined.includes('datum odečtu') || joined.includes('odečtu'))
}
