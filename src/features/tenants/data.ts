import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { Enums } from '@/types/supabase'
import type { Invitation, InvitationStatus, Lease, LeaseStatus, Tenant } from '@/types/database'

// ── Types ──────────────────────────────────────────────────────────────────────

export type TenantStatus = 'active' | 'invited' | 'ended'

export interface TenantWithContext {
  tenant: Tenant
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
    phone: string | null
  }
  lease: Lease | null
  invitation: Invitation | null
  status: TenantStatus
  property_name: string
  property_id: string
  monthly_rent: number
  paid_this_month: boolean
  unpaid_count: number
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

function mapInvitationStatus(s: Enums<'invitation_status'>): InvitationStatus {
  const map: Record<Enums<'invitation_status'>, InvitationStatus> = {
    pending: 'pending',
    accepted: 'accepted',
    expired: 'expired',
    revoked: 'cancelled',
  }
  return map[s]
}

// ── DB row types with joins ───────────────────────────────────────────────────

type DbPaymentPartial = Pick<Tables<'payments'>, 'id' | 'status' | 'paid_at' | 'period_month' | 'period_year'>

type DbLeaseWithRelations = Tables<'leases'> & {
  properties?: Pick<Tables<'properties'>, 'id' | 'name' | 'city'> | null
  payments?: DbPaymentPartial[]
}

type DbTenantWithRelations = Tables<'tenants'> & {
  leases?: DbLeaseWithRelations[]
  invitations?: Tables<'invitations'>[]
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

function mapInvitation(db: Tables<'invitations'>): Invitation {
  return {
    id: db.id,
    owner_id: db.invited_by,
    property_id: '',
    email: db.email,
    token: db.token,
    status: mapInvitationStatus(db.status),
    expires_at: db.expires_at,
    accepted_at: db.accepted_at,
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

function deriveTenantStatus(row: DbTenantWithRelations): TenantStatus {
  const hasActiveInvite = row.invitations?.some((i) => i.status === 'pending') ?? false
  if (!row.user_id && hasActiveInvite) return 'invited'
  const hasActiveLease = row.leases?.some((l) => l.status === 'aktivni') ?? false
  if (hasActiveLease) return 'active'
  return 'ended'
}

function mapTenantWithContext(row: DbTenantWithRelations): TenantWithContext {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const activeLease = row.leases?.find((l) => l.status === 'aktivni') ?? null
  const allLeases = row.leases ?? []

  const propertyId = activeLease?.property_id ?? ''
  const propertyName = activeLease?.properties?.name ?? ''
  const monthlyRent = activeLease?.monthly_rent ?? 0

  const allPayments = allLeases.flatMap((l) => l.payments ?? [])
  const unpaidCount = allPayments.filter((p) => p.status === 'overdue').length
  const thisMonthPaid = allPayments.some(
    (p) =>
      p.status === 'paid' &&
      p.period_year === currentYear &&
      p.period_month === currentMonth,
  )

  const pendingInvite = row.invitations?.find((i) => i.status === 'pending') ?? null

  const tenant: Tenant = {
    id: row.id,
    user_id: row.user_id,
    owner_id: row.owner_id,
    lease_id: activeLease?.id ?? null,
    property_id: propertyId,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  return {
    tenant,
    user: {
      id: row.user_id ?? row.id,
      full_name: row.full_name,
      avatar_url: null,
      email: row.email,
      phone: row.phone,
    },
    lease: activeLease ? mapLease(activeLease) : null,
    invitation: pendingInvite ? mapInvitation(pendingInvite) : null,
    status: deriveTenantStatus(row),
    property_name: propertyName,
    property_id: propertyId,
    monthly_rent: monthlyRent,
    paid_this_month: thisMonthPaid,
    unpaid_count: unpaidCount,
  }
}

// ── Shared select fragment ───────────────────────────────────────────────────

const TENANT_SELECT = `
  *,
  leases(
    id, monthly_rent, payment_day, start_date, end_date, status,
    property_id, tenant_id, deposit, archived_at,
    properties(id, name, city),
    payments(id, status, paid_at, period_month, period_year)
  ),
  invitations(id, status, token, expires_at, accepted_at, created_at, updated_at, email, invited_by)
` as const

// ── API ──────────────────────────────────────────────────────────────────────

export async function listTenants(): Promise<TenantWithContext[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select(TENANT_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapTenantWithContext(row as unknown as DbTenantWithRelations))
}

export async function getTenant(id: string): Promise<TenantWithContext | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select(TENANT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapTenantWithContext(data as unknown as DbTenantWithRelations) : null
}

export interface InviteDraft {
  property_id: string
  property_name: string
  full_name: string
  email: string
  monthly_rent: number
}

export async function inviteTenant(draft: InviteDraft): Promise<TenantWithContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Create tenant record
  const { data: tenantRow, error: tenantErr } = await supabase
    .from('tenants')
    .insert({ owner_id: user.id, email: draft.email, full_name: draft.full_name })
    .select('*')
    .single()

  if (tenantErr) throw tenantErr

  // 2. Create pending lease (status: ceka_na_podpis)
  const today = new Date().toISOString().split('T')[0]
  const { data: leaseRow, error: leaseErr } = await supabase
    .from('leases')
    .insert({
      property_id: draft.property_id,
      tenant_id: tenantRow.id,
      monthly_rent: draft.monthly_rent,
      start_date: today,
      status: 'ceka_na_podpis',
      deposit: 0,
      payment_day: 1,
      utilities_flat: 0,
    })
    .select('*')
    .single()

  if (leaseErr) throw leaseErr

  // 3. Create invitation (token auto-generated by DB default, expires +72h)
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
  const { data: inv, error: invErr } = await supabase
    .from('invitations')
    .insert({
      invited_by: user.id,
      email: draft.email,
      tenant_id: tenantRow.id,
      lease_id: leaseRow.id,
      expires_at: expiresAt,
      status: 'pending',
    })
    .select('token, expires_at')
    .single()

  if (invErr) throw invErr

  // Fire-and-forget invite email — neblokuje UI, failure loguje v Edge Function
  const inviteLink = `https://app.estatiq.cz/auth/accept-invite?token=${inv.token}`
  void supabase.functions.invoke('send-invite', {
    body: {
      email:         draft.email,
      tenant_name:   draft.full_name,
      property_name: draft.property_name,
      invite_link:   inviteLink,
      expires_at:    inv.expires_at,
    },
  })

  // Fetch the full context to return
  const ctx = await getTenant(tenantRow.id)
  if (!ctx) throw new Error('Tenant not found after creation')
  return ctx
}

export async function resendInvite(tenantId: string): Promise<TenantWithContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Invalidate existing pending invitations and create a new one
  const { data: existing } = await supabase
    .from('invitations')
    .select('id, lease_id, email')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Mark old invite as expired
    await supabase.from('invitations').update({ status: 'expired' }).eq('id', existing.id)

    // Create a fresh invite, select token for email
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    const { data: newInv } = await supabase
      .from('invitations')
      .insert({
        invited_by: user.id,
        email: existing.email,
        tenant_id: tenantId,
        lease_id: existing.lease_id,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select('token, expires_at')
      .maybeSingle()

    if (newInv) {
      // Fetch tenant + property names for the email (fire-and-forget)
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('full_name')
        .eq('id', tenantId)
        .single()

      let propertyName = ''
      if (existing.lease_id) {
        const { data: leaseRow } = await supabase
          .from('leases')
          .select('properties(name)')
          .eq('id', existing.lease_id)
          .single()
        propertyName = (leaseRow?.properties as { name: string } | null)?.name ?? ''
      }

      void supabase.functions.invoke('send-invite', {
        body: {
          email:         existing.email,
          tenant_name:   tenantRow?.full_name ?? '',
          property_name: propertyName,
          invite_link:   `https://app.estatiq.cz/auth/accept-invite?token=${newInv.token}`,
          expires_at:    newInv.expires_at,
        },
      })
    }
  }

  const ctx = await getTenant(tenantId)
  if (!ctx) throw new Error('Tenant not found')
  return ctx
}

// ── Invitation result ────────────────────────────────────────────────────────

export interface InvitationResult {
  token: string
  expires_at: string
  invite_link: string
}

export async function createInvitation(
  tenantId: string,
  leaseId: string,
  email: string,
): Promise<InvitationResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Expire any existing pending invitation for this tenant
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', existing.id)
  }

  // 2. Insert new invitation (token + expires_at generated by DB defaults)
  const { data: inv, error } = await supabase
    .from('invitations')
    .insert({
      invited_by: user.id,
      email,
      tenant_id: tenantId,
      lease_id: leaseId,
      status: 'pending',
    })
    .select('token, expires_at')
    .single()

  if (error) throw error

  const inviteLink = `https://app.estatiq.cz/auth/accept-invite?token=${inv.token}`

  // Fetch names for email (fire-and-forget)
  const [{ data: tenantRow }, { data: leaseRow }] = await Promise.all([
    supabase.from('tenants').select('full_name').eq('id', tenantId).single(),
    supabase.from('leases').select('properties(name)').eq('id', leaseId).single(),
  ])

  void supabase.functions.invoke('send-invite', {
    body: {
      email,
      tenant_name:   tenantRow?.full_name ?? '',
      property_name: (leaseRow?.properties as { name: string } | null)?.name ?? '',
      invite_link:   inviteLink,
      expires_at:    inv.expires_at,
    },
  })

  return {
    token:      inv.token,
    expires_at: inv.expires_at,
    invite_link: inviteLink,
  }
}

export async function endTenancy(tenantId: string): Promise<TenantWithContext> {
  // Find active lease for this tenant
  const { data: lease, error: leaseErr } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (leaseErr) throw leaseErr

  if (lease) {
    const { error } = await supabase
      .from('leases')
      .update({ status: 'ukoncena', archived_at: new Date().toISOString() })
      .eq('id', lease.id)

    if (error) throw error
  }

  const ctx = await getTenant(tenantId)
  if (!ctx) throw new Error('Tenant not found')
  return ctx
}
