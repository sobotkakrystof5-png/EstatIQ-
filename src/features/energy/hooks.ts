import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listEnergyReadings,
  createEnergyReading,
  deleteEnergyReading,
  listProperties,
  listEnergyAnomalyNotifications,
  dismissEnergyNotifications,
  importEnergyReadings,
  type NewReadingDraft,
  type ImportBatch,
} from './data'

export function useEnergyReadings(propertyId?: string) {
  return useQuery({
    queryKey: ['energy', 'readings', propertyId ?? 'all'],
    queryFn: () => listEnergyReadings(propertyId),
  })
}

export function useEnergyProperties() {
  return useQuery({
    queryKey: ['energy', 'properties'],
    queryFn: listProperties,
    staleTime: 60_000,
  })
}

export function useCreateEnergyReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: NewReadingDraft) => createEnergyReading(draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['energy'] }),
  })
}

export function useDeleteEnergyReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEnergyReading(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['energy'] }),
  })
}

export function useEnergyAnomalyNotifications() {
  return useQuery({
    queryKey: ['energy', 'anomaly-notifications'],
    queryFn: listEnergyAnomalyNotifications,
    staleTime: 30_000,
  })
}

export function useDismissEnergyNotifications() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => dismissEnergyNotifications(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['energy', 'anomaly-notifications'] }),
  })
}

export function useImportEnergyReadings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (batch: ImportBatch) => importEnergyReadings(batch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['energy'] }),
  })
}
