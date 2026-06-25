import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/features/auth/AuthContext'
import { CookieConsent } from '@/components/CookieConsent'
import '@/i18n/config'
import './index.css'
import { router } from './app/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <CookieConsent />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
