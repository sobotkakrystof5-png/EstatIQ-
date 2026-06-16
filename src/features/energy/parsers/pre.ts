/**
 * PRE (Pražská energetika) export CSV parser.
 *
 * PRE zákaznický portál (moje.pre.cz) exports semicolon-delimited CSV.
 * Typical headers:
 *   "Datum odečtu";"Typ odečtu";"Stav VT (kWh)";"Stav NT (kWh)";"Spotřeba VT";"Spotřeba NT"
 * or simplified:
 *   "Datum";"Číslo měřiče";"Stav";"Spotřeba"
 *
 * PRE-specific: high tariff (VT) + low tariff (NT) columns.
 * We sum VT+NT for the total reading value.
 */

import type { ParseResult, ParsedRow } from './types'
import { parseDate, parseDecimal } from './types'

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

export function parsePre(rows: Record<string, string>[]): ParseResult {
  const errors: string[] = []
  const parsed: ParsedRow[] = []
  let skipped = 0

  if (!rows.length) return { rows: [], skipped: 0, errors: ['Soubor neobsahuje žádná data.'], detectedProvider: 'pre' }

  const headers = Object.keys(rows[0])
  const dateIdx = findCol(headers, ['datum odečtu', 'datum', 'date'])

  // PRE may have VT + NT columns separately
  const vtIdx   = findCol(headers, ['stav vt', 'vt', 'vyšší tarif'])
  const ntIdx   = findCol(headers, ['stav nt', 'nt', 'nižší tarif'])
  const valueIdx = vtIdx !== -1 ? vtIdx : findCol(headers, ['stav', 'hodnota', 'stav měřiče'])
  const consIdx  = findCol(headers, ['spotřeba', 'spotřeba vt', 'consumption'])
  const meterIdx = findCol(headers, ['číslo měřiče', 'měřič', 'ean', 'číslo'])

  if (dateIdx === -1 || valueIdx === -1) {
    return {
      rows: [],
      skipped: rows.length,
      errors: ['Nepodařilo se identifikovat sloupce Datum a Stav. Zkontrolujte formát PRE souboru.'],
      detectedProvider: 'pre',
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const vals = Object.values(rows[i])

    const rawDate = vals[dateIdx] ?? ''
    const date = parseDate(rawDate)
    if (!date) { skipped++; errors.push(`Řádek ${i + 2}: neplatné datum "${rawDate}"`); continue }

    let value = parseDecimal(vals[valueIdx] ?? '')
    // Sum VT + NT if both present
    if (vtIdx !== -1 && ntIdx !== -1) {
      const nt = parseDecimal(vals[ntIdx] ?? '')
      if (!isNaN(nt)) value = (isNaN(value) ? 0 : value) + nt
    }

    if (isNaN(value)) { skipped++; errors.push(`Řádek ${i + 2}: neplatná hodnota měřiče`); continue }

    const item: ParsedRow = {
      reading_date: date,
      reading_value: value,
      type: 'elektrina',
      meter_id: meterIdx !== -1 ? (vals[meterIdx] ?? '').trim() || undefined : undefined,
      consumption: consIdx !== -1 ? parseDecimal(vals[consIdx] ?? '') || undefined : undefined,
    }

    parsed.push(item)
  }

  return { rows: parsed, skipped, errors, detectedProvider: 'pre' }
}

export function isPreFormat(headers: string[]): boolean {
  const joined = headers.map((h) => h.toLowerCase().replace(/[()]/g, '').trim()).join(' ')
  return joined.includes('vt') && joined.includes('nt')
}
