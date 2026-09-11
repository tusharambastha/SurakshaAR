import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }) {
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

  // Not logged in -> redirect to trainee login
  if (!user) return <Navigate to="/login" replace />

  // Admin trying to access trainee private dashboard/session -> redirect to admin dashboard
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />

  return children
}
