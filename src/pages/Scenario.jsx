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
import VirtualARHUD from '../components/ar/VirtualARHUD'

// ─── Floating Canvas Text Sprite Helper ────────────────────────────────────────
function createStepBadgeSprite(stepNumber, label, color = '#E05A00') {
  const canvas = document.createElement('canvas')
  canvas.width = 768  // wider: full text never truncated
  canvas.height = 140
  const ctx = canvas.getContext('2d')

  // Background pill
  ctx.fillStyle = 'rgba(15, 18, 26, 0.94)'
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  const r = 58, x = 6, y = 6, w = 756, h = 128
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
  ctx.arc(70, 70, 46, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(stepNumber), 70, 72)

  // Title text with industrial marker icon — NO truncation
  const markerPrefixes = ['⚠ HAZARD: ', '🚨 ALARM: ', '🦺 PPE: ', '🧯 ACTION: ', '🚪 EVACUATE: ']
  const prefix = markerPrefixes[stepNumber - 1] || '🎯 STEP: '
  const displayText = prefix + label // full text, no cut-off

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(displayText, 132, 70)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4.8, 1.10, 1) // wider to match wider canvas
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
  const [spatialDirectionCue, setSpatialDirectionCue] = useState(null)

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
  const isGasScenario  = scenario?.hazard_type === 'gas_leak'

  const getStepText = useCallback((s, field) => {
    if (!s) return ''
    if (lang === 'sat' && s[`${field}_sat`]) return s[`${field}_sat`]
    if (lang === 'hi' && s[`${field}_hi`]) return s[`${field}_hi`]
    return s[field] ?? ''
  }, [lang])

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

    const stepLabel = getStepText(step, 'label') || `Step ${stepIndex + 1}`
    const stepInst = getStepText(step, 'instruction') || (lang === 'sat' ? 'ᱥᱟᱹᱨᱤ! ᱫᱚᱥᱟᱨ ᱫᱷᱟᱯ ᱛᱮ ᱞᱟᱦᱟᱭ ᱢᱮ᱾' : lang === 'hi' ? 'सही! अगले चरण पर जाएं।' : 'Correct! Proceed to the next step.')
    setStepFeedback({ correct: true, label: stepLabel })
    speak(stepInst, lang)
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
      const t = threeRef.current
      if (t.camera && t.controls) {
        t.camera.position.set(0, 3.5, 9.5)
        t.controls.target.set(0, 1.2, 0)
        t.controls.enabled = true
        t.controls.update()
      }
    } else {
      const stream = await requestCameraStream()
      if (stream) {
        cameraStreamRef.current = stream
        setCameraAvail(true)
        setArMode(true)
      } else {
        alert('Camera permission required for Camera AR Mode. Using 3D Simulation Mode.')
      }
    }
  }

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
    t.floor = floor

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
    } else if (scenario.hazard_type === 'ppe') {
      hazardGroup.position.set(3, 1.4, 2.3)
      // Amber industrial hazard caution indicator beacon & strobe
      const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16), machineMat)
      hazardGroup.add(beaconBase)
      const beaconLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#EAB308', emissive: '#CA8A04', emissiveIntensity: 2.2 })
      )
      beaconLight.position.y = 0.25
      hazardGroup.add(beaconLight)
      const ppeLight = new THREE.PointLight('#EAB308', 3.5, 8)
      ppeLight.position.y = 0.3
      hazardGroup.add(ppeLight)
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

      t.flameMeshes = [flameCore, flameInner]
      t.flameLight = fLight
    }
    scene.add(hazardGroup)
    t.hazardGroup = hazardGroup

    // ── BUG 1 FIX: World-Anchored AR Fire Particle System ─────────────────────
    // The fire lives at a FIXED WORLD POSITION in the Three.js scene (0, 0, 1.8).
    // In AR mode the gyroscope rotates the Three.js CAMERA — not the scene.
    // So objects at world positions stay anchored to that real-world spot:
    // physically walking around the fire will show it from different angles,
    // exactly as if a real fire were placed there.
    // (The previous camera.add() approach made the fire follow the screen — WRONG.)
    //
    // ── Multi-Location World Anchored Fire Particle System ───────────────────
    // Anchored at the Electrical Control Panel hazard coordinates: (3, 1.3, 2.7).
    // In AR mode, the camera rotates at room origin, so this fire stays anchored
    // in physical 3D space near the right corner of the room.
    const WORLD_FIRE_POS = new THREE.Vector3(3, 1.3, 2.7) // fixed world spot on Control Panel

    // Create a procedural flame texture on canvas
    function makeFlameTexture(r, g, b) {
      const fc = document.createElement('canvas')
      fc.width = 64; fc.height = 64
      const fctx = fc.getContext('2d')
      const grad = fctx.createRadialGradient(32, 40, 2, 32, 32, 30)
      grad.addColorStop(0,   `rgba(${r},${g},${b},1)`)
      grad.addColorStop(0.4, `rgba(${r},${g},${b},0.7)`)
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)
      fctx.fillStyle = grad
      fctx.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(fc)
    }

    const arFireGroup = new THREE.Group()
    arFireGroup.position.copy(WORLD_FIRE_POS)
    arFireGroup.visible = false
    scene.add(arFireGroup) // scene child, NOT camera child → world-anchored

    // ── Particle definitions: 30 flame particles + 10 smoke particles ──────────
    const PARTICLE_COUNT = 30
    const SMOKE_COUNT = 10
    const particles = []
    const smokeParts = []

    const flameTex1 = makeFlameTexture(255, 80, 0)   // deep orange
    const flameTex2 = makeFlameTexture(255, 160, 0)  // bright orange
    const flameTex3 = makeFlameTexture(255, 230, 30) // yellow

    function makeParticle(isSmoke) {
      const tex = isSmoke ? null : [flameTex1, flameTex2, flameTex3][Math.floor(Math.random() * 3)]
      const size = isSmoke ? 0.18 + Math.random() * 0.14 : 0.08 + Math.random() * 0.18
      const mat = new THREE.MeshBasicMaterial({
        map: isSmoke ? null : tex,
        color: isSmoke ? new THREE.Color(0.18, 0.18, 0.18) : new THREE.Color(1, 1, 1),
        transparent: true,
        opacity: isSmoke ? 0.18 + Math.random() * 0.12 : 0.65 + Math.random() * 0.35,
        blending: isSmoke ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const geo = new THREE.PlaneGeometry(size, size * 1.4)
      const mesh = new THREE.Mesh(geo, mat)

      // Random spawn position in a small cluster around fire base
      const rx = (Math.random() - 0.5) * 0.22
      const rz = (Math.random() - 0.5) * 0.22
      const startY = isSmoke ? 0.55 + Math.random() * 0.3 : Math.random() * 0.3
      mesh.position.set(rx, startY, rz)

      // Per-particle velocities and lifecycle
      mesh.userData = {
        vx: (Math.random() - 0.5) * 0.004,
        vy: isSmoke ? 0.006 + Math.random() * 0.006 : 0.018 + Math.random() * 0.022,
        vz: (Math.random() - 0.5) * 0.004,
        life: Math.random(), // 0..1 normalised lifecycle position
        speed: isSmoke ? 0.003 + Math.random() * 0.003 : 0.005 + Math.random() * 0.008,
        initOpacity: mat.opacity,
        initSize: size,
        isSmoke,
        swayPhase: Math.random() * Math.PI * 2,
      }

      arFireGroup.add(mesh)
      return mesh
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle(false))
    for (let i = 0; i < SMOKE_COUNT; i++) smokeParts.push(makeParticle(true))
    t.arParticles = [...particles, ...smokeParts]

    // Urgent-growth start time
    t.arFireStartTime = t.clock.getElapsedTime()

    // Glowing point light — world-anchored at fire position
    const arFireLight = new THREE.PointLight('#FF6600', 7.0, 4.5)
    arFireLight.position.set(0, 0.5, 0)
    arFireGroup.add(arFireLight)
    const arFireGlow = new THREE.PointLight('#FF3300', 3.5, 7.0)
    arFireGlow.position.set(0, 1.0, 0)
    arFireGroup.add(arFireGlow)

    t.arFireGroup = arFireGroup
    t.arFireLight = arFireLight
    t.arFireGlow = arFireGlow
    t.WORLD_FIRE_POS = WORLD_FIRE_POS

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

    // ── Evacuation Waypoints (Glowing animated route to Exit Door & Muster Point) ──
    const evacPathGroup = new THREE.Group()
    evacPathGroup.visible = false
    const evacWaypoints = [
      new THREE.Vector3(2.5, 0.04, 2.2),
      new THREE.Vector3(1.0, 0.04, 1.0),
      new THREE.Vector3(-0.8, 0.04, -0.2),
      new THREE.Vector3(-2.6, 0.04, -1.8),
      new THREE.Vector3(-4.4, 0.04, -3.4),
      new THREE.Vector3(-5.8, 0.04, -4.8), // Exit door
    ]
    const evacArrowMat = new THREE.MeshBasicMaterial({
      color: '#22C55E',
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })
    const evacArrows = []
    for (let i = 0; i < evacWaypoints.length - 1; i++) {
      const p1 = evacWaypoints[i]
      const p2 = evacWaypoints[i + 1]
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize()

      const shape = new THREE.Shape()
      shape.moveTo(-0.24, -0.16)
      shape.lineTo(0, 0.22)
      shape.lineTo(0.24, -0.16)
      shape.lineTo(0.12, -0.16)
      shape.lineTo(0, 0.06)
      shape.lineTo(-0.12, -0.16)
      shape.closePath()

      const arrowGeo = new THREE.ShapeGeometry(shape)
      const arrowMesh = new THREE.Mesh(arrowGeo, evacArrowMat.clone())
      arrowMesh.rotation.x = -Math.PI / 2
      arrowMesh.rotation.z = Math.atan2(-dir.x, dir.z) + Math.PI
      arrowMesh.position.copy(mid)
      evacPathGroup.add(arrowMesh)
      evacArrows.push(arrowMesh)
    }
    scene.add(evacPathGroup)
    t.evacPathGroup = evacPathGroup
    t.evacArrows = evacArrows

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
          const clicked = hit.userData.stepIndex
          if (clicked === currentStepRef.current) {
            handleStepClick(clicked)
          } else if (clicked > currentStepRef.current) {
            setStepFeedback({ correct: false, label: 'Out of Sequence: Follow safety protocol in order!' })
            speak('Action out of sequence. Follow the safety protocol step order.', lang)
            setTimeout(() => setStepFeedback(null), 2400)
          }
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
      if (t.hazardGroup && !t.flameExtinguished) {
        t.hazardGroup.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.08)
        if (t.flameMeshes) {
          t.flameMeshes[0].scale.set(1 + Math.sin(elapsed * 14) * 0.12, 1 + Math.cos(elapsed * 12) * 0.15, 1 + Math.sin(elapsed * 11) * 0.12)
          t.flameMeshes[1].scale.set(1 + Math.cos(elapsed * 16) * 0.10, 1 + Math.sin(elapsed * 15) * 0.18, 1 + Math.cos(elapsed * 13) * 0.10)
        }
      }

      // Animate world-anchored AR fire particle system (BUG 1 + BUG 2 FIX)
      if (t.arFireGroup) {
        const inAR = arModeRef.current
        t.arFireGroup.visible = inAR && !t.flameExtinguished
        if (inAR && !t.flameExtinguished && t.arParticles) {
          // Fire grows urgently over 10-15s to simulate escalating danger
          const timeSinceStart = elapsed - (t.arFireStartTime ?? 0)
          const urgencyScale = Math.min(1.0 + timeSinceStart / 12.0, 2.8)
          t.arFireGroup.scale.setScalar(urgencyScale)

          // Billboard: make each particle face the camera each frame
          t.arParticles.forEach(p => {
            const d = p.userData
            // Advance lifecycle
            d.life += d.speed
            if (d.life >= 1.0) {
              // Respawn at base
              d.life = 0
              p.position.x = (Math.random() - 0.5) * (d.isSmoke ? 0.28 : 0.18)
              p.position.y = d.isSmoke ? 0.55 + Math.random() * 0.2 : Math.random() * 0.1
              p.position.z = (Math.random() - 0.5) * (d.isSmoke ? 0.28 : 0.18)
              p.material.opacity = d.initOpacity
            }

            // Rise upward + gentle sway
            p.position.y += d.vy
            p.position.x += d.vx + Math.sin(elapsed * 3.5 + d.swayPhase) * 0.002
            p.position.z += d.vz

            // Fade out toward end of life
            const fadeStart = d.isSmoke ? 0.55 : 0.45
            if (d.life > fadeStart) {
              p.material.opacity = d.initOpacity * (1 - (d.life - fadeStart) / (1 - fadeStart))
            }

            // Billboard: rotate particle to face camera (in group local space)
            const camWorldPos = new THREE.Vector3()
            camera.getWorldPosition(camWorldPos)
            const camLocal = t.arFireGroup.worldToLocal(camWorldPos.clone())
            p.lookAt(camLocal)
          })

          // Flicker the lights
          if (t.arFireLight) {
            t.arFireLight.intensity = (6.0 + Math.sin(elapsed * 19) * 3.0 + Math.cos(elapsed * 11) * 1.5) * Math.min(urgencyScale, 1.5)
          }
          if (t.arFireGlow) {
            t.arFireGlow.intensity = (3.0 + Math.sin(elapsed * 8) * 1.5) * Math.min(urgencyScale, 1.5)
          }
        }
      }


      // Animate Evacuation Waypoints (visible on Evacuate & Muster steps)
      if (t.evacPathGroup) {
        const isEvacStep = currentStepRef.current >= 4
        t.evacPathGroup.visible = isEvacStep
        if (isEvacStep && t.evacArrows) {
          t.evacArrows.forEach((arr, i) => {
            const pulse = (Math.sin(elapsed * 6 - i * 0.9) + 1) / 2
            arr.material.opacity = 0.35 + pulse * 0.6
            arr.scale.setScalar(0.9 + pulse * 0.25)
          })
        }
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
        if (controls) controls.enabled = false
        // Fixed eye-level viewer position at training room center
        camera.position.set(0, 1.4, 0)

        const { alpha, beta, gamma } = t.deviceRot
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(beta - 90),
          THREE.MathUtils.degToRad(alpha),
          THREE.MathUtils.degToRad(-gamma),
          'YXZ'
        )
        camera.quaternion.setFromEuler(euler)

        // Directional wayfinding cue calculation for Spatial Multi-Location AR
        const activeIdx = currentStepRef.current
        const activeStepObj = steps[activeIdx]
        if (activeStepObj?.position) {
          const targetPos = new THREE.Vector3(...activeStepObj.position)
          const camWorldPos = new THREE.Vector3()
          camera.getWorldPosition(camWorldPos)

          const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
          camForward.y = 0
          camForward.normalize()

          const toTarget = new THREE.Vector3().subVectors(targetPos, camWorldPos)
          toTarget.y = 0
          const dist = toTarget.length()
          toTarget.normalize()

          const dot = Math.min(Math.max(camForward.dot(toTarget), -1), 1)
          const angleRad = Math.acos(dot)
          const angleDeg = Math.round(THREE.MathUtils.radToDeg(angleRad))

          // In Three.js forward is -Z. Cross product Y indicates Left vs Right
          const crossY = camForward.z * toTarget.x - camForward.x * toTarget.z

          let turnDirection = 'in-front'
          if (angleDeg <= 25) {
            turnDirection = 'in-front'
          } else if (angleDeg >= 135) {
            turnDirection = 'behind'
          } else if (crossY < 0) {
            turnDirection = 'right'
          } else {
            turnDirection = 'left'
          }

          const now = performance.now()
          if (!t.lastCueUpdate || now - t.lastCueUpdate > 100) {
            t.lastCueUpdate = now
            setSpatialDirectionCue({
              inView: angleDeg <= 25,
              turnDirection,
              angleDeg,
              distanceMeters: dist.toFixed(1),
              stationName: activeStepObj.label,
              stepIndex: activeIdx,
            })
          }
        }
      } else {
        if (controls) {
          controls.enabled = true
          if (autoRotateRef.current) {
            controls.autoRotate = true
            controls.autoRotateSpeed = 2.5
          } else {
            controls.autoRotate = false
          }
          controls.update()
        }
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
        // Hide entire group when step is finished
        node.group.visible = false
      } else {
        // Spatial Multi-Location AR: in AR mode, ONLY render the active step's 3D object & beacon.
        // In 3D simulation mode, keep upcoming objects subtly visible for warehouse context.
        node.group.visible = arMode ? isActive : true
        node.beamMesh.visible = isActive
        node.ringMesh.visible = isActive
        node.badgeSprite.visible = isActive

        if (isActive) {
          node.orbMesh.material.emissiveIntensity = 1.0
          node.orbMesh.scale.setScalar(1.25)
          node.badgeSprite.scale.set(4.2, 1.05, 1) // slightly wider so text never truncates
        } else {
          // Keep orb small and dim (still raycasting target but invisible badge)
          node.orbMesh.material.emissiveIntensity = 0.05
          node.orbMesh.scale.setScalar(0.6)
        }
      }
    })

    // Update scene background and floor visibility for AR vs 3D mode
    if (t.scene) {
      if (arMode) {
        t.scene.background = null // Transparent for camera view
        if (t.floor) t.floor.visible = false // Trainee's camera shows real-world floor!
      } else {
        t.scene.background = new THREE.Color('#1F242D') // Crisp slate studio room
        if (t.floor) t.floor.visible = true
      }
    }

    // Dynamic virtual hazard reactions
    if (isFireScenario && t.flameMeshes) {
      const isExtinguished = completedSteps.includes(3)
      t.flameExtinguished = isExtinguished
      t.flameMeshes.forEach(mesh => {
        mesh.visible = !isExtinguished
      })
      if (t.flameLight) {
        t.flameLight.intensity = isExtinguished ? 0 : 4.0
      }
    }
  }, [currentStep, completedSteps, arMode, isFireScenario])

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

      {/* Camera Live Feed & Virtual AR HUD (AR Mode) */}
      {arMode && cameraAvail && (
        <>
          <CameraBackground streamRef={cameraStreamRef} videoRef={cameraVideoRef} />
          <VirtualARHUD
            scenario={scenario}
            currentStep={currentStep}
            completedSteps={completedSteps}
            steps={steps}
            lang={lang}
            onStepClick={handleStepClick}
            stepFeedback={stepFeedback}
            allDone={allDone}
            saving={saving}
            onToggleMode={toggleARMode}
            onExit={() => navigate('/dashboard')}
            isOnline={isOnline}
            spatialDirectionCue={spatialDirectionCue}
          />
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

      {/* Desktop 3D Simulation HUD Layer */}
      {!arMode && (
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
              {arMode ? '📷 Camera AR Mode' : '🖥️ 3D Simulation Mode'}
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
                    {T('step')} {currentStep + 1} / {steps.length}
                  </span>
                  <button
                    onClick={() => speak(getStepText(activeStep, 'instruction'), lang)}
                    style={{
                      background: 'transparent', border: 'none', color: '#9CA3AF',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                    }}
                  >
                    <Volume2 size={14} /> {T('listen')}
                  </button>
                </div>

                <h2 style={{ color: 'white', fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 800, marginBottom: 6 }}>
                  {getStepText(activeStep, 'label')}
                </h2>

                <p style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
                  {getStepText(activeStep, 'instruction')}
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
      )}

      {/* Step Feedback Popup for 3D Mode */}
      {!arMode && stepFeedback && (
        <div style={{
          position: 'absolute', top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          background: stepFeedback.correct ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '18px 28px',
          textAlign: 'center', color: 'white',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          <CheckCircle size={32} style={{ margin: '0 auto 6px' }} />
          <p style={{ fontWeight: 800, fontSize: 16 }}>{stepFeedback.label}</p>
          <p style={{ fontSize: 13, opacity: 0.9 }}>{stepFeedback.correct ? 'Correct Action Performed! ✓' : 'Out of Sequence — Follow step order'}</p>
        </div>
      )}
    </div>
  )
}
