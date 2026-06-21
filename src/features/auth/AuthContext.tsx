import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, type Tables } from '@/lib/supabase'

type Profile = Tables<'profiles'>

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  // Prevents double profile fetch when session is set and INITIAL_SESSION fires
  const profileFetchedFor = useRef<string | null>(null)

  async function fetchProfile(userId: string) {
    if (profileFetchedFor.current === userId) return
    profileFetchedFor.current = userId
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  async function refreshProfile() {
    if (session?.user.id) {
      profileFetchedFor.current = null
      await fetchProfile(session.user.id)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      if (event === 'INITIAL_SESSION') {
        // Unblock routing immediately; profile loads in background
        if (session) void fetchProfile(session.user.id)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) void fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        profileFetchedFor.current = null
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook in same file is intentional
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
