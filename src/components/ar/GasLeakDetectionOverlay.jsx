/**
 * SurakshaAR — Gas Leak AR Detection Overlay
 *
 * Real-time camera HUD for Gas Leak training module:
 * - Recognizes designated industrial training markers / cylinder sources
 * - Explicitly rejects human bodies, room walls, and clothes
 * - Displays Visual Scenario Confidence (never gas concentration or ppm)
 * - Renders AR Virtual Gas Leak Plume, 10m Danger Zone, Warning, and Evacuation Guidance
 * - Announces multilingual voice protocol alert
 * - Auto-advances Step 0 (Identify Gas Leak Warning)
 */

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw, FileText, Wind, Eye, Users } from 'lucide-react'
import { GasTrainingDetector } from '../../lib/gasDetection'
import { speak } from '../../lib/voice'

export default function GasLeakDetectionOverlay({
  videoRef,
  isActive = true,
  lang = 'en',
  onSourceDetected,
  onTaskCompleted,
}) {
  const [detection, setDetection] = useState({
    isRecognized:     false,
    state:            'none', // 'none' | 'verifying' | 'confirmed'
    visualConfidence: 0,
    bbox:             null,
    sourceType:       'Searching...',
  })

  const [sourceConfirmed, setSourceConfirmed] = useState(false)
  const [taskState, setTaskState]             = useState('scanning') // scanning | completed
  const [showMarkerModal, setShowMarkerModal] = useState(false)

  const detectorRef         = useRef(null)
  const animRef             = useRef(null)
  const soundPlayedRef      = useRef(false)

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new GasTrainingDetector({
      sampleWidth:  160,
      sampleHeight: 120,
    })
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  // Frame analysis loop
  useEffect(() => {
    if (!isActive) return

    function scanFrame() {
      if (videoRef?.current && detectorRef.current) {
        const result = detectorRef.current.detect(videoRef.current)
        setDetection(result)

        // When training source is confirmed across consecutive frames
        if (result.isRecognized && result.state === 'confirmed' && !sourceConfirmed) {
          setSourceConfirmed(true)

          if (!soundPlayedRef.current) {
            soundPlayedRef.current = true
            speak(
              lang === 'sat'
                ? 'ᱜᱮᱥ ᱞᱤᱠ ᱵᱚᱛᱚᱨ ᱧᱟᱢ ᱮᱱᱟ! ᱩᱞᱴᱟᱹ ᱦᱚᱭ ᱥᱮᱫ ᱚᱰᱚᱠᱚᱜ ᱢᱮ ᱟᱨ ᱵᱟᱰᱤ ᱥᱤᱥᱴᱚᱢ ᱯᱟᱸᱡᱟᱭ ᱢᱮ᱾'
                : lang === 'hi'
                  ? 'गैस रिसाव प्रशिक्षण स्रोत की पहचान हुई! तुरंत हवा के विपरीत दिशा में निकलें और बडी सिस्टम का पालन करें।'
                  : 'Gas leak training source recognized! Evacuate upwind immediately and follow buddy system.',
              lang
            )
          }

          if (onSourceDetected) onSourceDetected(result)

          // Auto-advance Step 0 after 1.2s confirmation
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
  }, [isActive, videoRef, sourceConfirmed, lang, onSourceDetected, onTaskCompleted])

  function handleSimulateSource() {
    if (detectorRef.current) {
      detectorRef.current.triggerSimulation(true)
    }
  }

  function handleReset() {
    if (detectorRef.current) {
      detectorRef.current.triggerSimulation(false)
    }
    setSourceConfirmed(false)
    setTaskState('scanning')
    soundPlayedRef.current = false
    setDetection({
      isRecognized:     false,
      state:            'none',
      visualConfidence: 0,
      bbox:             null,
      sourceType:       'Searching...',
    })
  }

  const isVerifying = detection.state === 'verifying'
  const isConfirmed = detection.state === 'confirmed' || sourceConfirmed

  return (
    <div
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        10,
        fontFamily:    'var(--font-sans, system-ui)',
      }}
    >
      <style>{`
        @keyframes plumePuff1 {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0.8; }
          50% { transform: translate(-45%, -40px) scale(1.1); opacity: 0.6; }
          100% { transform: translate(-55%, -85px) scale(1.6); opacity: 0; }
        }
        @keyframes plumePuff2 {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0.9; }
          50% { transform: translate(-58%, -50px) scale(1.2); opacity: 0.55; }
          100% { transform: translate(-42%, -100px) scale(1.8); opacity: 0; }
        }
        @keyframes dangerZonePulse {
          0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.65; }
          50% { transform: translate(-50%, -50%) scale(1.03); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.65; }
        }
        @keyframes warningBannerPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 30px rgba(220, 38, 38, 0.85); }
        }
      `}</style>

      {/* ── TOP HUD BANNER ────────────────────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          top:            16,
          left:           '50%',
          transform:      'translateX(-50%)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            6,
          pointerEvents:  'auto',
          maxWidth:       '92vw',
        }}
      >
        {/* Status Chip */}
        <div
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          8,
            padding:      '6px 14px',
            borderRadius: '24px',
            background:   isConfirmed ? 'rgba(220, 38, 38, 0.92)' : isVerifying ? 'rgba(217, 119, 6, 0.90)' : 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(8px)',
            border:       isConfirmed ? '1.5px solid #EF4444' : isVerifying ? '1.5px solid #F59E0B' : '1.5px solid rgba(255, 255, 255, 0.25)',
            color:        '#ffffff',
            fontSize:     '0.78rem',
            fontWeight:   700,
            boxShadow:    isConfirmed ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
            transition:   'all 0.25s ease',
          }}
        >
          {isConfirmed ? (
            <>
              <ShieldAlert size={15} color="#FEE2E2" />
              <span>⚠️ HAZARD CONFIRMED: VIRTUAL GAS LEAK SCENARIO</span>
            </>
          ) : isVerifying ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDE047', animation: 'ping 1s infinite' }} />
              <span>VERIFYING TRAINING SOURCE (MULTI-FRAME)…</span>
            </>
          ) : (
            <>
              <Eye size={14} color="#38BDF8" />
              <span>SEARCHING FOR DESIGNATED GAS TRAINING SOURCE / MARKER</span>
            </>
          )}
        </div>

        {/* Confidence display — STRICTLY ONLY ON RECOGNITION, CLEARLY 'Visual Scenario Confidence' */}
        {isConfirmed && (
          <div
            style={{
              background:     'rgba(0, 0, 0, 0.85)',
              border:         '1.5px solid #10B981',
              borderRadius:   '14px',
              padding:        '4px 12px',
              color:          '#34D399',
              fontSize:       '0.72rem',
              fontWeight:     800,
              display:        'flex',
              alignItems:     'center',
              gap:            6,
              letterSpacing:  '0.02em',
            }}
          >
            <CheckCircle2 size={13} color="#10B981" />
            <span>Visual Scenario Confidence: {Math.round(detection.visualConfidence * 100)}%</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>• Marker Verified</span>
          </div>
        )}

        {/* Helper Note for Reality Calibration */}
        {!isConfirmed && (
          <div
            style={{
              background:   'rgba(0, 0, 0, 0.65)',
              borderRadius: '8px',
              padding:      '3px 10px',
              color:        'rgba(255, 255, 255, 0.8)',
              fontSize:     '0.65rem',
              textAlign:    'center',
            }}
          >
            ℹ️ Camera CV recognizes designated training markers • Human bodies & walls rejected
          </div>
        )}
      </div>

      {/* ── AR RETICLE & VIRTUAL GAS SCENARIO VISUALIZATION ────────────── */}
      <div
        style={{
          position:  'absolute',
          top:       detection.bbox ? `${detection.bbox.y * 100}%` : '42%',
          left:      detection.bbox ? `${detection.bbox.x * 100}%` : '50%',
          transform: 'translate(-50%, -50%)',
          width:     detection.bbox ? `${Math.max(140, detection.bbox.width * window.innerWidth * 0.9)}px` : '180px',
          height:    detection.bbox ? `${Math.max(140, detection.bbox.height * window.innerHeight * 0.9)}px` : '180px',
          transition: 'all 0.15s ease-out',
        }}
      >
        {/* Reticle Boundary */}
        <div
          style={{
            position:     'absolute',
            inset:        0,
            borderRadius: isConfirmed ? '18px' : '50%',
            border:       isConfirmed ? '3px solid #10B981' : isVerifying ? '2.5px dashed #F59E0B' : '2px dashed rgba(255, 255, 255, 0.5)',
            boxShadow:    isConfirmed ? '0 0 25px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
            transition:   'all 0.2s ease',
          }}
        />

        {/* Center Target Dot when idle */}
        {!isConfirmed && (
          <div
            style={{
              position:     'absolute',
              top:          '50%',
              left:         '50%',
              transform:    'translate(-50%, -50%)',
              width:        8,
              height:       8,
              borderRadius: '50%',
              background:   isVerifying ? '#F59E0B' : '#ffffff',
            }}
          />
        )}

        {/* ── AR VIRTUAL GAS LEAK PLUME (Shown on Recognition) ────────── */}
        {isConfirmed && (
          <div
            style={{
              position: 'absolute',
              bottom:   '30%',
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
                width:        26,
                height:       26,
                borderRadius: '50%',
                background:   '#FACC15',
                boxShadow:    '0 0 20px #84CC16',
              }}
            />
          </div>
        )}

        {/* ── AR DANGER ZONE PERIMETER (Shown on Recognition) ─────────── */}
        {isConfirmed && (
          <div
            style={{
              position:     'absolute',
              top:          '50%',
              left:         '50%',
              transform:    'translate(-50%, -50%)',
              width:        '340px',
              height:       '340px',
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
        )}
      </div>

      {/* ── EVACUATION GUIDANCE HUD (When Hazard is Confirmed) ─────────── */}
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

      {/* ── DEMO / TESTING CONTROLS (Top Right) ───────────────────────── */}
      <div
        style={{
          position:      'absolute',
          top:           68,
          right:         14,
          display:       'flex',
          flexDirection: 'column',
          gap:           6,
          pointerEvents: 'auto',
        }}
      >
        {/* Toggle Training Marker Card Modal */}
        <button
          onClick={() => setShowMarkerModal(true)}
          style={{
            background:     'rgba(15, 23, 42, 0.85)',
            border:         '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius:   '20px',
            padding:        '6px 12px',
            color:          '#ffffff',
            fontSize:       '0.72rem',
            fontWeight:     600,
            cursor:         'pointer',
            display:        'inline-flex',
            alignItems:     'center',
            gap:            6,
            backdropFilter: 'blur(6px)',
          }}
        >
          <FileText size={13} color="#FBBF24" />
          <span>📄 View Training Marker</span>
        </button>

        {/* Place Simulated Training Source button */}
        {!isConfirmed ? (
          <button
            onClick={handleSimulateSource}
            style={{
              background:     'rgba(224, 90, 0, 0.9)',
              border:         '1px solid #FF8A3D',
              borderRadius:   '20px',
              padding:        '6px 12px',
              color:          '#ffffff',
              fontSize:       '0.72rem',
              fontWeight:     700,
              cursor:         'pointer',
              display:        'inline-flex',
              alignItems:     'center',
              gap:            5,
              boxShadow:      '0 4px 12px rgba(224, 90, 0, 0.4)',
            }}
          >
            <span>🎯 Place Simulated Source</span>
          </button>
        ) : (
          <button
            onClick={handleReset}
            style={{
              background:     'rgba(71, 85, 105, 0.85)',
              border:         '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius:   '20px',
              padding:        '6px 12px',
              color:          '#ffffff',
              fontSize:       '0.72rem',
              fontWeight:     600,
              cursor:         'pointer',
              display:        'inline-flex',
              alignItems:     'center',
              gap:            5,
            }}
          >
            <RotateCcw size={12} />
            <span>Reset Source</span>
          </button>
        )}
      </div>

      {/* ── DESIGNATED TRAINING MARKER POPUP MODAL ────────────────────── */}
      {showMarkerModal && (
        <div
          style={{
            position:       'fixed',
            inset:          0,
            background:     'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        20,
            zIndex:         999,
            pointerEvents:  'auto',
          }}
        >
          <div
            style={{
              background:   '#ffffff',
              borderRadius: '16px',
              padding:      '20px',
              maxWidth:     '360px',
              width:        '100%',
              color:        '#0F172A',
              textAlign:    'center',
              boxShadow:    '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800 }}>
              Designated Gas Training Marker
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.74rem', color: '#64748B' }}>
              Aim your camera at this high-contrast industrial training marker to trigger the AR gas-leak scenario.
            </p>

            {/* Industrial Hazard Diamond Pattern SVG */}
            <div
              style={{
                width:        '180px',
                height:       '180px',
                margin:       '0 auto 16px',
                background:   '#FBBF24',
                border:       '10px solid #0F172A',
                borderRadius: '8px',
                transform:    'rotate(45deg)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                boxShadow:    '0 6px 20px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0F172A' }}>
                  GAS LEAK
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0F172A' }}>
                  SOURCE #01
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: '#475569', margin: '0 0 16px' }}>
              💡 <em>You can also test directly by clicking <strong>Place Simulated Source</strong> on the AR HUD.</em>
            </p>

            <button
              onClick={() => setShowMarkerModal(false)}
              style={{
                background:   'var(--color-brand, #E05A00)',
                color:        '#ffffff',
                border:       'none',
                borderRadius: '10px',
                padding:      '10px 24px',
                fontSize:     '0.84rem',
                fontWeight:   700,
                cursor:       'pointer',
                width:        '100%',
              }}
            >
              Close & Aim Camera
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
