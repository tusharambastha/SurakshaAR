import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertCircle, Zap, Shield, Check, Key } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { friendlyAuthError } from '../lib/supabase'

export default function AdminLogin() {
  const { user, profile, loginAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // If already logged in as admin, redirect directly
  useEffect(() => {
    if (!authLoading && user && profile?.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, profile, authLoading, navigate])

  async function handleQuickDemoAdmin() {
    setError('')
    setLoading(true)
    try {
      const res = await loginAdmin({
        email: 'admin@suraksha.demo',
        password: 'Admin@1234',
      })
      if (res?.error) {
        setError(friendlyAuthError(res.error) || 'Failed to authenticate as Admin.')
        setLoading(false)
        return
      }
      navigate('/admin', { replace: true })
    } catch (e) {
      console.error('[Admin Login Error]', e)
      setError('Failed to authenticate as Admin. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handlePrefillCredentials() {
    setEmail('admin@suraksha.demo')
    setPassword('Admin@1234')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginAdmin({
        email: email.trim(),
        password,
      })
      if (res?.error) {
        setError(friendlyAuthError(res.error) || res.error.message || 'Invalid credentials or non-admin account.')
        setLoading(false)
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error('[Admin Login Error]', err)
      setError('Something went wrong during admin authentication. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#121214', display: 'flex', flexDirection: 'column' }}>
      {/* Admin-distinctive top bar */}
      <div style={{
        background: '#0A0A0C',
        padding: '14px 20px',
        borderBottom: '2px solid var(--color-brand, #E05A00)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Suraksha AR"
            style={{ height: 32, width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.02em' }}>SurakshaAR</span>
          <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
            ADMIN PORTAL
          </span>
        </div>

        <Link
          to={user ? '/dashboard' : '/login'}
          style={{
            color: '#9AA0A6',
            fontSize: '0.82rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {user ? '← Return to Trainee Dashboard' : '← Return to Trainee Login'}
        </Link>
      </div>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 430 }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{
              width: 58,
              height: 58,
              background: 'linear-gradient(135deg, #E05A00 0%, #B84200 100%)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 8px 24px rgba(224, 90, 0, 0.3)',
            }}>
              <Shield size={28} color="white" />
            </div>
            <h1 style={{ color: 'white', fontSize: '1.45rem', fontWeight: 700, margin: '0 0 4px' }}>
              Safety Administrator Login
            </h1>
            <p style={{ color: '#9AA0A6', fontSize: '0.85rem', margin: 0 }}>
              Industrial Compliance & Safety Oversight Portal
            </p>
          </div>

          <div style={{
            background: '#1C1D21',
            border: '1px solid #2F3136',
            borderRadius: 18,
            padding: '24px 22px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
          }}>
            {/* ⚡ 1-Click Instant Demo Admin Access */}
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(224, 90, 0, 0.12)',
                border: '1.5px solid #E05A00',
                borderRadius: 12,
                color: '#FFFFFF',
                cursor: 'pointer',
                marginBottom: 16,
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(224, 90, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#E05A00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Zap size={18} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FED7AA' }}>
                    ⚡ 1-Click Instant Demo Admin Access
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#9AA0A6' }}>
                    admin@suraksha.demo (Zero typing needed)
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#FED7AA', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Enter →
              </span>
            </button>

            {/* Quick Demo Credentials Info Chip */}
            <div
              onClick={handlePrefillCredentials}
              title="Click to pre-fill credentials"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed #3F4248',
                borderRadius: 8,
                marginBottom: 18,
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: '#BDC1C6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={13} color="#E05A00" />
                <span>
                  Demo: <strong style={{ color: '#FFFFFF' }}>admin@suraksha.demo</strong> · Pass: <strong style={{ color: '#FFFFFF' }}>Admin@1234</strong>
                </span>
              </div>
              <span style={{ color: '#E05A00', fontWeight: 600, fontSize: '0.72rem' }}>Fill ↺</span>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16, fontSize: '0.84rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" htmlFor="admin-email" style={{ color: '#BDC1C6', fontSize: '0.82rem' }}>
                  Admin Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@suraksha.demo"
                  required
                  autoComplete="email"
                  style={{ background: '#121214', color: 'white', borderColor: '#3F4248' }}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="admin-pw" style={{ color: '#BDC1C6', fontSize: '0.82rem' }}>
                  Password
                </label>
                <div className="form-input-group">
                  <input
                    id="admin-pw"
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin@1234"
                    required
                    autoComplete="current-password"
                    style={{ background: '#121214', color: 'white', borderColor: '#3F4248' }}
                  />
                  <button
                    type="button"
                    className="form-input-icon"
                    onClick={() => setShowPw(v => !v)}
                    style={{ color: '#888' }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                style={{ marginTop: 6 }}
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
                    &nbsp;Authenticating Admin…
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Access Admin Portal
                  </>
                )}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/login" style={{ color: '#888', fontSize: '0.8rem', textDecoration: 'none' }}>
              ← Return to Trainee Portal
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
