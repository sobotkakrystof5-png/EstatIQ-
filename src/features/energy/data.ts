import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/lib/supabase'
import type { Enums } from '@/types/supabase'

// ── Public types ──────────────────────────────────────────────────────────────

export type EnergyType = Enums<'energy_type'>
export type EnergyProvider = Enums<'energy_provider'>

export const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  elektrina: 'Elektřina',
  plyn: 'Plyn',
  voda_studena: 'Voda (studená)',
  voda_tepla: 'Voda (teplá)',
  teplo: 'Teplo',
}

export const ENERGY_TYPE_UNITS: Record<EnergyType, string> = {
  elektrina: 'kWh',
  plyn: 'm³',
  voda_studena: 'm³',
  voda_tepla: 'm³',
  teplo: 'GJ',
}

export const ENERGY_PROVIDER_LABELS: Record<EnergyProvider, string> = {
  cez: 'ČEZ',
  eon: 'E.ON',
  pre: 'PRE',
  innogy: 'innogy',
  prazska_teplarenska: 'Pražská teplárenská',
  jiny: 'Jiný dodavatel',
}

export interface EnergyReadingWithMeta extends Tables<'energy_readings'> {
  property_name: string
  is_anomaly: boolean
}

export interface NewReadingDraft {
  property_id: string
  type: EnergyType
  reading_value: number
  reading_date: string // YYYY-MM-DD
  note: string | null
  meter_id?: string | null
  provider?: EnergyProvider | null
  photo_file?: File | null
}

// ── DB helper types ───────────────────────────────────────────────────────────

type DbReadingWithProperty = Tables<'energy_readings'> & {
  properties: Pick<Tables<'properties'>, 'name'> | null
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function listEnergyReadings(
  propertyId?: string,
): Promise<EnergyReadingWithMeta[]> {
  let query = supabase
    .from('energy_readings')
    .select(`*, properties(name)`)
    .order('reading_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (propertyId) query = query.eq('property_id', propertyId)

  const { data, error } = await query
  if (error) throw error

  return (data as unknown as DbReadingWithProperty[]).map((r) => ({
    ...r,
    property_name: r.properties?.name ?? '—',
    is_anomaly: false, // overridden below for readings with consumption
  }))
}

export async function createEnergyReading(
  draft: NewReadingDraft,
): Promise<EnergyReadingWithMeta> {
  const now = new Date(draft.reading_date)
  const period_month = now.getMonth() + 1
  const period_year = now.getFullYear()

  // Find the previous reading for the same property + type to compute consumption
  const { data: prev } = await supabase
    .from('energy_readings')
    .select('reading_value')
    .eq('property_id', draft.property_id)
    .eq('type', draft.type)
    .lt('reading_date', draft.reading_date)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const consumption = prev ? draft.reading_value - prev.reading_value : null

  // Upload photo if provided
  let photo_url: string | null = null
  if (draft.photo_file) {
    const { data: authData } = await supabase.auth.getUser()
    if (authData.user) {
      const ext = draft.photo_file.name.split('.').pop() ?? 'jpg'
      const path = `${authData.user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('energy-photos')
        .upload(path, draft.photo_file, { upsert: false })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('energy-photos').getPublicUrl(path)
      photo_url = publicUrl
    }
  }

  const insert: TablesInsert<'energy_readings'> = {
    property_id: draft.property_id,
    type: draft.type,
    reading_value: draft.reading_value,
    reading_date: draft.reading_date,
    period_month,
    period_year,
    consumption: consumption !== null && consumption >= 0 ? consumption : null,
    note: draft.note,
    meter_id: draft.meter_id ?? null,
    provider: draft.provider ?? null,
    photo_url,
  }

  const { data, error } = await supabase
    .from('energy_readings')
    .insert(insert)
    .select(`*, properties(name)`)
    .single()

  if (error) throw error

  const row = data as unknown as DbReadingWithProperty

  // Check anomaly via DB function (only when we have consumption) — UI feedback only;
  // the notification is created server-side by the energy_reading_anomaly_webhook trigger
  let is_anomaly = false
  if (row.consumption !== null && row.consumption > 0) {
    const { data: anomaly } = await supabase.rpc('check_energy_anomaly', {
      p_consumption: row.consumption,
      p_month: row.period_month,
      p_year: row.period_year,
      p_property_id: row.property_id,
      p_type: row.type,
    })
    is_anomaly = anomaly?.[0]?.is_anomaly ?? false
  }

  return { ...row, property_name: row.properties?.name ?? '—', is_anomaly }
}

export async function deleteEnergyReading(id: string): Promise<void> {
  const { error } = await supabase.from('energy_readings').delete().eq('id', id)
  if (error) throw error
}

export async function listProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name')
    .is('archived_at', null)
    .order('name')
  if (error) throw error
  return data ?? []
}

// ── Anomaly notifications ─────────────────────────────────────────────────────

export interface EnergyAnomalyNotification {
  id: string
  title: string
  body: string | null
  created_at: string
}

export async function listEnergyAnomalyNotifications(): Promise<EnergyAnomalyNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, created_at')
    .eq('type', 'energy_anomaly')
    .is('read_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as EnergyAnomalyNotification[]
}

export async function dismissEnergyNotifications(ids: string[]): Promise<void> {
  if (!ids.length) return
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw error
}

// ── Bulk import ───────────────────────────────────────────────────────────────

export interface ImportBatch {
  rows: import('./parsers/types').ParsedRow[]
  propertyId: string
  filename: string
  provider: EnergyProvider | null
}

export interface ImportBatchResult {
  imported: number
  skipped: number
}

export async function importEnergyReadings(batch: ImportBatch): Promise<ImportBatchResult> {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) throw new Error('Unauthenticated')

  let imported = 0
  let skipped = 0

  for (const row of batch.rows) {
    const date = new Date(row.reading_date)
    const period_month = date.getMonth() + 1
    const period_year = date.getFullYear()

    // Compute consumption from previous reading if not provided by the file
    let consumption = row.consumption ?? null
    if (consumption === null) {
      const { data: prev } = await supabase
        .from('energy_readings')
        .select('reading_value')
        .eq('property_id', batch.propertyId)
        .eq('type', row.type)
        .lt('reading_date', row.reading_date)
        .order('reading_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (prev) {
        const diff = row.reading_value - prev.reading_value
        if (diff >= 0) consumption = diff
      }
    }

    const insert: TablesInsert<'energy_readings'> = {
      property_id: batch.propertyId,
      type: row.type,
      reading_value: row.reading_value,
      reading_date: row.reading_date,
      period_month,
      period_year,
      consumption: consumption !== null && consumption >= 0 ? consumption : null,
      meter_id: row.meter_id ?? null,
      provider: batch.provider ?? null,
      note: row.note ?? null,
    }

    const { error } = await supabase
      .from('energy_readings')
      .insert(insert)
      // Silently skip duplicates — unique constraint: (property_id, type, meter_id, period_year, period_month)
      .select('id')

    if (error) {
      if (error.code === '23505') { skipped++; continue }
      throw error
    }
    imported++
  }

  // Log the import
  await supabase.from('energy_imports').insert({
    user_id: authData.user.id,
    property_id: batch.propertyId,
    provider: batch.provider ?? null,
    filename: batch.filename,
    rows_total: batch.rows.length,
    rows_imported: imported,
    rows_skipped: skipped,
    status: 'completed',
  })

  return { imported, skipped }
}

// ── Chart data ────────────────────────────────────────────────────────────────

export interface EnergyChartPoint {
  label: string
  yearMonth: string
  elektrina: number | null
  plyn: number | null
  voda_studena: number | null
  voda_tepla: number | null
  teplo: number | null
}

export function buildEnergyChartData(readings: EnergyReadingWithMeta[]): EnergyChartPoint[] {
  const now = new Date()
  const points: EnergyChartPoint[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('cs-CZ', { month: 'short', year: '2-digit' }).format(d)
    points.push({ label, yearMonth, elektrina: null, plyn: null, voda_studena: null, voda_tepla: null, teplo: null })
  }

  for (const r of readings) {
    if (r.consumption === null || r.consumption === undefined) continue
    const yearMonth = `${r.period_year}-${String(r.period_month).padStart(2, '0')}`
    const point = points.find((p) => p.yearMonth === yearMonth)
    if (!point) continue
    const key = r.type as EnergyType
    const prev = point[key]
    point[key] = prev === null ? r.consumption : prev + r.consumption
  }

  return points
}
