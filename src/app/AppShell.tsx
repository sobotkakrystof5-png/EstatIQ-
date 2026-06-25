import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileText,
  Zap,
  Receipt,
  MessageSquare,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'

const NAV_ITEMS = [
  { key: 'dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { key: 'properties', to: '/app/properties', icon: Building2 },
  { key: 'tenants', to: '/app/tenants', icon: Users },
  { key: 'payments', to: '/app/payments', icon: CreditCard },
  { key: 'documents', to: '/app/documents', icon: FileText },
  { key: 'energy', to: '/app/energy', icon: Zap },
  { key: 'taxes', to: '/app/taxes', icon: Receipt },
  { key: 'messages', to: '/app/messages', icon: MessageSquare },
  { key: 'b2b', to: '/app/b2b', icon: Briefcase },
] as const

const BOTTOM_ITEMS = [
  { key: 'settings', to: '/app/settings', icon: Settings },
] as const

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  async function handleLogout() {
    await signOut()
    void navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        style={{ width: collapsed ? 72 : 256, transition: 'width 0.22s ease-in-out' }}
        className="relative flex shrink-0 flex-col overflow-hidden border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950"
      >
        {/* Logo */}
        <div className={cn(
          'flex h-16 shrink-0 items-center border-b border-surface-100 dark:border-surface-800',
          collapsed ? 'justify-center px-0' : 'justify-between px-5',
        )}>
          <span className="font-display text-xl font-bold text-surface-900 dark:text-surface-50 whitespace-nowrap">
            {collapsed
              ? <span className="text-emerald-600">E</span>
              : <>Estat<span className="text-emerald-600">IQ</span></>
            }
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-4" aria-label="Hlavní navigace">
          {NAV_ITEMS.map(({ key, to, icon: Icon }) => (
            <NavLink
              key={key}
              to={to}
              title={collapsed ? t(`nav.${key}`) : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-50',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-300',
                    )}
                  />
                  <span
                    className={cn(
                      'overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200',
                      collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100',
                    )}
                  >
                    {t(`nav.${key}`)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-surface-100 p-2 dark:border-surface-800">
          {BOTTOM_ITEMS.map(({ key, to, icon: Icon }) => (
            <NavLink
              key={key}
              to={to}
              title={collapsed ? t(`nav.${key}`) : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <Icon size={18} className="shrink-0 text-surface-400" />
              <span
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200',
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100',
                )}
              >
                {t(`nav.${key}`)}
              </span>
            </NavLink>
          ))}

          {/* User row */}
          <div className={cn(
            'mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5',
            collapsed && 'justify-center px-0',
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {initials}
            </div>
            <div
              className={cn(
                'min-w-0 flex-1 overflow-hidden transition-[opacity,max-width] duration-200',
                collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100',
              )}
            >
              <p className="truncate text-xs font-semibold text-surface-900 dark:text-surface-50">
                {profile?.full_name ?? ''}
              </p>
              <p className="truncate text-[10px] text-surface-400">{profile?.email ?? ''}</p>
            </div>
            {!collapsed && (
              <button
                onClick={() => { void handleLogout() }}
                title={t('nav.logout')}
                className="shrink-0 rounded p-1 text-surface-400 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={t('nav.logout')}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t('nav.expandMenu') : t('nav.collapseMenu')}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-surface-200 bg-white text-surface-400 shadow-sm transition-colors hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:hover:text-surface-200"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-6 dark:border-surface-800 dark:bg-surface-950">
          <div />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              aria-label="Upozornění"
              className="relative rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-surface-800 dark:hover:text-surface-200"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            </button>

            <ThemeSwitcher />
          </div>
        </header>

        {/* Page content — no JS animation wrapper, instant render */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
