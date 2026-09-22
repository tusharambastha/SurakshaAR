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
  canvas.width = 640
  canvas.height = 120
  const ctx = canvas.getContext('2d')

  // Background pill
  ctx.fillStyle = 'rgba(15, 18, 26, 0.94)'
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  const r = 48, x = 5, y = 5, w = 630, h = 110
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
  ctx.arc(60, 60, 38, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(stepNumber), 60, 62)

  // Title text with industrial marker icon
  const markerPrefixes = ['⚠ HAZARD: ', '🚨 ALARM: ', '🦺 PPE: ', '🧯 ACTION: ', '🚪 EVACUATE: ', '📍 MUSTER: ']
  const prefix = markerPrefixes[stepNumber - 1] || '🎯 STEP: '
  const displayText = prefix + label

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(displayText, 114, 60)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  // Human-scaled: 0.72m wide x 0.14m tall (occupies ~25% of mobile screen width at 2m distance)
  sprite.scale.set(0.72, 0.14, 1)
  return sprite
}

// ─── Procedural Web Audio Ambient Fire Sound Synthesizer ─────────────────────
class ProceduralFireAudio {
  constructor() {
    this.ctx = null
    this.gainNode = null
    this.noiseSource = null
    this.isPlaying = false
    this.intervalId = null
  }

  start() {
    if (this.isPlaying) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      if (!this.ctx) {
        this.ctx = new AudioCtx()
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }

      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime)
      this.gainNode.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.8)
      this.gainNode.connect(this.ctx.destination)

      // Low frequency fire roar (pink/brown noise generator buffer)
      const bufferSize = Math.floor(this.ctx.sampleRate * 2)
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let b0 = 0, b1 = 0, b2 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99 * b0 + white * 0.05
        b1 = 0.95 * b1 + white * 0.10
        b2 = 0.85 * b2 + white * 0.25
        output[i] = (b0 + b1 + b2) * 0.22
      }

      this.noiseSource = this.ctx.createBufferSource()
      this.noiseSource.buffer = noiseBuffer
      this.noiseSource.loop = true

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(360, this.ctx.currentTime)

      this.noiseSource.connect(filter)
      filter.connect(this.gainNode)
      this.noiseSource.start()

      // Randomized crisp crackle / pop bursts
      this.intervalId = setInterval(() => {
        if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return
        if (Math.random() < 0.65) {
          const osc = this.ctx.createOscillator()
          const popGain = this.ctx.createGain()
          const burstDur = 0.010 + Math.random() * 0.025
          osc.type = Math.random() < 0.5 ? 'triangle' : 'sawtooth'
          osc.frequency.setValueAtTime(400 + Math.random() * 1200, this.ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + burstDur)

          popGain.gain.setValueAtTime(0.05 + Math.random() * 0.08, this.ctx.currentTime)
          popGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + burstDur)

          osc.connect(popGain)
          popGain.connect(this.gainNode)
          osc.start()
          osc.stop(this.ctx.currentTime + burstDur)
        }
      }, 75)

      this.isPlaying = true
    } catch (e) {
      console.warn('[SurakshaAR] Fire sound initialization deferred:', e)
    }
  }

  stop() {
    if (!this.isPlaying) return
    try {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
      if (this.gainNode && this.ctx && this.ctx.state === 'running') {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime)
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3)
        setTimeout(() => {
          if (this.noiseSource) {
            try { this.noiseSource.stop() } catch {}
          }
          this.isPlaying = false
        }, 350)
      } else {
        this.isPlaying = false
      }
    } catch {
      this.isPlaying = false
    }
  }
}

// ─── Procedural Canvas Textures for Signage & Labels (Zero 404s) ───────────────
function createAlarmFaceTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 320
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#DC2626'
  ctx.fillRect(0, 0, 256, 320)

  // White header banner
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(14, 14, 228, 56)
  ctx.fillStyle = '#DC2626'
  ctx.font = '900 26px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('FIRE ALARM', 128, 52)

  // Break glass window outline
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(36, 90, 184, 115)
  ctx.strokeStyle = '#1E293B'
  ctx.lineWidth = 4
  ctx.strokeRect(36, 90, 184, 115)

  ctx.fillStyle = '#DC2626'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText('BREAK GLASS', 128, 140)
  ctx.fillText('PULL LEVER', 128, 170)

  // Bottom pull down arrow
  ctx.fillStyle = '#FACC15'
  ctx.beginPath()
  ctx.moveTo(128, 275)
  ctx.lineTo(95, 235)
  ctx.lineTo(161, 235)
  ctx.closePath()
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

function createExtinguisherLabelTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0F172A'
  ctx.fillRect(0, 0, 512, 256)

  // Red header
  ctx.fillStyle = '#DC2626'
  ctx.fillRect(8, 8, 496, 58)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CO₂ FIRE EXTINGUISHER', 256, 50)

  // Step instructions
  ctx.fillStyle = '#F8FAFC'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('1. PULL SAFETY PIN', 25, 105)
  ctx.fillText('2. AIM NOZZLE AT BASE OF FIRE', 25, 140)
  ctx.fillText('3. SQUEEZE LEVER & SWEEP', 25, 175)

  // Rating badges
  ctx.fillStyle = '#3B82F6'
  ctx.fillRect(25, 202, 135, 36)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 17px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CLASS B (FLUID)', 92, 226)

  ctx.fillStyle = '#EAB308'
  ctx.fillRect(175, 202, 145, 36)
  ctx.fillStyle = '#000000'
  ctx.fillText('CLASS C (ELEC)', 247, 226)

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

function createExitSignTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#15803D'
  ctx.fillRect(0, 0, 512, 256)
  ctx.strokeStyle = '#22C55E'
  ctx.lineWidth = 12
  ctx.strokeRect(6, 6, 500, 244)

  // Running man silhouette
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(115, 68, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(112, 92)
  ctx.lineTo(132, 136)
  ctx.lineTo(118, 170)
  ctx.lineTo(100, 145)
  ctx.lineTo(92, 102)
  ctx.closePath()
  ctx.fill()

  // Door outline
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 8
  ctx.strokeRect(45, 58, 44, 132)

  // "EXIT" text
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 80px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('EXIT', 310, 144)

  // Right arrow
  ctx.beginPath()
  ctx.moveTo(415, 128)
  ctx.lineTo(460, 128)
  ctx.lineTo(445, 113)
  ctx.moveTo(460, 128)
  ctx.lineTo(445, 143)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 8
  ctx.stroke()

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

function createMusterSignTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 384; canvas.height = 384
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#15803D'
  ctx.fillRect(0, 0, 384, 384)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 10
  ctx.strokeRect(8, 8, 368, 368)

  // 4 corner inward arrows
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath(); ctx.moveTo(45, 45); ctx.lineTo(105, 45); ctx.lineTo(45, 105); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(339, 45); ctx.lineTo(279, 45); ctx.lineTo(339, 105); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(45, 339); ctx.lineTo(105, 339); ctx.lineTo(45, 279); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(339, 339); ctx.lineTo(279, 339); ctx.lineTo(339, 279); ctx.closePath(); ctx.fill()

  // Center figures
  ctx.beginPath(); ctx.arc(192, 135, 22, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(145, 155, 18, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(239, 155, 18, 0, Math.PI * 2); ctx.fill()

  ctx.fillRect(174, 162, 36, 75)
  ctx.fillRect(132, 178, 26, 60)
  ctx.fillRect(226, 178, 26, 60)

  ctx.font = '900 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ASSEMBLY POINT', 192, 310)

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// ─── Realistic 3D Fire Object Generator (Warm Glow, Volumetric Cones, Embers) ─
function createRealisticFireGroup() {
  const fireGroup = new THREE.Group()

  // 1. Scorched Ground Mark (circular burnt soot decal)
  const scorchCanvas = document.createElement('canvas')
  scorchCanvas.width = 256; scorchCanvas.height = 256
  const sctx = scorchCanvas.getContext('2d')
  const sGrad = sctx.createRadialGradient(128, 128, 15, 128, 128, 120)
  sGrad.addColorStop(0, 'rgba(12, 12, 14, 0.98)')
  sGrad.addColorStop(0.45, 'rgba(35, 20, 10, 0.88)')
  sGrad.addColorStop(0.85, 'rgba(130, 35, 5, 0.40)')
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  sctx.fillStyle = sGrad
  sctx.beginPath()
  sctx.arc(128, 128, 120, 0, Math.PI * 2)
  sctx.fill()

  // Burnt ember specks
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * 95
    sctx.fillStyle = Math.random() < 0.6 ? '#FF4400' : '#FFB700'
    sctx.beginPath()
    sctx.arc(128 + Math.cos(angle) * dist, 128 + Math.sin(angle) * dist, 1.2 + Math.random() * 2, 0, Math.PI * 2)
    sctx.fill()
  }

  const scorchTex = new THREE.CanvasTexture(scorchCanvas)
  const scorchMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 32),
    new THREE.MeshBasicMaterial({ map: scorchTex, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide })
  )
  scorchMesh.rotation.x = -Math.PI / 2
  scorchMesh.position.y = -0.01
  fireGroup.add(scorchMesh)

  // 2. Heavy charred industrial equipment base ring
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.27, 0.035, 24),
    new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.8, roughness: 0.4 })
  )
  pad.position.y = 0.015
  fireGroup.add(pad)

  // 3. Volumetric Animated Flame Cones (Realistic ~0.62m waist-height)
  // (a) Outer flame body (Crimson / Deep Orange) ~0.60m tall
  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.62, 16),
    new THREE.MeshStandardMaterial({
      color: '#FF3B00',
      emissive: '#FF2200',
      emissiveIntensity: 2.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.90,
    })
  )
  flameOuter.position.y = 0.32
  fireGroup.add(flameOuter)

  // (b) Mid flame body (Golden Yellow) ~0.50m tall
  const flameMid = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.50, 14),
    new THREE.MeshStandardMaterial({
      color: '#FFB800',
      emissive: '#FF9500',
      emissiveIntensity: 3.4,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95,
    })
  )
  flameMid.position.y = 0.26
  fireGroup.add(flameMid)

  // (c) Core flame (White-Hot Center) ~0.35m tall
  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.095, 0.35, 12),
    new THREE.MeshStandardMaterial({
      color: '#FFFDF5',
      emissive: '#FFFFFF',
      emissiveIntensity: 4.2,
      roughness: 0.1,
    })
  )
  flameCore.position.y = 0.19
  fireGroup.add(flameCore)

  // 4. Procedural texture for flame particle embers
  const ptCanvas = document.createElement('canvas')
  ptCanvas.width = 64; ptCanvas.height = 64
  const ptctx = ptCanvas.getContext('2d')
  const ptGrad = ptctx.createRadialGradient(32, 40, 2, 32, 32, 28)
  ptGrad.addColorStop(0, 'rgba(255, 255, 240, 1)')
  ptGrad.addColorStop(0.35, 'rgba(255, 180, 0, 0.9)')
  ptGrad.addColorStop(0.7, 'rgba(255, 50, 0, 0.5)')
  ptGrad.addColorStop(1, 'rgba(200, 0, 0, 0)')
  ptctx.fillStyle = ptGrad
  ptctx.fillRect(0, 0, 64, 64)
  const emberTex = new THREE.CanvasTexture(ptCanvas)

  // 5. Rising Ember Particles
  const embers = []
  const emberMat = new THREE.MeshBasicMaterial({
    map: emberTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  for (let i = 0; i < 28; i++) {
    const size = 0.042 + Math.random() * 0.045
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.4), emberMat.clone())
    mesh.position.set(
      (Math.random() - 0.5) * 0.22,
      0.08 + Math.random() * 0.50,
      (Math.random() - 0.5) * 0.22
    )
    mesh.userData = {
      vx: (Math.random() - 0.5) * 0.003,
      vy: 0.008 + Math.random() * 0.009,
      vz: (Math.random() - 0.5) * 0.003,
      life: Math.random(),
      speed: 0.008 + Math.random() * 0.010,
      baseOpacity: 0.88,
      swayPhase: Math.random() * Math.PI * 2,
    }
    fireGroup.add(mesh)
    embers.push(mesh)
  }

  // 6. Soft Smoke Puffs
  const smokeParticles = []
  const smokeMat = new THREE.MeshBasicMaterial({
    color: '#222226',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  for (let i = 0; i < 8; i++) {
    const size = 0.08 + Math.random() * 0.07
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), smokeMat.clone())
    mesh.position.set(
      (Math.random() - 0.5) * 0.16,
      0.45 + Math.random() * 0.35,
      (Math.random() - 0.5) * 0.16
    )
    mesh.userData = {
      vy: 0.004 + Math.random() * 0.004,
      life: Math.random(),
      speed: 0.005 + Math.random() * 0.005,
      baseOpacity: 0.24,
    }
    fireGroup.add(mesh)
    smokeParticles.push(mesh)
  }

  // 7. Dynamic PointLights with Warm Fire Glow
  const fireLight = new THREE.PointLight('#FF6A00', 4.5, 4.0)
  fireLight.position.set(0, 0.40, 0)
  fireGroup.add(fireLight)

  const fireGlow = new THREE.PointLight('#FF2E00', 2.0, 5.0)
  fireGlow.position.set(0, 0.65, 0)
  fireGroup.add(fireGlow)

  return {
    group: fireGroup,
    flameOuter,
    flameMid,
    flameCore,
    embers,
    smokeParticles,
    fireLight,
    fireGlow,
  }
}

// ─── 3D Props for Training Station Steps ───────────────────────────────────────
function createAlarmBoxProp() {
  const propGroup = new THREE.Group()

  // Red wall box
  const alarmBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.32, 0.09),
    new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.3, metalness: 0.2 })
  )
  propGroup.add(alarmBox)

  // Faceplate with FIRE ALARM canvas texture
  const faceTex = createAlarmFaceTexture()
  const faceplate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.30),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.4 })
  )
  faceplate.position.set(0, 0, 0.048)
  propGroup.add(faceplate)

  // Pull lever handle
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.03, 0.04),
    new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.8 })
  )
  lever.position.set(0, -0.06, 0.07)
  propGroup.add(lever)

  // Pulsing Emergency Amber/Red Strobe on top
  const strobeBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.035, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8 })
  )
  strobeBase.position.set(0, 0.175, 0)
  propGroup.add(strobeBase)

  const strobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#F59E0B', emissive: '#D97706', emissiveIntensity: 2.5 })
  )
  strobe.position.set(0, 0.20, 0)
  propGroup.add(strobe)

  const strobeLight = new THREE.PointLight('#F59E0B', 1.8, 2.5)
  strobeLight.position.set(0, 0.22, 0)
  propGroup.add(strobeLight)

  propGroup.userData = { strobe, strobeLight }
  return propGroup
}

function createPPEStationProp() {
  const propGroup = new THREE.Group()

  // Brushed aluminum stand & circular base
  const standBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.03, 24),
    new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.3 })
  )
  standBase.position.y = -0.16
  propGroup.add(standBase)

  const standPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.38, 16),
    new THREE.MeshStandardMaterial({ color: '#64748B', metalness: 0.8, roughness: 0.2 })
  )
  standPole.position.y = 0.03
  propGroup.add(standPole)

  // Industrial Yellow Safety Helmet (IS 2925)
  const helmetDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.2, roughness: 0.3, side: THREE.DoubleSide })
  )
  helmetDome.position.set(0, 0.16, 0)
  propGroup.add(helmetDome)

  // Helmet brim
  const helmetBrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.125, 0.016, 12, 24),
    new THREE.MeshStandardMaterial({ color: '#EAB308', roughness: 0.3 })
  )
  helmetBrim.rotation.x = Math.PI / 2
  helmetBrim.position.set(0, 0.15, 0)
  propGroup.add(helmetBrim)

  // Safety Goggles with Cyan reflective visor
  const gogglesFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.045, 0.03),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.6 })
  )
  gogglesFrame.position.set(0, 0.10, 0.08)
  propGroup.add(gogglesFrame)

  const gogglesLens = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.038, 0.01),
    new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0284C7', emissiveIntensity: 0.6, transparent: true, opacity: 0.85 })
  )
  gogglesLens.position.set(0, 0.10, 0.095)
  propGroup.add(gogglesLens)

  // Heavy duty safety gloves (pair)
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.6 })
  const gloveL = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.03), gloveMat)
  gloveL.position.set(-0.09, -0.02, 0.04)
  propGroup.add(gloveL)

  const gloveR = gloveL.clone()
  gloveR.position.x = 0.09
  propGroup.add(gloveR)

  return propGroup
}

function createExtinguisherProp() {
  const propGroup = new THREE.Group()

  // Red cylinder body
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.42, 24),
    new THREE.MeshStandardMaterial({ color: '#DC2626', metalness: 0.35, roughness: 0.25 })
  )
  cyl.position.y = 0.03
  propGroup.add(cyl)

  // Dome top
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: '#DC2626', metalness: 0.35, roughness: 0.25 })
  )
  dome.position.y = 0.24
  propGroup.add(dome)

  // Rounded base foot ring
  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.074, 0.074, 0.03, 24),
    new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.6 })
  )
  baseRing.position.y = -0.18
  propGroup.add(baseRing)

  // Printed instructional label band
  const labelTex = createExtinguisherLabelTexture()
  const labelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.071, 0.071, 0.22, 24, 1, true, 0, Math.PI),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.4 })
  )
  labelMesh.position.set(0, 0.03, 0)
  labelMesh.rotation.y = Math.PI * 0.5
  propGroup.add(labelMesh)

  // Valve body & squeeze handle
  const valve = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.06, 0.045),
    new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.85 })
  )
  valve.position.set(0, 0.28, 0)
  propGroup.add(valve)

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.015, 0.03),
    new THREE.MeshStandardMaterial({ color: '#DC2626', metalness: 0.3 })
  )
  handle.position.set(-0.04, 0.32, 0)
  handle.rotation.z = -0.25
  propGroup.add(handle)

  // Pressure gauge
  const gauge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', emissive: '#22C55E', emissiveIntensity: 0.4 })
  )
  gauge.position.set(0.04, 0.28, 0.02)
  gauge.rotation.x = Math.PI / 2
  propGroup.add(gauge)

  // Black discharge horn & hose
  const horn = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.6 })
  )
  horn.position.set(0.09, 0.15, 0.03)
  horn.rotation.z = -0.55
  propGroup.add(horn)

  return propGroup
}

function createExitSignProp() {
  const propGroup = new THREE.Group()

  // Sign housing
  const casing = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.24, 0.05),
    new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.5 })
  )
  propGroup.add(casing)

  // Glowing faceplate with Running Man & EXIT text
  const exitTex = createExitSignTexture()
  const faceplate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.22),
    new THREE.MeshStandardMaterial({
      map: exitTex,
      emissive: '#15803D',
      emissiveIntensity: 0.95,
      roughness: 0.2,
    })
  )
  faceplate.position.set(0, 0, 0.027)
  propGroup.add(faceplate)

  // Subtle emergency green glow light
  const exitLight = new THREE.PointLight('#22C55E', 1.6, 2.5)
  exitLight.position.set(0, 0, 0.12)
  propGroup.add(exitLight)

  return propGroup
}

function createMusterPointProp() {
  const propGroup = new THREE.Group()

  // Aluminum support pole
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.65, 16),
    new THREE.MeshStandardMaterial({ color: '#64748B', metalness: 0.7, roughness: 0.3 })
  )
  post.position.y = -0.05
  propGroup.add(post)

  // ISO 7010 Muster Sign Board
  const musterTex = createMusterSignTexture()
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.36, 0.035),
    new THREE.MeshStandardMaterial({ color: '#0F172A' })
  )
  board.position.y = 0.22
  propGroup.add(board)

  const faceplate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshStandardMaterial({
      map: musterTex,
      emissive: '#15803D',
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  )
  faceplate.position.set(0, 0.22, 0.02)
  propGroup.add(faceplate)

  // Safe floor muster ring on ground
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.42, 32),
    new THREE.MeshBasicMaterial({ color: '#22C55E', side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -0.37
  propGroup.add(ring)

  return propGroup
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
  const [demoMode, setDemoMode]           = useState(true) // Presentation / Demo Mode default ON

  const canvasRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const fireAudioRef = useRef(new ProceduralFireAudio())

  // Three.js persistent references
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animId: null,
    stepNodes: [], // { group, propGroup, orbMesh, ringMesh, beamMesh, badgeSprite, stepIndex, pos }
    hazardGroup: null,
    fireVisual: null,
    clock: new THREE.Clock(),
    deviceRot: { alpha: 0, beta: 90, gamma: 0 },
    anchoredStep: -1,
    anchoredMode: null,
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

    // Warehouse Environment Props (Shown in 3D Simulation Mode, Hidden in Camera AR Mode)
    const warehousePropsGroup = new THREE.Group()
    const machineMat = new THREE.MeshStandardMaterial({ color: '#4B5563', metalness: 0.7, roughness: 0.3 })
    const yellowStripeMat = new THREE.MeshStandardMaterial({ color: '#EAB308', metalness: 0.2, roughness: 0.5 })

    // Generator 1
    const gen1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 1.6), machineMat)
    gen1.position.set(-5, 1.0, -1)
    warehousePropsGroup.add(gen1)
    const genStripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.2, 1.62), yellowStripeMat)
    genStripe.position.set(-5, 1.8, -1)
    warehousePropsGroup.add(genStripe)

    // Electrical Control Panel (Hazard 0 location: [3, 1.2, 3])
    const panelCabinet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.8), machineMat)
    panelCabinet.position.set(3, 1.2, 3)
    warehousePropsGroup.add(panelCabinet)
    // Panel face door
    const panelFace = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 0.05), new THREE.MeshStandardMaterial({ color: '#DC2626' }))
    panelFace.position.set(3, 1.2, 2.6)
    warehousePropsGroup.add(panelFace)

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

    // Fixed World Coordinates for Scenario Spatial Stations
    const WORLD_FIRE_POS = new THREE.Vector3(3, 1.3, 2.7)
    t.WORLD_FIRE_POS = WORLD_FIRE_POS

    // Fire Alarm Station prop ([2.5, 2.0, -2])
    const alarmPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2), machineMat)
    alarmPole.position.set(2.5, 1.1, -2)
    warehousePropsGroup.add(alarmPole)
    const alarmBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#B91C1C', emissiveIntensity: 0.4 }))
    alarmBox.position.set(2.5, 1.9, -2)
    warehousePropsGroup.add(alarmBox)

    // PPE Station Locker prop ([-4, 0.9, 1])
    const ppeLocker = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.7), new THREE.MeshStandardMaterial({ color: '#0284C7', metalness: 0.5 }))
    ppeLocker.position.set(-4, 1.0, 1)
    warehousePropsGroup.add(ppeLocker)

    // Fire Extinguisher prop ([1.5, 0.8, 2])
    const extBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16), new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.3 }))
    extBody.position.set(1.5, 0.45, 2)
    warehousePropsGroup.add(extBody)

    // Emergency Exit door frame ([-6, 1.5, -5])
    const exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.1), new THREE.MeshStandardMaterial({ color: '#16A34A', emissive: '#15803D', emissiveIntensity: 0.6 }))
    exitDoor.position.set(-6, 1.5, -5)
    warehousePropsGroup.add(exitDoor)

    // Muster Assembly Point post ([0, 1.0, 10])
    const musterPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5), machineMat)
    musterPost.position.set(0, 1.25, 10)
    warehousePropsGroup.add(musterPost)
    const musterSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), new THREE.MeshStandardMaterial({ color: '#16A34A', emissive: '#15803D', emissiveIntensity: 0.7 }))
    musterSign.position.set(0, 2.4, 10)
    warehousePropsGroup.add(musterSign)

    scene.add(warehousePropsGroup)
    t.warehousePropsGroup = warehousePropsGroup

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

      // ── Human-Scaled 3D Interactive Prop ──────────────────────────────────
      let propGroup = new THREE.Group()
      if (idx === 0) {
        if (isFireScenario) {
          const fireVis = createRealisticFireGroup()
          propGroup.add(fireVis.group)
          t.fireVisual = fireVis
        } else {
          // Hazard base / caution floor pad for non-fire
          const pad = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.27, 0.04, 24),
            new THREE.MeshStandardMaterial({ color: '#EAB308', metalness: 0.2, roughness: 0.4 })
          )
          pad.position.y = -0.06
          propGroup.add(pad)
        }
      } else if (idx === 1) {
        propGroup = createAlarmBoxProp()
      } else if (idx === 2) {
        propGroup = createPPEStationProp()
      } else if (idx === 3) {
        propGroup = createExtinguisherProp()
      } else if (idx === 4) {
        propGroup = createExitSignProp()
      } else if (idx === 5) {
        propGroup = createMusterPointProp()
      }
      group.add(propGroup)

      // Main Interactive Target Orb (Compact 8cm radius)
      const orbGeo = new THREE.SphereGeometry(0.08, 16, 16)
      const orbMat = new THREE.MeshStandardMaterial({
        color: step.color || '#E05A00',
        emissive: step.color || '#E05A00',
        emissiveIntensity: 0.8,
        metalness: 0.2,
        roughness: 0.2,
      })
      const orbMesh = new THREE.Mesh(orbGeo, orbMat)
      orbMesh.position.y = 0.18
      orbMesh.userData = { stepIndex: idx }
      group.add(orbMesh)

      // Pulsing floor target ring (Compact 14cm - 20cm)
      const ringGeo = new THREE.RingGeometry(0.14, 0.20, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: step.color || '#E05A00',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = -Math.PI / 2
      ringMesh.position.y = -0.16
      group.add(ringMesh)

      // Vertical beacon light beam (Compact 0.7m)
      const beamGeo = new THREE.CylinderGeometry(0.015, 0.05, 0.7, 12)
      const beamMat = new THREE.MeshBasicMaterial({
        color: step.color || '#E05A00',
        transparent: true,
        opacity: 0.3,
      })
      const beamMesh = new THREE.Mesh(beamGeo, beamMat)
      beamMesh.position.y = 0.45
      group.add(beamMesh)

      // Floating billboard sprite label (Proportionate: 0.72m wide x 0.14m tall)
      const badgeSprite = createStepBadgeSprite(idx + 1, step.label, step.color || '#E05A00')
      badgeSprite.position.set(0, 0.38, 0)
      badgeSprite.scale.set(0.72, 0.14, 1)
      group.add(badgeSprite)

      scene.add(group)
      stepNodes.push({
        group,
        propGroup,
        orbMesh,
        ringMesh,
        beamMesh,
        badgeSprite,
        stepIndex: idx,
        initialY: pos[1],
        pos,
        initialPos: [...pos],
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
      const activeNode = stepNodes[currentStepRef.current]
      const interactableTargets = []
      stepNodes.forEach(s => {
        if (s.orbMesh) interactableTargets.push(s.orbMesh)
      })
      if (activeNode?.group) {
        interactableTargets.push(activeNode.group)
      }
      const hits = raycaster.intersectObjects(interactableTargets, true)

      if (hits.length > 0) {
        handleStepClick(currentStepRef.current)
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

      // Animate Realistic Fire Visual (Volumetric Cones, Embers, Smoke, Dynamic Lighting)
      if (t.fireVisual && !t.flameExtinguished) {
        const f = t.fireVisual
        const breath = 1.0 + Math.sin(elapsed * 4.0) * 0.05 + Math.sin(elapsed * 12.0) * 0.04
        const flickerX = 1.0 + Math.sin(elapsed * 16.0) * 0.08
        const flickerZ = 1.0 + Math.cos(elapsed * 19.0) * 0.08

        if (f.flameOuter) f.flameOuter.scale.set(flickerX * breath, breath * (1.0 + Math.cos(elapsed * 14.0) * 0.06), flickerZ * breath)
        if (f.flameMid) f.flameMid.scale.set(flickerZ * breath, breath * (1.0 + Math.sin(elapsed * 18.0) * 0.08), flickerX * breath)
        if (f.flameCore) f.flameCore.scale.set(breath, breath * (1.0 + Math.sin(elapsed * 22.0) * 0.05), breath)

        // Floating glowing embers
        if (f.embers) {
          const camWorldPos = new THREE.Vector3()
          camera.getWorldPosition(camWorldPos)
          const camLocal = f.group.worldToLocal(camWorldPos.clone())

          f.embers.forEach(p => {
            const d = p.userData
            d.life += d.speed
            if (d.life >= 1.0) {
              d.life = 0
              p.position.x = (Math.random() - 0.5) * 0.22
              p.position.y = 0.08 + Math.random() * 0.12
              p.position.z = (Math.random() - 0.5) * 0.22
              p.material.opacity = d.baseOpacity
            }
            p.position.y += d.vy
            p.position.x += d.vx + Math.sin(elapsed * 5.0 + d.swayPhase) * 0.002
            p.position.z += d.vz

            if (d.life > 0.5) {
              p.material.opacity = d.baseOpacity * (1 - (d.life - 0.5) / 0.5)
            }
            p.lookAt(camLocal)
          })
        }

        // Rising subtle smoke puffs
        if (f.smokeParticles) {
          f.smokeParticles.forEach(s => {
            const d = s.userData
            d.life += d.speed
            if (d.life >= 1.0) {
              d.life = 0
              s.position.x = (Math.random() - 0.5) * 0.18
              s.position.y = 0.45 + Math.random() * 0.10
              s.position.z = (Math.random() - 0.5) * 0.18
              s.scale.setScalar(1.0)
              s.material.opacity = d.baseOpacity
            }
            s.position.y += d.vy
            s.scale.multiplyScalar(1.008)
            s.material.opacity = d.baseOpacity * Math.max(1.0 - d.life, 0)
          })
        }

        // Multi-frequency warm fire light flicker
        if (f.fireLight) {
          f.fireLight.intensity = 4.2 + Math.sin(elapsed * 18.0) * 0.9 + Math.cos(elapsed * 27.0) * 0.6
        }
        if (f.fireGlow) {
          f.fireGlow.intensity = 2.0 + Math.sin(elapsed * 9.0) * 0.5
        }
      }

      // Animate Step 1 Alarm Strobe LED
      if (currentStepRef.current === 1 && t.stepNodes[1]?.propGroup?.userData?.strobeLight) {
        const strobePulse = (Math.sin(elapsed * 14) + 1) / 2
        t.stepNodes[1].propGroup.userData.strobeLight.intensity = strobePulse > 0.6 ? 2.8 : 0.15
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
          node.orbMesh.position.y = 0.22 + Math.sin(elapsed * 4) * 0.04
          node.ringMesh.rotation.z = elapsed * 1.5
          node.ringMesh.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.15)
          node.beamMesh.material.opacity = 0.25 + Math.sin(elapsed * 6) * 0.15
        }
      })

      // Handle AR camera orientation & World Anchoring
      if (arModeRef.current) {
        if (controls) controls.enabled = false
        camera.position.set(0, 1.4, 0)

        const { alpha, beta, gamma } = t.deviceRot
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(beta - 90),
          THREE.MathUtils.degToRad(alpha),
          THREE.MathUtils.degToRad(-gamma),
          'YXZ'
        )
        camera.quaternion.setFromEuler(euler)

        const activeIdx = currentStepRef.current
        const activeNode = t.stepNodes[activeIdx]

        // ── Presentation Demo Mode Anchoring ──
        if (demoModeRef.current) {
          if (t.anchoredStep !== activeIdx || t.anchoredMode !== true) {
            const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
            const forwardH = new THREE.Vector3(camForward.x, 0, camForward.z).normalize()
            if (forwardH.lengthSq() < 0.001) forwardH.set(0, 0, -1)

            if (activeNode) {
              const anchorDist = 1.7
              const anchorPos = new THREE.Vector3()
                .copy(camera.position)
                .addScaledVector(forwardH, anchorDist)
              anchorPos.y = activeIdx === 0 ? camera.position.y - 0.40 : camera.position.y - 0.25

              activeNode.group.position.copy(anchorPos)
              activeNode.group.lookAt(camera.position.x, anchorPos.y, camera.position.z)
              activeNode.group.visible = true
            }
            t.anchoredStep = activeIdx
            t.anchoredMode = true
          }
        } else {
          // Realistic Multi-Location Mode: restore fixed room coordinates
          if (t.anchoredMode !== false) {
            t.stepNodes.forEach((node) => {
              if (node.initialPos) {
                node.group.position.set(...node.initialPos)
                node.group.quaternion.set(0, 0, 0, 1)
              }
            })
            t.anchoredMode = false
            t.anchoredStep = activeIdx
          }
        }

        // Spatial Direction & Distance Guidance (Calculated to the live world target!)
        if (activeNode) {
          const targetWorldPos = new THREE.Vector3()
          activeNode.group.getWorldPosition(targetWorldPos)

          const camWorldPos = new THREE.Vector3()
          camera.getWorldPosition(camWorldPos)

          const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
          camForward.y = 0
          camForward.normalize()

          const toTarget = new THREE.Vector3().subVectors(targetWorldPos, camWorldPos)
          toTarget.y = 0
          const dist = toTarget.length()
          toTarget.normalize()

          const dot = Math.min(Math.max(camForward.dot(toTarget), -1), 1)
          const angleRad = Math.acos(dot)
          const angleDeg = Math.round(THREE.MathUtils.radToDeg(angleRad))

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
              stationName: steps[activeIdx]?.label || '',
              stepIndex: activeIdx,
              isDemoMode: demoModeRef.current,
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
      fireAudioRef.current.stop()
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
  const demoModeRef = useRef(demoMode)
  demoModeRef.current = demoMode

  // ─── Update Visual State When Step Changes (No WebGL Teardown) ────────────────
  useEffect(() => {
    const t = threeRef.current
    if (!t.stepNodes || !t.stepNodes.length) return

    // Signal renderLoop to re-anchor active object to live camera orientation
    t.anchoredStep = -1

    t.stepNodes.forEach(node => {
      const isCompleted = completedSteps.includes(node.stepIndex)
      const isActive = node.stepIndex === currentStep

      if (isCompleted) {
        node.group.visible = false
      } else {
        // Spatial Multi-Location AR: in AR mode, ONLY render the active step's 3D object & beacon.
        // In 3D simulation mode, keep upcoming objects subtly visible for warehouse context.
        node.group.visible = arMode ? isActive : true
        node.beamMesh.visible = isActive
        node.ringMesh.visible = isActive
        node.badgeSprite.visible = isActive
        if (node.propGroup) node.propGroup.visible = true

        if (isActive) {
          node.orbMesh.material.emissiveIntensity = 1.0
          node.orbMesh.scale.setScalar(1.0)
          node.badgeSprite.scale.set(0.72, 0.14, 1)
        } else {
          node.orbMesh.material.emissiveIntensity = 0.05
          node.orbMesh.scale.setScalar(0.6)
        }
      }
    })

    // Hide giant warehouse environment meshes in AR mode (user's room is the environment!)
    if (t.warehousePropsGroup) {
      t.warehousePropsGroup.visible = !arMode
    }

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

    // Dynamic virtual hazard reactions & realistic fire extinction
    const isExtinguished = completedSteps.includes(3)
    t.flameExtinguished = isExtinguished
    if (t.fireVisual) {
      t.fireVisual.flameOuter.visible = !isExtinguished
      t.fireVisual.flameMid.visible = !isExtinguished
      t.fireVisual.flameCore.visible = !isExtinguished
      t.fireVisual.embers.forEach(e => { e.visible = !isExtinguished })
      t.fireVisual.smokeParticles.forEach(s => { s.visible = !isExtinguished })
      if (t.fireVisual.fireLight) t.fireVisual.fireLight.intensity = isExtinguished ? 0 : 4.5
      if (t.fireVisual.fireGlow) t.fireVisual.fireGlow.intensity = isExtinguished ? 0 : 2.0
    }
    if (t.flameMeshes) {
      t.flameMeshes.forEach(mesh => {
        mesh.visible = !isExtinguished
      })
      if (t.flameLight) {
        t.flameLight.intensity = isExtinguished ? 0 : 4.0
      }
    }

    // Ambient Fire Crackling Audio (Web Audio API)
    // Plays when Step 0 is active and fire is not extinguished
    if (isFireScenario && !isExtinguished && currentStep === 0) {
      fireAudioRef.current.start()
    } else {
      fireAudioRef.current.stop()
    }
  }, [currentStep, completedSteps, arMode, isFireScenario, demoMode])

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
            demoMode={demoMode}
            onToggleDemoMode={() => setDemoMode(prev => !prev)}
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
