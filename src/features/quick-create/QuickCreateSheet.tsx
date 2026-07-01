import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building2,
  Users,
  FileSignature,
  CreditCard,
  Receipt,
  CheckSquare,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PropertyFormModal } from '@/features/properties/PropertyFormModal'
import { InviteTenantModal } from '@/features/tenants/InviteTenantModal'

interface QuickCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CreateItem {
  key: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconBg: string
  iconColor: string
}

const ITEMS: CreateItem[] = [
  { key: 'property',  icon: Building2,      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-700 dark:text-emerald-400' },
  { key: 'tenant',    icon: Users,          iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',   iconColor: 'text-indigo-700 dark:text-indigo-400'  },
  { key: 'lease',     icon: FileSignature,  iconBg: 'bg-blue-100 dark:bg-blue-900/30',       iconColor: 'text-blue-700 dark:text-blue-400'      },
  { key: 'payment',   icon: CreditCard,     iconBg: 'bg-amber-100 dark:bg-amber-900/30',     iconColor: 'text-amber-700 dark:text-amber-400'    },
  { key: 'expense',   icon: Receipt,        iconBg: 'bg-rose-100 dark:bg-rose-900/30',       iconColor: 'text-rose-700 dark:text-rose-400'      },
  { key: 'task',      icon: CheckSquare,    iconBg: 'bg-violet-100 dark:bg-violet-900/30',   iconColor: 'text-violet-700 dark:text-violet-400'  },
]

export function QuickCreateSheet({ open, onOpenChange }: QuickCreateSheetProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [propertyOpen, setPropertyOpen] = useState(false)
  const [tenantOpen, setTenantOpen] = useState(false)

  function close() { onOpenChange(false) }

  function handleItem(key: string) {
    close()
    switch (key) {
      case 'property':
        setPropertyOpen(true)
        break
      case 'tenant':
        setTenantOpen(true)
        break
      case 'lease':
        void navigate('/app/tenants')
        break
      case 'payment':
        void navigate('/app/payments')
        break
      case 'expense':
        void navigate('/app/expenses')
        break
      case 'task':
        void navigate('/app/calendar')
        break
    }
  }

  return (
    <>
      {/* Backdrop + sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={close}
              aria-hidden="true"
            />

            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-8 pt-3 shadow-2xl md:hidden dark:bg-surface-900"
              role="dialog"
              aria-modal="true"
              aria-label={t('quickCreate.title')}
            >
              {/* Grabber */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-200 dark:bg-surface-700" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <h2 className="font-display text-lg font-bold text-surface-900 dark:text-surface-50">
                  {t('quickCreate.title')}
                </h2>
                <button
                  onClick={close}
                  aria-label={t('common.close')}
                  className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors dark:hover:bg-surface-800 dark:hover:text-surface-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-3 px-5">
                {ITEMS.map(({ key, icon: Icon, iconBg, iconColor }) => (
                  <button
                    key={key}
                    onClick={() => handleItem(key)}
                    className={cn(
                      'flex flex-col items-center gap-2.5 rounded-2xl border border-surface-100 bg-surface-50 px-3 py-4',
                      'transition-all duration-150 active:scale-95 hover:border-surface-200 hover:bg-white',
                      'dark:border-surface-800 dark:bg-surface-800/50 dark:hover:bg-surface-800',
                    )}
                  >
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
                      <Icon size={20} className={iconColor} />
                    </div>
                    <span className="text-xs font-medium leading-tight text-surface-700 dark:text-surface-300">
                      {t(`quickCreate.items.${key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sub-modály */}
      <PropertyFormModal open={propertyOpen} onOpenChange={setPropertyOpen} />
      <InviteTenantModal open={tenantOpen} onOpenChange={setTenantOpen} />
    </>
  )
}
