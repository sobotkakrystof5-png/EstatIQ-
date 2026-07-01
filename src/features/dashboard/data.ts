import { supabase } from '@/lib/supabase'

const MONTH_LABELS_CS = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

function monthPrefix(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  incomeThisMonth: number
  incomeTrend: number
  propertiesTotal: number
  propertiesOccupied: number
  occupancyPct: number
  pendingAmount: number
  overdueAmount: number
  tenantsCount: number
  leasesCount: number
  tasksCount: number
  expensesThisMonth: number
  cashflow: number
  insuranceCount: number
  loansMonthlyTotal: number
  metersCount: number
}

export interface TenantPreview {
  id: string
  fullName: string
  email: string
}

export interface PropertyPreview {
  id: string
  name: string
  city: string
  status: string
}

export interface RecentPayment {
  id: string
  tenantName: string
  propertyName: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'canceled'
  dueDate: string
}

export interface DashboardNotification {
  id: string
  title: string
  body: string | null
  type: string
  createdAt: string
  readAt: string | null
}

export interface ChartPoint {
  month: string
  income: number
  occupancy: number
}

// ── Internal query types ──────────────────────────────────────────────────────

type RawRecentPayment = {
  id: string
  amount: number
  status: string
  due_date: string
  leases: {
    properties: { name: string } | null
    tenants: { full_name: string } | null
  } | null
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth() + 1

  const currentPrefix = monthPrefix(currentYear, currentMonth)
  const prevPrefix = monthPrefix(prevYear, prevMonth)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const [
    propertiesRes, thisMonthRes, prevMonthRes, pendingRes, overdueRes,
    tenantsRes, leasesRes, tasksRes, expensesRes, loansRes, metersRes,
  ] = await Promise.all([
    supabase.from('properties').select('status, insurance_policy_number').is('archived_at', null),
    supabase.from('payments').select('amount, status').like('due_date', `${currentPrefix}%`),
    supabase.from('payments').select('amount, status').like('due_date', `${prevPrefix}%`),
    supabase.from('payments').select('amount').eq('status', 'pending'),
    supabase.from('payments').select('amount').eq('status', 'overdue'),
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    supabase.from('leases').select('id', { count: 'exact', head: true }).eq('status', 'aktivni'),
    db.from('calendar_events').select('id', { count: 'exact', head: true }).eq('status', 'open') as Promise<{ count: number | null }>,
    supabase.from('expenses').select('amount').like('expense_date', `${currentPrefix}%`),
    db.from('loans').select('monthly_payment') as Promise<{ data: Array<{ monthly_payment: number | null }> | null }>,
    supabase.from('energy_readings').select('id', { count: 'exact', head: true }).like('reading_date', `${currentPrefix}%`),
  ])

  const properties = propertiesRes.data ?? []
  const thisMonth = thisMonthRes.data ?? []
  const prevMonthPayments = prevMonthRes.data ?? []
  const pendingPayments = pendingRes.data ?? []
  const overduePayments = overdueRes.data ?? []

  const incomeThisMonth = thisMonth
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)

  const incomeLastMonth = prevMonthPayments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)

  const incomeTrend =
    incomeLastMonth > 0
      ? Math.round(((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100)
      : 0

  const pendingAmount = pendingPayments.reduce((s, p) => s + p.amount, 0)
  const overdueAmount = overduePayments.reduce((s, p) => s + p.amount, 0)

  const propertiesTotal = properties.length
  const propertiesOccupied = properties.filter((p) => p.status === 'pronajata').length
  const occupancyPct = propertiesTotal > 0 ? Math.round((propertiesOccupied / propertiesTotal) * 100) : 0

  const expensesThisMonth = (expensesRes.data ?? []).reduce((s, e) => s + e.amount, 0)
  const loansData = (loansRes as unknown as { data: Array<{ monthly_payment: number | null }> | null }).data ?? []
  const loansMonthlyTotal = loansData.reduce((s, l) => s + (l.monthly_payment ?? 0), 0)
  const tasksCount = (tasksRes as unknown as { count: number | null }).count ?? 0
  const insuranceCount = properties.filter((p) => p.insurance_policy_number).length

  return {
    incomeThisMonth,
    incomeTrend,
    propertiesTotal,
    propertiesOccupied,
    occupancyPct,
    pendingAmount,
    overdueAmount,
    tenantsCount: tenantsRes.count ?? 0,
    leasesCount: leasesRes.count ?? 0,
    tasksCount,
    expensesThisMonth,
    cashflow: incomeThisMonth - expensesThisMonth,
    insuranceCount,
    loansMonthlyTotal,
    metersCount: metersRes.count ?? 0,
  }
}

export async function fetchRecentPayments(): Promise<RecentPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `id, amount, status, due_date,
       leases(
         properties(name),
         tenants(full_name)
       )`,
    )
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data as unknown as RawRecentPayment[]).map((p) => ({
    id: p.id,
    tenantName: p.leases?.tenants?.full_name ?? '—',
    propertyName: p.leases?.properties?.name ?? '—',
    amount: p.amount,
    status: p.status as RecentPayment['status'],
    dueDate: p.due_date,
  }))
}

export async function fetchNotifications(): Promise<DashboardNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, type, created_at, read_at')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    createdAt: n.created_at,
    readAt: n.read_at,
  }))
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function fetchIncomeChart(): Promise<ChartPoint[]> {
  const now = new Date()

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_LABELS_CS[d.getMonth()] }
  })

  const [paymentsRes, propertiesRes] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, period_month, period_year')
      .eq('status', 'paid')
      .gte('due_date', monthPrefix(months[0].year, months[0].month) + '-01'),
    supabase.from('properties').select('status').is('archived_at', null),
  ])

  const payments = paymentsRes.data ?? []
  const properties = propertiesRes.data ?? []
  const totalProps = properties.length
  const occupiedProps = properties.filter((p) => p.status === 'pronajata').length
  const occupancyPct = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0

  return months.map(({ year, month, label }) => ({
    month: label,
    income: payments
      .filter((p) => p.period_year === year && p.period_month === month)
      .reduce((s, p) => s + p.amount, 0),
    // TODO(fáze 2): track occupancy per month historically
    occupancy: occupancyPct,
  }))
}

export async function fetchDashboardTenantsPreview(): Promise<TenantPreview[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, full_name, email')
    .limit(5)

  if (error) throw error

  return (data ?? []).map((t) => ({
    id: t.id,
    fullName: t.full_name,
    email: t.email,
  }))
}

export async function fetchDashboardPropertiesPreview(): Promise<PropertyPreview[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, city, status')
    .is('archived_at', null)
    .limit(5)

  if (error) throw error

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    status: p.status,
  }))
}
