import type { EnergyType, EnergyProvider } from '../data'

export interface ParsedRow {
  reading_date: string   // YYYY-MM-DD
  reading_value: number
  type: EnergyType
  meter_id?: string
  consumption?: number
  note?: string
}

export interface ParseResult {
  rows: ParsedRow[]
  skipped: number
  errors: string[]
  detectedProvider: EnergyProvider | null
}

export interface ColumnMapping {
  date: string
  value: string
  type?: string
  meterId?: string
  consumption?: string
}

/** Normalize a Czech/European decimal string to a JS number */
export function parseDecimal(raw: string): number {
  // Replace Czech decimal comma with dot, strip thousands separator (space or dot before comma)
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

/** Parse DD.MM.YYYY or YYYY-MM-DD to ISO date */
export function parseDate(raw: string): string | null {
  const trimmed = raw.trim()

  // DD.MM.YYYY
  const czMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (czMatch) {
    const [, d, m, y] = czMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return trimmed

  // YYYY/MM/DD
  const slashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (slashMatch) {
    const [, y, m, d] = slashMatch
    return `${y}-${m}-${d}`
  }

  // MM/DD/YYYY (unlikely in CZ but defensive)
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    const [, m, d, y] = usMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}
