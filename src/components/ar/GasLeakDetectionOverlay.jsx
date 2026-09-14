/**
 * SurakshaAR — Gas Leak & Smoke Hazard AR Detection Overlay
 *
 * Real-time camera HUD for Gas Leak & Confined Space module (works like Fire module):
 * - Detects visible smoke/mist plumes in the live camera feed
 * - Rejects human faces/skin, static walls, clothes, and lighting shifts
 * - 3 Validated States:
 *   1. NO HAZARD DETECTED (ambient monitoring, NO confidence % displayed)
 *   2. VERIFYING SMOKE / MIST PLUME... (temporal motion & diffusion analysis in progress)
 *   3. ⚠️ GAS LEAK / SMOKE HAZARD DETECTED (evidence-based visual detection confidence %, AR plume, 10m danger zone)
 * - Highlights the detected smoke plume region with bounding reticle
 * - Clear disclaimer: Visual smoke detection for simulated training; does not measure gas ppm
 * - Multilingual spoken evacuation warning (English, Hindi, Santali)
 * - Auto-advances Step 0 (Identify Gas Leak Warning)
 */

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw, Wind, Users, CloudFog } from 'lucide-react'
import { SmokePlumeDetector } from '../../lib/gasDetection'
import { speak } from '../../lib/voice'

export default function GasLeakDetectionOverlay({
  videoRef,
  isActive = true,
  lang = 'en',
  onSourceDetected,
  onTaskCompleted,
}) {
  const [detection, setDetection] = useState({
    isGasHazard:      false,
    isSmoke:          false,
    state:            'none', // 'none' | 'verifying' | 'confirmed'
    visualConfidence: 0,
    bbox:             null,
    pixelCount:       0,
  })

  const [hazardConfirmed, setHazardConfirmed] = useState(false)
  const [taskState, setTaskState]             = useState('scanning') // scanning | completed

  const detectorRef    = useRef(null)
  const animRef        = useRef(null)
  const soundPlayedRef = useRef(false)

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new SmokePlumeDetector({
      sampleWidth:  160,
      sampleHeight: 120,
    })
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  // Live frame analysis loop
  useEffect(() => {
    if (!isActive) return

    function scanFrame() {
      if (videoRef?.current && detectorRef.current) {
        const result = detectorRef.current.detect(videoRef.current)
        setDetection(result)

        // When smoke/gas hazard is confirmed across sustained consecutive frames
        if (result.isGasHazard && result.state === 'confirmed' && !hazardConfirmed) {
          setHazardConfirmed(true)

          if (!soundPlayedRef.current) {
            soundPlayedRef.current = true
            speak(
              lang === 'sat'
                ? 'ᱜᱮᱥ ᱞᱤᱠ ᱫᱷᱩᱶᱟ ᱵᱚᱛᱚᱨ ᱧᱟᱢ ᱮᱱᱟ! ᱩᱞᱴᱟᱹ ᱦᱚᱭ ᱥᱮᱫ ᱚᱰᱚᱠᱚᱜ ᱢᱮ ᱟᱨ ᱵᱟᱰᱤ ᱥᱤᱥᱴᱚᱢ ᱯᱟᱸᱡᱟᱭ ᱢᱮ᱾'
                : lang === 'hi'
                  ? 'गैस रिसाव धुआं खतरा पाया गया! तुरंत हवा के विपरीत दिशा में निकलें और बडी सिस्टम का पालन करें।'
                  : 'Gas leak smoke hazard detected! Evacuate upwind immediately and follow buddy system.',
              lang
            )
          }

          if (onSourceDetected) onSourceDetected(result)

          // Auto-advance Step 0 after 1.2s of confirmed hazard
          setTimeout(() => {
            setTaskState('completed')
            if (onTaskCompleted) {
              onTaskCompleted({
                wasCorrect:     true,
                responseTimeMs: 1200,
                score:          100,
                selectedAnswer: 'Identified',
              })
            }
          }, 1200)
        }
      }
      animRef.current = requestAnimationFrame(scanFrame)
    }

    animRef.current = requestAnimationFrame(scanFrame)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isActive, videoRef, hazardConfirmed, lang, onSourceDetected, onTaskCompleted])

  function handleSimulateSmoke() {
    if (detectorRef.current) {
      detectorRef.current.triggerSimulation(true)
    }
  }

  function handleReset() {
    if (detectorRef.current) detectorRef.current.reset()
    setHazardConfirmed(false)
    soundPlayedRef.current = false
    setTaskState('scanning')
    setDetection({
      isGasHazard:      false,
      isSmoke:          false,
      state:            'none',
      visualConfidence: 0,
      bbox:             null,
      pixelCount:       0,
    })
  }

  if (!isActive) return null

  const isConfirmed = detection.state === 'confirmed' && (detection.isGasHazard || hazardConfirmed)
  const isVerifying = detection.state === 'verifying'
  const isNone      = detection.state === 'none' && !hazardConfirmed

  return (
    <div
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        10,
        fontFamily:    'var(--font-sans, system-ui)',
        overflow:      'hidden',
      }}
    >
      <style>{`
        @keyframes plumePuff1 {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0.85; }
          50% { transform: translate(-45%, -45px) scale(1.15); opacity: 0.65; }
          100% { transform: translate(-55%, -95px) scale(1.7); opacity: 0; }
        }
        @keyframes plumePuff2 {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0.9; }
          50% { transform: translate(-58%, -55px) scale(1.25); opacity: 0.6; }
          100% { transform: translate(-42%, -110px) scale(1.9); opacity: 0; }
        }
        @keyframes dangerZonePulse {
          0% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.65; }
          50% { transform: translate(-50%, -50%) scale(1.03); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.65; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── 1. TOP SCANNING STATUS BAR (3 DISTINCT STATES) ── */}
      <div
        style={{
          margin:        '68px auto 0',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           6,
          pointerEvents: 'all',
          maxWidth:      '94vw',
        }}
      >
        {/* STATE A: NO HAZARD DETECTED (NO confidence percentage shown) */}
        {isNone && (
          <div
            style={{
              background:     'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border:         '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius:   20,
              padding:        '7px 18px',
              color:          'white',
              fontSize:       '0.82rem',
              fontWeight:     600,
              display:        'flex',
              alignItems:     'center',
              gap:            9,
              boxShadow:      '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <span
              style={{
                width:        9,
                height:       9,
                borderRadius: '50%',
                background:   '#10B981',
                boxShadow:    '0 0 10px #10B981',
                flexShrink:   0,
              }}
            />
            <span>AI Camera Active · <strong>NO HAZARD DETECTED</strong></span>
            <span
              style={{
                color:       '#94A3B8',
                fontSize:    '0.74rem',
                borderLeft:  '1px solid rgba(255,255,255,0.2)',
                paddingLeft: 8,
              }}
            >
              Point camera at visible smoke / mist
            </span>
            <button
              onClick={handleSimulateSmoke}
              title="Test simulation"
              style={{
                background:   'rgba(234, 88, 12, 0.25)',
                border:       '1px solid rgba(234, 88, 12, 0.55)',
                color:        '#FFB347',
                borderRadius: 8,
                padding:      '2px 8px',
                fontSize:     '0.68rem',
                fontWeight:   700,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          3,
                marginLeft:   4,
              }}
            >
              <CloudFog size={12} color="#FFB347" /> Simulate
            </button>
          </div>
        )}

        {/* STATE B: VERIFYING SMOKE / MIST PLUME... */}
        {isVerifying && (
          <div
            style={{
              background:     'rgba(120, 85, 0, 0.92)',
              backdropFilter: 'blur(8px)',
              border:         '1.5px solid #FCD34D',
              borderRadius:   14,
              padding:        '8px 18px',
              color:          'white',
              fontSize:       '0.84rem',
              fontWeight:     700,
              display:        'flex',
              alignItems:     'center',
              gap:            8,
              boxShadow:      '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <span
              style={{
                width:        10,
                height:       10,
                borderRadius: '50%',
                background:   '#FCD34D',
                boxShadow:    '0 0 10px #FCD34D',
                flexShrink:   0,
                animation:    'pulse 0.8s ease-in-out infinite',
              }}
            />
            <span>🟡 VERIFYING SMOKE / MIST PLUME... (Analyzing plume motion & diffusion)</span>
          </div>
        )}

        {/* STATE C: ⚠️ GAS LEAK / SMOKE HAZARD DETECTED */}
        {isConfirmed && (
          <div
            style={{
              background:   'linear-gradient(90deg, rgba(220, 38, 38, 0.96), rgba(234, 88, 12, 0.96))',
              border:       '1.5px solid #FCA5A5',
              borderRadius: 14,
              padding:      '10px 20px',
              color:        'white',
              display:      'flex',
              flexDirection:'column',
              alignItems:   'center',
              gap:          4,
              boxShadow:    '0 6px 24px rgba(220, 38, 38, 0.55)',
              animation:    'slideDownFade 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.94rem', fontWeight: 800, letterSpacing: '0.03em' }}>
              <AlertTriangle size={18} color="#FEF08A" />
              <span>⚠️ GAS LEAK / SMOKE HAZARD DETECTED</span>
              <span
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  padding:    '2px 9px',
                  borderRadius: 6,
                  fontSize:   '0.74rem',
                  fontWeight: 800,
                  color:      '#34D399',
                  border:     '1px solid rgba(52, 211, 153, 0.4)',
                }}
              >
                {Math.round(detection.visualConfidence * 100)}% VISUAL CONFIDENCE
              </span>
              <button
                onClick={handleReset}
                title="Reset detection"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border:     '1px solid rgba(255,255,255,0.25)',
                  color:      'white',
                  borderRadius: 6,
                  padding:    '2px 7px',
                  fontSize:   '0.68rem',
                  cursor:     'pointer',
                  display:    'flex',
                  alignItems: 'center',
                  gap:        3,
                }}
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#FEF08A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={14} /> <span>EVACUATE UPWIND IMMEDIATELY • BUDDY SYSTEM MANDATORY</span>
            </div>
          </div>
        )}

        {/* Reality Disclaimer: Visual smoke detection for simulated training */}
        <div
          style={{
            background:   'rgba(0, 0, 0, 0.65)',
            borderRadius: '8px',
            padding:      '3px 10px',
            color:        'rgba(255, 255, 255, 0.75)',
            fontSize:     '0.64rem',
            textAlign:    'center',
          }}
        >
          ℹ️ Visual smoke detection for simulated training scenario • Smartphone cameras do not measure gas ppm
        </div>
      </div>

      {/* ── 2. HIGHLIGHT DETECTED SMOKE REGION & AR GAS PLUME SCENARIO ── */}
      {isConfirmed && detection.bbox && (
        <div
          style={{
            position:   'absolute',
            left:       `${Math.max(2, Math.min(90, detection.bbox.x * 100))}%`,
            top:        `${Math.max(4, Math.min(84, detection.bbox.y * 100))}%`,
            width:      `${Math.max(12, Math.min(60, detection.bbox.width * 100))}%`,
            height:     `${Math.max(12, Math.min(58, detection.bbox.height * 100))}%`,
            border:     '2.5px solid #F59E0B',
            borderRadius: 10,
            boxShadow:  '0 0 24px rgba(245, 158, 11, 0.75), inset 0 0 16px rgba(245, 158, 11, 0.3)',
            transition: 'all 0.12s ease-out',
            pointerEvents: 'none',
          }}
        >
          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: -4, left: -4, width: 12, height: 12, borderTop: '3px solid #10B981', borderLeft: '3px solid #10B981' }} />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderTop: '3px solid #10B981', borderRight: '3px solid #10B981' }} />
          <div style={{ position: 'absolute', bottom: -4, left: -4, width: 12, height: 12, borderBottom: '3px solid #10B981', borderLeft: '3px solid #10B981' }} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 12, height: 12, borderBottom: '3px solid #10B981', borderRight: '3px solid #10B981' }} />

          {/* Floating Smoke Target Label */}
          <div
            style={{
              position:       'absolute',
              top:            -28,
              left:           '50%',
              transform:      'translateX(-50%)',
              background:     'rgba(217, 119, 6, 0.95)',
              backdropFilter: 'blur(4px)',
              color:          'white',
              padding:        '3px 10px',
              borderRadius:   6,
              fontSize:       '0.74rem',
              fontWeight:     800,
              letterSpacing:  '0.04em',
              whiteSpace:     'nowrap',
              display:        'flex',
              alignItems:     'center',
              gap:            5,
              boxShadow:      '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <CloudFog size={13} color="#FDE047" />
            <span>SMOKE / MIST PLUME ({Math.round(detection.visualConfidence * 100)}%)</span>
          </div>

          {/* AR VIRTUAL GAS LEAK PLUME (Emitting from detected smoke) */}
          <div
            style={{
              position: 'absolute',
              bottom:   '10%',
              left:     '50%',
              width:    '160px',
              height:   '220px',
              pointerEvents: 'none',
            }}
          >
            {/* Billowing vapor cloud 1 */}
            <div
              style={{
                position:     'absolute',
                bottom:       0,
                left:         '50%',
                width:        '110px',
                height:       '110px',
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(163, 230, 53, 0.85) 0%, rgba(132, 204, 22, 0.45) 55%, rgba(101, 163, 13, 0) 80%)',
                filter:       'blur(8px)',
                animation:    'plumePuff1 2.2s infinite ease-out',
              }}
            />
            {/* Billowing vapor cloud 2 */}
            <div
              style={{
                position:     'absolute',
                bottom:       10,
                left:         '50%',
                width:        '130px',
                height:       '130px',
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(234, 179, 8, 0.8) 0%, rgba(163, 230, 53, 0.4) 60%, rgba(101, 163, 13, 0) 80%)',
                filter:       'blur(10px)',
                animation:    'plumePuff2 2.6s infinite ease-out 0.8s',
              }}
            />
            {/* Source leak emitter glow */}
            <div
              style={{
                position:     'absolute',
                bottom:       -5,
                left:         '50%',
                transform:    'translateX(-50%)',
                width:        24,
                height:       24,
                borderRadius: '50%',
                background:   '#FACC15',
                boxShadow:    '0 0 20px #84CC16',
              }}
            />
          </div>

          {/* AR DANGER ZONE PERIMETER (Ground perimeter around source) */}
          <div
            style={{
              position:     'absolute',
              top:          '50%',
              left:         '50%',
              transform:    'translate(-50%, -50%)',
              width:        '320px',
              height:       '320px',
              borderRadius: '50%',
              border:       '3px dashed #EF4444',
              boxShadow:    '0 0 30px rgba(239, 68, 68, 0.55), inset 0 0 25px rgba(239, 68, 68, 0.25)',
              animation:    'dangerZonePulse 2s infinite ease-in-out',
              display:      'flex',
              alignItems:   'flex-end',
              justifyContent: 'center',
              paddingBottom: 8,
            }}
          >
            <span
              style={{
                background:   '#DC2626',
                color:        '#ffffff',
                fontSize:     '0.62rem',
                fontWeight:   800,
                padding:      '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}
            >
              ⚠️ DANGER ZONE: 10m RADIUS
            </span>
          </div>
        </div>
      )}

      {/* ── 3. EVACUATION GUIDANCE HUD (When Hazard is Confirmed) ── */}
      {isConfirmed && (
        <div
          style={{
            position:       'absolute',
            bottom:         185,
            left:           '50%',
            transform:      'translateX(-50%)',
            width:          'min(460px, 94vw)',
            background:     'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            border:         '1.5px solid #EF4444',
            borderRadius:   '14px',
            padding:        '12px 14px',
            color:          '#ffffff',
            pointerEvents:  'auto',
            boxShadow:      '0 8px 30px rgba(0,0,0,0.6)',
            animation:      'slideUpFade 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>
            <AlertTriangle size={17} color="#EF4444" />
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FCA5A5' }}>
              EMERGENCY EVACUATION PROTOCOL
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: '#DC2626', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
              CRITICAL
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '8px' }}>
              <Wind size={15} color="#38BDF8" />
              <span><strong>1. Evacuate UPWIND:</strong> Move against wind direction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '8px' }}>
              <Users size={15} color="#34D399" />
              <span><strong>2. Buddy System:</strong> Confirm partner, never enter alone</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. STEP COMPLETION BADGE (WHEN CONFIRMED) ── */}
      {taskState === 'completed' && (
        <div
          style={{
            position:       'absolute',
            bottom:         110,
            left:           '50%',
            transform:      'translateX(-50%)',
            pointerEvents:  'all',
            background:     'rgba(16, 185, 129, 0.95)',
            color:          'white',
            borderRadius:   14,
            padding:        '10px 24px',
            display:        'flex',
            alignItems:     'center',
            gap:            10,
            fontWeight:     800,
            fontSize:       '0.88rem',
            boxShadow:      '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>Gas Leak / Smoke Hazard Identified ✓ — Proceeding to Step 2</span>
        </div>
      )}
    </div>
  )
}
