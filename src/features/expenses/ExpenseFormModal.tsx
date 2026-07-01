import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Input, Select, Button } from '@/components/ui'
import { useCreateExpense } from './hooks'
import { useQuery } from '@tanstack/react-query'
import { listProperties } from '@/features/properties/data'
import type { ExpenseDraft } from './data'

type ExpenseCategory = ExpenseDraft['category']
type TaxDeductible = ExpenseDraft['tax_deductible']

const CATEGORIES: ExpenseCategory[] = ['opravy', 'pojistne', 'sluzby', 'sprava', 'danove_poplatky', 'energie', 'reklama', 'jine']

interface FormState {
  property_id: string
  category: ExpenseCategory
  description: string
  amount: string
  expense_date: string
  tax_deductible: TaxDeductible
}

const today = new Date().toISOString().split('T')[0]!

const EMPTY: FormState = {
  property_id: '',
  category: 'opravy',
  description: '',
  amount: '',
  expense_date: today,
  tax_deductible: 'no',
}

interface ExpenseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseFormModal({ open, onOpenChange }: ExpenseFormModalProps) {
  const { t } = useTranslation()
  const create = useCreateExpense()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: properties } = useQuery({ queryKey: ['properties'], queryFn: listProperties })

  function patch(p: Partial<FormState>) { setForm((f) => ({ ...f, ...p })) }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.property_id) next.property_id = t('expenses.form.propertyRequired')
    if (!form.description.trim()) next.description = t('expenses.form.descriptionRequired')
    if (!form.amount || isNaN(Number(form.amount.replace(/\s/g, '')))) next.amount = t('expenses.form.amountRequired')
    if (!form.expense_date) next.expense_date = t('expenses.form.dateRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    create.mutate(
      {
        property_id: form.property_id,
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount.replace(/\s/g, '')),
        expense_date: form.expense_date,
        tax_deductible: form.tax_deductible,
      },
      {
        onSuccess: () => { setForm(EMPTY); onOpenChange(false) },
      },
    )
  }

  const propertyOptions = [
    { value: '', label: t('expenses.form.selectProperty') },
    ...(properties ?? []).map((p) => ({ value: p.id, label: p.name })),
  ]

  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: t(`expenses.category.${c}`),
  }))

  const taxOptions = [
    { value: 'no', label: t('expenses.tax.no') },
    { value: 'yes', label: t('expenses.tax.yes') },
    { value: 'pausal_30', label: t('expenses.tax.pausal30') },
  ]

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('expenses.form.title')}
      description={t('expenses.form.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Select
          id="expense-property"
          label={t('expenses.form.property')}
          value={form.property_id}
          onValueChange={(v) => patch({ property_id: v })}
          options={propertyOptions}
        />
        {errors.property_id && (
          <p className="-mt-3 text-xs text-red-600 dark:text-red-400">{errors.property_id}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="expense-category"
            label={t('expenses.form.category')}
            value={form.category}
            onValueChange={(v) => patch({ category: v as ExpenseCategory })}
            options={categoryOptions}
          />
          <Input
            label={t('expenses.form.date')}
            type="date"
            value={form.expense_date}
            error={errors.expense_date}
            onChange={(e) => patch({ expense_date: e.target.value })}
          />
        </div>

        <Input
          label={t('expenses.form.description')}
          placeholder={t('expenses.form.descriptionPlaceholder')}
          value={form.description}
          error={errors.description}
          autoFocus
          onChange={(e) => patch({ description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('expenses.form.amount')}
            inputMode="numeric"
            className="font-tabular"
            rightIcon={<span className="text-sm font-medium">Kč</span>}
            value={form.amount}
            error={errors.amount}
            onChange={(e) => patch({ amount: e.target.value })}
          />
          <Select
            id="expense-tax"
            label={t('expenses.form.taxDeductible')}
            value={form.tax_deductible}
            onValueChange={(v) => patch({ tax_deductible: v as TaxDeductible })}
            options={taxOptions}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={create.isPending}>
            {t('expenses.form.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
