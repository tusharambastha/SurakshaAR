/**
 * SurakshaAR — Fire Detection AR Overlay & Interactive Safety Training
 *
 * Provides real-time camera-based flame tracking HUD:
 * - Real-time flame bounding box & reticle positioned at detected flame coordinates
 * - Warning banners: 🔥 FIRE HAZARD DETECTED | ⚠️ MAINTAIN SAFE DISTANCE
 * - Safety protocols: 🧯 Identify Correct Extinguisher | 🚪 Locate Emergency Exit
 * - Automatically verifies and completes Step 1 ("Identify Fire Source") upon flame detection
 * - Zero popup quiz questions during camera training (all questions reserved for Safety Assessment test)
 */

import { useState, useEffect, useRef } from 'react'
import { Flame, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react'
import { FireDetector } from '../../lib/fireDetection'
import { speak } from '../../lib/voice'

export default function FireDetectionOverlay({
  videoRef,
  isActive = true,
  lang = 'en',
  onFireDetected,
  onTaskCompleted,
}) {
  const [detection, setDetection] = useState({
    isFire: false,
    confidence: 0,
    bbox: null,
    flameCenter: null,
    pixelCount: 0,
  })

  const [fireConfirmed, setFireConfirmed] = useState(false)
  const [taskState, setTaskState] = useState('detecting') // detecting | completed

  const detectorRef = useRef(null)
  const animRef = useRef(null)
  const fireSoundPlayedRef = useRef(false)

  // Initialize detector with strict pixel threshold
  useEffect(() => {
    detectorRef.current = new FireDetector({
      sampleWidth: 160,
      sampleHeight: 120,
      minPixels: 18,
    })
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  function handleSimulateFire() {
    detectorRef.current?.triggerSimulation(true)
  }

  function handleResetDetection() {
    detectorRef.current?.reset()
    setFireConfirmed(false)
    setDetection({ isFire: false, confidence: 0, bbox: null, flameCenter: null, pixelCount: 0 })
    setTaskState('detecting')
    fireSoundPlayedRef.current = false
  }

  // Live frame analysis loop
  useEffect(() => {
    if (!isActive) return

    function scanFrame() {
      if (videoRef?.current && detectorRef.current) {
        const result = detectorRef.current.detect(videoRef.current)
        setDetection(result)

        if (result.isFire && !fireConfirmed) {
          setFireConfirmed(true)
          if (!fireSoundPlayedRef.current) {
            fireSoundPlayedRef.current = true
            speak(
              lang === 'hi'
                ? 'आग का खतरा पाया गया! सुरक्षित दूरी बनाए रखें।'
                : 'Fire hazard detected! Maintain safe distance.',
              lang
            )
          }
          if (onFireDetected) onFireDetected(result)

          // Smoothly complete Step 1 after 1.2s of confirmed fire detection
          setTimeout(() => {
            setTaskState('completed')
            if (onTaskCompleted) {
              onTaskCompleted({
                wasCorrect: true,
                responseTimeMs: 1200,
                selectedAnswer: 'Flame Source Identified',
                score: 100,
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
  }, [isActive, videoRef, fireConfirmed, lang, onFireDetected, onTaskCompleted])

  if (!isActive) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>

      {/* ── 1. REAL-TIME FLAME BOUNDING BOX RETICLE ── */}
      {detection.isFire && detection.bbox && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.max(2, Math.min(92, detection.bbox.x * 100))}%`,
            top: `${Math.max(2, Math.min(85, detection.bbox.y * 100))}%`,
            width: `${Math.max(12, Math.min(60, detection.bbox.width * 100))}%`,
            height: `${Math.max(12, Math.min(60, detection.bbox.height * 100))}%`,
            border: '2.5px solid #FF3B30',
            borderRadius: 8,
            boxShadow: '0 0 20px rgba(255, 59, 48, 0.75), inset 0 0 15px rgba(255, 120, 0, 0.4)',
            transition: 'all 0.12s ease-out',
            pointerEvents: 'none',
          }}
        >
          {/* Flame targeting corner brackets */}
          <div style={{ position: 'absolute', top: -4, left: -4, width: 10, height: 10, borderTop: '3px solid #FFD60A', borderLeft: '3px solid #FFD60A' }} />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderTop: '3px solid #FFD60A', borderRight: '3px solid #FFD60A' }} />
          <div style={{ position: 'absolute', bottom: -4, left: -4, width: 10, height: 10, borderBottom: '3px solid #FFD60A', borderLeft: '3px solid #FFD60A' }} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 10, height: 10, borderBottom: '3px solid #FFD60A', borderRight: '3px solid #FFD60A' }} />

          {/* Floating Flame Target Label */}
          <div style={{
            position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(220, 38, 38, 0.92)', backdropFilter: 'blur(4px)',
            color: 'white', padding: '3px 10px', borderRadius: 6,
            fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            <Flame size={13} color="#FFD60A" />
            FLAME DETECTED ({Math.round(detection.confidence * 100)}%)
          </div>
        </div>
      )}

      {/* ── 2. TOP SCANNING STATUS BAR ── */}
      <div style={{
        margin: '68px auto 0',
        pointerEvents: 'all',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        {!detection.isFire ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 20, padding: '7px 18px',
            color: 'white', fontSize: '0.82rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 9,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%', background: '#10B981',
              boxShadow: '0 0 10px #10B981', animation: 'pulse 1.5s infinite',
            }} />
            <span>AI Camera Active · Scanning for flame hazards…</span>
            <button
              onClick={handleSimulateFire}
              title="Test fire detection alarm safely"
              style={{
                background: 'rgba(234, 88, 12, 0.25)',
                border: '1px solid var(--color-brand)',
                color: '#FFB347',
                borderRadius: 12,
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginLeft: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Flame size={12} color="#FFB347" /> Simulate Fire
            </button>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.95), rgba(234, 88, 12, 0.95))',
            border: '1.5px solid #FCA5A5',
            borderRadius: 14, padding: '10px 20px',
            color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            boxShadow: '0 6px 24px rgba(220, 38, 38, 0.5)',
            animation: 'slideDownFade 0.25s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.96rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                <Flame size={18} color="#FEF08A" />
                🔥 FIRE HAZARD DETECTED
                <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                  {Math.round(detection.confidence * 100)}% CONFIDENCE
                </span>
              </div>
              <button
                onClick={handleResetDetection}
                style={{
                  background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white', borderRadius: 8, padding: '3px 8px', fontSize: '0.72rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FEF08A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={15} /> ⚠️ MAINTAIN SAFE DISTANCE
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.76rem', color: '#FEE2E2', fontWeight: 600 }}>
              <span>🧯 Identify Correct Extinguisher</span>
              <span>•</span>
              <span>🚪 Locate Emergency Exit</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Completion Confirmation Badge */}
      {taskState === 'completed' && (
        <div style={{
          pointerEvents: 'all',
          margin: '0 auto 24px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: 'white', borderRadius: 14,
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10,
          fontWeight: 800, fontSize: '0.88rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          animation: 'slideUpFade 0.25s ease-out',
        }}>
          <CheckCircle2 size={18} />
          <span>
            {lang === 'hi' ? 'आग के खतरे की पहचान हो गई! चरण 1 पूर्ण ✓' : 'Fire Hazard Identified! Step 1 Complete ✓'}
          </span>
        </div>
      )}
    </div>
  )
}
