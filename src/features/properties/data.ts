import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { Enums } from '@/types/supabase'
import type { Lease, LeaseStatus, PropertyStatus, PropertyWithStats } from '@/types/database'

// ── Enum mappers ─────────────────────────────────────────────────────────────

function mapPropertyStatus(s: Enums<'property_status'>): PropertyStatus {
  const map: Record<Enums<'property_status'>, PropertyStatus> = {
    volna: 'vacant',
    pronajata: 'active',
    v_oprave: 'maintenance',
    archivovana: 'archived',
  }
  return map[s]
}

function toDbPropertyStatus(s: PropertyStatus): Enums<'property_status'> {
  const map: Record<PropertyStatus, Enums<'property_status'>> = {
    vacant: 'volna',
    active: 'pronajata',
    maintenance: 'v_oprave',
    archived: 'archivovana',
  }
  return map[s]
}

function mapLeaseStatus(s: Enums<'lease_status'>): LeaseStatus {
  const map: Record<Enums<'lease_status'>, LeaseStatus> = {
    aktivni: 'active',
    ceka_na_podpis: 'upcoming',
    ukoncena: 'terminated',
    archivovana: 'expired',
  }
  return map[s]
}

// ── DB row types with joins ───────────────────────────────────────────────────

type DbPaymentPartial = Pick<Tables<'payments'>, 'id' | 'status' | 'paid_at'>

type DbLeaseWithPayments = Tables<'leases'> & {
  payments?: DbPaymentPartial[]
}

type DbPropertyWithLeases = Tables<'properties'> & {
  leases?: DbLeaseWithPayments[]
}

// ── Mapper helpers ───────────────────────────────────────────────────────────

function mapLease(db: Tables<'leases'>): Lease {
  return {
    id: db.id,
    property_id: db.property_id,
    tenant_id: db.tenant_id,
    start_date: db.start_date,
    end_date: db.end_date,
    monthly_rent: db.monthly_rent,
    deposit: db.deposit,
    currency: 'CZK',
    payment_day: db.payment_day,
    status: mapLeaseStatus(db.status),
    terms: null,
    signed_at: null,
    terminated_at: null,
    termination_reason: null,
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

function mapPropertyWithStats(row: DbPropertyWithLeases): PropertyWithStats {
  const leases = row.leases ?? []
  const activeLease = leases.find((l) => l.status === 'aktivni') ?? null
  const tenantCount = leases.filter((l) => l.status === 'aktivni').length
  const allPayments = leases.flatMap((l) => l.payments ?? [])
  const unpaidCount = allPayments.filter((p) => p.status === 'overdue').length
  const paidPayments = allPayments.filter((p) => p.status === 'paid' && p.paid_at)
  const lastPaymentAt =
    paidPayments.length > 0
      ? paidPayments.sort((a, b) => b.paid_at!.localeCompare(a.paid_at!))[0].paid_at!
      : null

  return {
    id: row.id,
    owner_id: row.owner_id,
    organization_id: row.organization_id,
    name: row.name,
    address_street: row.address,
    address_city: row.city,
    address_zip: row.postal_code ?? '',
    address_country: row.country,
    floor_area_m2: row.area_sqm,
    rooms: row.rooms,
    floor: row.floor,
    photos: row.cover_image_url ? [row.cover_image_url] : [],
    status: mapPropertyStatus(row.status),
    monthly_rent: activeLease?.monthly_rent ?? 0,
    currency: 'CZK',
    notes: row.description,
    archived_at: row.archived_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    active_lease: activeLease ? mapLease(activeLease) : null,
    tenant_count: tenantCount,
    unpaid_count: unpaidCount,
    last_payment_at: lastPaymentAt,
    cadastral_number: row.cadastral_number,
    cadastre_lv: row.cadastre_lv ?? null,
    cadastre_ku: row.cadastre_ku ?? null,
    cadastre_ku_code: row.cadastre_ku_code ?? null,
    cadastre_parcel: row.cadastre_parcel ?? null,
    cadastre_owners: row.cadastre_owners ?? null,
    cadastre_encumbrances: row.cadastre_encumbrances ?? null,
    cadastre_refreshed_at: row.cadastre_refreshed_at ?? null,
  }
}

// ── Shared select fragment ───────────────────────────────────────────────────

const PROPERTY_SELECT = `
  *,
  leases(
    id, monthly_rent, payment_day, start_date, end_date,
    status, tenant_id, property_id, deposit, archived_at,
    created_at, updated_at,
    payments(id, status, paid_at)
  )
` as const

// ── Public interface ─────────────────────────────────────────────────────────

export interface PropertyDraft {
  name: string
  address_street: string
  address_city: string
  address_zip: string
  rooms: number | null
  floor_area_m2: number | null
  monthly_rent: number
  status: PropertyStatus
  notes: string | null
  // ČÚZK — volitelné při vytvoření z katastru
  cadastral_number?: string | null
  cadastre_lv?: string | null
  cadastre_ku?: string | null
  cadastre_ku_code?: string | null
  cadastre_parcel?: string | null
}

export interface CadastrePatch {
  cadastre_lv: string | null
  cadastre_ku: string | null
  cadastre_ku_code: string | null
  cadastre_parcel: string | null
  cadastre_owners: { name: string; share: string }[] | null
  cadastre_encumbrances: string[] | null
}

export async function listProperties(): Promise<PropertyWithStats[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPropertyWithStats(row as unknown as DbPropertyWithLeases))
}

export async function getProperty(id: string): Promise<PropertyWithStats | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapPropertyWithStats(data as unknown as DbPropertyWithLeases) : null
}

export async function createProperty(draft: PropertyDraft): Promise<PropertyWithStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('properties')
    .insert({
      owner_id: user.id,
      name: draft.name,
      address: draft.address_street,
      city: draft.address_city,
      postal_code: draft.address_zip || null,
      country: 'CZ',
      rooms: draft.rooms,
      area_sqm: draft.floor_area_m2,
      status: toDbPropertyStatus(draft.status),
      description: draft.notes,
      type: 'byt',
      archived_at: draft.status === 'archived' ? new Date().toISOString() : null,
      cadastral_number: draft.cadastral_number ?? null,
      cadastre_lv: draft.cadastre_lv ?? null,
      cadastre_ku: draft.cadastre_ku ?? null,
      cadastre_ku_code: draft.cadastre_ku_code ?? null,
      cadastre_parcel: draft.cadastre_parcel ?? null,
    })
    .select(PROPERTY_SELECT)
    .single()

  if (error) throw error
  return mapPropertyWithStats(data as unknown as DbPropertyWithLeases)
}

export async function updateProperty(id: string, draft: PropertyDraft): Promise<PropertyWithStats> {
  const { data, error } = await supabase
    .from('properties')
    .update({
      name: draft.name,
      address: draft.address_street,
      city: draft.address_city,
      postal_code: draft.address_zip || null,
      rooms: draft.rooms,
      area_sqm: draft.floor_area_m2,
      status: toDbPropertyStatus(draft.status),
      description: draft.notes,
      archived_at: draft.status === 'archived' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select(PROPERTY_SELECT)
    .single()

  if (error) throw error
  return mapPropertyWithStats(data as unknown as DbPropertyWithLeases)
}

export async function archiveProperty(id: string): Promise<PropertyWithStats> {
  const { data, error } = await supabase
    .from('properties')
    .update({ status: 'archivovana', archived_at: new Date().toISOString() })
    .eq('id', id)
    .select(PROPERTY_SELECT)
    .single()

  if (error) throw error
  return mapPropertyWithStats(data as unknown as DbPropertyWithLeases)
}

export async function restoreProperty(id: string): Promise<PropertyWithStats> {
  const current = await getProperty(id)
  const dbStatus: Enums<'property_status'> =
    (current?.tenant_count ?? 0) > 0 ? 'pronajata' : 'volna'

  const { data, error } = await supabase
    .from('properties')
    .update({ status: dbStatus, archived_at: null })
    .eq('id', id)
    .select(PROPERTY_SELECT)
    .single()

  if (error) throw error
  return mapPropertyWithStats(data as unknown as DbPropertyWithLeases)
}

export async function updateCadastreData(id: string, patch: CadastrePatch): Promise<PropertyWithStats> {
  const { data, error } = await supabase
    .from('properties')
    .update({
      cadastre_lv: patch.cadastre_lv,
      cadastre_ku: patch.cadastre_ku,
      cadastre_ku_code: patch.cadastre_ku_code,
      cadastre_parcel: patch.cadastre_parcel,
      cadastre_owners: patch.cadastre_owners,
      cadastre_encumbrances: patch.cadastre_encumbrances,
      cadastre_refreshed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(PROPERTY_SELECT)
    .single()

  if (error) throw error
  return mapPropertyWithStats(data as unknown as DbPropertyWithLeases)
}
