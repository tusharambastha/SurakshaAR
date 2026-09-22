import { useState } from 'react'
import {
  Volume2, CheckCircle2, AlertTriangle, Flame, Wind, Zap, Shield, Target,
  ArrowRight, Monitor, X, WifiOff, Printer, Compass, ChevronLeft, ChevronRight,
  RotateCcw, MapPin, Bell, DoorOpen, Navigation, Cog, Lock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { speak } from '../../lib/voice'

// Visual icon lookup for spatial station steps
const STATION_ICONS = {
  0: Flame,       // Step 0: Hazard / Fire
  1: Bell,        // Step 1: Alarm Call Point
  2: Shield,      // Step 2: PPE Locker
  3: AlertTriangle,// Step 3: Extinguisher / Action
  4: DoorOpen,    // Step 4: Fire Exit
  5: MapPin,      // Step 5: Muster Point
}

const MACHINERY_STATION_ICONS = {
  0: Cog,           // Step 0: Nip-Point Hazard
  1: AlertTriangle, // Step 1: E-Stop Button
  2: Lock,          // Step 2: LOTO Padlock
  3: Zap,           // Step 3: Zero Energy Verification
  4: Shield,        // Step 4: Safety Guard
  5: MapPin,        // Step 5: Supervisor Sign-Off
}

export default function VirtualARHUD({
  scenario,
  currentStep,
  completedSteps,
  steps,
  lang,
  onStepClick,
  stepFeedback,
  allDone,
  saving,
  onToggleMode,
  onExit,
  isOnline,
  spatialDirectionCue,
  demoMode = true,
  onToggleDemoMode,
  timerSeconds,
  timerMaxSeconds,
  consequenceFailure,
  onRetryStep,
  positiveSuccess,
  onDecisionChoice,
}) {
  const [trackerExpanded, setTrackerExpanded] = useState(true)

  const activeStep = steps[currentStep]
  const isFire = scenario?.hazard_type === 'fire'
  const isGas = scenario?.hazard_type === 'gas_leak'
  const isMachinery = scenario?.hazard_type === 'machinery'
  const isPPE = scenario?.hazard_type === 'ppe'

  // Hazard details and interactive AR marker badge
  const hazardMarker = isFire
    ? {
        label: '⚠ CLASS C ELECTRICAL FIRE',
        subtext: 'Live 415V Control Cabinet · In Danger Zone',
        color: '#EF4444',
        icon: <Flame size={16} color="#EF4444" />,
      }
    : isGas
    ? {
        label: '⚠ TOXIC GAS LEAK DETECTED',
        subtext: 'High Pressure Pipe Rupture · Evacuation Area',
        color: '#84CC16',
        icon: <Wind size={16} color="#84CC16" />,
      }
    : isMachinery
    ? {
        label: '⚠ ROTATING MACHINERY NIP-POINT',
        subtext: 'Live High-Torque Rollers · LOTO Required',
        color: '#F59E0B',
        icon: <Cog size={16} color="#F59E0B" />,
      }
    : {
        label: '⚠ INDUSTRIAL PPE REQUIRED',
        subtext: 'High-Risk Machinery Area · Mandatory Compliance',
        color: '#F59E0B',
        icon: <Shield size={16} color="#F59E0B" />,
      }

  function getStepText(step, field) {
    if (!step) return ''
    if (lang === 'sat' && step[`${field}_sat`]) return step[`${field}_sat`]
    if (lang === 'hi' && step[`${field}_hi`]) return step[`${field}_hi`]
    return step[field] ?? ''
  }

  const stepLabel = getStepText(activeStep, 'label')
  const stepInstruction = getStepText(activeStep, 'instruction')

  const inView = spatialDirectionCue?.inView ?? true
  const turnDirection = spatialDirectionCue?.turnDirection ?? 'in-front'
  const angleDeg = spatialDirectionCue?.angleDeg ?? 0
  const distanceMeters = spatialDirectionCue?.distanceMeters ?? '2.0'

  return (
    <div
      aria-label="Virtual AR Heads-Up Display"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 10px) 12px env(safe-area-inset-bottom, 14px)',
        boxSizing: 'border-box',
      }}
    >
      {/* ── TOP SECTION: Header Controls + Mini-Map + Spatial Guidance ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'all' }}>
        {/* Top AR Status Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          {/* Scenario & Hazard Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(15, 18, 24, 0.90)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${hazardMarker.color}55`,
              borderRadius: '24px',
              padding: '6px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {hazardMarker.icon}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: hazardMarker.color, letterSpacing: '0.04em' }}>
                {hazardMarker.label}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>
                {hazardMarker.subtext}
              </span>
            </div>
          </div>

          {/* Top Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Printable Markers Setup Guide Link */}
            <a
              href="#/setup-guide"
              target="_blank"
              rel="noopener noreferrer"
              title="View & Print Room Station Markers"
              style={{
                background: 'rgba(28, 32, 40, 0.90)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#E05A00',
                borderRadius: '20px',
                padding: '5px 9px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Printer size={13} />
              <span>Markers</span>
            </a>

            {/* Live AR Feed Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(15, 18, 24, 0.90)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '5px 9px',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#F3F4F6' }}>
                SPATIAL AR
              </span>
            </div>

            {/* Demo Mode vs Realistic Training Mode Toggle */}
            {onToggleDemoMode && (
              <button
                type="button"
                onClick={onToggleDemoMode}
                title={demoMode ? 'Switch to Realistic Multi-Location Mode' : 'Switch to Fast Presentation Demo Mode'}
                style={{
                  background: demoMode ? 'rgba(224, 90, 0, 0.95)' : 'rgba(28, 32, 40, 0.90)',
                  border: `1.5px solid ${demoMode ? '#F97316' : 'rgba(255, 255, 255, 0.25)'}`,
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: demoMode ? '0 0 10px rgba(224, 90, 0, 0.5)' : 'none',
                }}
              >
                {demoMode ? <Zap size={12} color="#FFFFFF" fill="#FFFFFF" /> : <Compass size={12} />}
                <span>{demoMode ? '⚡ Demo Mode' : '🏢 Realistic'}</span>
              </button>
            )}

            {onToggleMode && (
              <button
                type="button"
                onClick={onToggleMode}
                title="Switch to 3D Simulation Mode"
                style={{
                  background: 'rgba(28, 32, 40, 0.90)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '5px 9px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Monitor size={13} />
                <span>3D</span>
              </button>
            )}

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                title="Exit training"
                style={{
                  background: 'rgba(220, 38, 38, 0.25)',
                  border: '1px solid #DC2626',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '5px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Step Urgency Countdown Timer */}
        {!allDone && timerSeconds !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(15, 18, 24, 0.94)',
                backdropFilter: 'blur(10px)',
                border: `1.5px solid ${timerSeconds > 7 ? '#10B981' : timerSeconds > 3 ? '#F59E0B' : '#EF4444'}`,
                borderRadius: '24px',
                padding: '4px 13px',
                boxShadow: `0 4px 16px ${timerSeconds > 7 ? 'rgba(16,185,129,0.3)' : timerSeconds > 3 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.7)'}`,
                animation: timerSeconds <= 3 ? 'sarUrgentPulse 0.6s ease-in-out infinite' : 'none',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>⏱</span>
              <span style={{
                color: timerSeconds > 7 ? '#10B981' : timerSeconds > 3 ? '#F59E0B' : '#EF4444',
                fontSize: '0.82rem',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                minWidth: 24,
                textAlign: 'center'
              }}>
                {timerSeconds}s
              </span>
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, (timerSeconds / (timerMaxSeconds || 20)) * 100))}%`,
                    height: '100%',
                    background: timerSeconds > 7 ? '#10B981' : timerSeconds > 3 ? '#F59E0B' : '#EF4444',
                    borderRadius: 2,
                    transition: 'width 0.9s linear, background-color 0.3s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.64rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {timerSeconds <= 3 ? 'CRITICAL' : timerSeconds <= 7 ? 'EXPEDITE' : 'WINDOW'}
              </span>
            </div>
          </div>
        )}

        {/* ── 2D Top Mini-Map / Spatial Step Tracker ── */}
        <div
          style={{
            background: 'rgba(15, 20, 30, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Tracker Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Navigation size={13} color="#E05A00" />
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#F3F4F6' }}>
                Step {currentStep + 1} of {steps.length}: <span style={{ color: '#E05A00' }}>{stepLabel}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTrackerExpanded(!trackerExpanded)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.65rem',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              {trackerExpanded ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {/* Station Stations Mini-Map Chips */}
          {trackerExpanded && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${steps.length || 6}, 1fr)`,
                gap: 4,
              }}
            >
              {steps.map((s, idx) => {
                const isCompleted = completedSteps.includes(idx)
                const isActive = idx === currentStep
                const Icon = isMachinery ? (MACHINERY_STATION_ICONS[idx] || Target) : (STATION_ICONS[idx] || Target)

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '4px 2px',
                      borderRadius: 8,
                      background: isActive
                        ? 'rgba(224, 90, 0, 0.25)'
                        : isCompleted
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isActive
                        ? '1.5px solid #E05A00'
                        : isCompleted
                        ? '1px solid #10B981'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isCompleted ? (
                        <CheckCircle2 size={12} color="#10B981" />
                      ) : (
                        <Icon size={12} color={isActive ? '#E05A00' : '#94A3B8'} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? '#FFFFFF' : isCompleted ? '#10B981' : '#94A3B8',
                        marginTop: 2,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {idx + 1}. {s.label.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Spatial Wayfinding Direction Banner ── */}
        {!allDone && (
          <div
            style={{
              background: demoMode
                ? 'rgba(16, 185, 129, 0.92)'
                : inView
                ? 'rgba(16, 185, 129, 0.90)'
                : 'rgba(224, 90, 0, 0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              padding: '6px 12px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: demoMode || inView
                ? '0 4px 16px rgba(16, 185, 129, 0.4)'
                : '0 4px 16px rgba(224, 90, 0, 0.4)',
              transition: 'background 0.2s ease',
            }}
          >
            {demoMode ? (
              <>
                <Target size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  🎯 DEMO MODE: Anchored In Front (1.9m) — Aim & Tap Action
                </span>
              </>
            ) : inView ? (
              <>
                <Target size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  🎯 TARGET IN SIGHT ({distanceMeters}m) — Aim Reticle & Perform Action
                </span>
              </>
            ) : turnDirection === 'right' ? (
              <>
                <Compass size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  Turn Right ➡ ({angleDeg}°) to locate {stepLabel}
                </span>
                <ChevronRight size={16} />
              </>
            ) : turnDirection === 'left' ? (
              <>
                <ChevronLeft size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  ⬅ Turn Left ({angleDeg}°) to locate {stepLabel}
                </span>
                <Compass size={16} />
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  🔄 Turn Around ({angleDeg}°) — Station is behind you!
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Off-Screen Perimeter Directional Indicators (Only in Realistic Mode) ── */}
      {!allDone && !demoMode && !inView && (
        <>
          {turnDirection === 'left' && (
            <div
              style={{
                position: 'absolute',
                left: 10,
                top: '46%',
                transform: 'translateY(-50%)',
                background: 'rgba(224, 90, 0, 0.92)',
                color: 'white',
                borderRadius: '24px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: '0.8rem',
                boxShadow: '0 0 20px rgba(224, 90, 0, 0.8)',
                animation: 'pulse 1s infinite alternate',
                pointerEvents: 'none',
              }}
            >
              <ChevronLeft size={20} />
              <span>{angleDeg}° LEFT</span>
            </div>
          )}

          {turnDirection === 'right' && (
            <div
              style={{
                position: 'absolute',
                right: 10,
                top: '46%',
                transform: 'translateY(-50%)',
                background: 'rgba(224, 90, 0, 0.92)',
                color: 'white',
                borderRadius: '24px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: '0.8rem',
                boxShadow: '0 0 20px rgba(224, 90, 0, 0.8)',
                animation: 'pulse 1s infinite alternate',
                pointerEvents: 'none',
              }}
            >
              <span>{angleDeg}° RIGHT</span>
              <ChevronRight size={20} />
            </div>
          )}
        </>
      )}

      {/* ── Center Reticle Target ── */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Floating Reticle Status Pill */}
        <div
          style={{
            marginBottom: 8,
            background: (demoMode || inView) ? 'rgba(16, 185, 129, 0.90)' : 'rgba(20, 24, 33, 0.85)',
            backdropFilter: 'blur(6px)',
            border: `1.5px solid ${(demoMode || inView) ? '#10B981' : hazardMarker.color}`,
            borderRadius: '16px',
            padding: '3px 10px',
            fontSize: '0.64rem',
            fontWeight: 800,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: `0 0 16px ${(demoMode || inView) ? '#10B98188' : hazardMarker.color + '44'}`,
            whiteSpace: 'nowrap',
          }}
        >
          <Target size={12} color={(demoMode || inView) ? '#FFFFFF' : hazardMarker.color} />
          <span>{demoMode ? '🎯 OBJECT ANCHORED IN FRONT' : inView ? '🎯 OBJECT ANCHORED IN VIEW' : 'SCAN ROOM FOR MARKER'}</span>
        </div>

        {/* Precision Industrial Reticle */}
        <div
          style={{
            width: 72,
            height: 72,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Corner Brackets */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: `2px solid ${inView ? '#10B981' : hazardMarker.color}`, borderLeft: `2px solid ${inView ? '#10B981' : hazardMarker.color}` }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderTop: `2px solid ${inView ? '#10B981' : hazardMarker.color}`, borderRight: `2px solid ${inView ? '#10B981' : hazardMarker.color}` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 14, height: 14, borderBottom: `2px solid ${inView ? '#10B981' : hazardMarker.color}`, borderLeft: `2px solid ${inView ? '#10B981' : hazardMarker.color}` }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottom: `2px solid ${inView ? '#10B981' : hazardMarker.color}`, borderRight: `2px solid ${inView ? '#10B981' : hazardMarker.color}` }} />

          {/* Center Crosshair Dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: inView ? '#10B981' : '#FFFFFF',
              boxShadow: inView ? '0 0 10px #10B981' : '0 0 8px rgba(255,255,255,0.9)',
            }}
          />
        </div>
      </div>

      {/* ── Bottom Guided Training HUD Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          margin: '0 auto',
          background: 'rgba(15, 18, 24, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '20px',
          padding: '14px 16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
          pointerEvents: 'all',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 6 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                background: completedSteps.includes(i)
                  ? '#10B981'
                  : i === currentStep
                  ? 'var(--color-brand)'
                  : 'rgba(255, 255, 255, 0.2)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {!allDone && activeStep && (
          <>
            {/* Step Header & Audio */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    background: 'var(--color-brand-50)',
                    color: 'var(--color-brand)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  STATION {currentStep + 1} OF {steps.length}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  Safety Protocol Sequence
                </span>
              </div>

              <button
                type="button"
                onClick={() => speak(stepInstruction, lang)}
                title="Listen to instruction"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  color: '#D1D5DB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                <Volume2 size={13} />
                <span>Listen</span>
              </button>
            </div>

            {/* Step Label & Instruction */}
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                {stepLabel}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#D1D5DB', lineHeight: 1.45 }}>
                {stepInstruction}
              </p>
            </div>

            {/* Primary Action / Decision Buttons */}
            {activeStep?.is_decision_step ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-brand)', textAlign: 'center', letterSpacing: '0.04em' }}>
                  SAFETY DECISION POINT · EVALUATE HAZARD SEVERITY
                </div>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => onDecisionChoice && onDecisionChoice('small_safe')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '11px 10px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <span>🔥 Small &amp; Safe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDecisionChoice && onDecisionChoice('not_safe')}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '11px 10px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <span>⚠️ Not Safe / Spreading</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onStepClick(currentStep)}
                style={{
                  background: 'var(--color-brand)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(224, 90, 0, 0.45)',
                  transition: 'transform 0.1s ease, filter 0.15s ease',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <CheckCircle2 size={18} />
                <span>Perform Action: {stepLabel}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </>
        )}

        {allDone && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}
            >
              <CheckCircle2 size={26} />
            </div>
            <h3 style={{ color: '#10B981', fontSize: '1rem', fontWeight: 800, margin: '0 0 4px' }}>
              Spatial AR Training Completed!
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.78rem', margin: 0 }}>
              {saving ? 'Evaluating response times and saving score...' : 'Preparing safety readiness certificate...'}
            </p>
          </div>
        )}
      </div>

      {/* ── Real-Time Correct / Incorrect Feedback Toast ── */}
      {stepFeedback && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 40,
            background: stepFeedback.correct ? 'rgba(16, 185, 129, 0.96)' : 'rgba(239, 68, 68, 0.96)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px 24px',
            textAlign: 'center',
            color: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            animation: 'scaleIn 0.2s ease-out',
          }}
        >
          {stepFeedback.correct ? (
            <CheckCircle2 size={32} style={{ margin: '0 auto 6px' }} />
          ) : (
            <AlertTriangle size={32} style={{ margin: '0 auto 6px' }} />
          )}
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>
            {stepFeedback.label}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.95 }}>
            {stepFeedback.correct ? 'Correct Safety Station Reached! ✓' : 'Action Out of Sequence — Follow Protocol Order'}
          </div>
        </div>
      )}

      {/* Positive Action Confirmation Badge Pulse */}
      {positiveSuccess && (
        <div
          style={{
            position: 'fixed',
            top: '24%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9998,
            background: 'rgba(16, 185, 129, 0.96)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20,
            padding: '12px 22px',
            color: '#FFFFFF',
            boxShadow: '0 12px 32px rgba(16, 185, 129, 0.55)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'sarScaleUp 0.25s ease-out',
            pointerEvents: 'none',
          }}
        >
          <CheckCircle2 size={24} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Correct Protocol Action! ✓</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Executed within safety response window</div>
          </div>
        </div>
      )}

      {/* Consequence Overlay Modal on Failure or Timeout */}
      {consequenceFailure && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 18, 24, 0.90)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            pointerEvents: 'all',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#181D26',
              border: '2px solid #EF4444',
              borderRadius: 22,
              padding: '26px 22px',
              boxShadow: '0 20px 50px rgba(239, 68, 68, 0.45), 0 8px 24px rgba(0,0,0,0.8)',
              textAlign: 'center',
              color: '#FFFFFF',
              animation: 'sarScaleUp 0.25s ease-out',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#EF4444'
            }}>
              <AlertTriangle size={32} />
            </div>

            <div style={{
              fontSize: '0.72rem', fontWeight: 800, color: '#EF4444',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6
            }}>
              Critical Safety Consequence
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
              {consequenceFailure.title}
            </h2>

            <div style={{
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 14, padding: '12px 14px', marginBottom: 20, textAlign: 'left'
            }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#FCA5A5', lineHeight: 1.55 }}>
                {consequenceFailure.explanation}
              </p>
            </div>

            <button
              type="button"
              onClick={onRetryStep}
              style={{
                background: '#E05A00',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px 20px',
                fontSize: '0.94rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 18px rgba(224, 90, 0, 0.45)',
              }}
            >
              <RotateCcw size={18} />
              <span>Retry This Step</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Injected Keyframes */}
      <style>{`
        @keyframes sarUrgentPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); box-shadow: 0 0 20px rgba(239, 68, 68, 0.85); }
          100% { transform: scale(1); }
        }
        @keyframes sarScaleUp {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
