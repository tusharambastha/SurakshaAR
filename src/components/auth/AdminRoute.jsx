import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { mockGetAuthSession } from '../../lib/mockDb'

export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  // Guard against transient state sync delay in demo/mock mode
  if (!isSupabaseConfigured) {
    const { data } = mockGetAuthSession()
    const session = data?.session
    if (session?.role === 'admin') {
      // Admin session is active in storage — wait for React state if needed
      if (!user || !profile || profile.role !== 'admin') {
        return (
          <div style={{
            minHeight: '100vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#1A1A1A', gap: 16,
          }}>
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Suraksha AR"
              style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(224,90,0,0.18))' }}
            />
            <div className="spinner" style={{ borderTopColor: 'var(--color-brand)' }} />
          </div>
        )
      }
      return children
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)', gap: 16,
      }}>
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Suraksha AR"
          style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(224,90,0,0.18))' }}
        />
        <div className="spinner" style={{ borderTopColor: 'var(--color-brand)' }} />
      </div>
    )
  }

  // Not logged in → to login
  if (!user) return <Navigate to="/admin-login" replace />
  // Logged in but not admin → redirect to trainee dashboard
  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
