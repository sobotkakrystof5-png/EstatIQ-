import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SubscriptionUsage {
  unit_count: number
  unit_limit: number
  tier: string
  status: string
  /** 0–1, capped at 1 */
  fill: number
  /** true when unit_count >= unit_limit */
  isAtLimit: boolean
  /** true when subscription is active or trialing */
  isActive: boolean
}

export function useSubscriptionUsage() {
  return useQuery<SubscriptionUsage>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      type UsageRow = { unit_count: number; unit_limit: number; tier: string; status: string }
      // supabase.rpc is typed only for known function names; cast via unknown to call
      // the new get_subscription_usage function until types are regenerated.
      type RawRpc = (name: string) => PromiseLike<{ data: UsageRow[] | null; error: { message: string } | null }>
      const rpc = supabase.rpc as unknown as RawRpc
      const { data, error } = await rpc('get_subscription_usage')
      if (error) throw new Error(error.message)
      const row: UsageRow = data?.[0] ?? { unit_count: 0, unit_limit: 1, tier: 'free', status: 'active' }
      const fill = row.unit_limit > 0 ? Math.min(row.unit_count / row.unit_limit, 1) : 1
      return {
        unit_count: row.unit_count,
        unit_limit: row.unit_limit,
        tier: row.tier,
        status: row.status,
        fill,
        isAtLimit: row.unit_count >= row.unit_limit,
        isActive: row.status === 'active' || row.status === 'trialing',
      }
    },
    staleTime: 30_000,
  })
}
