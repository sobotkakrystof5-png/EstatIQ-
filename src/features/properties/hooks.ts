import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveProperty,
  createProperty,
  getProperty,
  listProperties,
  restoreProperty,
  updateCadastreData,
  updateProperty,
  type CadastrePatch,
  type PropertyDraft,
} from './data'

export const propertyKeys = {
  all: ['properties'] as const,
  list: () => [...propertyKeys.all, 'list'] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
}

export function useProperties() {
  return useQuery({
    queryKey: propertyKeys.list(),
    queryFn: listProperties,
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => getProperty(id),
    enabled: Boolean(id),
  })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: PropertyDraft) => createProperty(draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.all }),
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: PropertyDraft }) => updateProperty(id, draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.all }),
  })
}

export function useArchiveProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveProperty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.all }),
  })
}

export function useRestoreProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreProperty(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.all }),
  })
}

export function useRefreshCadastre() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CadastrePatch }) => updateCadastreData(id, patch),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: propertyKeys.detail(id) }),
  })
}
