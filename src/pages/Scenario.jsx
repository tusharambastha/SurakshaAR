/**
 * SurakshaAR — AR & 3D Industrial Safety Simulator
 *
 * Designed for workers in Jharkhand's mining, steel, and manufacturing sectors.
 *
 * Features:
 *   1. 🖥️ 3D Simulation Mode:
 *      - Full 360° OrbitControls (drag to rotate, pinch/wheel to zoom)
 *      - On-screen touch D-pad & zoom buttons for mobile accessibility
 *      - "🎯 Focus Target" camera auto-aim button
 *      - Bright industrial lighting with safety-striped warehouse floor
 *      - Realistic industrial props (Control panel fire, PPE station, Alarm, Extinguisher, Exit, Muster point)
 *      - High-visibility vertical beacon light beams + floating step badges
 *   2. 📷 Camera AR Mode:
 *      - Live camera feed (environment facing) with transparent 3D overlay
 *      - Device orientation tracking (gyro/compass) with off-screen target pointer
 *   3. Dual Interaction:
 *      - Tap directly on 3D object in scene
 *      - OR tap the large on-screen action button in HUD
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  X, Camera, Monitor, CheckCircle, WifiOff,
  Compass, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Target, Volume2, RotateCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useOffline } from '../contexts/OfflineContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { mockGetScenario, mockCreateSession, mockUpdateSession, mockInsertFeedbackLog } from '../lib/mockDb'
import { calculateScore } from '../lib/scoring'
import { queueOfflineAction } from '../lib/indexeddb'
import { speak } from '../lib/voice'
import FireDetectionOverlay from '../components/ar/FireDetectionOverlay'

// ─── Floating Canvas Text Sprite Helper ────────────────────────────────────────
function createStepBadgeSprite(stepNumber, label, color = '#E05A00') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  // Background pill
  ctx.fillStyle = 'rgba(20, 20, 24, 0.90)'
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  const r = 60, x = 6, y = 6, w = 500, h = 116
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Circular step number badge
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(64, 64, 42, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(stepNumber), 64, 66)

  // Title text
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  // Truncate if long
  let displayText = label
  if (displayText.length > 24) displayText = displayText.substring(0, 22) + '…'
  ctx.fillText(displayText, 126, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(3.6, 0.9, 1)
  return sprite
}

// ─── Camera AR Live Video Background ──────────────────────────────────────────
function CameraBackground({ streamRef, videoRef }) {
  useEffect(() => {
    if (videoRef?.current && streamRef?.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [streamRef, videoRef])

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      autoPlay
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', zIndex: 0,
      }}
    />
  )
}

// ─── Main Scenario Page Component ─────────────────────────────────────────────
export default function Scenario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { T, lang } = useLang()
  const { isOnline } = useOffline()

  const [arMode, setArMode]               = useState(false)
  const [cameraAvail, setCameraAvail]     = useState(false)
  const [cameraChecked, setCameraChecked] = useState(false)
  const [currentStep, setCurrentStep]     = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [stepLogs, setStepLogs]           = useState([])
  const [sessionId, setSessionId]         = useState(null)
  const [saving, setSaving]               = useState(false)
  const [stepStartTime, setStepStartTime] = useState(Date.now())
  const [stepFeedback, setStepFeedback]   = useState(null)
  const [showControlsHelp, setShowControlsHelp] = useState(true)

  const canvasRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const cameraVideoRef = useRef(null)

  // Three.js persistent references
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animId: null,
    stepNodes: [], // { group, orbMesh, ringMesh, beamMesh, badgeSprite, stepIndex, pos }
    hazardGroup: null,
    clock: new THREE.Clock(),
    deviceRot: { alpha: 0, beta: 90, gamma: 0 },
  })

  // Fetch scenario details
  const { data: scenario, isLoading } = useQuery({
    queryKey: ['scenario', id],
    queryFn: async () => {
      if (!isSupabaseConfigured) return mockGetScenario(id).data
      const { data, error } = await supabase.from('scenarios').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
  })

  const isFireScenario = scenario?.hazard_type === 'fire'

  // Helper to open real camera stream across mobile & desktop webcams
  const requestCameraStream = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return null
    try {
      // Prioritize environment rear camera on phones/tablets
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
    } catch {
      try {
        // Fallback to standard webcam/front camera
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      } catch (err) {
        console.warn('[Camera] getUserMedia failed:', err)
        return null
      }
    }
  }, [])

  // Auto-dismiss help hint after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowControlsHelp(false), 6000)
    return () => clearTimeout(t)
  }, [])

  // Check camera availability & auto-start AR mode
  useEffect(() => {
    async function checkCamera() {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await requestCameraStream()
        if (stream) {
          cameraStreamRef.current = stream
          setCameraAvail(true)
          setArMode(true) // Auto-start in Camera AR mode for real-time fire detection
        }
      }
      setCameraChecked(true)
    }
    checkCamera()
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [requestCameraStream])

  // Create training session record
  useEffect(() => {
    if (!user || !id) return
    async function createSession() {
      const sId = crypto.randomUUID()
      const sessionData = {
        id: sId,
        user_id: user.id,
        scenario_id: id,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        score: 0,
        steps_completed: [],
      }
      if (!isSupabaseConfigured) {
        const res = await mockCreateSession({ id: sId, userId: user.id, scenarioId: id })
        if (res?.data?.id) setSessionId(res.data.id)
        else setSessionId(sId)
      } else if (isOnline) {
        await supabase.from('training_sessions').insert(sessionData)
        setSessionId(sId)
      } else {
        await queueOfflineAction('complete_session', sessionData)
        setSessionId(sId)
      }
      setStepStartTime(Date.now())
    }
    createSession()
  }, [user, id, isOnline])

  // Complete a step handler
  const handleStepClick = useCallback(async (stepIndex) => {
    if (stepIndex !== currentStep) return
    const timeTaken = Date.now() - stepStartTime
    const step = scenario?.steps?.[stepIndex]
    const log = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      step_index: stepIndex,
      was_correct: true,
      time_taken_ms: timeTaken,
      is_ppe_step: step?.is_ppe_step ?? false,
    }

    setStepFeedback({ correct: true, label: step?.label ?? `Step ${stepIndex + 1}` })
    speak(step?.instruction ?? 'Correct! Proceed to the next step.', lang)
    setTimeout(() => setStepFeedback(null), 2200)

    const newLogs = [...stepLogs, log]
    setStepLogs(newLogs)
    setCompletedSteps(prev => [...prev, stepIndex])

    if (!isSupabaseConfigured) {
      await mockInsertFeedbackLog({ sessionId, userId: user?.id, stepIndex, feedbackType: 'correct', message: step?.label ?? '' })
    } else if (isOnline) {
      await supabase.from('feedback_logs').insert(log)
    }

    const steps = scenario?.steps ?? []
    if (stepIndex === steps.length - 1) {
      await finishSession(newLogs)
    } else {
      setCurrentStep(stepIndex + 1)
      setStepStartTime(Date.now())

      // Auto-aim camera toward the next step
      const nextStep = steps[stepIndex + 1]
      if (nextStep && threeRef.current.controls) {
        const [tx, ty, tz] = nextStep.position || [0, 1, 0]
        smoothLookAt(tx, ty, tz)
      }
    }
  }, [currentStep, stepStartTime, scenario, stepLogs, sessionId, user, isOnline, lang])

  // Smoothly tween OrbitControls target to look at position
  function smoothLookAt(targetX, targetY, targetZ) {
    const controls = threeRef.current.controls
    if (!controls) return
    const startX = controls.target.x
    const startY = controls.target.y
    const startZ = controls.target.z
    const startTime = performance.now()
    const duration = 600

    function stepTween(now) {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = p * (2 - p)
      controls.target.x = startX + (targetX - startX) * ease
      controls.target.y = startY + (targetY - startY) * ease
      controls.target.z = startZ + (targetZ - startZ) * ease
      controls.update()
      if (p < 1) requestAnimationFrame(stepTween)
    }
    requestAnimationFrame(stepTween)
  }

  // Focus current step button action
  function handleFocusTarget() {
    const step = scenario?.steps?.[currentStep]
    if (step && threeRef.current.controls && threeRef.current.camera) {
      const [tx, ty, tz] = step.position || [0, 1, 0]
      const camera = threeRef.current.camera
      // Place camera in front of target
      camera.position.set(tx, ty + 2.5, tz + 5.5)
      smoothLookAt(tx, ty, tz)
    }
  }

  const [autoRotate, setAutoRotate]       = useState(false)
  const autoRotateRef = useRef(false)

  // Toggle continuous 360-degree auto-rotation
  function toggleAutoRotate() {
    setAutoRotate(prev => {
      const next = !prev
      autoRotateRef.current = next
      if (threeRef.current.controls) {
        threeRef.current.controls.autoRotate = next
        threeRef.current.controls.autoRotateSpeed = 2.5
      }
      return next
    })
  }

  // Smooth animated 360-degree rotation step
  function animateOrbitRotate(angleX, angleY) {
    const controls = threeRef.current.controls
    if (!controls) return
    const startTime = performance.now()
    const duration = 380
    let lastP = 0
    function stepAnim(now) {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = p * (2 - p)
      const delta = ease - lastP
      lastP = ease
      if (angleX !== 0) controls.rotateLeft(angleX * delta)
      if (angleY !== 0) controls.rotateUp(angleY * delta)
      controls.update()
      if (p < 1) requestAnimationFrame(stepAnim)
    }
    requestAnimationFrame(stepAnim)
  }

  // Smooth animated zoom
  function animateZoom(factor) {
    const camera = threeRef.current.camera
    const controls = threeRef.current.controls
    if (!camera || !controls) return
    const startTime = performance.now()
    const duration = 280
    let lastP = 0
    function stepZoom(now) {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = p * (2 - p)
      const delta = ease - lastP
      lastP = ease
      if (factor > 1) controls.dollyIn(1 + 0.25 * delta)
      else controls.dollyOut(1 + 0.25 * delta)
      controls.update()
      if (p < 1) requestAnimationFrame(stepZoom)
    }
    requestAnimationFrame(stepZoom)
  }

  // Camera directional manual pan/rotate controls
  function handleManualRotate(dx, dy) {
    animateOrbitRotate(dx, dy)
  }

  function handleManualZoom(factor) {
    animateZoom(factor)
  }

  async function finishSession(logs) {
    setSaving(true)
    const { score, breakdown } = calculateScore(
      logs.map(l => ({ was_correct: l.was_correct, time_taken_ms: l.time_taken_ms, is_ppe_step: l.is_ppe_step })),
      scenario?.benchmark_time_ms ?? 90000
    )
    const totalTime = logs.reduce((s, l) => s + l.time_taken_ms, 0)
    const completedAt = new Date().toISOString()

    const updateData = {
      id: sessionId,
      user_id: user?.id,
      scenario_id: id,
      completed_at: completedAt,
      score,
      reaction_time_ms: totalTime,
      status: 'completed',
      steps_completed: logs.map(l => ({ step_index: l.step_index, was_correct: l.was_correct })),
    }

    if (!isSupabaseConfigured) {
      await mockUpdateSession(sessionId, updateData)
    } else if (isOnline) {
      await supabase.from('training_sessions').upsert(updateData)
    } else {
      await queueOfflineAction('complete_session', updateData)
    }

    setSaving(false)
    navigate(`/results/${sessionId}`, {
      state: { score, breakdown, scenario, allLogs: logs, totalTime },
    })
  }

  async function toggleARMode() {
    if (!arMode && cameraAvail && cameraStreamRef.current) {
      setArMode(true)
    } else if (arMode) {
      setArMode(false)
    } else {
      const stream = await requestCameraStream()
      if (stream) {
        cameraStreamRef.current = stream
        setCameraAvail(true)
        setArMode(true)
      } else {
        alert('Camera permission required for Camera AR Fire Detection. Using 3D Simulation Mode.')
      }
    }
  }

  // Real-time camera flame detection listener
  const handleFireDetected = useCallback((result) => {
    console.log('[FireDetection] Real-time flame detected with confidence:', result.confidence)
  }, [])

  // Interactive fire safety training response handler (Phase 4 & 5)
  const handleFireTaskCompleted = useCallback(async ({ wasCorrect, responseTimeMs, selectedAnswer }) => {
    // Record feedback log in mockDb / Supabase
    if (!isSupabaseConfigured) {
      await mockInsertFeedbackLog({
        sessionId,
        userId: user?.id,
        stepIndex: 0,
        feedbackType: wasCorrect ? 'correct' : 'incorrect',
        message: `AR Fire Extinguisher Protocol: Selected Option ${selectedAnswer} (${wasCorrect ? 'Correct' : 'Incorrect'}) in ${(responseTimeMs / 1000).toFixed(1)}s`,
      })
    }

    // If currently on Step 0 (Identify Fire Source), automatically complete it
    if (currentStep === 0) {
      const step = scenario?.steps?.[0]
      const log = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        step_index: 0,
        was_correct: wasCorrect,
        time_taken_ms: responseTimeMs,
        is_ppe_step: step?.is_ppe_step ?? false,
      }
      setStepLogs(prev => [...prev, log])
      setCompletedSteps(prev => (prev.includes(0) ? prev : [...prev, 0]))
      setCurrentStep(1)
      setStepStartTime(Date.now())
      setStepFeedback({ correct: wasCorrect, label: 'Fire Hazard Identified & Extinguisher Protocol Verified! ✓' })
      setTimeout(() => setStepFeedback(null), 2500)
    }
  }, [sessionId, user, currentStep, scenario])

  // ─── Three.js Scene Mounting (ONE TIME ONLY) ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !scenario) return

    const t = threeRef.current
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    t.renderer = renderer

    // 2. Scene
    const scene = new THREE.Scene()
    t.scene = scene

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200)
    camera.position.set(0, 3.5, 9.5)
    t.camera = camera

    // 4. OrbitControls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.8
    controls.zoomSpeed = 1.0
    controls.panSpeed = 0.8
    controls.minDistance = 2.0
    controls.maxDistance = 25.0
    controls.maxPolarAngle = Math.PI / 2 - 0.05 // Don't flip under floor
    controls.target.set(0, 1.2, 0)
    controls.update()
    t.controls = controls

    // 5. Lighting — Bright, high-contrast, industrial visibility
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 1.4)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xfff3e0, 1.5)
    dirLight.position.set(12, 20, 10)
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xcceeff, 0.8)
    fillLight.position.set(-12, 10, -10)
    scene.add(fillLight)

    // 6. Environment Props
    const isGasLeak = scenario.hazard_type === 'gas_leak'

    // Floor with Industrial Safety Grid & Warning Borders
    const floorSize = 36
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize)
    const floorCanvas = document.createElement('canvas')
    floorCanvas.width = 1024
    floorCanvas.height = 1024
    const fctx = floorCanvas.getContext('2d')

    // Factory floor concrete base
    fctx.fillStyle = isGasLeak ? '#383028' : '#2A2E33'
    fctx.fillRect(0, 0, 1024, 1024)

    // Safety grid tiles
    fctx.strokeStyle = isGasLeak ? '#4A4035' : '#3A4048'
    fctx.lineWidth = 4
    for (let i = 0; i <= 1024; i += 64) {
      fctx.beginPath()
      fctx.moveTo(i, 0); fctx.lineTo(i, 1024); fctx.stroke()
      fctx.beginPath()
      fctx.moveTo(0, i); fctx.lineTo(1024, i); fctx.stroke()
    }

    // Yellow/Black diagonal safety hazard perimeter
    fctx.strokeStyle = '#F1C40F'
    fctx.lineWidth = 24
    fctx.strokeRect(12, 12, 1000, 1000)

    const floorTex = new THREE.CanvasTexture(floorCanvas)
    floorTex.wrapS = THREE.RepeatWrapping
    floorTex.wrapT = THREE.RepeatWrapping
    floorTex.repeat.set(1, 1)

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.8,
      metalness: 0.1,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    scene.add(floor)

    // Machinery Units
    const machineMat = new THREE.MeshStandardMaterial({ color: '#4B5563', metalness: 0.7, roughness: 0.3 })
    const yellowStripeMat = new THREE.MeshStandardMaterial({ color: '#EAB308', metalness: 0.2, roughness: 0.5 })

    // Generator 1
    const gen1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 1.6), machineMat)
    gen1.position.set(-5, 1.0, -1)
    scene.add(gen1)
    const genStripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.2, 1.62), yellowStripeMat)
    genStripe.position.set(-5, 1.8, -1)
    scene.add(genStripe)

    // Electrical Control Panel (Hazard 0 location: [3, 1.2, 3])
    const panelCabinet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.8), machineMat)
    panelCabinet.position.set(3, 1.2, 3)
    scene.add(panelCabinet)
    // Panel face door
    const panelFace = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 0.05), new THREE.MeshStandardMaterial({ color: '#DC2626' }))
    panelFace.position.set(3, 1.2, 2.6)
    scene.add(panelFace)

    // Hazard visual effect (Fire or Gas Plume)
    const hazardGroup = new THREE.Group()
    if (isGasLeak) {
      hazardGroup.position.set(-2.5, 1.2, 2)
      // Toxic cloud spheres
      for (let i = 0; i < 4; i++) {
        const gas = new THREE.Mesh(
          new THREE.SphereGeometry(0.5 + i * 0.1, 12, 12),
          new THREE.MeshStandardMaterial({
            color: '#84CC16',
            emissive: '#65A30D',
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.65 - i * 0.1,
          })
        )
        gas.position.set((Math.random() - 0.5) * 0.4, i * 0.3, (Math.random() - 0.5) * 0.4)
        hazardGroup.add(gas)
      }
      const gLight = new THREE.PointLight('#84CC16', 3.0, 8)
      hazardGroup.add(gLight)
    } else {
      hazardGroup.position.set(3, 1.4, 2.3)
      // Flame cones and core
      const flameCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 1.2, 12),
        new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#DC2626', emissiveIntensity: 2.5 })
      )
      flameCore.position.y = 0.5
      hazardGroup.add(flameCore)

      const flameInner = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.9, 10),
        new THREE.MeshStandardMaterial({ color: '#F59E0B', emissive: '#D97706', emissiveIntensity: 3.0 })
      )
      flameInner.position.y = 0.45
      hazardGroup.add(flameInner)

      const fLight = new THREE.PointLight('#F97316', 4.0, 9)
      hazardGroup.add(fLight)
    }
    scene.add(hazardGroup)
    t.hazardGroup = hazardGroup

    // Fire Alarm Station prop ([2.5, 2.0, -2])
    const alarmPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2), machineMat)
    alarmPole.position.set(2.5, 1.1, -2)
    scene.add(alarmPole)
    const alarmBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#B91C1C', emissiveIntensity: 0.4 }))
    alarmBox.position.set(2.5, 1.9, -2)
    scene.add(alarmBox)

    // PPE Station Locker prop ([-4, 0.9, 1])
    const ppeLocker = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.7), new THREE.MeshStandardMaterial({ color: '#0284C7', metalness: 0.5 }))
    ppeLocker.position.set(-4, 1.0, 1)
    scene.add(ppeLocker)

    // Fire Extinguisher prop ([1.5, 0.8, 2])
    const extBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16), new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.3 }))
    extBody.position.set(1.5, 0.45, 2)
    scene.add(extBody)

    // Emergency Exit door frame ([-6, 1.5, -5])
    const exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.1), new THREE.MeshStandardMaterial({ color: '#16A34A', emissive: '#15803D', emissiveIntensity: 0.6 }))
    exitDoor.position.set(-6, 1.5, -5)
    scene.add(exitDoor)

    // Muster Assembly Point post ([0, 1.0, 10])
    const musterPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5), machineMat)
    musterPost.position.set(0, 1.25, 10)
    scene.add(musterPost)
    const musterSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), new THREE.MeshStandardMaterial({ color: '#16A34A', emissive: '#15803D', emissiveIntensity: 0.7 }))
    musterSign.position.set(0, 2.4, 10)
    scene.add(musterSign)

    // 7. Hotspot Beacons & Floating Badges
    const stepNodes = []
    const steps = scenario.steps || []
    steps.forEach((step, idx) => {
      const pos = step.position || [0, 1, 0]
      const group = new THREE.Group()
      group.position.set(pos[0], pos[1], pos[2])

      // Main Interactive Orb
      const orbGeo = new THREE.SphereGeometry(0.42, 24, 24)
      const orbMat = new THREE.MeshStandardMaterial({
        color: step.color || '#E05A00',
        emissive: step.color || '#E05A00',
        emissiveIntensity: 0.8,
        metalness: 0.2,
        roughness: 0.2,
      })
      const orbMesh = new THREE.Mesh(orbGeo, orbMat)
      orbMesh.userData = { stepIndex: idx }
      group.add(orbMesh)

      // Pulsing floor target ring
      const ringGeo = new THREE.RingGeometry(0.6, 0.9, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: step.color || '#E05A00',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.position.y = -pos[1] + 0.02 // Anchor to floor
      group.add(ringMesh)

      // Vertical beacon light beam
      const beamGeo = new THREE.CylinderGeometry(0.08, 0.35, 4.0, 16)
      const beamMat = new THREE.MeshBasicMaterial({
        color: step.color || '#E05A00',
        transparent: true,
        opacity: 0.3,
      })
      const beamMesh = new THREE.Mesh(beamGeo, beamMat)
      beamMesh.position.y = 2.0
      group.add(beamMesh)

      // Floating billboard sprite label
      const badgeSprite = createStepBadgeSprite(idx + 1, step.label, step.color || '#E05A00')
      badgeSprite.position.set(0, 1.1, 0)
      group.add(badgeSprite)

      scene.add(group)
      stepNodes.push({
        group,
        orbMesh,
        ringMesh,
        beamMesh,
        badgeSprite,
        stepIndex: idx,
        initialY: pos[1],
        pos,
      })
    })
    t.stepNodes = stepNodes

    // 8. Raycasting Click & Touch Listener
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function handlePointerInteract(event) {
      const rect = canvas.getBoundingClientRect()
      const clientX = event.clientX ?? event.changedTouches?.[0]?.clientX
      const clientY = event.clientY ?? event.changedTouches?.[0]?.clientY
      if (clientX === undefined || clientY === undefined) return

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const interactableMeshes = stepNodes.map(s => s.orbMesh)
      const hits = raycaster.intersectObjects(interactableMeshes, false)

      if (hits.length > 0) {
        const hit = hits[0].object
        if (hit.userData && hit.userData.stepIndex !== undefined) {
          handleStepClick(hit.userData.stepIndex)
        }
      }
    }

    canvas.addEventListener('click', handlePointerInteract)

    // 9. Window Resize
    function onResize() {
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // 10. Device Orientation Handler for Camera AR
    function onDeviceRot(e) {
      t.deviceRot = {
        alpha: e.alpha ?? 0,
        beta: e.beta ?? 90,
        gamma: e.gamma ?? 0,
      }
    }
    window.addEventListener('deviceorientation', onDeviceRot)

    // 11. Animation Loop
    function renderLoop() {
      t.animId = requestAnimationFrame(renderLoop)
      const elapsed = t.clock.getElapsedTime()

      // Animate hazard
      if (t.hazardGroup) {
        t.hazardGroup.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.08)
      }

      // Animate step nodes
      t.stepNodes.forEach((node) => {
        const isActive = node.group.visible && node.stepIndex === currentStepRef.current
        if (isActive) {
          // Bob up and down
          node.orbMesh.position.y = Math.sin(elapsed * 4) * 0.15
          // Rotate pulse ring
          node.ringMesh.rotation.z = elapsed * 1.5
          node.ringMesh.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.2)
          // Pulse beacon beam
          node.beamMesh.material.opacity = 0.25 + Math.sin(elapsed * 6) * 0.15
        }
      })

      // Handle AR camera orientation vs 3D OrbitControls
      if (arModeRef.current) {
        const { alpha, beta, gamma } = t.deviceRot
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(beta - 90),
          THREE.MathUtils.degToRad(alpha),
          THREE.MathUtils.degToRad(-gamma),
          'YXZ'
        )
        camera.quaternion.setFromEuler(euler)
      } else if (controls) {
        if (autoRotateRef.current) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 2.5
        } else {
          controls.autoRotate = false
        }
        controls.update()
      }

      renderer.render(scene, camera)
    }
    renderLoop()

    // 12. Cleanup on unmount
    return () => {
      if (t.animId) cancelAnimationFrame(t.animId)
      canvas.removeEventListener('click', handlePointerInteract)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('deviceorientation', onDeviceRot)
      controls.dispose()
      renderer.dispose()
      scene.clear()
    }
  }, [scenario, handleStepClick]) // ONLY run once when scenario loads!

  // Keep refs up to date for the persistent animation loop
  const currentStepRef = useRef(currentStep)
  currentStepRef.current = currentStep
  const arModeRef = useRef(arMode)
  arModeRef.current = arMode

  // ─── Update Visual State When Step Changes (No WebGL Teardown) ────────────────
  useEffect(() => {
    const t = threeRef.current
    if (!t.stepNodes.length) return

    t.stepNodes.forEach(node => {
      const isCompleted = completedSteps.includes(node.stepIndex)
      const isActive = node.stepIndex === currentStep

      if (isCompleted) {
        // Hide finished step or turn subtle green
        node.group.visible = false
      } else {
        node.group.visible = true
        node.beamMesh.visible = isActive
        node.ringMesh.visible = isActive

        if (isActive) {
          node.orbMesh.material.emissiveIntensity = 1.0
          node.orbMesh.scale.setScalar(1.25)
          node.badgeSprite.scale.set(3.8, 0.95, 1)
        } else {
          node.orbMesh.material.emissiveIntensity = 0.2
          node.orbMesh.scale.setScalar(0.85)
          node.badgeSprite.scale.set(2.8, 0.7, 1)
        }
      }
    })

    // Update scene background for AR vs 3D mode
    if (t.scene) {
      if (arMode) {
        t.scene.background = null // Transparent for camera view
      } else {
        t.scene.background = new THREE.Color('#1F242D') // Crisp slate studio room
      }
    }
  }, [currentStep, completedSteps, arMode])

  if (isLoading || !cameraChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--color-brand)', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>Loading 3D Training Simulator…</p>
        </div>
      </div>
    )
  }

  const steps = scenario?.steps ?? []
  const allDone = completedSteps.length === steps.length && steps.length > 0
  const activeStep = steps[currentStep]

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1F242D', position: 'relative', overflow: 'hidden' }}>

      {/* Camera Live Feed (AR Mode) with Real-Time Computer Vision Fire Detection */}
      {arMode && cameraAvail && (
        <>
          <CameraBackground streamRef={cameraStreamRef} videoRef={cameraVideoRef} />
          {isFireScenario && (
            <FireDetectionOverlay
              videoRef={cameraVideoRef}
              isActive={arMode}
              lang={lang}
              onFireDetected={handleFireDetected}
              onTaskCompleted={handleFireTaskCompleted}
            />
          )}
        </>
      )}

      {/* Persistent Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          display: 'block',
          touchAction: 'none',
          cursor: 'grab',
        }}
      />

      {/* AR Center Reticle / Crosshair */}
      {arMode && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 48, height: 48, pointerEvents: 'none', zIndex: 5,
          border: '2px solid rgba(255, 255, 255, 0.7)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 8, height: 8, background: 'var(--color-brand)', borderRadius: '50%' }} />
        </div>
      )}

      {/* On-Screen Touch / Mouse Camera Helper Controls (Right Side) */}
      {!arMode && (
        <div style={{
          position: 'absolute', right: 16, top: '40%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 8, zIndex: 12,
        }}>
          {/* Action Button Row: Locate + 360 Auto-Rotate */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleFocusTarget}
              title="Focus Active Target"
              style={{
                width: 44, height: 44, borderRadius: 12, background: 'var(--color-brand)',
                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer',
              }}
            >
              <Target size={22} />
            </button>

            <button
              onClick={toggleAutoRotate}
              title={autoRotate ? "Stop 360° Rotation" : "Auto-Rotate 360°"}
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: autoRotate ? '#10B981' : 'rgba(20, 20, 26, 0.85)',
                border: autoRotate ? '2px solid #34D399' : '1px solid rgba(255,255,255,0.2)',
                color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: autoRotate ? '0 0 16px rgba(16, 185, 129, 0.7)' : '0 4px 12px rgba(0,0,0,0.3)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <RotateCw size={17} style={{ animation: autoRotate ? 'spin 3s linear infinite' : 'none' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, marginTop: 1 }}>360°</span>
            </button>
          </div>

          {/* D-Pad Buttons with 360 Center Button */}
          <div style={{
            background: 'rgba(20, 20, 26, 0.85)', backdropFilter: 'blur(8px)',
            borderRadius: 16, padding: 6, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <button
              onClick={() => handleManualRotate(0, 0.4)}
              title="Tilt Up"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowUp size={18} />
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => handleManualRotate(0.75, 0)}
                title="Rotate 360° Left"
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={toggleAutoRotate}
                title="Toggle 360° Orbit"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: autoRotate ? 'var(--color-brand)' : 'rgba(255,255,255,0.12)',
                  border: 'none', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                }}
              >
                360°
              </button>
              <button
                onClick={() => handleManualRotate(-0.75, 0)}
                title="Rotate 360° Right"
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <button
              onClick={() => handleManualRotate(0, -0.4)}
              title="Tilt Down"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowDown size={18} />
            </button>
          </div>

          {/* Zoom Buttons */}
          <div style={{
            background: 'rgba(20, 20, 26, 0.85)', backdropFilter: 'blur(8px)',
            borderRadius: 14, padding: 6, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <button
              onClick={() => handleManualZoom(1.3)}
              title="Zoom In"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => handleManualZoom(0.7)}
              title="Zoom Out"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ZoomOut size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating 3D Navigation Hint */}
      {showControlsHelp && !arMode && (
        <div style={{
          position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-brand)', borderRadius: 20,
          padding: '8px 20px', color: 'white', fontSize: 12, fontWeight: 600,
          zIndex: 12, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <Compass size={16} color="var(--color-brand)" />
          <span>Click &amp; drag anywhere to rotate 360° · Scroll to zoom · Tap the glowing orb</span>
          <button onClick={() => setShowControlsHelp(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginLeft: 6 }}>✕</button>
        </div>
      )}

      {/* HUD Layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>

        {/* Top Header Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(to bottom, rgba(15,18,22,0.95), transparent)',
          pointerEvents: 'all',
        }}>
          {/* Mode Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: arMode ? 'rgba(224,90,0,0.25)' : 'rgba(14,124,123,0.25)',
            border: `1.5px solid ${arMode ? 'var(--color-brand)' : '#0E7C7B'}`,
            borderRadius: 20, padding: '6px 14px',
            color: 'white', fontSize: 12, fontWeight: 700,
          }}>
            {arMode ? <Camera size={14} color="var(--color-brand)" /> : <Monitor size={14} color="#0E7C7B" />}
            {arMode
              ? (isFireScenario ? '🔥 Camera AR · Real-Time Fire Detection' : '📷 Camera AR Mode')
              : '🖥️ 3D Simulation Mode'}
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!isOnline && (
              <div style={{
                background: 'rgba(212,136,42,0.9)', borderRadius: 20,
                padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'white',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <WifiOff size={12} /> OFFLINE
              </div>
            )}

            <button
              onClick={toggleARMode}
              style={{
                background: 'rgba(28,32,40,0.9)', border: '1px solid rgba(255,255,255,0.25)',
                color: 'white', borderRadius: 20, padding: '8px 16px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {arMode ? <Monitor size={14} /> : <Camera size={14} />}
              {arMode ? 'Switch to 3D' : 'Switch to AR'}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(220,38,38,0.2)', border: '1px solid #DC2626',
                color: 'white', borderRadius: 20, padding: '8px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <X size={14} /> {T('exitTraining')}
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: '0 20px', pointerEvents: 'none' }}>
          <span style={{
            background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 6,
            color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700,
          }}>
            {scenario?.title ?? 'Industrial Training Scenario'}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Bottom Instruction & Action Card */}
        <div style={{
          background: 'linear-gradient(to top, rgba(12,14,18,0.96) 80%, transparent)',
          padding: '24px 20px 20px',
          pointerEvents: 'all',
          maxWidth: 680,
          margin: '0 auto',
          width: '100%',
        }}>
          {/* Progress Segmented Bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 3,
                background: completedSteps.includes(i) ? '#10B981'
                  : i === currentStep ? 'var(--color-brand)' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.3s ease',
              }} />
            ))}
          </div>

          {!allDone && activeStep && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-brand)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  STEP {currentStep + 1} OF {steps.length}
                </span>
                <button
                  onClick={() => speak(activeStep.instruction, lang)}
                  style={{
                    background: 'transparent', border: 'none', color: '#9CA3AF',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                  }}
                >
                  <Volume2 size={14} /> Listen
                </button>
              </div>

              <h2 style={{ color: 'white', fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 800, marginBottom: 6 }}>
                {activeStep.label}
              </h2>

              <p style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
                {activeStep.instruction}
              </p>

              {/* Direct Action Completion Button (Guarantees 100% usability!) */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleStepClick(currentStep)}
                  style={{
                    flex: 1,
                    background: 'var(--color-brand)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 20px',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(224,90,0,0.4)',
                  }}
                >
                  <CheckCircle size={20} />
                  Complete Action: {activeStep.label}
                </button>

                {!arMode && (
                  <button
                    onClick={handleFocusTarget}
                    title="Center view on this target"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 12,
                      padding: '0 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <Target size={18} />
                    Locate
                  </button>
                )}
              </div>
            </div>
          )}

          {allDone && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.2)',
                color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{ color: '#10B981', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                All Safety Actions Completed!
              </h3>
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>
                {saving ? 'Saving results and preparing knowledge assessment…' : 'Preparing results…'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step Feedback Popup */}
      {stepFeedback && (
        <div style={{
          position: 'absolute', top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          background: 'rgba(16, 185, 129, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '18px 28px',
          textAlign: 'center', color: 'white',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          <CheckCircle size={32} style={{ margin: '0 auto 6px' }} />
          <p style={{ fontWeight: 800, fontSize: 16 }}>{stepFeedback.label}</p>
          <p style={{ fontSize: 13, opacity: 0.9 }}>Correct Action Performed! ✓</p>
        </div>
      )}
    </div>
  )
}
