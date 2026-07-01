import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Sparkles,
  BookOpen,
  Smartphone,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  CalendarDays,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import type { Workspace } from './types'

interface MoreMenuProps {
  open: boolean
  onClose: () => void
  workspace: Workspace
  onWorkspaceChange: (w: Workspace) => void
}

function PwaInstructions() {
  const { t } = useTranslation()
  return (
    <div className="mt-3 rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-600 dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-400">
      <p className="mb-2 font-semibold text-surface-800 dark:text-surface-200">{t('more.pwa.howTo')}</p>
      <ol className="space-y-1.5 list-decimal list-inside">
        <li>{t('more.pwa.step1')}</li>
        <li>{t('more.pwa.step2')}</li>
        <li>{t('more.pwa.step3')}</li>
      </ol>
      <p className="mt-2 text-xs text-surface-400">{t('more.pwa.result')}</p>
    </div>
  )
}

type TreeItem = { key: string; to: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const TREE_ITEMS: TreeItem[] = [
  { key: 'dashboard',  to: '/app/dashboard',  icon: LayoutDashboard },
  { key: 'properties', to: '/app/properties', icon: Building2 },
  { key: 'tenants',    to: '/app/tenants',    icon: Users },
  { key: 'payments',   to: '/app/payments',   icon: Receipt },
  { key: 'calendar',   to: '/app/calendar',   icon: CalendarDays },
  { key: 'tasks',      to: '/app/tasks',      icon: CheckSquare },
  { key: 'svj',        to: '/app/svj',        icon: ShieldCheck },
]

export function MoreMenu({ open, onClose, workspace, onWorkspaceChange }: MoreMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pwaOpen, setPwaOpen] = useState(false)
  const [menuExpanded, setMenuExpanded] = useState(false)

  function go(to: string) {
    void navigate(to)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-full flex-col overflow-y-auto bg-white shadow-2xl dark:bg-surface-900"
            role="dialog"
            aria-modal="true"
            aria-label={t('more.title')}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-100 p-5 dark:border-surface-800">
              <h2 className="font-display text-lg font-bold text-surface-900 dark:text-surface-50">
                {t('more.title')}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 transition-colors dark:hover:bg-surface-800"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 p-5">
              {/* Workspace switcher */}
              <WorkspaceSwitcher
                value={workspace}
                onChange={(w) => { onWorkspaceChange(w); onClose() }}
                className="flex-wrap gap-y-2"
              />

              {/* Rychlé akce */}
              <div className="space-y-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">
                  {t('more.quickActions')}
                </p>

                <button
                  onClick={() => go('/app/dashboard')}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{t('more.aiAssistant')}</p>
                    <p className="text-xs text-surface-400">{t('more.aiAssistantDesc')}</p>
                  </div>
                </button>

                <button
                  onClick={() => go('/app/dashboard')}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{t('more.guide')}</p>
                    <p className="text-xs text-surface-400">{t('more.guideDesc')}</p>
                  </div>
                </button>

                <button
                  onClick={() => setPwaOpen((v) => !v)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Smartphone size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{t('more.addToHome')}</p>
                    <p className="text-xs text-surface-400">{t('more.addToHomeDesc')}</p>
                  </div>
                  {pwaOpen ? <ChevronDown size={16} className="text-surface-400" /> : <ChevronRight size={16} className="text-surface-400" />}
                </button>

                <AnimatePresence>
                  {pwaOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden px-1"
                    >
                      <PwaInstructions />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu strom */}
              <div>
                <button
                  onClick={() => setMenuExpanded((v) => !v)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-widest text-surface-400',
                    'hover:text-surface-600 transition-colors dark:hover:text-surface-300',
                  )}
                >
                  {t('more.menuTree')}
                  {menuExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <AnimatePresence>
                  {menuExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pt-1">
                        {TREE_ITEMS.map(({ key, to, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => go(to)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-50"
                          >
                            <Icon size={16} className="text-surface-400" />
                            {t(`nav.${key}`)}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
