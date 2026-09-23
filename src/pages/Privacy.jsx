import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { ShieldCheck, Lock, Mail, UserCheck, Database, EyeOff } from 'lucide-react'

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: 64 }}>
        <div className="page-container" style={{ maxWidth: 840, margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-brand)', marginBottom: 8 }}>
              <ShieldCheck size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transparency</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Last updated: September 2026 · Simple, transparent, and privacy-first
            </p>
          </div>

          {/* Privacy Overview Banner */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '20px 24px',
              marginBottom: 32,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-success-bg, #E6F4EC)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={20} color="var(--color-success, #2E8B57)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--color-text-primary)', marginBottom: 3 }}>
                We respect your data privacy
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                SurakshaAR collects only the minimum necessary information required to authenticate your training sessions, verify emergency drills, and issue safety credentials.
              </div>
            </div>
          </div>

          {/* Policy Content Sections */}
          <div
            className="card"
            style={{
              padding: 'clamp(24px, 4vw, 40px)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg, 16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            {/* 1. Information Collected During Registration */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                1. Information Collected During Registration
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 10px' }}>
                When you create an account on SurakshaAR, we collect the basic details needed to identify you as an industrial trainee:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <li><strong>Full Name:</strong> Displayed on your training dashboard and printed on digital certificates.</li>
                <li><strong>Email Address:</strong> Used for account sign-in and security verification via OTP.</li>
                <li><strong>Plant / Site Location:</strong> (Optional) Used to associate training drills with industrial work zones.</li>
                <li><strong>Language Preference:</strong> Selected interface language (English, Hindi, or Santali).</li>
              </ul>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 2. Email Address Used for OTP & Authentication */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                2. Email Address Used for OTP / Authentication
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                SurakshaAR uses a secure 6-digit One-Time Password (OTP) verification system. When you request a code or create an account, an automated email is sent to your provided email address from <strong>surakshaar.in@gmail.com</strong>. Your email is used strictly for authentication and safety certificate notifications — we never send spam, marketing solicitations, or share your email with third-party advertisers.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 3. Basic Account Information & Training Records */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                3. Basic Account Information &amp; Training History
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                As you complete interactive drills in the AR and 3D simulation modules, we record your drill performance metrics, including completion timestamps, hazard identification reaction times, assessment test scores, and issued certificates. This data allows you and your safety supervisor to track compliance and safety readiness over time.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 4. How Collected Information is Used */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                4. How Collected Information is Used
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <li>To authenticate your identity and safeguard your training account.</li>
                <li>To record scenario completion and evaluate competency gaps.</li>
                <li>To generate digitally signed and verifiable safety training certificates.</li>
                <li>To provide offline synchronization when drilling in remote or underground sites.</li>
              </ul>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 5. Data Security */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                5. Data Security
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                We employ standard modern security practices to protect your data. All communication between your device and SurakshaAR is encrypted using HTTPS and Transport Layer Security (TLS). Passwords, OTP hashes, and auth tokens are protected against unauthorized access.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 6. Third-Party Services */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                6. Third-Party Services
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                SurakshaAR uses a small set of trusted infrastructure providers:
                <br /><br />
                • <strong>EmailJS / Google Mail Service:</strong> Dispatches real-time verification OTP emails.<br />
                • <strong>Supabase:</strong> Provides secure cloud database storage and role-based authentication.<br />
                • <strong>WebXR Device API:</strong> Executes on-device camera plane detection for AR without transmitting video streams to any external server.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 7. User Rights */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                7. User Rights
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                You have the right to view, update, or correct your personal profile information at any time from the <Link to="/profile" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>Profile page</Link>. You can also request complete deletion of your account records or download your earned safety certificates by contacting our support team.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 8. Contact Information */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                8. Contact Information
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
                If you have questions, feedback, or data privacy requests, feel free to reach out directly:
              </p>
              <div
                style={{
                  background: 'var(--color-surface-alt)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '12px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Mail size={16} color="var(--color-brand)" />
                <a href="mailto:surakshaar.in@gmail.com" style={{ color: 'var(--color-brand)', fontWeight: 700, textDecoration: 'none', fontSize: '0.92rem' }}>
                  surakshaar.in@gmail.com
                </a>
              </div>
            </section>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
