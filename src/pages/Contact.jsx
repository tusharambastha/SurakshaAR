import React, { useState } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { Mail, Instagram, Phone, Clock, Send, CheckCircle2, Shield, ArrowUpRight } from 'lucide-react'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Open user's default email client prefilled with their inquiry
    const mailtoSubject = encodeURIComponent(subject || `[SurakshaAR Support] Inquiry from ${name || 'Trainee'}`)
    const mailtoBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)
    window.location.href = `mailto:surakshaar.in@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: 64 }}>
        <div className="page-container" style={{ maxWidth: 940, margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
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
              <Mail size={14} />
              <span>We're Here to Help</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px',
              }}
            >
              Contact Suraksha<span style={{ color: 'var(--color-brand)' }}>AR</span>
            </h1>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                color: 'var(--color-text-secondary)',
                maxWidth: 600,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Have a question about industrial safety training, technical support, or institutional deployment? Reach out to our team.
            </p>
          </div>

          {/* 2-Column Responsive Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 28,
              marginBottom: 40,
            }}
          >
            {/* Left Column: Official Contact Channels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Email Card */}
              <div
                className="card"
                style={{
                  padding: 24,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg, 16px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-brand-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-brand)',
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Official Email
                    </div>
                    <a
                      href="mailto:surakshaar.in@gmail.com"
                      style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-brand)', textDecoration: 'none' }}
                    >
                      surakshaar.in@gmail.com
                    </a>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  For general questions, OTP verification inquiries, certificate verification, and feedback.
                </p>
              </div>

              {/* Instagram Card */}
              <div
                className="card"
                style={{
                  padding: 24,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg, 16px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: '#FDF2F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DB2777',
                    }}
                  >
                    <Instagram size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Official Social
                    </div>
                    <a
                      href="https://www.instagram.com/surakshaaar/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '1rem', fontWeight: 700, color: '#DB2777', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>@surakshaaar</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Follow our official Instagram profile for project updates, AR drill highlights, and safety advisories.
                </p>
              </div>

              {/* Support Hours Card */}
              <div
                className="card"
                style={{
                  padding: 24,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg, 16px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Working Hours
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Monday – Saturday, 9:00 AM – 6:00 PM IST
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Standard inquiries receive replies within 24 business hours.
                </p>
              </div>

            </div>

            {/* Right Column: Direct Inquiry Form */}
            <div
              className="card"
              style={{
                padding: 'clamp(20px, 3vw, 32px)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg, 16px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
                Send us a Message
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                Fill out the details below to dispatch your message directly to our official support inbox.
              </p>

              {submitted && (
                <div
                  style={{
                    background: 'var(--color-success-bg, #E6F4EC)',
                    border: '1px solid var(--color-success-border, #A3D4B8)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    color: 'var(--color-success, #2E8B57)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 18,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Email client opened! You can now send your inquiry to surakshaar.in@gmail.com</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 6 }}>Your Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: 6 }}>Your Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: 6 }}>Subject</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Certificate issue / Training question"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: 6 }}>Message</label>
                  <textarea
                    required
                    rows={4}
                    className="form-input"
                    placeholder="How can we assist you?"
                    style={{ resize: 'vertical' }}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ padding: '12px 20px', marginTop: 4 }}
                >
                  <Send size={16} />
                  <span>Send Message via Email</span>
                </button>
              </form>
            </div>

          </div>

          {/* National Industrial Emergency Helplines Reference */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: 'clamp(20px, 3vw, 28px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Shield size={20} color="#DC2626" />
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                National Emergency Helplines (India)
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              In real-life workplace accidents, immediate emergency response is critical. Save these official national helpline numbers:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 12,
              }}
            >
              {[
                { label: 'Fire Service', number: '101', icon: '🚒', color: '#DC2626' },
                { label: 'Ambulance / Medical', number: '108', icon: '🚑', color: '#DC2626' },
                { label: 'Police Emergency', number: '100', icon: '🚓', color: '#1D4ED8' },
                { label: 'All Emergency (National)', number: '112', icon: '📞', color: '#DC2626' },
                { label: 'Disaster Management', number: '1078', icon: '🌊', color: '#D97706' },
                { label: 'Chemical Emergency', number: '1800-180-4104', icon: '☣️', color: '#7C3AED' },
              ].map(({ label, number, icon, color }) => (
                <div
                  key={number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</span>
                  </div>
                  <a
                    href={`tel:${number.replace(/-/g, '')}`}
                    style={{ fontSize: '0.94rem', fontWeight: 800, color, textDecoration: 'none' }}
                  >
                    {number}
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
