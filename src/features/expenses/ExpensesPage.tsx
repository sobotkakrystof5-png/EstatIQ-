import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Plus, Receipt } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDateShort } from '@/lib/formatters'
import { useExpenses } from './hooks'
import { ExpenseFormModal } from './ExpenseFormModal'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  opravy: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  pojistne: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sluzby: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  sprava: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  danove_poplatky: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  energie: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  reklama: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  jine: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
}

export default function ExpensesPage() {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const { data: expenses, isLoading } = useExpenses()

  const totalThisYear = expenses
    ?.filter((e) => new Date(e.expense_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, e) => sum + e.amount, 0) ?? 0

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('expenses.title')}
          </h1>
          <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
            {t('expenses.subtitle')}
          </p>
        </motion.div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
          {t('expenses.add')}
        </Button>
      </div>

      <Card padding="lg" className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
            <Receipt size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm text-surface-500 dark:text-surface-400">{t('expenses.totalThisYear')}</p>
            <p className="font-display text-2xl font-bold tabular-nums text-surface-900 dark:text-surface-50">
              {formatCurrency(totalThisYear)}
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100 dark:bg-surface-800" />
          ))}
        </div>
      ) : !expenses?.length ? (
        <EmptyState
          title={t('expenses.empty.title')}
          description={t('expenses.empty.description')}
          action={
            <Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
              {t('expenses.add')}
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {expenses.map((expense, i) => (
              <motion.li
                key={expense.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 first:pt-5 last:pb-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                      {expense.description}
                    </p>
                    <span className={cn(
                      'hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block',
                      CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.jine,
                    )}>
                      {t(`expenses.category.${expense.category}`)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-surface-400">
                    {formatDateShort(new Date(expense.expense_date))}
                    {expense.tax_deductible !== 'no' && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                        · {t('expenses.taxDeductible')}
                      </span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 font-tabular text-sm font-semibold text-surface-900 dark:text-surface-50">
                  {formatCurrency(expense.amount)}
                </p>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      <ExpenseFormModal open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
