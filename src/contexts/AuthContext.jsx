import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  mockSignOut, mockGetAuthSession, mockGetProfile, mockGoogleSignIn, mockLoginAdmin, mockSignIn,
} from '../lib/mockDb'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(authUser) {
    if (!authUser) { setProfile(null); return }
    if (!isSupabaseConfigured) {
      const res = mockGetProfile(authUser.id)
      setProfile(res?.data ?? null)
      return
    }
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).single()
    if (error) { console.error('[AuthContext]', error.message); setProfile(null) }
    else setProfile(data)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const { data } = mockGetAuthSession()
        const session = data?.session
        if (session) {
          const u = { id: session.userId, email: session.email, role: session.role }
          setUser(u)
          const pRes = mockGetProfile(session.userId)
          setProfile(pRes?.data ?? null)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('[AuthContext error]', err)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      fetchProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        await fetchProfile(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    if (!isSupabaseConfigured) {
      await mockSignOut()
      setUser(null); setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  async function refreshProfile() {
    if (!isSupabaseConfigured) {
      try {
        const { data } = mockGetAuthSession()
        const session = data?.session
        if (session) {
          const u = { id: session.userId, email: session.email, role: session.role }
          setUser(u)
          const pRes = mockGetProfile(session.userId)
          setProfile(pRes?.data ?? null)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('[AuthContext refreshProfile error]', err)
      }
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user ?? null
    setUser(authUser)
    await fetchProfile(authUser)
  }

  async function loginWithGoogle({ email, fullName, avatarUrl, language = 'en' }) {
    if (!isSupabaseConfigured) {
      const res = await mockGoogleSignIn({ email, fullName, avatarUrl, language })
      if (res.error) return res
      const session = res.data.session
      const u = { id: session.userId, email: session.email, role: session.role }
      setUser(u)
      setProfile(res.data.profile)
      return res
    }
    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user ?? null
    setUser(authUser)
    await fetchProfile(authUser)
    return { data: { user: authUser }, error: null }
  }

  async function loginAdmin({ email, password } = {}) {
    if (!isSupabaseConfigured) {
      const res = (email || password)
        ? await mockSignIn({ email, password })
        : await mockLoginAdmin('admin@suraksha.demo')
      if (res.error) return res
      const session = res.data?.session
      if (!session || session.role !== 'admin') {
        return { error: { message: 'This account does not have admin access. Contact your system administrator.' } }
      }
      const u = { id: session.userId, email: session.email, role: 'admin' }
      setUser(u)
      const pRes = mockGetProfile(session.userId)
      setProfile(pRes?.data ?? { id: session.userId, email: session.email, role: 'admin', full_name: 'Safety Director (Admin)' })
      return { data: res.data, error: null }
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) return { error: err }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (prof?.role !== 'admin') {
      await supabase.auth.signOut()
      return { error: { message: 'This account does not have admin access. Contact your system administrator.' } }
    }
    setUser(data.user)
    setProfile(prof)
    return { data, error: null }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, loginWithGoogle, loginAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
