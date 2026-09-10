import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Save, Award, LogOut, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { SUPPORTED_LANGUAGES } from '../lib/i18n'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { mockUpdateProfile, mockGetSessions } from '../lib/mockDb'
import { scoreRating } from '../lib/scoring'
import { Navbar } from '../components/layout/Navbar'

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { T } = useLang()
  const navigate = useNavigate()

  const [fullName, setFullName]         = useState('')
  const [siteLocation, setSiteLocation] = useState('')
  const [prefLang, setPrefLang]         = useState('en')
  const [saving, setSaving]             = useState(false)
  const [saveMsg, setSaveMsg]           = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setSiteLocation(profile.site_location ?? '')
      setPrefLang(profile.preferred_language ?? 'en')
    }
  }, [profile])

  const { data: sessions } = useQuery({
    queryKey: ['profile-sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!isSupabaseConfigured) return mockGetSessions(user.id).data ?? []
      const { data } = await supabase.from('training_sessions').select('*, scenarios(title)')
        .eq('user_id', user.id).eq('status', 'completed')
        .order('completed_at', { ascending: false }).limit(10)
      return data ?? []
    },
  })

  const { data: certs } = useQuery({
    queryKey: ['profile-certs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const all = JSON.parse(localStorage.getItem('mock_certificates') ?? '[]')
        return all.filter(c => c.user_id === user.id)
      }
      const { data } = await supabase.from('certificates').select('*')
        .eq('user_id', user.id).eq('status', 'valid')
        .order('issued_at', { ascending: false })
      return data ?? []
    },
  })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      if (!isSupabaseConfigured) {
        mockUpdateProfile(user.id, { full_name: fullName, site_location: siteLocation, preferred_language: prefLang })
      } else {
        await supabase.from('profiles').update({
          full_name: fullName, site_location: siteLocation, preferred_language: prefLang,
        }).eq('id', user.id)
      }
      await refreshProfile()
      setSaveMsg('Profile updated successfully!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{ paddingTop: 'calc(var(--navbar-height) + 24px)', paddingBottom: 48 }}>
        <div className="page-container" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>{T('profile')}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Manage your training profile and view your history</p>
          </div>

          {/* Profile form */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', fontWeight: 800, color: 'white',
              }}>
                {(profile?.full_name ?? 'T')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{profile?.full_name ?? 'Trainee'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{user?.email}</div>
              </div>
              <span className="badge badge-brand" style={{ marginLeft: 'auto' }}>TRAINEE</span>
            </div>

            {saveMsg && (
              <div className={`alert ${saveMsg.includes('Failed') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 20 }}>
                {saveMsg.includes('Failed') ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                {saveMsg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">{T('fullName')}</label>
                <input type="text" className="form-input" value={fullName}
                  onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Site / Plant Location</label>
                <input type="text" className="form-input" value={siteLocation}
                  onChange={e => setSiteLocation(e.target.value)}
                  placeholder="e.g., Jharia Coalfields, Bokaro Steel Plant" />
              </div>
              <div className="form-group">
                <label className="form-label">{T('preferredLanguage')}</label>
                <select className="form-select" value={prefLang} onChange={e => setPrefLang(e.target.value)}>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.nativeLabel}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : <Save size={16} />}
                  {saving ? 'Saving…' : T('save')}
                </button>
                <button type="button" className="btn btn-danger" onClick={async () => { await signOut(); navigate('/login') }}>
                  <LogOut size={16} /> {T('logout')}
                </button>
              </div>
            </form>
          </div>

          {/* Certificates */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 16 }}>
              <Award size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-brand)', verticalAlign: 'middle' }} />
              My Certificates
            </h2>
            {!certs?.length ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                No certificates yet. Complete a training module and pass the assessment to earn your first certificate.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {certs.map(c => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', background: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)',
                  }}>
                    <Award size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.course_name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {c.cert_number} · {fmtDate(c.issued_at)}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/certificate/${c.id}`)}>View</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session history */}
          <div className="card">
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 16 }}>Session History</h2>
            {!sessions?.length ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No completed sessions yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Module</th><th>Score</th><th>Date</th></tr></thead>
                  <tbody>
                    {sessions.map(s => {
                      const r = scoreRating(s.score ?? 0)
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 500 }}>{s.scenarios?.title ?? s.scenario?.title ?? s.course_name ?? 'Industrial Safety Scenario'}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: r.color }}>{s.score ?? 0}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>/105</span>
                          </td>
                          <td>{fmtDate(s.completed_at || s.created_at || s.started_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
