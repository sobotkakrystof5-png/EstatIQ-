import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { Enums } from '@/types/supabase'
import type { DocumentCategory, DocumentWithContext } from '@/types/database'

export type { DocumentWithContext }

export interface UploadDraft {
  name: string
  category: DocumentCategory
  property_id: string | null
  tenant_id: string | null  // used to look up lease_id
  file: File
}

// ── Enum mappers ─────────────────────────────────────────────────────────────

function mapCategory(s: Enums<'document_category'>): DocumentCategory {
  const map: Record<Enums<'document_category'>, DocumentCategory> = {
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

function toDbCategory(c: DocumentCategory): Enums<'document_category'> {
  const map: Record<DocumentCategory, Enums<'document_category'>> = {
    lease: 'najemni_smlouva',
    protocol: 'predavaci_protokol',
    insurance: 'pojistka',
    invoice: 'faktura',
    correspondence: 'korespondence',
    other: 'jine',
  }
  return map[c]
}

// ── DB row type with joins ────────────────────────────────────────────────────

type DbLeaseWithTenant = {
  tenant_id: string
  tenants: Pick<Tables<'tenants'>, 'id' | 'full_name'> | null
}

type DbDocumentWithJoins = Tables<'documents'> & {
  properties: Pick<Tables<'properties'>, 'id' | 'name' | 'city'> | null
  leases: DbLeaseWithTenant | null
}

// ── Mapper ───────────────────────────────────────────────────────────────────

function mapDocument(row: DbDocumentWithJoins): DocumentWithContext {
  return {
    id: row.id,
    owner_id: row.uploaded_by,
    property_id: row.property_id,
    tenant_id: row.leases?.tenant_id ?? null,
    lease_id: row.lease_id,
    category: mapCategory(row.category),
    name: row.name,
    file_url: row.file_url,
    file_size_bytes: row.file_size,
    mime_type: row.mime_type,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    property: row.properties
      ? { id: row.properties.id, name: row.properties.name, address_city: row.properties.city }
      : null,
    tenant: row.leases?.tenants
      ? { id: row.leases.tenants.id, full_name: row.leases.tenants.full_name, avatar_url: null }
      : null,
  }
}

// ── Shared select fragment ───────────────────────────────────────────────────

const DOCUMENT_SELECT = `
  *,
  properties(id, name, city),
  leases(
    tenant_id,
    tenants(id, full_name)
  )
` as const

// ── API ──────────────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<DocumentWithContext[]> {
  const { data, error } = await supabase
    .from('documents')
    .select(DOCUMENT_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapDocument)
}

export async function uploadDocument(draft: UploadDraft): Promise<DocumentWithContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Upload file to Storage
  const ext = draft.file.name.split('.').pop() ?? 'bin'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(path, draft.file, { upsert: false })

  if (uploadErr) throw uploadErr

  const {
    data: { publicUrl },
  } = supabase.storage.from('documents').getPublicUrl(path)

  // 2. Find lease_id if property + tenant are both selected
  let leaseId: string | null = null
  if (draft.property_id && draft.tenant_id) {
    const { data: lease } = await supabase
      .from('leases')
      .select('id')
      .eq('property_id', draft.property_id)
      .eq('tenant_id', draft.tenant_id)
      .in('status', ['aktivni', 'ceka_na_podpis'])
      .limit(1)
      .maybeSingle()

    leaseId = lease?.id ?? null
  }

  // 3. Insert document row
  const { data, error } = await supabase
    .from('documents')
    .insert({
      uploaded_by: user.id,
      property_id: draft.property_id,
      lease_id: leaseId,
      category: toDbCategory(draft.category),
      name: draft.name.trim(),
      file_url: publicUrl,
      file_size: draft.file.size,
      mime_type: draft.file.type || 'application/octet-stream',
    })
    .select(DOCUMENT_SELECT)
    .single()

  if (error) throw error
  return mapDocument(data)
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
  // TODO(fáze 2): also remove file from Storage bucket
}
