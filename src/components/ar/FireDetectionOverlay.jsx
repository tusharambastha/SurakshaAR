/**
 * SurakshaAR — Fire Detection AR Overlay
 *
 * Real-time camera HUD for fire hazard detection with 3 validated states:
 * 1. NO FIRE DETECTED (normal ambient monitoring, no confidence %, no alerts)
 * 2. VERIFYING FIRE... (temporal flicker & combustion analysis in progress)
 * 3. FIRE HAZARD DETECTED (sustained genuine flame confirmed, reticle, confidence %, auto-advances Step 1)
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
    isFire:       false,
    state:        'none', // 'none' | 'verifying' | 'confirmed'
    confidence:   0,
    bbox:         null,
    pixelCount:   0,
    flickerRatio: 0,
  })

  const [fireConfirmed, setFireConfirmed] = useState(false)
  const [taskState, setTaskState]         = useState('scanning') // scanning | completed

  const detectorRef        = useRef(null)
  const animRef            = useRef(null)
  const fireSoundPlayedRef = useRef(false)

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new FireDetector({
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

        // When flame is genuinely confirmed across sustained frames
        if (result.isFire && result.state === 'confirmed' && !fireConfirmed) {
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

          // Auto-advance Step 0 (Identify Fire Source) after 1.2s confirmation
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
  }, [isActive, videoRef, fireConfirmed, lang, onFireDetected, onTaskCompleted])

  function handleSimulateFire() {
    if (detectorRef.current) {
      detectorRef.current.triggerSimulation(true)
    }
  }

  function handleReset() {
    if (detectorRef.current) detectorRef.current.reset()
    setFireConfirmed(false)
    fireSoundPlayedRef.current = false
    setTaskState('scanning')
    setDetection({
      isFire:       false,
      state:        'none',
      confidence:   0,
      bbox:         null,
      pixelCount:   0,
      flickerRatio: 0,
    })
  }

  if (!isActive) return null

  const isConfirmed = detection.state === 'confirmed' && detection.isFire
  const isVerifying = detection.state === 'verifying'
  const isNone      = detection.state === 'none'

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>

      {/* ── 1. FLAME BOUNDING BOX RETICLE — ONLY WHEN CONFIRMED ── */}
      {isConfirmed && detection.bbox && (
        <div
          style={{
            position: 'absolute',
            left:   `${Math.max(2, Math.min(90, detection.bbox.x * 100))}%`,
            top:    `${Math.max(4, Math.min(84, detection.bbox.y * 100))}%`,
            width:  `${Math.max(10, Math.min(50, detection.bbox.width * 100))}%`,
            height: `${Math.max(10, Math.min(48, detection.bbox.height * 100))}%`,
            border: '2.5px solid #FF3B30',
            borderRadius: 8,
            boxShadow: '0 0 22px rgba(255, 59, 48, 0.75), inset 0 0 14px rgba(255, 120, 0, 0.4)',
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
            background: 'rgba(220, 38, 38, 0.94)', backdropFilter: 'blur(4px)',
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

      {/* ── 2. TOP SCANNING STATUS BAR (3 DISTINCT STATES) ── */}
      <div style={{
        margin: '68px auto 0',
        pointerEvents: 'all',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>

        {/* STATE A: NO FIRE DETECTED */}
        {isNone && (
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
              boxShadow: '0 0 10px #10B981', flexShrink: 0,
            }} />
            <span>AI Camera Active · <strong>NO FIRE DETECTED</strong></span>
            <span style={{ color: '#94A3B8', fontSize: '0.74rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 8 }}>
              Point at candle / lighter
            </span>
            <button
              onClick={handleSimulateFire}
              title="Test simulation"
              style={{
                background: 'rgba(234, 88, 12, 0.22)',
                border: '1px solid rgba(234, 88, 12, 0.5)',
                color: '#FFB347', borderRadius: 8, padding: '2px 8px',
                fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4,
              }}
            >
              <Flame size={11} color="#FFB347" /> Simulate
            </button>
          </div>
        )}

        {/* STATE B: VERIFYING FIRE... */}
        {isVerifying && (
          <div style={{
            background: 'rgba(120, 85, 0, 0.90)', backdropFilter: 'blur(8px)',
            border: '1.5px solid #FCD34D',
            borderRadius: 14, padding: '8px 18px',
            color: 'white', fontSize: '0.84rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', background: '#FCD34D',
              boxShadow: '0 0 10px #FCD34D', flexShrink: 0,
              animation: 'pulse 0.8s ease-in-out infinite',
            }} />
            <span>🟡 VERIFYING FIRE... (Analyzing flame flicker & heat core)</span>
          </div>
        )}

        {/* STATE C: FIRE HAZARD DETECTED */}
        {isConfirmed && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.96), rgba(234, 88, 12, 0.96))',
            border: '1.5px solid #FCA5A5',
            borderRadius: 14, padding: '10px 20px',
            color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            boxShadow: '0 6px 24px rgba(220, 38, 38, 0.55)',
            animation: 'slideDownFade 0.25s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.96rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              <Flame size={18} color="#FEF08A" />
              🔥 FIRE HAZARD DETECTED
              <span style={{
                background: 'rgba(0,0,0,0.3)', padding: '2px 9px', borderRadius: 6,
                fontSize: '0.74rem', fontWeight: 700,
              }}>
                {Math.round(detection.confidence * 100)}% CONFIDENCE
              </span>
              <button
                onClick={handleReset}
                title="Reset detection"
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white', borderRadius: 6, padding: '2px 7px',
                  fontSize: '0.68rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FEF08A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={15} /> ⚠️ MAINTAIN SAFE DISTANCE
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* ── 3. STEP COMPLETION BADGE (WHEN CONFIRMED) ── */}
      {taskState === 'completed' && (
        <div style={{
          pointerEvents: 'all',
          margin: '0 auto 24px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: 'white', borderRadius: 14,
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10,
          fontWeight: 800, fontSize: '0.88rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <CheckCircle2 size={18} />
          <span>Fire Source Identified ✓ — Proceeding to Step 2</span>
        </div>
      )}
    </div>
  )
}
