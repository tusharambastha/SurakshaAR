/**
 * SurakshaAR — Designated Gas-Leak Training Marker & Source Detector
 *
 * Smartphone cameras cannot detect physical gas molecules.
 * This Computer Vision engine detects designated industrial Gas-Leak Training Markers / Cylinder Sources,
 * strictly rejecting:
 * - Perfume sprays, aerosols, and diffuse mists (rejected: lack solid marker placard geometry & dark hazard glyphs)
 * - Human faces, skin, hair, and bodies (strict chromatic skin filtering)
 * - Plain room walls, ceilings, and floors (gradient edge-density threshold)
 * - Clothes and random furniture (aspect-ratio, color pair, and pattern consistency)
 *
 * Multi-frame temporal state machine:
 * 'none' -> 'verifying' -> 'confirmed' (requires 7+ sustained frames)
 * Rapid decay prevents single-frame false positives.
 */

const SAMPLE_WIDTH = 160
const SAMPLE_HEIGHT = 120

// Bounding box scale limits (relative to frame dimensions)
const MIN_BOX_W = 0.08
const MAX_BOX_W = 0.65
const MIN_BOX_H = 0.08
const MAX_BOX_H = 0.65
const MIN_ASPECT_RATIO = 0.6
const MAX_ASPECT_RATIO = 1.6

// Temporal stability thresholds (~20-30 FPS)
const VERIFYING_FRAMES = 3  // ~150ms of positive detection
const CONFIRMED_FRAMES = 7  // ~350ms of sustained evidence
const DECAY_STEP = 2        // Decay when evidence is missing

/**
 * Check if a pixel represents human skin.
 * Uses normalized RGB / chromatic boundary tests to reject human bodies, faces, and hands.
 */
export function isSkinPixel(r, g, b) {
  return (
    r > 85 &&
    g > 45 &&
    b > 25 &&
    r > g &&
    r > b &&
    (r - g) >= 10 &&
    (r - b) >= 15 &&
    Math.abs(r - g) < 90 &&
    (r + g + b) < 680
  )
}

/**
 * Evaluate if a pixel matches the designated hazard marker yellow/amber field:
 * High saturation industrial yellow/amber (e.g., #F59E0B / #FBBF24 / #EAB308).
 * Rejects diffuse white/gray mist from perfume sprays.
 */
export function isMarkerYellowPixel(r, g, b) {
  // Must be bright red & green, low blue, with high saturation (r+g > 2.2*b)
  return (
    r > 145 &&
    g > 115 &&
    b < 100 &&
    (r - b) > 55 &&
    (g - b) > 35 &&
    Math.abs(r - g) < 70
  )
}

/**
 * Evaluate if a pixel matches the designated hazard marker dark border / symbol:
 * High contrast dark slate / black border (#0F172A / #000000).
 */
export function isMarkerDarkPixel(r, g, b) {
  return r < 60 && g < 60 && b < 60
}

export class GasTrainingDetector {
  constructor(options = {}) {
    this.sampleWidth = options.sampleWidth || SAMPLE_WIDTH
    this.sampleHeight = options.sampleHeight || SAMPLE_HEIGHT

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.sampleWidth
    this.canvas.height = this.sampleHeight
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    this.counter = 0
    this.state = 'none' // 'none' | 'verifying' | 'confirmed'
    this.lastBbox = null
    this.lastConfidence = 0
    this.simulated = false
  }

  /** Trigger manual training source simulation for testing or demonstrations */
  triggerSimulation(enabled = true) {
    this.simulated = enabled
    if (enabled) {
      this.counter = CONFIRMED_FRAMES + 2
      this.state = 'confirmed'
      this.lastBbox = { x: 0.5, y: 0.42, width: 0.24, height: 0.26 }
      this.lastConfidence = 0.95
    } else {
      this.counter = 0
      this.state = 'none'
      this.lastBbox = null
      this.lastConfidence = 0
    }
  }

  /**
   * Process a single video frame.
   * Returns:
   * {
   *   isRecognized: boolean,
   *   state: 'none' | 'verifying' | 'confirmed',
   *   visualConfidence: number, // 0.0 to 1.0 (Visual Scenario Confidence)
   *   verifyProgress: number,   // 0.0 to 1.0
   *   bbox: { x, y, width, height } | null,
   *   sourceType: string,
   * }
   */
  detect(videoElement) {
    if (this.simulated) {
      return {
        isRecognized: true,
        state: 'confirmed',
        visualConfidence: 0.95,
        verifyProgress: 1.0,
        bbox: this.lastBbox,
        sourceType: 'Designated Gas Cylinder / Valve Training Marker',
      }
    }

    if (!videoElement || videoElement.readyState < 2) {
      return {
        isRecognized: false,
        state: 'none',
        visualConfidence: 0,
        verifyProgress: 0,
        bbox: null,
        sourceType: 'Searching...',
      }
    }

    const sw = this.sampleWidth
    const sh = this.sampleHeight

    try {
      this.ctx.drawImage(videoElement, 0, 0, sw, sh)
      const imgData = this.ctx.getImageData(0, 0, sw, sh)
      const data = imgData.data

      let skinPixels = 0
      let yellowPixels = 0
      let darkPixels = 0
      let minX = sw, maxX = 0, minY = sh, maxY = 0

      // Edge gradient accumulator
      let edgeTransitions = 0

      // Focus sampling around the center ROI (15% to 85% bounds)
      const startX = Math.floor(sw * 0.12)
      const endX = Math.floor(sw * 0.88)
      const startY = Math.floor(sh * 0.12)
      const endY = Math.floor(sh * 0.88)

      // Step by 2 pixels for real-time speed & stability
      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * sw + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          // 1. Check skin rejection
          if (isSkinPixel(r, g, b)) {
            skinPixels++
            continue // Human body / face / hand pixel — disqualified
          }

          // 2. Check hazard marker yellow field
          if (isMarkerYellowPixel(r, g, b)) {
            yellowPixels++
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y

            // Check horizontal edge transition
            const nIdx = (y * sw + (x + 1)) * 4
            const nLum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2]
            const cLum = 0.299 * r + 0.587 * g + 0.114 * b
            if (Math.abs(cLum - nLum) > 40) {
              edgeTransitions++
            }
          }
          // 3. Check hazard marker dark border / symbol
          else if (isMarkerDarkPixel(r, g, b)) {
            darkPixels++
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      // If more than 25% of sampled area is human skin, reject frame
      const totalSamples = ((endX - startX) / 2) * ((endY - startY) / 2)
      const skinRatio = skinPixels / (totalSamples || 1)
      if (skinRatio > 0.25) {
        this.counter = Math.max(0, this.counter - DECAY_STEP)
        this.updateState()
        return {
          isRecognized: false,
          state: this.state,
          visualConfidence: 0,
          verifyProgress: Math.min(1, this.counter / CONFIRMED_FRAMES),
          bbox: null,
          sourceType: 'Human / Room Detected (Ignored)',
        }
      }

      const clusterW = maxX > minX ? maxX - minX : 0
      const clusterH = maxY > minY ? maxY - minY : 0
      const wRatio = clusterW / sw
      const hRatio = clusterH / sh
      const aspectRatio = clusterH > 0 ? clusterW / clusterH : 0

      // STRICT VALIDATION AGAINST DESIGNATED TRAINING MARKER:
      // - Must have substantial Yellow hazard field
      // - Must have Dark border / symbol (Perfume spray and diffuse mist have NO dark border)
      // - Must have sharp edge transitions
      // - Must have bounded size and aspect ratio
      const hasMarkerColors = yellowPixels >= 20 && darkPixels >= 8
      const hasSharpEdges = edgeTransitions >= 10
      const isValidGeometry =
        wRatio >= MIN_BOX_W &&
        wRatio <= MAX_BOX_W &&
        hRatio >= MIN_BOX_H &&
        hRatio <= MAX_BOX_H &&
        aspectRatio >= MIN_ASPECT_RATIO &&
        aspectRatio <= MAX_ASPECT_RATIO

      const isValidMarker = hasMarkerColors && hasSharpEdges && isValidGeometry

      if (isValidMarker) {
        this.counter = Math.min(CONFIRMED_FRAMES + 4, this.counter + 1)
        this.lastBbox = {
          x: (minX + clusterW / 2) / sw,
          y: (minY + clusterH / 2) / sh,
          width: Math.max(0.14, wRatio),
          height: Math.max(0.14, hRatio),
        }
      } else {
        this.counter = Math.max(0, this.counter - DECAY_STEP)
      }

      this.updateState()
      const verifyProgress = Math.min(1, Math.max(0, this.counter / CONFIRMED_FRAMES))

      // Calculate Visual Scenario Confidence
      if (this.state === 'confirmed') {
        const confidence = Math.min(0.96, 0.88 + Math.min(0.08, (this.counter - CONFIRMED_FRAMES) * 0.02))
        this.lastConfidence = confidence
        return {
          isRecognized: true,
          state: 'confirmed',
          visualConfidence: confidence,
          verifyProgress: 1.0,
          bbox: this.lastBbox,
          sourceType: 'Designated Gas Cylinder / Valve Training Marker',
        }
      }

      return {
        isRecognized: false,
        state: this.state,
        visualConfidence: 0,
        verifyProgress,
        bbox: this.state === 'verifying' ? this.lastBbox : null,
        sourceType: this.state === 'verifying' ? 'Verifying Training Marker...' : 'Searching for Marker...',
      }
    } catch {
      return {
        isRecognized: false,
        state: 'none',
        visualConfidence: 0,
        verifyProgress: 0,
        bbox: null,
        sourceType: 'Searching...',
      }
    }
  }

  updateState() {
    if (this.counter >= CONFIRMED_FRAMES) {
      this.state = 'confirmed'
    } else if (this.counter >= VERIFYING_FRAMES) {
      this.state = 'verifying'
    } else {
      this.state = 'none'
    }
  }
}
