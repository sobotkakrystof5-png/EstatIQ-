import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listExpenses, createExpense, type ExpenseDraft, type DbExpense } from './data'

export function useExpenses() {
  return useQuery<DbExpense[]>({ queryKey: ['expenses'], queryFn: listExpenses })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: ExpenseDraft) => createExpense(draft),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['expenses'] }) },
  })
}
