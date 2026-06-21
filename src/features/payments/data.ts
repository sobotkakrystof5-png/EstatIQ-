import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import type { PaymentWithContext } from '@/types/database'

export type { PaymentWithContext }

export interface MarkPaidDraft {
  paymentId: string
  paid_at: string
  note?: string
}

// ── DB row type with joins ────────────────────────────────────────────────────

type DbLeaseWithRelations = {
  id: string
  tenant_id: string
  property_id: string
  tenants: Pick<Tables<'tenants'>, 'id' | 'full_name'> | null
  properties: Pick<Tables<'properties'>, 'id' | 'name' | 'city'> | null
}

type DbPaymentWithJoins = Tables<'payments'> & {
  leases: DbLeaseWithRelations | null
}

// ── Mapper ───────────────────────────────────────────────────────────────────

function mapPayment(row: DbPaymentWithJoins): PaymentWithContext {
  const lease = row.leases
  return {
    id: row.id,
    lease_id: row.lease_id,
    tenant_id: lease?.tenant_id ?? '',
    property_id: lease?.property_id ?? '',
    owner_id: '',
    amount: row.amount,
    currency: 'CZK',
    due_date: row.due_date,
    paid_at: row.paid_at,
    status: row.status,
    type: row.type,
    note: row.note,
    stripe_payment_intent_id: null,
    variable_symbol: row.variable_symbol,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tenant: {
      id: lease?.tenant_id ?? '',
      full_name: lease?.tenants?.full_name ?? null,
      avatar_url: null,
    },
    property: {
      id: lease?.property_id ?? '',
      name: lease?.properties?.name ?? '',
      address_city: lease?.properties?.city ?? '',
    },
  }
}

// ── Shared select fragment ───────────────────────────────────────────────────

const PAYMENT_SELECT = `
  *,
  leases!inner(
    id, tenant_id, property_id,
    tenants(id, full_name),
    properties(id, name, city)
  )
` as const

// ── API ──────────────────────────────────────────────────────────────────────

export async function listPayments(): Promise<PaymentWithContext[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .order('due_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapPayment)
}

export async function markAsPaid(draft: MarkPaidDraft): Promise<PaymentWithContext> {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_at: draft.paid_at,
      paid_amount: undefined, // keep existing paid_amount
      note: draft.note ?? null,
    })
    .eq('id', draft.paymentId)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return mapPayment(data)
}

export async function generateMonthlyPayments(yyyymm: string): Promise<PaymentWithContext[]> {
  const [yearStr, monthStr] = yyyymm.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  // Get all active leases visible to this user (RLS scoped)
  const { data: leases, error: leasesErr } = await supabase
    .from('leases')
    .select('id, monthly_rent, payment_day')
    .eq('status', 'aktivni')

  if (leasesErr) throw leasesErr
  if (!leases?.length) return []

  // Find which leases already have a payment for this period
  const { data: existing, error: existErr } = await supabase
    .from('payments')
    .select('lease_id')
    .in('lease_id', leases.map((l) => l.id))
    .eq('period_year', year)
    .eq('period_month', month)

  if (existErr) throw existErr

  const alreadyHas = new Set((existing ?? []).map((p) => p.lease_id))

  const toInsert = leases
    .filter((l) => !alreadyHas.has(l.id))
    .map((l) => ({
      lease_id: l.id,
      amount: l.monthly_rent,
      due_date: `${yearStr}-${monthStr.padStart(2, '0')}-${String(l.payment_day).padStart(2, '0')}`,
      status: 'pending' as const,
      type: 'rent' as const,
      period_year: year,
      period_month: month,
    }))

  if (!toInsert.length) return []

  const { data: created, error: createErr } = await supabase
    .from('payments')
    .insert(toInsert)
    .select(PAYMENT_SELECT)

  if (createErr) throw createErr
  return (created ?? []).map(mapPayment)
}

export async function sendReminder(paymentId: string): Promise<void> {
  // TODO(fáze 2): POST to reminder Edge Function → Resend email
  void paymentId
}

// Returns a data-URI for CSV download (client-side, no async)
export function buildCSV(payments: PaymentWithContext[]): string {
  const header = ['Nájemník', 'Nemovitost', 'Město', 'Částka (Kč)', 'Splatnost', 'Zaplaceno dne', 'Stav', 'VS']
  const rows = payments.map((p) => [
    p.tenant.full_name ?? '',
    p.property.name,
    p.property.address_city,
    p.amount,
    p.due_date,
    p.paid_at ? p.paid_at.split('T')[0] : '',
    p.status,
    p.variable_symbol ?? '',
  ])
  const csv = [header, ...rows].map((r) => r.join(';')).join('\r\n')
  return `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(csv)}`
}
