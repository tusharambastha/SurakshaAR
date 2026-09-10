import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { supabase, isSupabaseConfigured, friendlyAuthError } from '../lib/supabase'
import { mockSignIn } from '../lib/mockDb'
import { Navbar } from '../components/layout/Navbar'

export default function Login() {
  const { refreshProfile } = useAuth()
  const { T } = useLang()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        const { error: err } = await mockSignIn({ email, password })
        if (err) { setError(err.message); setLoading(false); return }
        await refreshProfile()
        navigate('/dashboard', { replace: true })
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) { setError(friendlyAuthError(err)); setLoading(false); return }
        navigate('/dashboard', { replace: true })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{
        padding: `calc(var(--navbar-height) + 40px) var(--space-4) 40px`,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, background: 'var(--color-brand)',
              borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Shield size={32} color="white" strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 6 }}>Welcome Back</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Sign in to continue your safety training
            </p>
          </div>

          <div className="card">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{T('email')}</label>
                <input
                  id="email" type="email" className="form-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">{T('password')}</label>
                <div className="form-input-group">
                  <input
                    id="password" type={showPw ? 'text' : 'password'}
                    className="form-input" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                  />
                  <button type="button" className="form-input-icon"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? T('hidePassword') : T('showPassword')}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="button" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-brand)', fontSize: 'var(--text-sm)', fontWeight: 600,
                }}
                  onClick={() => alert('Password reset: Contact your site administrator or Safety Officer.')}
                >
                  {T('forgotPassword')}
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                {loading
                  ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />&nbsp;Signing in…</>
                  : <><LogIn size={18} /> {T('signIn')}</>
                }
              </button>
            </form>

            <div className="divider-with-text" style={{ margin: '24px 0 20px' }}>{T('or')}</div>

            <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {T('dontHaveAccount')}{' '}
              <Link to="/signup" style={{ color: 'var(--color-brand)', fontWeight: 700 }}>{T('register')}</Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/admin-login" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Admin Portal Login →
            </Link>
          </p>

          {!isSupabaseConfigured && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={async () => {
                  setEmail('trainee@suraksha.demo')
                  setPassword('Demo@1234')
                  setLoading(true)
                  const { error: err } = await mockSignIn({ email: 'trainee@suraksha.demo', password: 'Demo@1234' })
                  if (!err) {
                    await refreshProfile()
                    navigate('/dashboard', { replace: true })
                  }
                  setLoading(false)
                }}
                style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}
              >
                ⚡ 1-Click Demo Trainee Login
              </button>

              <div className="alert alert-info" style={{ marginTop: 4 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-xs)' }}>
                  <strong>Demo Mode Active:</strong> You can sign in with any email, or click the 1-click button above!
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
