import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/lib/supabase'

type Profile = Tables<'profiles'>
type ProfileUpdate = TablesUpdate<'profiles'>

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  updateProfile: (fields: ProfileUpdate) => Promise<{ error: string | null }>
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!cancelled) {
        setProfile(data)
        setLoading(false)
      }
    }

    void fetchProfile()
    return () => { cancelled = true }
  }, [])

  const updateProfile = useCallback(async (fields: ProfileUpdate): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Uživatel není přihlášen' }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) return { error: error.message }
    setProfile(data)
    return { error: null }
  }, [])

  return { profile, loading, updateProfile }
}
