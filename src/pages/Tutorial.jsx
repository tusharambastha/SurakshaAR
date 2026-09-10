import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Volume2, SkipForward } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { speak, isTTSSupported } from '../lib/voice'
import { Navbar } from '../components/layout/Navbar'

const STEP_ICONS = ['📷', '🎯', '🦺', '📋', '✅']

export default function Tutorial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { T, tutorialSteps, lang } = useLang()
  const [current, setCurrent] = useState(0)
  const total = tutorialSteps.length

  function handleNext() {
    if (current < total - 1) setCurrent(i => i + 1)
    else navigate(`/scenario/${id}`)
  }
  function handleBack() { if (current > 0) setCurrent(i => i - 1) }
  function handleSkip() { navigate(`/scenario/${id}`) }
  function handleListen() {
    const step = tutorialSteps[current]
    speak(`${step.title}. ${step.body}`, lang)
  }

  const step = tutorialSteps[current]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{
        padding: `calc(var(--navbar-height) + 32px) var(--space-4) 48px`,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 8 }}>{T('howItWorksTitle')}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Before you begin AR training, here's what to expect.
            </p>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {tutorialSteps.map((_, i) => (
              <div key={i} style={{
                width: i === current ? 32 : 10, height: 10,
                borderRadius: 5,
                background: i < current
                  ? 'var(--color-success)'
                  : i === current ? 'var(--color-brand)' : 'var(--color-border)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Step card */}
          <div className="card animate-slide-up" key={current} style={{
            textAlign: 'center', padding: '40px 32px',
            marginBottom: 24, minHeight: 300,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 68, marginBottom: 20, lineHeight: 1 }}>
              {STEP_ICONS[current]}
            </div>
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
            }}>
              {T('stepOf', String(current + 1), String(total))}
            </span>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 12, lineHeight: 1.2 }}>{step.title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.65, maxWidth: 380 }}>
              {step.body}
            </p>
            {isTTSSupported(lang) && (
              <button onClick={handleListen} className="btn btn-ghost btn-sm" style={{ marginTop: 20 }}>
                <Volume2 size={16} /> {T('listen')}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={handleBack} disabled={current === 0} style={{ flex: 1 }}>
              <ChevronLeft size={18} /> {T('tutorialBack')}
            </button>
            <button className="btn btn-primary" onClick={handleNext} style={{ flex: 2 }}>
              {current === total - 1
                ? <>{T('startTrainingNow')} →</>
                : <>{T('tutorialNext')} <ChevronRight size={18} /></>
              }
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={handleSkip} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <SkipForward size={14} /> {T('skipTutorial')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
