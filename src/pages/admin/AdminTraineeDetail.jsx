import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Clock, CheckCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { mockGetProfile, mockGetSessions } from '../../lib/mockDb'
import { Navbar } from '../../components/layout/Navbar'
import { scoreRating } from '../../lib/scoring'

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(ms) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
}

export default function AdminTraineeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: profile } = useQuery({
    queryKey: ['admin-trainee', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) return mockGetProfile(id).data
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
      return data
    },
  })

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['admin-trainee-sessions', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) return mockGetSessions(id).data ?? []
      const { data } = await supabase
        .from('training_sessions')
        .select('*, scenarios(title, hazard_type)')
        .eq('user_id', id).eq('status', 'completed')
        .order('completed_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: certs } = useQuery({
    queryKey: ['admin-trainee-certs', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const all = JSON.parse(localStorage.getItem('mock_certificates') ?? '[]')
        return all.filter(c => c.user_id === id)
      }
      const { data } = await supabase.from('certificates').select('*').eq('user_id', id)
      return data ?? []
    },
  })

  const avgScore = sessions?.length
    ? Math.round(sessions.reduce((s, sess) => s + (sess.score ?? 0), 0) / sessions.length)
    : null
  const rating = avgScore !== null ? scoreRating(avgScore) : null
  const passCount = sessions?.filter(s => (s.score ?? 0) >= 63).length ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{ paddingTop: 'calc(var(--navbar-height) + 24px)', paddingBottom: 48 }}>
        <div className="page-container" style={{ maxWidth: 800 }}>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate('/admin/trainees')}>
            <ArrowLeft size={16} /> All Trainees
          </button>

          {/* Trainee header */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, color: 'white',
              }}>
                {(profile?.full_name ?? 'T')[0].toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 2 }}>{profile?.full_name ?? '—'}</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{profile?.email ?? id}</p>
                {profile?.site_location && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>📍 {profile.site_location}</p>
                )}
              </div>
              <span className="badge badge-brand" style={{ marginLeft: 'auto' }}>TRAINEE</span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Sessions', value: sessions?.length ?? 0, icon: <Clock size={16} style={{ color: 'var(--color-brand)' }} /> },
                { label: 'Avg Score', value: avgScore !== null ? `${avgScore}` : '—', icon: <Trophy size={16} style={{ color: rating?.color ?? 'var(--color-text-muted)' }} />, color: rating?.color },
                { label: 'Pass Rate', value: sessions?.length ? `${Math.round((passCount / sessions.length) * 100)}%` : '—', icon: <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> },
                { label: 'Certificates', value: certs?.length ?? 0, icon: <Trophy size={16} style={{ color: 'var(--color-warning)' }} /> },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{stat.icon}</div>
                  <p style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: stat.color ?? 'var(--color-text-primary)', lineHeight: 1.2 }}>{stat.value}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)' }}>Training History</h2>
            </div>
            {isLoading ? (
              <div style={{ padding: 32, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : !sessions?.length ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No sessions yet for this trainee.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Module</th><th>Score</th><th>Time</th><th>Result</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {sessions.map(sess => {
                      const r = scoreRating(sess.score ?? 0)
                      const passed = (sess.score ?? 0) >= 63
                      return (
                        <tr key={sess.id}>
                          <td style={{ fontWeight: 500 }}>{sess.scenarios?.title ?? '—'}</td>
                          <td><span style={{ fontWeight: 700, color: r.color }}>{sess.score ?? 0}</span><span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>/105</span></td>
                          <td>{fmtTime(sess.reaction_time_ms)}</td>
                          <td>
                            <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`}>
                              {passed ? '✓ Pass' : '✗ Fail'}
                            </span>
                          </td>
                          <td>{fmtDate(sess.completed_at)}</td>
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
