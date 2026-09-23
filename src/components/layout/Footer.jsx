import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Mail, Instagram, ExternalLink, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
        marginTop: 'auto',
        fontSize: 'var(--text-sm)',
        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      <div
        className="page-container"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '40px clamp(16px, 4vw, 32px) 28px',
          boxSizing: 'border-box',
        }}
      >
        {/* Main Footer Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 32,
            marginBottom: 32,
          }}
        >
          {/* Brand & Brief Description */}
          <div style={{ maxWidth: 360, minWidth: 260, flex: '1 1 280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <img
                src={`${import.meta.env.BASE_URL}images/surakshaar-logo.png`}
                alt="SurakshaAR Logo"
                style={{ height: 32, width: 'auto', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}>
                Suraksha<span style={{ color: 'var(--color-brand)' }}>AR</span>
              </span>
            </div>
            <p
              style={{
                fontSize: '0.86rem',
                lineHeight: 1.6,
                color: 'var(--color-text-muted)',
                margin: 0,
              }}
            >
              Immersive, interactive, and practical Augmented Reality safety training for high-risk industrial environments.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 14,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
              }}
            >
              <Shield size={12} color="var(--color-brand)" />
              <span>Smart India Hackathon 2026 · SIH26041</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div style={{ minWidth: 180, flex: '1 1 180px' }}>
            <h4
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 14,
              }}
            >
              Platform
            </h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link
                  to="/about"
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  Know About SurakshaAR
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect & Social Links */}
          <div style={{ minWidth: 200, flex: '1 1 200px' }}>
            <h4
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 14,
              }}
            >
              Connect
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Instagram link */}
              <a
                href="https://www.instagram.com/surakshaaar/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
              >
                <Instagram size={16} color="var(--color-brand)" />
                <span>Instagram: @surakshaaar</span>
                <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
              </a>

              {/* Official Email */}
              <a
                href="mailto:surakshaar.in@gmail.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-brand)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
              >
                <Mail size={16} color="var(--color-brand)" />
                <span>surakshaar.in@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <div>
            © 2026 SurakshaAR. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/privacy" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              Privacy
            </Link>
            <span>·</span>
            <Link to="/terms" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              Terms
            </Link>
            <span>·</span>
            <Link to="/contact" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
