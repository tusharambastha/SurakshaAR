import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { AlertTriangle, FileText, ShieldCheck, Mail } from 'lucide-react'

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: 64 }}>
        <div className="page-container" style={{ maxWidth: 840, margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-brand)', marginBottom: 8 }}>
              <FileText size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Legal</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              Terms &amp; Conditions
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Last updated: September 2026 · Effective for all SurakshaAR users
            </p>
          </div>

          {/* Critical Safety & Educational Disclaimer Alert */}
          <div
            style={{
              background: 'var(--color-warning-bg, #FFFBEB)',
              border: '1.5px solid var(--color-warning-border, #FDE68A)',
              borderRadius: 'var(--radius-lg, 14px)',
              padding: '20px 24px',
              marginBottom: 32,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={24} color="var(--color-warning, #D97706)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#92400E', margin: '0 0 6px' }}>
                Important Educational &amp; Safety Disclaimer
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                <strong>SurakshaAR is an educational and industrial safety training platform.</strong> All simulations, Augmented Reality (AR) experiences, interactive scenarios, videos, checklists, and safety information provided on this platform are designed solely for educational, simulation, and training purposes.
                <br /><br />
                <strong>These simulations are NOT a substitute for official workplace safety procedures, professional safety officer instructions, factory operating guidelines, or applicable statutory and government safety regulations</strong> (such as DGMS, Factory Act, OSHA, or Bureau of Indian Standards). In actual emergency situations, always adhere strictly to your plant's official emergency action plan, emergency sirens, and professional command instructions.
              </p>
            </div>
          </div>

          {/* Terms Content Sections */}
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
            {/* 1. Use of Platform */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                1. Use of Platform
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                By accessing or using SurakshaAR (including our web platform, mobile PWA, 3D simulations, and AR modules), you agree to be bound by these Terms &amp; Conditions. The platform is intended for workers, trainees, supervisors, and safety personnel to learn and practice emergency safety protocols in a simulated environment.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 2. User Account */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                2. User Account
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                Users register using their genuine email address and verify access via a one-time password (OTP). You are responsible for maintaining the confidentiality of your session credentials and ensuring that information provided (such as your full name, employee identification, and site location) is accurate for certificate generation and training records.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 3. Training Content */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                3. Training Content
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                The training scenarios (such as Fire &amp; Explosion Response, Gas Leak &amp; Confined Space, Machinery Guarding, and PPE Inspection) present simulated hazards to teach emergency sequences. While scenario procedures align with recognized standards (e.g., IS 2925, IS 15683, PASS method), plant-specific engineering controls and local Standard Operating Procedures (SOPs) must always take legal precedence at your job site.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 4. User Conduct */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                4. User Conduct
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                You agree to use SurakshaAR lawfully, ethically, and without attempting to disrupt service operations. You may not reverse-engineer, exploit vulnerabilities, automate fraudulent drill submissions, or forge completion certificates.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 5. Intellectual Property */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                5. Intellectual Property
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                All original 3D models, textures, user interface designs, audio synthesizers, brand marks, and software code comprising SurakshaAR are the intellectual property of the SurakshaAR team. Individual trainees are granted a personal, non-exclusive license to access and complete training scenarios.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 6. Third-Party Services */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                6. Third-Party Services
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                SurakshaAR utilizes select third-party services to deliver its capabilities, including Google WebXR APIs for camera surface tracking, EmailJS and Google Apps Script for automated OTP dispatch, and Supabase for secure cloud synchronization. Your interaction with these third parties is subject to their respective terms and service policies.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 7. Platform Availability */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                7. Platform Availability
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                SurakshaAR is designed with offline progressive web app (PWA) capabilities to support remote and underground mine drills. However, cloud synchronization, certificate verification, and real-time AI assistance require active internet connectivity. We strive for high uptime but do not guarantee uninterrupted availability during system maintenance.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 8. Updates to Terms */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                8. Updates to Terms
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                We may periodically update these Terms to reflect technical improvements, regulatory guidelines, or additional safety modules. Continued use of SurakshaAR after modifications constitutes acceptance of the revised Terms.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 9. Contact */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                9. Contact
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
                For questions regarding these Terms &amp; Conditions or organizational deployment inquiries, please contact our team:
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
