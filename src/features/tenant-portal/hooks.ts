import { useQuery } from '@tanstack/react-query'
import { getTenantContext, getTenantDocuments, getTenantPayments } from './data'

export const tenantKeys = {
  all: ['tenant-portal'] as const,
  context: () => [...tenantKeys.all, 'context'] as const,
  payments: () => [...tenantKeys.all, 'payments'] as const,
  documents: () => [...tenantKeys.all, 'documents'] as const,
}

export function useTenantContext() {
  return useQuery({
    queryKey: tenantKeys.context(),
    queryFn: getTenantContext,
    staleTime: 60_000,
  })
}

export function useTenantPayments() {
  return useQuery({
    queryKey: tenantKeys.payments(),
    queryFn: getTenantPayments,
    staleTime: 30_000,
  })
}

export function useTenantDocuments() {
  return useQuery({
    queryKey: tenantKeys.documents(),
    queryFn: getTenantDocuments,
    staleTime: 60_000,
  })
}
