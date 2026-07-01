/* eslint-disable react-refresh/only-export-components -- route config file: it exports `router`, not refreshable components */
import { createBrowserRouter, Navigate, Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './AppShell'
import TenantLayout from '@/features/tenant-portal/TenantLayout'
import AuthLayout from './AuthLayout'
import { SkeletonCard } from '@/components/ui/Skeleton'
import ProtectedRoute from '@/features/auth/ProtectedRoute'

// Lazy-loaded pages
const LandingPage = lazy(() => import('@/features/dashboard/LandingPage'))
const PrelaunchPage = lazy(() => import('@/features/dashboard/PrelaunchPage'))
const LoginPage = lazy(() => import('@/features/dashboard/LoginPage'))
const RegisterPage = lazy(() => import('@/features/dashboard/RegisterPage'))
const OnboardingWizard = lazy(() => import('@/features/onboarding/OnboardingWizard'))
const DashboardShell = lazy(() => import('@/features/dashboard/DashboardShell'))
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'))
const SvjPage = lazy(() => import('@/features/svj/SvjPage'))
const ExpensesPage = lazy(() => import('@/features/expenses/ExpensesPage'))
const PropertiesPage = lazy(() => import('@/features/properties/PropertiesPage'))
const PropertyDetailPage = lazy(() => import('@/features/properties/PropertyDetailPage'))
const TenantsPage = lazy(() => import('@/features/tenants/TenantsPage'))
const TenantDetailPage = lazy(() => import('@/features/tenants/TenantDetailPage'))
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage'))
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const EnergyPage = lazy(() => import('@/features/energy/EnergyPage'))
const B2BPage = lazy(() => import('@/features/b2b/B2BPage'))
const ForgotPasswordPage = lazy(() => import('@/features/dashboard/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'))
const AcceptInvitePage = lazy(() => import('@/features/auth/AcceptInvitePage'))
const TenantDashboardPage = lazy(() => import('@/features/tenant-portal/TenantDashboardPage'))
const TenantPaymentsPage = lazy(() => import('@/features/tenant-portal/TenantPaymentsPage'))
const TenantDocumentsPage = lazy(() => import('@/features/tenant-portal/TenantDocumentsPage'))
const TenantContactPage = lazy(() => import('@/features/tenant-portal/TenantContactPage'))
const PrivacyPolicyPage = lazy(() => import('@/features/legal/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('@/features/legal/TermsPage'))

// Placeholder for pages in later phases
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">{title}</p>
      <p className="text-sm text-surface-400">Tato sekce bude k dispozici brzy.</p>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(<LandingPage />),
  },
  {
    path: '/prelaunch',
    element: withSuspense(<PrelaunchPage />),
  },
  {
    path: '/zasady-ochrany-soukromi',
    element: withSuspense(<PrivacyPolicyPage />),
  },
  {
    path: '/podminky-pouziti',
    element: withSuspense(<TermsPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/onboarding',
        element: withSuspense(<OnboardingWizard />),
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'register', element: withSuspense(<RegisterPage />) },
      { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
      { path: 'accept-invite', element: withSuspense(<AcceptInvitePage />) },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<DashboardShell />) },
          { path: 'calendar',  element: withSuspense(<CalendarPage />) },
          { path: 'svj',       element: withSuspense(<SvjPage />) },
          { path: 'expenses',  element: withSuspense(<ExpensesPage />) },
          { path: 'properties', element: withSuspense(<PropertiesPage />) },
          { path: 'properties/:id', element: withSuspense(<PropertyDetailPage />) },
          { path: 'tenants', element: withSuspense(<TenantsPage />) },
          { path: 'tenants/:id', element: withSuspense(<TenantDetailPage />) },
          { path: 'payments', element: withSuspense(<PaymentsPage />) },
          { path: 'documents', element: withSuspense(<DocumentsPage />) },
          { path: 'energy', element: withSuspense(<EnergyPage />) },
          { path: 'taxes', element: <ComingSoon title="Daně" /> },
          { path: 'messages', element: <ComingSoon title="Zprávy" /> },
          { path: 'crm', element: <ComingSoon title="CRM" /> },
          { path: 'airbnb', element: <ComingSoon title="Krátkodobé pronájmy" /> },
          { path: 'tasks', element: <ComingSoon title="Úkoly" /> },
          { path: 'b2b', element: withSuspense(<B2BPage />) },
          { path: 'settings', element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
  {
    path: '/tenant',
    element: <ProtectedRoute />,
    children: [
      {
        element: <TenantLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: withSuspense(<TenantDashboardPage />) },
          { path: 'payments', element: withSuspense(<TenantPaymentsPage />) },
          { path: 'documents', element: withSuspense(<TenantDocumentsPage />) },
          { path: 'contact', element: withSuspense(<TenantContactPage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-surface-950">
        <p className="font-display text-6xl font-bold text-surface-200 dark:text-surface-800">404</p>
        <p className="text-lg font-medium text-surface-900 dark:text-surface-50">Stránka nenalezena</p>
        <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-700">Zpět na hlavní stránku</Link>
      </div>
    ),
  },
])
