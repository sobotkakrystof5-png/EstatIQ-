import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInvitation,
  endTenancy,
  getTenant,
  inviteTenant,
  listTenants,
  resendInvite,
  type InvitationResult,
  type InviteDraft,
} from './data'

export const tenantKeys = {
  all: ['tenants'] as const,
  list: () => [...tenantKeys.all, 'list'] as const,
  detail: (id: string) => [...tenantKeys.all, 'detail', id] as const,
}

export function useTenants() {
  return useQuery({ queryKey: tenantKeys.list(), queryFn: listTenants })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => getTenant(id),
    enabled: Boolean(id),
  })
}

export function useInviteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: InviteDraft) => inviteTenant(draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.all }),
  })
}

export function useCreateInvitation() {
  const qc = useQueryClient()
  return useMutation<
    InvitationResult,
    Error,
    { tenantId: string; leaseId: string; email: string }
  >({
    mutationFn: ({ tenantId, leaseId, email }) => createInvitation(tenantId, leaseId, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.all }),
  })
}

export function useResendInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => resendInvite(tenantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.all }),
  })
}

export function useEndTenancy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => endTenancy(tenantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.all }),
  })
}
