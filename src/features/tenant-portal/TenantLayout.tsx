import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, CreditCard, FileText, Phone, LogOut, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { supabase } from '@/lib/supabase'
import { useTenantContext } from './hooks'

const NAV_ITEMS = [
  { key: 'dashboard', to: '/tenant/dashboard', icon: LayoutDashboard },
  { key: 'payments', to: '/tenant/payments', icon: CreditCard },
  { key: 'documents', to: '/tenant/documents', icon: FileText },
  { key: 'contact', to: '/tenant/contact', icon: Phone },
] as const

export default function TenantLayout() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { data: ctx } = useTenantContext()

  const initials = ctx?.initials ?? '??'
  const name = ctx?.full_name ?? ''
  const propertyLabel = ctx
    ? t('tenant.propertyLabel', { name: ctx.property.name, city: ctx.property.address_city })
    : ''

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950 lg:flex">
        {/* Logo + property badge */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-100 px-5 dark:border-surface-800">
          <span className="font-display text-xl font-bold text-surface-900 dark:text-surface-50">
            Estat<span className="text-emerald-600">IQ</span>
          </span>
        </div>

        {/* Property pill */}
        {propertyLabel && (
          <div className="mx-3 mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-900/20">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t('tenant.nav.dashboard')}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-surface-800 dark:text-surface-200">
              {propertyLabel}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3" aria-label="Navigace nájemníka">
          {NAV_ITEMS.map(({ key, to, icon: Icon }) => (
            <NavLink
              key={key}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-50',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400',
                    )}
                  />
                  {t(`tenant.nav.${key}`)}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User row */}
        <div className="border-t border-surface-100 p-3 dark:border-surface-800">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-surface-900 dark:text-surface-50">{name}</p>
              <p className="truncate text-[10px] text-surface-400">{t('tenant.role')}</p>
            </div>
            <button
              onClick={handleLogout}
              title={t('tenant.logout')}
              aria-label={t('tenant.logout')}
              className="shrink-0 rounded p-1 text-surface-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 dark:border-surface-800 dark:bg-surface-950 lg:px-6">
          {/* Logo on mobile */}
          <span className="font-display text-lg font-bold text-surface-900 dark:text-surface-50 lg:hidden">
            Estat<span className="text-emerald-600">IQ</span>
          </span>
          {/* Property label on desktop */}
          <p className="hidden truncate text-sm text-surface-500 dark:text-surface-400 lg:block">
            {propertyLabel}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Přepnout na světlé téma' : 'Přepnout na tmavé téma'}
              className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-surface-800 dark:hover:text-surface-200"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Avatar on mobile */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 lg:hidden">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <motion.div
            key={typeof window !== 'undefined' ? window.location.pathname : ''}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ── Bottom tab bar (mobile) ───────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950 lg:hidden"
        aria-label="Mobilní navigace"
      >
        {NAV_ITEMS.map(({ key, to, icon: Icon }) => (
          <NavLink
            key={key}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                <span>{t(`tenant.nav.${key}`)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
