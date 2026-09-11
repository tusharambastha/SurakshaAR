import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { OfflineProvider } from './contexts/OfflineContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminRoute } from './components/auth/AdminRoute'
import OfflineBanner from './components/ui/OfflineBanner'
import SafetyChatbot from './components/chatbot/SafetyChatbot'
import React from 'react'

// Pages
import Landing     from './pages/Landing'
import Login       from './pages/Login'
import Signup      from './pages/Signup'
import AdminLogin  from './pages/AdminLogin'
import Dashboard   from './pages/Dashboard'
import Tutorial    from './pages/Tutorial'
import Scenario    from './pages/Scenario'
import Assessment  from './pages/Assessment'
import Results     from './pages/Results'
import Certificate from './pages/Certificate'
import Verify      from './pages/Verify'
import Profile     from './pages/Profile'
import Admin       from './pages/admin/Admin'
import AdminTrainees from './pages/admin/AdminTrainees'
import AdminTraineeDetail from './pages/admin/AdminTraineeDetail'
import AdminCompliance from './pages/admin/AdminCompliance'
import AdminCertificates from './pages/admin/AdminCertificates'
import AdminLeaderboard from './pages/admin/AdminLeaderboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
})

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#F7F5F1', padding: 24,
        }}>
          <div style={{
            background: 'white', border: '1px solid #E3DDD5', borderRadius: 14,
            padding: 32, maxWidth: 480, width: '100%', textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: '#C0392B', marginBottom: 12 }}>Application Error</h2>
            <p style={{ color: '#4A4A4A', fontSize: '0.9rem', marginBottom: 20 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.hash = '#/dashboard'
                  window.location.reload()
                }}
                style={{
                  background: '#E05A00', color: 'white', border: 'none',
                  borderRadius: 10, padding: '12px 24px', fontWeight: 700,
                  cursor: 'pointer', fontSize: '1rem', width: '100%',
                }}
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'transparent', color: '#4A4A4A', border: '1px solid #E3DDD5',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 600,
                  cursor: 'pointer', fontSize: '0.9rem', width: '100%',
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <OfflineProvider>
                <HashRouter>
                  <OfflineBanner />

                  <Routes>
                    {/* ── Public ── */}
                    <Route path="/landing"      element={<Landing />} />
                    <Route path="/login"        element={<Login />} />
                    <Route path="/signup"       element={<Signup />} />
                    <Route path="/admin-login"  element={<AdminLogin />} />
                    <Route path="/verify/:certNumber" element={<Verify />} />

                    {/* ── Trainee (protected) ── */}
                    <Route path="/dashboard"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/tutorial/:id"          element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
                    <Route path="/scenario/:id"          element={<ProtectedRoute><Scenario /></ProtectedRoute>} />
                    <Route path="/assessment/:id"        element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
                    <Route path="/results/:sessionId"    element={<ProtectedRoute><Results /></ProtectedRoute>} />
                    <Route path="/certificate/:id"       element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
                    <Route path="/profile"               element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* ── Admin (role-gated) ── */}
                    <Route path="/admin"                 element={<AdminRoute><Admin /></AdminRoute>} />
                    <Route path="/admin/trainees"        element={<AdminRoute><AdminTrainees /></AdminRoute>} />
                    <Route path="/admin/trainees/:id"    element={<AdminRoute><AdminTraineeDetail /></AdminRoute>} />
                    <Route path="/admin/compliance"      element={<AdminRoute><AdminCompliance /></AdminRoute>} />
                    <Route path="/admin/certificates"    element={<AdminRoute><AdminCertificates /></AdminRoute>} />
                    <Route path="/admin/leaderboard"     element={<AdminRoute><AdminLeaderboard /></AdminRoute>} />

                    {/* ── Default ── */}
                    <Route path="/" element={<Navigate to="/landing" replace />} />
                    <Route path="*" element={<Navigate to="/landing" replace />} />
                  </Routes>

                  {/* Safety chatbot persists across all protected pages */}
                  <SafetyChatbot />
                </HashRouter>
              </OfflineProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
