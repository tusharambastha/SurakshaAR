import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { Copyright as CopyrightIcon, ShieldCheck, FileCheck, Mail, AlertCircle } from 'lucide-react'

export default function Copyright() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: 64 }}>
        <div className="page-container" style={{ maxWidth: 840, margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-brand)', marginBottom: 8 }}>
              <CopyrightIcon size={20} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Legal Notice</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              Copyright &amp; Intellectual Property Notice
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
              &copy; 2026 SurakshaAR. All Rights Reserved.
            </p>
          </div>

          {/* Copyright Highlight Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-50, #FFF3EB), var(--color-surface, #FFFFFF))',
              border: '1.5px solid var(--color-brand-100, #FFE6D5)',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: '24px 28px',
              marginBottom: 32,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                All Rights Reserved &copy; 2026 SurakshaAR
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Developed for Smart India Hackathon 2026 (Problem Statement SIH26041). All software code, 3D simulations, AR experiences, audio synthesizers, and assessment materials are legally protected.
              </div>
            </div>
          </div>

          {/* Detailed Copyright Sections */}
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
            {/* 1. Proprietary Ownership */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                1. Proprietary Assets &amp; Ownership
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 10px' }}>
                All materials contained within the SurakshaAR application and website are the proprietary property of the SurakshaAR team and project contributors, including but not limited to:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <li>Custom Three.js 3D models (fire extinguishers, machinery nip-point rollers, gas detection pipelines, emergency panels).</li>
                <li>Augmented reality WebXR hit-test tracking routines and surface placement systems.</li>
                <li>Procedural Web Audio sound effects (CO₂ discharge plumes, industrial alarms, combustion sounds).</li>
                <li>Scenario training step sequences, PASS firefighting animations, and decision-tree logic.</li>
                <li>Graphic design, brand typography, badges, color palettes, and the official SurakshaAR logo.</li>
                <li>Curated safety question banks and localized translations (English, Hindi, Santali ᱥᱟᱱᱛᱟᱲᱤ).</li>
              </ul>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 2. Permitted Use */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                2. Permitted Use
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                Individual trainees, students, safety officers, and authorized industrial plant personnel are granted a non-exclusive, non-transferable, revocable license to access SurakshaAR solely for educational learning, emergency drill practice, and certification testing.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 3. Prohibited Activities */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                3. Prohibited Activities
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 10px' }}>
                Except as explicitly permitted by the project creators, you may not:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <li>Copy, distribute, duplicate, republish, or sub-license any portion of the 3D models or AR training code.</li>
                <li>Extract, decompile, reverse-engineer, or disassemble the application binaries or assets.</li>
                <li>Commercialize, sell, or repackage SurakshaAR training modules as a third-party paid product without prior authorization.</li>
                <li>Remove or obscure any copyright notices, watermarks, or digital signatures from generated safety certificates.</li>
              </ul>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 4. Digital Certificate Verification & Anti-Counterfeiting */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                4. Certificate Integrity &amp; Anti-Counterfeiting
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                All digital certificates issued upon module completion contain unique certificate identification numbers, cryptographic verification hashes, and verifiable QR codes. Any reproduction, forgery, or tampering with SurakshaAR completion certificates is strictly prohibited and invalidates the credential.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 5. Open-Source Ecosystem Acknowledgments */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                5. Third-Party &amp; Open-Source Attributions
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                SurakshaAR proudly utilizes open-source libraries and open web standards, including Three.js (MIT License), React (MIT License), Vite, Lucide Icons (ISC License), and the W3C WebXR Device API. All respective third-party trademarks and open-source copyrights belong to their respective owners.
              </p>
            </section>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* 6. Contact for Permissions */}
            <section>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                6. Licensing &amp; Copyright Inquiries
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
                To request permissions, institutional licensing, academic collaborations, or to report copyright infringement concerns, please contact our team:
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
