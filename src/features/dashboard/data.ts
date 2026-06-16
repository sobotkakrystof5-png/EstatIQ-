import { supabase } from '@/lib/supabase'

const MONTH_LABELS_CS = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

function monthPrefix(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  incomeThisMonth: number
  incomeTrend: number        // % change vs last month
  propertiesTotal: number
  propertiesOccupied: number // active leases count
  occupancyPct: number       // propertiesOccupied / propertiesTotal * 100
  pendingAmount: number      // SUM(amount WHERE status='pending')
  overdueAmount: number      // SUM(amount WHERE status='overdue')
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

  const [propertiesRes, thisMonthRes, prevMonthRes, pendingRes, overdueRes] = await Promise.all([
    supabase.from('properties').select('status').is('archived_at', null),
    supabase.from('payments').select('amount, status').like('due_date', `${currentPrefix}%`),
    supabase.from('payments').select('amount, status').like('due_date', `${prevPrefix}%`),
    supabase.from('payments').select('amount').eq('status', 'pending'),
    supabase.from('payments').select('amount').eq('status', 'overdue'),
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

  return {
    incomeThisMonth,
    incomeTrend,
    propertiesTotal,
    propertiesOccupied,
    occupancyPct,
    pendingAmount,
    overdueAmount,
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
