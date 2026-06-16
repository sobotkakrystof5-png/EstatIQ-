/**
 * Entry point for energy CSV import parsing.
 * Handles encoding detection (UTF-8 / Windows-1250), delimiter sniffing,
 * provider auto-detection, and dispatches to the right parser.
 */

import Papa from 'papaparse'
import type { EnergyProvider } from '../data'
import type { ParseResult } from './types'
import { isCezFormat, parseCez } from './cez'
import { isEonFormat, parseEon } from './eon'
import { isPreFormat, parsePre } from './pre'

// ── Encoding ──────────────────────────────────────────────────────────────────

/**
 * Decode a file buffer trying UTF-8 first, then Windows-1250.
 * Czech portals often export CP1250-encoded files.
 */
async function decodeBuffer(buffer: ArrayBuffer): Promise<string> {
  const tryDecode = (enc: string): string | null => {
    try {
      const text = new TextDecoder(enc, { fatal: true }).decode(buffer)
      return text
    } catch {
      return null
    }
  }

  return tryDecode('utf-8') ?? tryDecode('windows-1250') ?? new TextDecoder('iso-8859-2').decode(buffer)
}

// ── Delimiter sniffing ────────────────────────────────────────────────────────

function sniffDelimiter(firstLine: string): ',' | ';' | '\t' {
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
  }
  if (counts[';'] >= counts[','] && counts[';'] >= counts['\t']) return ';'
  if (counts['\t'] >= counts[',']) return '\t'
  return ','
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ImportFileResult extends ParseResult {
  filename: string
  delimiter: string
}

export async function parseEnergyFile(
  file: File,
  overrideProvider?: EnergyProvider | null,
): Promise<ImportFileResult> {
  const buffer = await file.arrayBuffer()
  const text = await decodeBuffer(buffer)

  const firstLine = text.split('\n')[0] ?? ''
  const delimiter = sniffDelimiter(firstLine)

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^["']|["']$/g, ''),
    transform: (v) => v.trim().replace(/^["']|["']$/g, ''),
  })

  const rows = parsed.data
  const headers = parsed.meta.fields ?? []

  // Determine provider — explicit override wins
  const provider = overrideProvider ?? detectProvider(headers)

  let result: ParseResult
  switch (provider) {
    case 'cez':     result = parseCez(rows); break
    case 'eon':     result = parseEon(rows); break
    case 'pre':     result = parsePre(rows); break
    case 'innogy':  result = parseEon(rows); break   // innogy uses same format as E.ON
    default:        result = parseGeneric(rows, headers); break
  }

  return { ...result, filename: file.name, delimiter }
}

function detectProvider(headers: string[]): EnergyProvider | null {
  if (isPreFormat(headers)) return 'pre'
  if (isCezFormat(headers)) return 'cez'
  if (isEonFormat(headers)) return 'eon'
  return null
}

// ── Generic parser ────────────────────────────────────────────────────────────
// Tries a best-effort parse by guessing which columns hold date / value.

const GENERIC_DATE_HINTS  = ['datum', 'date', 'day', 'den', 'čas']
const GENERIC_VALUE_HINTS = ['stav', 'hodnota', 'value', 'reading', 'měřič', 'kwh', 'm3', 'gj']
const GENERIC_CONS_HINTS  = ['spotřeba', 'consumption', 'odběr']
const GENERIC_METER_HINTS = ['číslo', 'meter', 'ean', 'sériové', 'id']

function findColByHints(headers: string[], hints: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().replace(/[()]/g, '').trim()
    if (hints.some((hint) => h.includes(hint))) return i
  }
  return -1
}

import { parseDate, parseDecimal } from './types'
import type { ParsedRow } from './types'
import type { EnergyType } from '../data'

const ENERGY_TYPE_UNIT_MAP: Record<string, EnergyType> = {
  kwh: 'elektrina',
  'm3': 'plyn',
  'm³': 'plyn',
  gj: 'teplo',
}

function guessTypeFromHeaders(headers: string[]): EnergyType {
  const joined = headers.join(' ').toLowerCase()
  for (const [unit, type] of Object.entries(ENERGY_TYPE_UNIT_MAP)) {
    if (joined.includes(unit)) return type
  }
  return 'elektrina'
}

function parseGeneric(rows: Record<string, string>[], headers: string[]): ParseResult {
  const errors: string[] = []
  const parsed: ParsedRow[] = []
  let skipped = 0

  if (!rows.length) return { rows: [], skipped: 0, errors: ['Soubor neobsahuje žádná data.'], detectedProvider: null }

  const dateIdx  = findColByHints(headers, GENERIC_DATE_HINTS)
  const valueIdx = findColByHints(headers, GENERIC_VALUE_HINTS)
  const consIdx  = findColByHints(headers, GENERIC_CONS_HINTS)
  const meterIdx = findColByHints(headers, GENERIC_METER_HINTS)

  if (dateIdx === -1 || valueIdx === -1) {
    return {
      rows: [],
      skipped: rows.length,
      errors: [
        'Formát souboru nebyl rozpoznán. Ujistěte se, že CSV obsahuje sloupce pro datum a stav měřiče.',
      ],
      detectedProvider: null,
    }
  }

  const energyType = guessTypeFromHeaders(headers)

  for (let i = 0; i < rows.length; i++) {
    const vals = Object.values(rows[i])
    const rawDate  = vals[dateIdx] ?? ''
    const rawValue = vals[valueIdx] ?? ''

    const date = parseDate(rawDate)
    if (!date) { skipped++; errors.push(`Řádek ${i + 2}: neplatné datum "${rawDate}"`); continue }

    const value = parseDecimal(rawValue)
    if (isNaN(value)) { skipped++; errors.push(`Řádek ${i + 2}: neplatná hodnota "${rawValue}"`); continue }

    parsed.push({
      reading_date: date,
      reading_value: value,
      type: energyType,
      meter_id: meterIdx !== -1 ? (vals[meterIdx] ?? '').trim() || undefined : undefined,
      consumption: consIdx !== -1 ? parseDecimal(vals[consIdx] ?? '') || undefined : undefined,
    })
  }

  return { rows: parsed, skipped, errors, detectedProvider: null }
}
