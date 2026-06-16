import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { DocumentWithContext, Lease, LeaseStatus, PaymentWithContext } from '@/types/database'
import type { Enums } from '@/types/supabase'

// ── TenantContext ─────────────────────────────────────────────────────────────

export interface TenantContext {
  id: string
  full_name: string
  email: string
  initials: string
  property: {
    id: string
    name: string
    address_street: string
    address_city: string
  }
  lease: Lease
  landlord: {
    full_name: string
    email: string
    phone: string | null
  }
}

// ── Enum mappers ─────────────────────────────────────────────────────────────

function mapLeaseStatus(s: Enums<'lease_status'>): LeaseStatus {
  const map: Record<Enums<'lease_status'>, LeaseStatus> = {
    aktivni: 'active',
    ceka_na_podpis: 'upcoming',
    ukoncena: 'terminated',
    archivovana: 'expired',
  }
  return map[s]
}

function toInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ── DB row types ──────────────────────────────────────────────────────────────

type DbLandlordProfile = Pick<Tables<'profiles'>, 'full_name' | 'email' | 'phone'>

type DbPropertyWithLandlord = Pick<Tables<'properties'>, 'id' | 'name' | 'address' | 'city'> & {
  profiles: DbLandlordProfile | null
}

type DbLeaseWithProperty = Tables<'leases'> & {
  properties: DbPropertyWithLandlord | null
}

type DbTenantWithLeases = Tables<'tenants'> & {
  leases: DbLeaseWithProperty[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── API ──────────────────────────────────────────────────────────────────────

export async function getTenantContext(): Promise<TenantContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tenants')
    .select(`
      id, full_name, email, phone,
      leases(
        id, property_id, tenant_id, monthly_rent, deposit, payment_day,
        start_date, end_date, status, created_at, updated_at, archived_at,
        utilities_flat, bank_account, contract_url,
        properties(
          id, name, address, city,
          profiles!properties_owner_id_fkey(full_name, email, phone)
        )
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Tenant record not found for current user')

  const row = data as unknown as DbTenantWithLeases

  const activeLease =
    row.leases.find((l) => l.status === 'aktivni') ??
    row.leases.find((l) => l.status === 'ceka_na_podpis') ??
    null

  if (!activeLease) throw new Error('No active lease found for current tenant')

  const property = activeLease.properties
  const landlord = property?.profiles

  return {
    id: row.id,
    full_name: row.full_name ?? '',
    email: row.email,
    initials: toInitials(row.full_name),
    property: {
      id: property?.id ?? '',
      name: property?.name ?? '',
      address_street: property?.address ?? '',
      address_city: property?.city ?? '',
    },
    lease: mapLease(activeLease),
    landlord: {
      full_name: landlord?.full_name ?? '',
      email: landlord?.email ?? '',
      phone: landlord?.phone ?? null,
    },
  }
}

export async function getTenantPayments(): Promise<PaymentWithContext[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the tenant's active lease (RLS scopes to own records)
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, full_name, leases!inner(id, property_id, tenant_id, properties(id, name, city))')
    .eq('user_id', user.id)
    .maybeSingle()

  if (tenantErr) throw tenantErr
  if (!tenant) return []

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .in(
      'lease_id',
      (tenant as unknown as { leases: { id: string }[] }).leases.map((l) => l.id),
    )
    .order('due_date', { ascending: false })

  if (error) throw error

  const leaseMap = new Map(
    (tenant as unknown as {
      leases: {
        id: string
        property_id: string
        tenant_id: string
        properties: { id: string; name: string; city: string } | null
      }[]
    }).leases.map((l) => [l.id, l]),
  )

  return (payments ?? []).map((p) => {
    const lease = leaseMap.get(p.lease_id)
    return {
      id: p.id,
      lease_id: p.lease_id,
      tenant_id: lease?.tenant_id ?? '',
      property_id: lease?.property_id ?? '',
      owner_id: '',
      amount: p.amount,
      currency: 'CZK',
      due_date: p.due_date,
      paid_at: p.paid_at,
      status: p.status,
      type: p.type,
      note: p.note,
      stripe_payment_intent_id: null,
      variable_symbol: p.variable_symbol,
      created_at: p.created_at,
      updated_at: p.updated_at,
      tenant: {
        id: tenant.id,
        full_name: tenant.full_name,
        avatar_url: null,
      },
      property: {
        id: lease?.properties?.id ?? '',
        name: lease?.properties?.name ?? '',
        address_city: lease?.properties?.city ?? '',
      },
    }
  })
}

export async function getTenantDocuments(): Promise<DocumentWithContext[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, full_name, leases(id)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (tenantErr) throw tenantErr
  if (!tenant) return []

  const leaseIds = (tenant as unknown as { leases: { id: string }[] }).leases.map((l) => l.id)
  if (!leaseIds.length) return []

  const { data: docs, error } = await supabase
    .from('documents')
    .select('*, properties(id, name, city)')
    .in('lease_id', leaseIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (docs ?? []).map((d) => ({
    id: d.id,
    owner_id: d.uploaded_by,
    property_id: d.property_id,
    tenant_id: tenant.id,
    lease_id: d.lease_id,
    category: mapCategory(d.category),
    name: d.name,
    file_url: d.file_url,
    file_size_bytes: d.file_size,
    mime_type: d.mime_type,
    expires_at: d.expires_at,
    created_at: d.created_at,
    updated_at: d.updated_at,
    property: d.properties
      ? {
          id: (d.properties as { id: string; name: string; city: string }).id,
          name: (d.properties as { id: string; name: string; city: string }).name,
          address_city: (d.properties as { id: string; name: string; city: string }).city,
        }
      : null,
    tenant: { id: tenant.id, full_name: tenant.full_name, avatar_url: null },
  }))
}

function mapCategory(
  s: Enums<'document_category'>,
): DocumentWithContext['category'] {
  const map: Record<Enums<'document_category'>, DocumentWithContext['category']> = {
    najemni_smlouva: 'lease',
    predavaci_protokol: 'protocol',
    pojistka: 'insurance',
    faktura: 'invoice',
    korespondence: 'correspondence',
    revize: 'other',
    jine: 'other',
  }
  return map[s]
}
