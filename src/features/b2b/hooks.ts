import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrgMemberRole } from '@/types/database'
import { getOrganization, getMembers, inviteMember, removeMember, updateMemberRole } from './data'

export const b2bKeys = {
  all: ['b2b'] as const,
  org: () => [...b2bKeys.all, 'organization'] as const,
  members: () => [...b2bKeys.all, 'members'] as const,
}

export function useOrganization() {
  return useQuery({
    queryKey: b2bKeys.org(),
    queryFn: getOrganization,
    staleTime: 60_000,
  })
}

export function useMembers() {
  return useQuery({
    queryKey: b2bKeys.members(),
    queryFn: getMembers,
    staleTime: 30_000,
  })
}

export function useInviteMember() {
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: OrgMemberRole }) =>
      inviteMember(email, role),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: b2bKeys.members() }),
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgMemberRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: b2bKeys.members() }),
  })
}
