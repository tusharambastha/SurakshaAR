import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { SUPPORTED_LANGUAGES } from '../lib/i18n'
import { supabase, isSupabaseConfigured, friendlyAuthError } from '../lib/supabase'
import { mockSignUp } from '../lib/mockDb'
import { Navbar } from '../components/layout/Navbar'

export default function Signup() {
  const { refreshProfile } = useAuth()
  const { T } = useLang()
  const navigate = useNavigate()
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [prefLang, setPrefLang]   = useState('en')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (password !== confirmPw) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        const { error: err } = await mockSignUp({ email, password, fullName: fullName.trim(), language: prefLang })
        if (err) { setError(err.message); return }
        await refreshProfile()
        navigate('/dashboard', { replace: true })
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (err) { setError(friendlyAuthError(err)); return }
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            preferred_language: prefLang,
            role: 'trainee',
          })
        }
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
        padding: `calc(var(--navbar-height) + 32px) var(--space-4) 40px`,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, background: 'var(--color-brand)',
              borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Shield size={32} color="white" strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 6 }}>Create Your Account</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Join SurakshaAR safety training platform
            </p>
          </div>

          <div className="card">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /><span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">{T('fullName')} *</label>
                <input id="fullName" type="text" className="form-input"
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name" required autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">{T('email')} *</label>
                <input id="reg-email" type="email" className="form-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pw">{T('password')} *</label>
                <div className="form-input-group">
                  <input id="reg-pw" type={showPw ? 'text' : 'password'} className="form-input"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters" required autoComplete="new-password" />
                  <button type="button" className="form-input-icon" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pw">{T('confirmPassword')} *</label>
                <input id="confirm-pw" type={showPw ? 'text' : 'password'} className="form-input"
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat password" required autoComplete="new-password"
                  style={{ borderColor: confirmPw && confirmPw !== password ? 'var(--color-error)' : undefined }} />
                {confirmPw && confirmPw !== password && (
                  <span className="form-error">Passwords do not match</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pref-lang">{T('preferredLanguage')}</label>
                <select id="pref-lang" className="form-select" value={prefLang} onChange={e => setPrefLang(e.target.value)}>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.nativeLabel}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 4 }}>
                {loading
                  ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />&nbsp;Creating account…</>
                  : <><UserPlus size={18} /> {T('createAccount')}</>
                }
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {T('alreadyHaveAccount')}{' '}
              <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 700 }}>{T('signIn')}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
