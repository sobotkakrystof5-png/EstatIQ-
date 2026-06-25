import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'

// ── Wizard draft types ────────────────────────────────────────────────────────

export interface WizardPropertyDraft {
  name: string
  street: string
  city: string
  zip: string
}

export interface WizardTenantDraft {
  full_name: string
  email: string
  monthly_rent: number
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface TenantAndInviteResult {
  tenant: Tables<'tenants'>
  lease: Tables<'leases'>
  invitation: Tables<'invitations'>
  inviteLink: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function createPropertyFromWizard(draft: WizardPropertyDraft): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('properties')
    .insert({
      owner_id: user.id,
      name: draft.name,
      address: draft.street,
      city: draft.city || 'Neuvedeno',
      postal_code: draft.zip || null,
      country: 'CZ',
      type: 'byt',
      status: 'volna',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function createTenantAndInvite(
  propertyId: string,
  tenantDraft: WizardTenantDraft,
): Promise<TenantAndInviteResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Tenant (user_id=null — vyplní se až po přijetí pozvánky)
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({
      owner_id: user.id,
      full_name: tenantDraft.full_name,
      email: tenantDraft.email,
    })
    .select('*')
    .single()

  if (tenantErr) throw tenantErr

  // 2. Lease — rovnou aktivní, payment_day=1 dle CLAUDE.md defaultu
  const today = new Date().toISOString().split('T')[0]
  const { data: lease, error: leaseErr } = await supabase
    .from('leases')
    .insert({
      property_id: propertyId,
      tenant_id: tenant.id,
      monthly_rent: tenantDraft.monthly_rent,
      start_date: today,
      status: 'aktivni',
      deposit: 0,
      payment_day: 1,
      utilities_flat: 0,
    })
    .select('*')
    .single()

  if (leaseErr) throw leaseErr

  // Sync property status → pronajata
  await supabase
    .from('properties')
    .update({ status: 'pronajata' })
    .eq('id', propertyId)

  // 3. Invitation — token + expires_at generuje DB default (+72 h, jednorázový)
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
  const { data: invitation, error: invErr } = await supabase
    .from('invitations')
    .insert({
      invited_by: user.id,
      email: tenantDraft.email,
      tenant_id: tenant.id,
      lease_id: lease.id,
      expires_at: expiresAt,
      status: 'pending',
    })
    .select('*')
    .single()

  if (invErr) throw invErr

  const inviteLink = `https://app.estatiq.cz/auth/accept-invite?token=${invitation.token}`

  // Fire-and-forget invite email
  supabase
    .from('properties')
    .select('name')
    .eq('id', propertyId)
    .single()
    .then(({ data: prop }) => {
      void supabase.functions.invoke('send-invite', {
        body: {
          email:         tenantDraft.email,
          tenant_name:   tenantDraft.full_name,
          property_name: prop?.name ?? '',
          invite_link:   inviteLink,
          expires_at:    invitation.expires_at,
        },
      })
    })

  return { tenant, lease, invitation, inviteLink }
}
