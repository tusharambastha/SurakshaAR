import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)',
      }}>
        <div className="spinner" />
      </div>
    )
  }

  // Not logged in → to login
  if (!user) return <Navigate to="/admin-login" replace />
  // Logged in but not admin → sign out is handled by AdminLogin, just redirect
  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
