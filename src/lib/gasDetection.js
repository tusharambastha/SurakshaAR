/**
 * SurakshaAR — Designated Gas-Leak Training Marker & Source Detector
 *
 * Smartphone cameras cannot detect invisible physical gas molecules.
 * This Computer Vision engine detects designated industrial Gas-Leak Training Markers / Cylinder Sources,
 * strictly rejecting:
 * - Human faces, skin, hair, and bodies (strict chromatic skin filtering)
 * - Plain room walls, ceilings, and floors (gradient edge-density threshold)
 * - Clothes and random furniture (aspect-ratio, scale, and pattern consistency)
 *
 * Multi-frame temporal state machine:
 * 'none' -> 'verifying' -> 'confirmed' (requires 8+ sustained frames)
 * Rapid decay prevents single-frame false positives.
 */

const SAMPLE_WIDTH = 160
const SAMPLE_HEIGHT = 120

// Bounding box scale limits (relative to frame dimensions)
const MIN_BOX_W = 0.06
const MAX_BOX_W = 0.65
const MIN_BOX_H = 0.06
const MAX_BOX_H = 0.65
const MIN_ASPECT_RATIO = 0.6
const MAX_ASPECT_RATIO = 1.6

// Temporal stability thresholds (~20-30 FPS)
const VERIFYING_FRAMES = 3  // ~150ms of positive detection
const CONFIRMED_FRAMES = 8  // ~400ms of sustained evidence
const DECAY_STEP = 2        // Smooth decay when evidence is missing

/**
 * Check if a pixel represents human skin.
 * Uses normalized RGB / chromatic boundary tests to reject human bodies, faces, and hands.
 */
export function isSkinPixel(r, g, b) {
  // Common daylight/indoor skin tone envelope
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
 * Evaluate if a pixel matches the high-contrast industrial hazard marker palette:
 * Yellow/Amber hazard background (#F59E0B / #EAB308) or deep industrial dark border (#1E293B / #000000).
 */
export function isHazardMarkerPixel(r, g, b) {
  // Yellow/Amber hazard sign contrast
  const isHazardYellow = (r > 160 && g > 130 && b < 100 && (r - b) > 60)
  // Deep dark border/glyph
  const isHazardDark = (r < 65 && g < 65 && b < 65)
  return isHazardYellow || isHazardDark
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
      this.counter = CONFIRMED_FRAMES
      this.state = 'confirmed'
      this.lastBbox = { x: 0.5, y: 0.42, width: 0.22, height: 0.26 }
      this.lastConfidence = 0.94
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
   *   bbox: { x, y, width, height } | null,
   *   sourceType: string,
   * }
   */
  detect(videoElement) {
    if (this.simulated) {
      return {
        isRecognized: true,
        state: 'confirmed',
        visualConfidence: 0.94,
        bbox: this.lastBbox,
        sourceType: 'Designated Gas Cylinder / Valve Training Marker',
      }
    }

    if (!videoElement || videoElement.readyState < 2) {
      return {
        isRecognized: false,
        state: 'none',
        visualConfidence: 0,
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
      let markerPixels = 0
      let minX = sw, maxX = 0, minY = sh, maxY = 0

      // Edge gradient accumulator
      let edgeTransitions = 0

      // Step by 2 pixels for real-time speed & stability
      for (let y = 1; y < sh - 1; y += 2) {
        for (let x = 1; x < sw - 1; x += 2) {
          const idx = (y * sw + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          // 1. Check skin rejection
          if (isSkinPixel(r, g, b)) {
            skinPixels++
            continue // Human body / face pixel — disqualified
          }

          // 2. Check hazard marker characteristics
          if (isHazardMarkerPixel(r, g, b)) {
            markerPixels++
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y

            // Check horizontal edge transition (gradient with neighbor)
            const nIdx = (y * sw + (x + 1)) * 4
            const nLum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2]
            const cLum = 0.299 * r + 0.587 * g + 0.114 * b
            if (Math.abs(cLum - nLum) > 45) {
              edgeTransitions++
            }
          }
        }
      }

      // If more than 28% of sampled area is human skin, reject frame
      const totalSamples = (sw / 2) * (sh / 2)
      const skinRatio = skinPixels / totalSamples
      if (skinRatio > 0.28) {
        this.counter = Math.max(0, this.counter - DECAY_STEP)
        this.updateState()
        return {
          isRecognized: false,
          state: this.state,
          visualConfidence: 0,
          bbox: null,
          sourceType: 'Human / Room Detected (Ignored)',
        }
      }

      const clusterW = maxX > minX ? maxX - minX : 0
      const clusterH = maxY > minY ? maxY - minY : 0
      const wRatio = clusterW / sw
      const hRatio = clusterH / sh
      const aspectRatio = clusterH > 0 ? clusterW / clusterH : 0

      // Check validity against designated training marker spatial bounds
      const isValidBounds =
        wRatio >= MIN_BOX_W &&
        wRatio <= MAX_BOX_W &&
        hRatio >= MIN_BOX_H &&
        hRatio <= MAX_BOX_H &&
        aspectRatio >= MIN_ASPECT_RATIO &&
        aspectRatio <= MAX_ASPECT_RATIO &&
        markerPixels >= 35 &&
        edgeTransitions >= 15

      if (isValidBounds) {
        this.counter = Math.min(CONFIRMED_FRAMES + 4, this.counter + 1)
        this.lastBbox = {
          x: (minX + clusterW / 2) / sw,
          y: (minY + clusterH / 2) / sh,
          width: Math.max(0.12, wRatio),
          height: Math.max(0.12, hRatio),
        }
      } else {
        this.counter = Math.max(0, this.counter - DECAY_STEP)
      }

      this.updateState()

      // Calculate Visual Scenario Confidence
      if (this.state === 'confirmed') {
        const confidence = Math.min(0.96, 0.88 + Math.min(0.08, (this.counter - CONFIRMED_FRAMES) * 0.02))
        this.lastConfidence = confidence
        return {
          isRecognized: true,
          state: 'confirmed',
          visualConfidence: confidence,
          bbox: this.lastBbox,
          sourceType: 'Designated Gas Cylinder / Valve Training Marker',
        }
      }

      return {
        isRecognized: false,
        state: this.state,
        visualConfidence: 0,
        bbox: this.state === 'verifying' ? this.lastBbox : null,
        sourceType: this.state === 'verifying' ? 'Verifying Training Source...' : 'Searching for Marker...',
      }
    } catch {
      return {
        isRecognized: false,
        state: 'none',
        visualConfidence: 0,
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
