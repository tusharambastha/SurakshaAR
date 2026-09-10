import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { mockGetAllProfiles, mockGetAllSessions } from '../../lib/mockDb'
import { Navbar } from '../../components/layout/Navbar'
import { scoreRating } from '../../lib/scoring'

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminTrainees() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return mockGetAllProfiles().data ?? []
      const { data } = await supabase.from('profiles').select('*').eq('role', 'trainee').order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: sessions } = useQuery({
    queryKey: ['admin-all-sessions-summary'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return mockGetAllSessions().data ?? []
      const { data } = await supabase.from('training_sessions').select('user_id, score, status').eq('status', 'completed')
      return data ?? []
    },
  })

  // Build per-trainee stats
  function traineeStats(userId) {
    if (!sessions) return { count: 0, avg: null }
    const mine = sessions.filter(s => s.user_id === userId)
    const count = mine.length
    const avg = count ? Math.round(mine.reduce((s, sess) => s + (sess.score ?? 0), 0) / count) : null
    return { count, avg }
  }

  const filtered = (profiles ?? []).filter(p =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.site_location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{ paddingTop: 'calc(var(--navbar-height) + 24px)', paddingBottom: 48 }}>
        <div className="page-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>Trainee Directory</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {filtered.length} of {profiles?.length ?? 0} trainees
              </p>
            </div>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="form-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, location…"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : !filtered.length ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Users size={40} style={{ color: 'var(--color-border-strong)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>{search ? 'No trainees match your search.' : 'No trainees registered yet.'}</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Trainee</th>
                      <th>Location</th>
                      <th>Sessions</th>
                      <th>Avg Score</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const { count, avg } = traineeStats(p.id)
                      const r = avg !== null ? scoreRating(avg) : null
                      return (
                        <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/trainees/${p.id}`)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                              }}>
                                {(p.full_name ?? 'T')[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{p.full_name ?? '—'}</p>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{p.email ?? p.id.slice(0, 12)}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{p.site_location ?? '—'}</td>
                          <td style={{ fontWeight: 600 }}>{count}</td>
                          <td>
                            {avg !== null
                              ? <span style={{ fontWeight: 700, color: r?.color }}>{avg}<span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>/105</span></span>
                              : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                            }
                          </td>
                          <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{fmtDate(p.created_at)}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/admin/trainees/${p.id}`) }}>
                              View <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
