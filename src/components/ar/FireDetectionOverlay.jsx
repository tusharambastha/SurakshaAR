/**
 * SurakshaAR — Fire Detection AR Overlay & Interactive Safety Training
 *
 * Provides real-time camera-based flame tracking HUD and interactive safety evaluation:
 * - Real-time flame bounding box & reticle positioned at detected flame coordinates
 * - Warning banners: 🔥 FIRE HAZARD DETECTED | ⚠️ MAINTAIN SAFE DISTANCE
 * - Safety protocols: 🧯 Identify Correct Extinguisher | 🚪 Locate Emergency Exit
 * - Phase 4 & 5: Interactive electrical fire extinguisher assessment question
 * - Database & session tracking for reaction time, answer accuracy, and score
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { Flame, ShieldAlert, CheckCircle2, XCircle, RotateCcw, Volume2 } from 'lucide-react'
import { FireDetector } from '../../lib/fireDetection'
import { speak, isTTSSupported } from '../../lib/voice'

const FIRE_QUESTION = {
  id: 'q-ar-fire-01',
  question_en: 'Which extinguisher should be used for an electrical fire?',
  question_hi: 'बिजली की आग के लिए कौन सा अग्निशामक उपयोग करना चाहिए?',
  options_en: [
    { label: 'A', text: 'Water', correct: false },
    { label: 'B', text: 'CO₂', correct: true },
    { label: 'C', text: 'Petrol', correct: false },
    { label: 'D', text: 'None', correct: false },
  ],
  options_hi: [
    { label: 'A', text: 'पानी (Water)', correct: false },
    { label: 'B', text: 'CO₂ (Carbon Dioxide)', correct: true },
    { label: 'C', text: 'पेट्रोल (Petrol)', correct: false },
    { label: 'D', text: 'कोई नहीं (None)', correct: false },
  ],
  correctLabel: 'B',
  correctText: 'CO₂',
  explanation_en: 'CO₂ extinguishers are electrically non-conductive and leave no harmful residue, making them safe for live electrical fires. Water conducts electricity and can cause fatal shock.',
  explanation_hi: 'CO₂ अग्निशामक बिजली का संचालन नहीं करते हैं और कोई अवशेष नहीं छोड़ते, इसलिए बिजली की आग के लिए सुरक्षित हैं। पानी बिजली का संचालन करता है जिससे करंट लग सकता है।',
}

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
  const [taskState, setTaskState] = useState('detecting') // detecting | question | feedback_correct | feedback_wrong | completed
  const [selectedOption, setSelectedOption] = useState(null)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [responseTimeMs, setResponseTimeMs] = useState(null)
  const [attempts, setAttempts] = useState(0)

  const detectorRef = useRef(null)
  const animRef = useRef(null)
  const fireSoundPlayedRef = useRef(false)

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new FireDetector({
      sampleWidth: 160,
      sampleHeight: 120,
      minPixels: 10,
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

        if (result.isFire && !fireConfirmed) {
          setFireConfirmed(true)
          if (!fireSoundPlayedRef.current) {
            fireSoundPlayedRef.current = true
            speak(lang === 'hi' ? 'आग का खतरा पाया गया! सुरक्षित दूरी बनाए रखें।' : 'Fire hazard detected! Maintain safe distance.', lang)
          }
          if (onFireDetected) onFireDetected(result)

          // Launch interactive task after 1.2s of detection confirmation
          setTimeout(() => {
            setTaskState(prev => prev === 'detecting' ? 'question' : prev)
            setQuestionStartTime(Date.now())
          }, 1200)
        }
      }
      animRef.current = requestAnimationFrame(scanFrame)
    }

    animRef.current = requestAnimationFrame(scanFrame)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isActive, videoRef, fireConfirmed, lang, onFireDetected])

  // Current question data based on language
  const qData = useMemo(() => {
    const isHi = lang === 'hi'
    return {
      question: isHi ? FIRE_QUESTION.question_hi : FIRE_QUESTION.question_en,
      options: isHi ? FIRE_QUESTION.options_hi : FIRE_QUESTION.options_en,
      explanation: isHi ? FIRE_QUESTION.explanation_hi : FIRE_QUESTION.explanation_en,
    }
  }, [lang])

  function handleOptionSelect(opt) {
    if (taskState !== 'question') return
    const reactionTime = Date.now() - (questionStartTime || Date.now())
    setResponseTimeMs(reactionTime)
    setSelectedOption(opt.label)
    setAttempts(a => a + 1)

    if (opt.correct) {
      setTaskState('feedback_correct')
      speak(lang === 'hi' ? 'आपका उत्तर सही है! CO2 अग्निशामक।' : 'You are correct! CO2 extinguisher.', lang)
    } else {
      setTaskState('feedback_wrong')
      speak(lang === 'hi' ? 'गलत उत्तर। सही उत्तर: CO2 अग्निशामक।' : 'Incorrect answer. Correct answer: CO2 extinguisher.', lang)
    }
  }

  function handleRetryQuestion() {
    setSelectedOption(null)
    setTaskState('question')
    setQuestionStartTime(Date.now())
  }

  function handleProceed() {
    setTaskState('completed')
    if (onTaskCompleted) {
      onTaskCompleted({
        questionId: FIRE_QUESTION.id,
        selectedAnswer: selectedOption,
        wasCorrect: selectedOption === FIRE_QUESTION.correctLabel,
        responseTimeMs,
        attempts,
        score: selectedOption === FIRE_QUESTION.correctLabel ? 100 : 70,
      })
    }
  }

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
            <span>AI Camera Active · Scanning live frames for flame hazards…</span>
            <span style={{ color: '#94A3B8', fontSize: '0.74rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 8 }}>
              Show candle/match flame to camera
            </span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.96rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              <Flame size={18} color="#FEF08A" />
              🔥 FIRE HAZARD DETECTED
              <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                {Math.round(detection.confidence * 100)}% CONFIDENCE
              </span>
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

      {/* ── 3. INTERACTIVE SAFETY TRAINING CARD (PHASE 4 & 5) ── */}
      {(taskState === 'question' || taskState === 'feedback_correct' || taskState === 'feedback_wrong') && (
        <div style={{
          pointerEvents: 'all',
          margin: '0 auto 20px',
          width: 'min(580px, calc(100vw - 32px))',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px)',
          border: taskState === 'feedback_correct' ? '2px solid #10B981'
            : taskState === 'feedback_wrong' ? '2px solid #EF4444'
            : '1.5px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 20,
          padding: '22px 24px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
          animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'rgba(234, 88, 12, 0.2)',
                border: '1px solid rgba(234, 88, 12, 0.5)',
                color: 'var(--color-brand)',
                borderRadius: 8, padding: '4px 10px',
                fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Safety Protocol Assessment
              </span>
              {responseTimeMs && (
                <span style={{ color: '#94A3B8', fontSize: '0.74rem' }}>
                  Response: {(responseTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            {isTTSSupported(lang) && (
              <button
                onClick={() => speak(qData.question, lang)}
                style={{
                  background: 'transparent', border: 'none', color: '#CBD5E1',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem',
                }}
              >
                <Volume2 size={14} /> Listen
              </button>
            )}
          </div>

          {/* Question text */}
          <h3 style={{
            color: 'white',
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            fontWeight: 800,
            lineHeight: 1.35,
            marginBottom: 16,
          }}>
            {qData.question}
          </h3>

          {/* 4 Answer Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {qData.options.map((opt) => {
              const isSelected = selectedOption === opt.label
              const isCorrectOpt = opt.correct
              let btnBg = 'rgba(255, 255, 255, 0.07)'
              let border = '1px solid rgba(255, 255, 255, 0.15)'
              let textColor = 'white'

              if (taskState === 'feedback_correct' || taskState === 'feedback_wrong') {
                if (isCorrectOpt) {
                  btnBg = 'rgba(16, 185, 129, 0.25)'
                  border = '1.5px solid #10B981'
                  textColor = '#A7F3D0'
                } else if (isSelected && !isCorrectOpt) {
                  btnBg = 'rgba(239, 68, 68, 0.25)'
                  border = '1.5px solid #EF4444'
                  textColor = '#FECACA'
                }
              }

              return (
                <button
                  key={opt.label}
                  onClick={() => handleOptionSelect(opt)}
                  disabled={taskState !== 'question'}
                  style={{
                    background: btnBg,
                    border,
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: textColor,
                    cursor: taskState === 'question' ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: isSelected ? 'var(--color-brand)' : 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ flex: 1 }}>{opt.text}</span>
                </button>
              )
            })}
          </div>

          {/* Feedback Section (Phase 5) */}
          {taskState === 'feedback_correct' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34D399', fontWeight: 800, fontSize: '0.94rem', marginBottom: 4 }}>
                <CheckCircle2 size={20} />
                ✓ YOU ARE CORRECT!
              </div>
              <p style={{ color: '#E2E8F0', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                {qData.explanation}
              </p>
            </div>
          )}

          {taskState === 'feedback_wrong' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F87171', fontWeight: 800, fontSize: '0.94rem', marginBottom: 4 }}>
                <XCircle size={20} />
                ✕ INCORRECT ANSWER
              </div>
              <p style={{ color: '#FEF08A', fontWeight: 700, fontSize: '0.84rem', margin: '0 0 4px 0' }}>
                Correct answer: CO₂ extinguisher.
              </p>
              <p style={{ color: '#E2E8F0', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                {qData.explanation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {taskState === 'feedback_wrong' && (
              <button
                onClick={handleRetryQuestion}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: 'white', borderRadius: 10,
                  padding: '10px 16px', fontSize: '0.84rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RotateCcw size={15} /> Try Again
              </button>
            )}

            {(taskState === 'feedback_correct' || taskState === 'feedback_wrong') && (
              <button
                onClick={handleProceed}
                style={{
                  background: 'var(--color-brand)',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '10px 20px', fontSize: '0.86rem', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(224,90,0,0.4)',
                }}
              >
                Continue Training →
              </button>
            )}
          </div>
        </div>
      )}

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
        }}>
          <CheckCircle2 size={18} />
          <span>Fire Safety Protocol Verified! Step 1 Complete ✓</span>
        </div>
      )}
    </div>
  )
}
