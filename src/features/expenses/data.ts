import { supabase } from '@/lib/supabase'

type ExpenseCategory = 'opravy' | 'pojistne' | 'sluzby' | 'sprava' | 'danove_poplatky' | 'energie' | 'reklama' | 'jine'
type TaxDeductible = 'yes' | 'no' | 'pausal_30'

export interface DbExpense {
  id: string
  property_id: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  tax_deductible: TaxDeductible
  receipt_url: string | null
  supplier: string | null
  invoice_number: string | null
  lease_id: string | null
  period_month: number | null
  period_year: number | null
  created_at: string
  updated_at: string
}

export interface ExpenseDraft {
  property_id: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  tax_deductible: TaxDeductible
  receipt_url?: string | null
  supplier?: string | null
}

export async function listExpenses(): Promise<DbExpense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as DbExpense[]
}

export async function createExpense(draft: ExpenseDraft): Promise<DbExpense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      property_id: draft.property_id,
      category: draft.category,
      description: draft.description,
      amount: draft.amount,
      expense_date: draft.expense_date,
      tax_deductible: draft.tax_deductible,
      receipt_url: draft.receipt_url ?? null,
      supplier: draft.supplier ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as unknown as DbExpense
}
