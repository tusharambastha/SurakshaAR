/**
 * SurakshaAR — Robust Computer Vision Fire & Flame Detection Engine
 *
 * Exclusively detects active luminous combustion flames (match, candle, lighter).
 * Rejects: human skin/faces, yellow/orange clothing, warm walls, lamps, and screens.
 *
 * 5-Stage Verification Pipeline:
 * 1. Optical Combustion Pixel Filter (Incandescent blowout core or orange flame body)
 * 2. Spatial Scale & Geometry (Candle/lighter scale <= 22% width, <= 28% height, compact cluster)
 * 3. Temporal Flicker Analysis (True combustion turbulence: frame-to-frame delta >= 16 on >= 20% pixels)
 * 4. Temporal State Machine ('none' -> 'verifying' -> 'confirmed' with quick decay on absence)
 * 5. Dynamic Evidence-Based Confidence (78% - 98%, only reported on 'confirmed')
 */

const SAMPLE_WIDTH = 160
const SAMPLE_HEIGHT = 120

// Pixel thresholds
const FLAME_R_MIN          = 240
const INCANDESCENT_G_MIN   = 225
const INCANDESCENT_B_MIN   = 160
const INCANDESCENT_SUM_MIN = 645

const ORANGE_G_MIN  = 50
const ORANGE_G_MAX  = 160  // Yellow clothing has G > 175 -> rejected
const ORANGE_B_MAX  = 48   // Skin has B > 80, fabric B > 60 -> rejected
const ORANGE_RG_MIN = 80   // Red dominance over green
const ORANGE_RB_MIN = 165  // Skin has (R-B) < 100 -> rejected

// Spatial constraints (Candle / lighter scale)
const MIN_FLAME_PIXELS    = 8
const MAX_BOX_W_RATIO     = 0.22  // Flame width <= 22% of frame
const MAX_BOX_H_RATIO     = 0.28  // Flame height <= 28% of frame
const MAX_FRAME_RATIO     = 0.05  // Flame pixels <= 5% of total frame (rejects large shirts)
const MIN_CLUSTER_DENSITY = 0.22  // Flame pixels / bounding box area

// Temporal flicker
const FLICKER_LUMA_DELTA = 16
const MIN_FLICKER_RATIO  = 0.18

// Confirmation frames (~15-20 FPS)
const VERIFYING_FRAMES = 4   // ~200ms of consistent candidate
const CONFIRMED_FRAMES = 12  // ~600ms of sustained temporal & optical evidence
const DECAY_RATE       = 3   // Fast clearance when flame leaves frame (~100ms)

/**
 * Pixel-level optical evaluation.
 * Returns true ONLY if pixel exhibits active flame radiation characteristics.
 */
export function isFlamePixel(r, g, b) {
  if (r < FLAME_R_MIN) return false
  const sum = r + g + b

  // Signature A: Direct incandescent blowout core (saturates all 3 channels)
  const isBlowout = (g >= INCANDESCENT_G_MIN && b >= INCANDESCENT_B_MIN && sum >= INCANDESCENT_SUM_MIN)

  // Signature B: Saturated combustion flame body
  const isOrangeFlame = (
    g >= ORANGE_G_MIN &&
    g <= ORANGE_G_MAX &&
    b <= ORANGE_B_MAX &&
    (r - g) >= ORANGE_RG_MIN &&
    (r - b) >= ORANGE_RB_MIN
  )

  return isBlowout || isOrangeFlame
}

/**
 * Stateful FireDetector with frame-differencing flicker analysis.
 */
export class FireDetector {
  constructor(options = {}) {
    this.sampleWidth  = options.sampleWidth  || SAMPLE_WIDTH
    this.sampleHeight = options.sampleHeight || SAMPLE_HEIGHT

    this.canvas = document.createElement('canvas')
    this.canvas.width  = this.sampleWidth
    this.canvas.height = this.sampleHeight
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    const totalPx = this.sampleWidth * this.sampleHeight
    this.prevLuma = new Float32Array(totalPx)
    this.hasPrev  = false

    this.counter        = 0
    this.state          = 'none' // 'none' | 'verifying' | 'confirmed'
    this.lastBbox       = null
    this.lastConfidence = 0
    this.simulated      = false
  }

  /** Trigger simulated detection for presentation/testing */
  triggerSimulation(enabled = true) {
    this.simulated = enabled
    if (enabled) {
      this.counter = CONFIRMED_FRAMES
      this.state   = 'confirmed'
      this.lastBbox = { x: 0.38, y: 0.28, width: 0.24, height: 0.30 }
      this.lastConfidence = 0.94
    }
  }

  /** Reset all internal state */
  reset() {
    this.counter        = 0
    this.state          = 'none'
    this.hasPrev         = false
    this.lastBbox       = null
    this.lastConfidence = 0
    this.simulated      = false
    this.prevLuma.fill(0)
  }

  /**
   * Process a single video frame from live camera.
   * @param {HTMLVideoElement} videoElement
   * @returns {{ isFire: boolean, state: 'none'|'verifying'|'confirmed', confidence: number, bbox: object|null, pixelCount: number, flickerRatio: number }}
   */
  detect(videoElement) {
    if (this.simulated) {
      return {
        isFire:       true,
        state:        'confirmed',
        confidence:   this.lastConfidence,
        bbox:         this.lastBbox,
        pixelCount:   35,
        flickerRatio: 0.65,
      }
    }

    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return {
        isFire:       false,
        state:        'none',
        confidence:   0,
        bbox:         null,
        pixelCount:   0,
        flickerRatio: 0,
      }
    }

    const { sampleWidth, sampleHeight, ctx } = this
    ctx.drawImage(videoElement, 0, 0, sampleWidth, sampleHeight)
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
    const data    = imgData.data
    const total   = sampleWidth * sampleHeight

    let flameCount   = 0
    let flickerCount = 0
    let minX = sampleWidth,  maxX = 0
    let minY = sampleHeight, maxY = 0
    let sumX = 0, sumY = 0

    // Stage 1: Optical pixel classification & luminance calculation
    for (let i = 0; i < total; i++) {
      const idx  = i * 4
      const r    = data[idx]
      const g    = data[idx + 1]
      const b    = data[idx + 2]
      const luma = 0.299 * r + 0.587 * g + 0.114 * b

      if (isFlamePixel(r, g, b)) {
        const x = i % sampleWidth
        const y = Math.floor(i / sampleWidth)
        flameCount++
        sumX += x
        sumY += y
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        // Stage 3: Temporal flicker check against previous frame
        if (this.hasPrev) {
          const delta = Math.abs(luma - this.prevLuma[i])
          if (delta >= FLICKER_LUMA_DELTA) {
            flickerCount++
          }
        }
      }

      this.prevLuma[i] = luma
    }

    this.hasPrev = true

    // If fewer than minimum pixels found -> decay counter
    if (flameCount < MIN_FLAME_PIXELS) {
      return this._decay()
    }

    // Stage 2: Spatial scale and compactness constraints
    const boxW      = maxX - minX + 1
    const boxH      = maxY - minY + 1
    const boxArea   = boxW * boxH
    const density   = boxArea > 0 ? flameCount / boxArea : 0
    const wRatio    = boxW / sampleWidth
    const hRatio    = boxH / sampleHeight
    const frameRatio = flameCount / total

    // Reject if too large (shirt, wall) or too scattered (ambient noise)
    if (
      wRatio > MAX_BOX_W_RATIO ||
      hRatio > MAX_BOX_H_RATIO ||
      frameRatio > MAX_FRAME_RATIO ||
      density < MIN_CLUSTER_DENSITY
    ) {
      return this._decay()
    }

    // Stage 3: Temporal flicker validation
    const flickerRatio = flameCount > 0 ? flickerCount / flameCount : 0

    // Require dynamic flicker once verifying threshold reached
    if (this.counter >= VERIFYING_FRAMES && flickerRatio < MIN_FLICKER_RATIO) {
      return this._decay()
    }

    // Stage 4: Increment consecutive detections
    this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 10)

    if (this.counter >= CONFIRMED_FRAMES) {
      this.state = 'confirmed'
    } else if (this.counter >= VERIFYING_FRAMES) {
      this.state = 'verifying'
    } else {
      this.state = 'none'
    }

    // Bounding box padding & normalization
    const pad = 5
    this.lastBbox = {
      x:      Math.max(0, minX - pad) / sampleWidth,
      y:      Math.max(0, minY - pad) / sampleHeight,
      width:  Math.min(sampleWidth, boxW + pad * 2) / sampleWidth,
      height: Math.min(sampleHeight, boxH + pad * 2) / sampleHeight,
    }

    // Stage 5: Calculated confidence (only shown on 'confirmed')
    let confidence = 0
    if (this.state === 'confirmed') {
      const densityBonus     = Math.min(0.10, (density - MIN_CLUSTER_DENSITY) * 0.4)
      const flickerBonus     = Math.min(0.10, (flickerRatio - MIN_FLICKER_RATIO) * 0.35)
      const persistenceBonus = Math.min(0.08, (this.counter - CONFIRMED_FRAMES) * 0.008)
      confidence = Math.min(0.98, Math.max(0.78, 0.78 + densityBonus + flickerBonus + persistenceBonus))
      this.lastConfidence = Math.round(confidence * 100) / 100
    }

    return {
      isFire:       this.state === 'confirmed',
      state:        this.state,
      confidence:   this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:         this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount:   flameCount,
      flickerRatio,
    }
  }

  _decay() {
    this.counter = Math.max(0, this.counter - DECAY_RATE)

    if (this.counter >= CONFIRMED_FRAMES) {
      this.state = 'confirmed'
    } else if (this.counter >= VERIFYING_FRAMES) {
      this.state = 'verifying'
      this.lastBbox = null
    } else {
      this.state = 'none'
      this.lastBbox = null
    }

    return {
      isFire:       this.state === 'confirmed',
      state:        this.state,
      confidence:   this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:         this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount:   0,
      flickerRatio: 0,
    }
  }
}
