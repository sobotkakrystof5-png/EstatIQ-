/**
 * E.ON (MůjE.ON) export CSV parser.
 *
 * E.ON typically exports semicolon-delimited CSV with headers:
 *   "Datum";"Odběrné místo";"EAN";"Tarif";"Stav (kWh)";"Spotřeba (kWh)"
 * or (newer portal):
 *   "Datum";""Číslo smlouvy";"Stav měřiče";"Spotřeba"
 */

import type { ParseResult, ParsedRow } from './types'
import { parseDate, parseDecimal } from './types'

const EON_DATE_COLS  = ['datum', 'date', 'datum odečtu']
const EON_VALUE_COLS = ['stav', 'stav měřiče', 'hodnota měřiče', 'aktuální stav']
const EON_METER_COLS = ['odběrné místo', 'číslo měřiče', 'ean', 'sériové']
const EON_CONS_COLS  = ['spotřeba', 'consumption']

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[()]/g, '').trim()
}

function findCol(headers: string[], candidates: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const n = normalizeHeader(headers[i])
    if (candidates.some((c) => n.includes(c))) return i
  }
  return -1
}

function detectTypeFromHeaders(headers: string[]): import('../data').EnergyType {
  const joined = headers.join(' ').toLowerCase()
  if (joined.includes('m3') || joined.includes('m³') || joined.includes('plyn')) return 'plyn'
  if (joined.includes('gj') || joined.includes('teplo')) return 'teplo'
  if (joined.includes('voda')) return 'voda_studena'
  return 'elektrina'
}

export function parseEon(rows: Record<string, string>[]): ParseResult {
  const errors: string[] = []
  const parsed: ParsedRow[] = []
  let skipped = 0

  if (!rows.length) return { rows: [], skipped: 0, errors: ['Soubor neobsahuje žádná data.'], detectedProvider: 'eon' }

  const headers = Object.keys(rows[0])
  const dateIdx  = findCol(headers, EON_DATE_COLS)
  const valueIdx = findCol(headers, EON_VALUE_COLS)
  const meterIdx = findCol(headers, EON_METER_COLS)
  const consIdx  = findCol(headers, EON_CONS_COLS)

  if (dateIdx === -1 || valueIdx === -1) {
    return {
      rows: [],
      skipped: rows.length,
      errors: ['Nepodařilo se identifikovat sloupce Datum a Stav měřiče. Zkontrolujte formát souboru.'],
      detectedProvider: 'eon',
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

  return { rows: parsed, skipped, errors, detectedProvider: 'eon' }
}

export function isEonFormat(headers: string[]): boolean {
  const joined = headers.map((h) => h.toLowerCase().replace(/[()]/g, '').trim()).join(' ')
  return joined.includes('odběrné místo') || (joined.includes('datum') && joined.includes('stav') && joined.includes('spotřeba'))
}
