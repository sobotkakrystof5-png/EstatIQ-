import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchRecentPayments,
  fetchIncomeChart,
  fetchNotifications,
  markNotificationRead,
} from './data'

export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard', 'stats'], queryFn: fetchDashboardStats })
}

export function useRecentPayments() {
  return useQuery({ queryKey: ['dashboard', 'recentPayments'], queryFn: fetchRecentPayments })
}

export function useIncomeChart() {
  return useQuery({ queryKey: ['dashboard', 'chart'], queryFn: fetchIncomeChart })
}

export function useNotifications() {
  return useQuery({ queryKey: ['dashboard', 'notifications'], queryFn: fetchNotifications })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'notifications'] }),
  })
}
