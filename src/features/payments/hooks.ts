import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  generateMonthlyPayments,
  listPayments,
  markAsPaid,
  sendReminder,
  type MarkPaidDraft,
} from './data'

export const paymentKeys = {
  all: ['payments'] as const,
  list: () => [...paymentKeys.all, 'list'] as const,
}

export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.list(),
    queryFn: listPayments,
  })
}

export function useMarkAsPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: MarkPaidDraft) => markAsPaid(draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentKeys.all }),
  })
}

export function useSendReminder() {
  return useMutation({
    mutationFn: (paymentId: string) => sendReminder(paymentId),
  })
}

export function useGeneratePayments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (yyyymm: string) => generateMonthlyPayments(yyyymm),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentKeys.all }),
  })
}
