import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { Enums } from '@/types/supabase'
import type { Organization, OrganizationMember, OrgMemberRole } from '@/types/database'

export interface MemberWithUser extends OrganizationMember {
  user: {
    id: string
    full_name: string
    email: string
    initials: string
  }
}

// ── Enum mappers ─────────────────────────────────────────────────────────────

function mapOrgRole(s: Enums<'org_member_role'>): OrgMemberRole {
  const map: Record<Enums<'org_member_role'>, OrgMemberRole> = {
    admin: 'admin',
    spravce: 'manager',
    accountant: 'accountant',
    viewer: 'viewer',
  }
  return map[s]
}

function toDbRole(r: OrgMemberRole): Enums<'org_member_role'> {
  const map: Record<OrgMemberRole, Enums<'org_member_role'>> = {
    admin: 'admin',
    manager: 'spravce',
    accountant: 'accountant',
    viewer: 'viewer',
  }
  return map[r]
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

// ── DB row types with joins ───────────────────────────────────────────────────

type DbOrgRow = Pick<Tables<'organizations'>, 'id' | 'name' | 'slug' | 'logo_url' | 'created_at' | 'updated_at'>

type DbMemberWithProfile = Tables<'organization_members'> & {
  profiles: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'> | null
}

// ── Helper — current user's org ───────────────────────────────────────────────

async function getCurrentUserAndOrgId(): Promise<{ userId: string; orgId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('No organization found for this user')

  return { userId: user.id, orgId: data.organization_id }
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function getOrganization(): Promise<Organization> {
  const { userId, orgId } = await getCurrentUserAndOrgId()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, created_at, updated_at')
    .eq('id', orgId)
    .single()

  if (error) throw error

  const org = data as DbOrgRow
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo_url: org.logo_url,
    owner_id: userId,        // DB has no owner_id; use current user as proxy
    subscription_id: null,   // TODO(fáze 2): join with subscriptions
    created_at: org.created_at,
    updated_at: org.updated_at,
  }
}

export async function getMembers(): Promise<MemberWithUser[]> {
  const { orgId } = await getCurrentUserAndOrgId()

  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles!organization_members_user_id_fkey(id, full_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const r = row as DbMemberWithProfile
    const profile = r.profiles
    return {
      id: r.id,
      organization_id: r.organization_id,
      user_id: r.user_id,
      role: mapOrgRole(r.role),
      invited_by: r.invited_by,
      joined_at: r.joined_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: {
        id: profile?.id ?? r.user_id,
        full_name: profile?.full_name ?? '',
        email: profile?.email ?? '',
        initials: toInitials(profile?.full_name ?? null),
      },
    }
  })
}

export async function inviteMember(_email: string, _role: OrgMemberRole): Promise<{ token: string }> {
  // TODO(fáze 2): Edge Function → vyhledat/vytvořit profil dle e-mailu, přidat do organization_members + Resend email
  // Přímá pozvánka přes API vyžaduje serverovou logiku (hledání uživatele dle e-mailu je citlivá operace)
  throw new Error('inviteMember: not yet implemented — requires Edge Function')
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
}

export async function updateMemberRole(memberId: string, role: OrgMemberRole): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role: toDbRole(role) })
    .eq('id', memberId)

  if (error) throw error
}
