import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { Shield, Eye, Flame, Award, Globe, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function About() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: 64 }}>
        <div className="page-container" style={{ maxWidth: 840, margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header Badge & Title */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-brand-50)',
                border: '1px solid var(--color-brand-100)',
                color: 'var(--color-brand)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <Shield size={14} />
              <span>Smart India Hackathon 2026 · Problem Statement SIH26041</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                lineHeight: 1.25,
                margin: '0 0 16px',
              }}
            >
              Know About Suraksha<span style={{ color: 'var(--color-brand)' }}>AR</span>
            </h1>

            {/* Core User-Specified Definition */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                maxWidth: 720,
                margin: '0 auto',
              }}
            >
              SurakshaAR is an AR-based industrial safety training platform designed to provide immersive, interactive, and practical safety learning experiences.
            </p>
          </div>

          {/* Overview Card */}
          <div
            className="card"
            style={{
              padding: 'clamp(20px, 3vw, 32px)',
              marginBottom: 32,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg, 16px)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Eye size={20} color="var(--color-brand)" />
              The Mission
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 16px' }}>
              Traditional industrial safety training often relies on passive classroom lectures and static manuals, leaving workers underprepared for fast-moving hazards. SurakshaAR bridges this gap by transforming ordinary mobile devices into high-fidelity augmented reality drill simulators.
            </p>
            <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
              Workers practice hazard detection, emergency equipment operation, and evacuation decision-making safely in digital space before facing real-world risks on factory floors, mining sites, and chemical plants.
            </p>
          </div>

          {/* Core Pillars Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
              marginBottom: 36,
            }}
          >
            {[
              {
                icon: <Eye size={22} color="var(--color-brand)" />,
                title: 'Immersive AR Hazard Simulation',
                desc: 'Overlay true-scale 3D fire hazards, gas dispersion zones, and rotating machinery onto real surroundings using WebXR and camera-tracking technology.',
              },
              {
                icon: <Flame size={22} color="#DC2626" />,
                title: 'Practical Emergency Drills',
                desc: 'Hands-on practice with firefighting equipment (PASS method), breathing apparatus (SCBA), and Lockout/Tagout (LOTO) protocols with realistic time constraints.',
              },
              {
                icon: <Globe size={22} color="#059669" />,
                title: 'Vernacular Workforce Inclusion',
                desc: 'Fully accessible multilingual interface supporting English, Hindi, and Santali (Ol Chiki ᱥᱟᱱᱛᱟᱲᱤ) with voice audio guidance for frontline shop-floor workers.',
              },
              {
                icon: <Award size={22} color="#D97706" />,
                title: 'Verified Digital Credentials',
                desc: 'Automated post-drill assessments generate tamper-proof digital completion certificates with verifiable scores and QR authentication.',
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: 24,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg, 14px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}
                >
                  {p.icon}
                </div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Call to Action */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-50, #FFF3EB), var(--color-surface, #FFFFFF))',
              border: '1.5px solid var(--color-brand-100, #FFE6D5)',
              borderRadius: 'var(--radius-xl, 20px)',
              padding: 'clamp(24px, 4vw, 36px)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.45rem)', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 10px' }}>
              Experience Next-Generation Safety Training
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Explore interactive modules, test your emergency response speed, and build life-saving reflexes in Augmented Reality.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                Go to Training Dashboard
                <ArrowRight size={16} />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/contact')}
                style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              >
                Contact Us
              </button>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
