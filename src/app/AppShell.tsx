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
  CalendarDays,
  Plus,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { QuickCreateSheet } from '@/features/quick-create/QuickCreateSheet'
import { WorkspaceSwitcher } from '@/features/workspace/WorkspaceSwitcher'
import { MoreMenu } from '@/features/workspace/MoreMenu'
import type { Workspace } from '@/features/workspace/types'

// ── Nav konfigurace ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   to: '/app/dashboard',   icon: LayoutDashboard },
  { key: 'properties',  to: '/app/properties',  icon: Building2 },
  { key: 'tenants',     to: '/app/tenants',     icon: Users },
  { key: 'payments',    to: '/app/payments',    icon: CreditCard },
  { key: 'documents',   to: '/app/documents',   icon: FileText },
  { key: 'energy',      to: '/app/energy',      icon: Zap },
  { key: 'taxes',       to: '/app/taxes',       icon: Receipt },
  { key: 'messages',    to: '/app/messages',    icon: MessageSquare },
  { key: 'b2b',         to: '/app/b2b',         icon: Briefcase },
] as const

const BOTTOM_ITEMS = [
  { key: 'settings', to: '/app/settings', icon: Settings },
] as const

// Spodní mobilní navigace — 4 položky + středový + tlačítko
const MOBILE_NAV = [
  { key: 'dashboard',  to: '/app/dashboard',  icon: LayoutDashboard },
  { key: 'properties', to: '/app/properties', icon: Building2 },
  // střed = quick-create (+ tlačítko)
  { key: 'calendar',   to: '/app/calendar',   icon: CalendarDays },
  { key: 'more',       to: null,              icon: MoreHorizontal },
] as const

// ── Desktop sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
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
    <aside
      style={{ width: collapsed ? 72 : 256, transition: 'width 0.22s ease-in-out' }}
      className="relative hidden shrink-0 flex-col overflow-hidden border-r border-surface-200 bg-white md:flex dark:border-surface-800 dark:bg-surface-950"
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
                <span className={cn(
                  'overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200',
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100',
                )}>
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
            <span className={cn(
              'overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100',
            )}>
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
          <div className={cn(
            'min-w-0 flex-1 overflow-hidden transition-[opacity,max-width] duration-200',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100',
          )}>
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
  )
}

// ── Mobilní spodní navigace ───────────────────────────────────────────────────

function MobileBottomNav({ onQuickCreate, onMore }: { onQuickCreate: () => void; onMore: () => void }) {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-surface-200 bg-white/95 backdrop-blur-sm md:hidden dark:border-surface-800 dark:bg-surface-950/95"
      aria-label="Mobilní navigace"
    >
      {/* Levé 2 položky */}
      {MOBILE_NAV.slice(0, 2).map(({ key, to, icon: Icon }) => (
        <NavLink
          key={key}
          to={to!}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
              <span>{t(`nav.${key}`)}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Středový + quick-create */}
      <div className="flex flex-1 justify-center">
        <button
          onClick={onQuickCreate}
          aria-label={t('nav.quickCreate')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 hover:bg-emerald-700"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Pravé 2 položky (Kalendář + Více) */}
      {MOBILE_NAV.slice(2).map(({ key, to, icon: Icon }) => {
        if (!to) {
          return (
            <button
              key={key}
              onClick={onMore}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-surface-400 hover:text-surface-600 transition-colors dark:hover:text-surface-300"
            >
              <Icon size={22} />
              <span>{t(`nav.${key}`)}</span>
            </button>
          )
        }
        return (
          <NavLink
            key={key}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                <span>{t(`nav.${key}`)}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [workspace, setWorkspace] = useState<Workspace>('manage')
  const navigate = useNavigate()

  function handleWorkspaceChange(w: Workspace) {
    setWorkspace(w)
    if (w === 'svj') void navigate('/app/svj')
    if (w === 'crm') void navigate('/app/crm')
    if (w === 'airbnb') void navigate('/app/airbnb')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Hlavní obsah */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 md:px-6 dark:border-surface-800 dark:bg-surface-950">
          {/* Mobilní logo */}
          <span className="font-display text-xl font-bold text-surface-900 dark:text-surface-50 md:hidden">
            Estat<span className="text-emerald-600">IQ</span>
          </span>

          {/* Desktop workspace switcher */}
          <div className="hidden md:block">
            <WorkspaceSwitcher value={workspace} onChange={handleWorkspaceChange} />
          </div>

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

        {/* Obsah stránky */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobilní spodní navigace */}
      <MobileBottomNav
        onQuickCreate={() => setQuickCreateOpen(true)}
        onMore={() => setMoreOpen(true)}
      />

      {/* Quick-create bottom sheet */}
      <QuickCreateSheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen} />

      {/* Hamburger "Více" menu */}
      <MoreMenu
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        workspace={workspace}
        onWorkspaceChange={handleWorkspaceChange}
      />
    </div>
  )
}
