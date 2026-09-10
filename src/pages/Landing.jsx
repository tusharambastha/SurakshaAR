import { useNavigate } from 'react-router-dom'
import { Shield, Camera, CheckCircle, ArrowRight } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { Navbar } from '../components/layout/Navbar'

export default function Landing() {
  const { T, lang } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()

  const HOW_IT_WORKS = [
    { step: T('step_learn'), desc: T('step_learn_desc'), icon: '📖', color: '#3498DB' },
    { step: T('step_experience'), desc: T('step_experience_desc'), icon: '📱', color: '#E05A00' },
    { step: T('step_act'), desc: T('step_act_desc'), icon: '⚡', color: '#E74C3C' },
    { step: T('step_assess'), desc: T('step_assess_desc'), icon: '📋', color: '#9B59B6' },
    { step: T('step_improve'), desc: T('step_improve_desc'), icon: '📈', color: '#27AE60' },
    { step: T('step_certify'), desc: T('step_certify_desc'), icon: '🏆', color: '#F39C12' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        paddingTop: 'calc(var(--navbar-height) + 60px)',
        paddingBottom: 80,
        padding: `calc(var(--navbar-height) + 60px) var(--space-4) 80px`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Authentic Industrial Facility Photographic Background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
        }}>
          {/* Real Documentary Photograph of Indian Manufacturing Plant */}
          <div
            style={{
              position: 'absolute', inset: -15,
              backgroundImage: `url(${import.meta.env.BASE_URL}images/industrial-facility.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'right 35%',
              filter: 'saturate(0.85) contrast(0.92) brightness(0.96)',
              transform: 'scale(1.02)',
              animation: 'subtleAmbientDrift 28s ease-in-out infinite alternate',
            }}
          />

          {/* Soft atmospheric haze with gentle daylight variation */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 80% 25%, rgba(255, 245, 220, 0.25) 0%, transparent 65%)',
              animation: 'subtleSunlightPulse 14s ease-in-out infinite alternate',
              mixBlendMode: 'screen',
            }}
          />

          {/* Natural Depth-of-Field & Legibility Scrim */}
          {/* Keeps left/center area clean and softly blurred so text is 100% readable, industrial details stay on right */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, var(--color-bg) 0%, rgba(247,245,241,0.95) 40%, rgba(247,245,241,0.82) 65%, rgba(247,245,241,0.45) 85%, rgba(247,245,241,0.2) 100%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Subtle bottom blend into page body */}
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 100,
              background: 'linear-gradient(to top, var(--color-bg), transparent)',
            }}
          />
        </div>

        <div className="page-container" style={{ maxWidth: 800, position: 'relative' }}>
          {/* Safety badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--color-brand-50)',
            border: '1.5px solid var(--color-brand-100)',
            borderRadius: 'var(--radius-pill)',
            padding: '6px 16px',
            marginBottom: 24,
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-brand)',
          }}>
            <Shield size={15} />
            Smart India Hackathon 2026 · SIH26041
          </div>

          {/* Logo image */}
          <div style={{
            marginBottom: lang !== 'en' ? 12 : 24,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <img
              src={`${import.meta.env.BASE_URL}images/surakshaar-logo.png`}
              alt="SurakshaAR — Immersive Training for a Safer Bharat"
              style={{
                height: 'clamp(90px, 16vw, 150px)',
                width: 'auto',
                maxWidth: '92%',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.08))',
              }}
            />
          </div>

          {/* Regional tagline for non-English users */}
          {lang !== 'en' && (
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              marginBottom: 24,
            }}>
              {T('tagline')}
            </p>
          )}

          {/* Hero heading */}
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: 20,
            lineHeight: 1.2,
          }}>
            {T('heroHeading')}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--color-text-secondary)',
            maxWidth: 600,
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}>
            {T('heroSubtitle')}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              style={{ fontSize: '1.05rem', padding: '14px 32px' }}
            >
              <Camera size={20} />
              {T('startARTraining')}
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: '1.05rem', padding: '14px 32px' }}
            >
              {T('exploreTraining')}
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{
            display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
            marginTop: 32,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
              Camera AR on Android
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
              Hindi · English · Santali
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
              Blockchain Verified Certificates
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
              Offline Capable
            </span>
          </div>
        </div>
      </section>

      {/* Visual AR Demo Block */}
      <section style={{
        background: '#1A1A1A',
        padding: '60px var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <p style={{
            color: '#888', fontSize: 'var(--text-xs)', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24,
          }}>
            AR TRAINING PREVIEW
          </p>
          {/* Simulated AR scene */}
          <div style={{
            position: 'relative',
            height: 280,
            background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #333',
            overflow: 'hidden',
            maxWidth: 700,
            margin: '0 auto',
          }}>
            {/* Simulated camera feed background */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #1E2A1E 0%, #2A1A0A 50%, #1A1A2A 100%)',
              opacity: 0.8,
            }} />

            {/* AR overlays simulation */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Fire effect */}
              <div style={{
                position: 'absolute', bottom: 40, left: '35%',
                width: 60, height: 80,
                background: 'radial-gradient(ellipse at bottom, #FF4500, #FF8C00, transparent)',
                borderRadius: '50% 50% 20% 20%',
                animation: 'pulse 0.8s ease-in-out infinite alternate',
                filter: 'blur(2px)',
              }} />

              {/* Hazard marker */}
              <div style={{
                position: 'absolute', bottom: 120, left: '30%',
                background: 'rgba(255,69,0,0.9)',
                borderRadius: 8, padding: '6px 12px',
                color: 'white', fontSize: 13, fontWeight: 700,
                boxShadow: '0 0 20px rgba(255,69,0,0.6)',
              }}>
                ⚠ FIRE HAZARD
              </div>

              {/* Exit marker */}
              <div style={{
                position: 'absolute', right: 40, top: '50%',
                background: 'rgba(46,139,87,0.9)',
                borderRadius: 8, padding: '6px 12px',
                color: 'white', fontSize: 13, fontWeight: 700,
                boxShadow: '0 0 20px rgba(46,139,87,0.6)',
              }}>
                🚪 FIRE EXIT →
              </div>

              {/* PPE marker */}
              <div style={{
                position: 'absolute', left: 30, top: '40%',
                background: 'rgba(52,152,219,0.9)',
                borderRadius: 8, padding: '6px 12px',
                color: 'white', fontSize: 13, fontWeight: 700,
                boxShadow: '0 0 20px rgba(52,152,219,0.6)',
              }}>
                🦺 PPE STATION
              </div>

              {/* AR indicator */}
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid #00FF88',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 12px',
                color: '#00FF88',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em',
              }}>
                📷 CAMERA AR MODE
              </div>

              {/* Scan lines overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>

          <p style={{
            color: '#666', fontSize: 'var(--text-xs)', marginTop: 12,
          }}>
            Real camera feed + AR hazard overlays + interactive safety tasks
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '72px var(--space-4)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 12 }}>
              {T('howItWorks')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 500, margin: '0 auto' }}>
              A structured learning journey from theory to verified certification.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64,
                  background: item.color + '18',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: 28,
                  border: `2px solid ${item.color}30`,
                }}>
                  {item.icon}
                </div>
                <div style={{
                  width: 24, height: 24,
                  background: item.color,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'white',
                  margin: '0 auto 8px',
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 6 }}>{item.step}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{
                    display: 'none', // Hidden on mobile, shown on desktop via CSS
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '48px var(--space-4)',
      }}>
        <div className="page-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-6)',
          }}>
            {[
              { icon: '📱', title: 'Camera AR Mode', desc: 'Real environment + virtual hazards overlaid on your camera' },
              { icon: '🗣️', title: 'Voice Assessment', desc: 'Questions read aloud in Hindi and English. Listen, then answer.' },
              { icon: '🛡️', title: 'Blockchain Certificates', desc: 'SHA-256 verified digital certificates with QR code validation' },
              { icon: '📡', title: 'Offline Capable', desc: 'Train offline, sync progress automatically when reconnected' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 4 }}>{f.title}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px var(--space-4)', textAlign: 'center' }}>
        <div className="page-container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 16 }}>
            Ready to train safely?
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
            Join industrial workers from Jharkhand's mining, steel, and mica sectors.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            style={{ fontSize: '1.05rem', padding: '16px 40px' }}
          >
            {user ? 'Go to Dashboard' : 'Create Free Account'}
            <ArrowRight size={18} />
          </button>
          {!user && (
            <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', fontWeight: 600 }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '24px var(--space-4)',
        textAlign: 'center',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
      }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={14} style={{ color: 'var(--color-brand)' }} />
            <strong style={{ color: 'var(--color-text-secondary)' }}>SurakshaAR</strong>
          </div>
          <p>Built for Smart India Hackathon 2026 · SIH26041 · Jharkhand Industrial Safety</p>
          <p style={{ marginTop: 4 }}>Targeting mining &amp; manufacturing sectors · Android AR-ready</p>
        </div>
      </footer>
    </div>
  )
}
