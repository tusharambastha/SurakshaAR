/**
 * SurakshaAR — Smoke & Mist Plume Visual Detection Engine
 * (Gas Leak & Confined Space Hazard Simulation)
 *
 * Exclusively detects visible airborne smoke, mist, and vapor plumes (e.g. incense stick / agarbatti,
 * smoke generator, vapor, extinguishing mist).
 *
 * Multi-Tier Defense Pipeline:
 * 1. Optical Chrominance Filter:
 *    - Rejects human skin, faces, and hands (strict chromatic skin boundary test)
 *    - Rejects saturated colored clothes and furniture (chrominance delta > 46)
 *    - Passes diffuse, semi-transparent grey-white smoke/mist (60 <= Luma <= 248)
 * 2. Background Model & Inter-Frame Dynamics:
 *    - Dual-motion analysis: Exponential Moving Average (EMA) background model + inter-frame delta
 *    - Rejects static background walls, hanging clothes, and furniture (zero motion, bgDelta < 3)
 *    - Rejects camera pans / lighting switches (global shift threshold)
 * 3. Connected-Component Spatial Clustering (BFS):
 *    - Aggregates plume pixels into contiguous clusters (min 8px, density >= 0.10)
 * 4. Temporal Persistence State Machine:
 *    - 'none' -> 'verifying' (2 frames) -> 'confirmed' (5 frames)
 *    - Rapid, gentle clearance when smoke dissipates
 *
 * IMPORTANT: This is visual smoke detection for simulated safety training.
 * It does not measure chemical gas molecules, methane, or ppm.
 */

const SAMPLE_WIDTH  = 160
const SAMPLE_HEIGHT = 120

// Spatial plume constraints (tuned for delicate incense smoke & larger plumes)
const MIN_PLUME_PIXELS  = 8     // Detects delicate incense curls / agarbatti smoke
const MAX_PLUME_PIXELS  = 3000  // Upper limit to reject full camera occlusions
const MAX_BOX_W_RATIO   = 0.75  // Max width 75% of frame
const MAX_BOX_H_RATIO   = 0.80  // Max height 80% of frame
const MIN_PLUME_DENSITY = 0.10  // Minimum cluster density

// Temporal motion thresholds
const MIN_MOTION_DELTA  = 3     // Min luminance shift for moving smoke particles
const MAX_MOTION_DELTA  = 65    // Max luminance shift (rejects harsh specular glare)

// State machine temporal thresholds (~20 FPS)
const VERIFYING_FRAMES  = 2     // ~100ms of positive evidence
const CONFIRMED_FRAMES  = 5     // ~250ms of sustained smoke dynamics
const DECAY_RATE        = 1     // Smooth decay

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
 * Optical evaluation for semi-transparent grey-white smoke / mist plume.
 * Allows neutral/diffuse tones with indoor lighting warmth, rejecting saturated colors.
 */
export function isSmokeOpticsPixel(r, g, b) {
  if (isSkinPixel(r, g, b)) return false

  const maxC = Math.max(r, g, b)
  const minC = Math.min(r, g, b)
  const chromaDiff = maxC - minC
  const luma = 0.299 * r + 0.587 * g + 0.114 * b

  // Low/moderate saturation (diffuse smoke/vapor/mist) and visible luminance
  return chromaDiff <= 46 && luma >= 60 && luma <= 248
}

export class SmokePlumeDetector {
  constructor(options = {}) {
    this.sampleWidth  = options.sampleWidth  || SAMPLE_WIDTH
    this.sampleHeight = options.sampleHeight || SAMPLE_HEIGHT

    this.canvas = document.createElement('canvas')
    this.canvas.width  = this.sampleWidth
    this.canvas.height = this.sampleHeight
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    const totalPx = this.sampleWidth * this.sampleHeight
    this.bgLuma   = new Float32Array(totalPx)
    this.prevLuma = new Float32Array(totalPx)
    this.frameCount = 0

    this.counter        = 0
    this.state          = 'none' // 'none' | 'verifying' | 'confirmed'
    this.lastBbox       = null
    this.lastConfidence = 0
    this.simulated      = false
  }

  /** Trigger simulated smoke / mist trigger for judge demonstrations */
  triggerSimulation(enabled = true) {
    this.simulated = enabled
    if (enabled) {
      this.counter        = CONFIRMED_FRAMES + 2
      this.state          = 'confirmed'
      this.lastBbox       = { x: 0.38, y: 0.30, width: 0.32, height: 0.38 }
      this.lastConfidence = 0.94
    } else {
      this.reset()
    }
  }

  reset() {
    this.counter        = 0
    this.state          = 'none'
    this.lastBbox       = null
    this.lastConfidence = 0
    this.simulated      = false
    this.frameCount     = 0
    this.bgLuma.fill(0)
    this.prevLuma.fill(0)
  }

  /**
   * Process a single video frame.
   * Returns:
   * {
   *   isGasHazard: boolean,
   *   isSmoke: boolean,
   *   state: 'none' | 'verifying' | 'confirmed',
   *   visualConfidence: number, // 0 when none/verifying; 0.85-0.96 when confirmed
   *   bbox: { x, y, width, height } | null,
   *   pixelCount: number,
   * }
   */
  detect(videoElement) {
    if (this.simulated) {
      return {
        isGasHazard:      true,
        isSmoke:          true,
        state:            'confirmed',
        visualConfidence: this.lastConfidence,
        bbox:             this.lastBbox,
        pixelCount:       75,
      }
    }

    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return {
        isGasHazard:      false,
        isSmoke:          false,
        state:            'none',
        visualConfidence: 0,
        bbox:             null,
        pixelCount:       0,
      }
    }

    const sw = this.sampleWidth
    const sh = this.sampleHeight

    try {
      this.ctx.drawImage(videoElement, 0, 0, sw, sh)
      const imgData = this.ctx.getImageData(0, 0, sw, sh)
      const data    = imgData.data

      const grid    = new Uint8Array(sw * sh)
      const curLuma = new Float32Array(sw * sh)

      let totalSmokePixels = 0
      let totalGlobalShift = 0
      const isWarmup = this.frameCount < 3

      for (let y = 0; y < sh; y++) {
        const rowOffset = y * sw
        for (let x = 0; x < sw; x++) {
          const pIdx = rowOffset + x
          const idx  = pIdx * 4
          const r    = data[idx]
          const g    = data[idx + 1]
          const b    = data[idx + 2]

          const luma = 0.299 * r + 0.587 * g + 0.114 * b
          curLuma[pIdx] = luma

          // Initialize background model during warmup
          if (isWarmup) {
            this.bgLuma[pIdx] = luma
            this.prevLuma[pIdx] = luma
            continue
          }

          // Optical smoke filter
          if (isSmokeOpticsPixel(r, g, b)) {
            const bgDelta   = Math.abs(luma - this.bgLuma[pIdx])
            const prevDelta = Math.abs(luma - this.prevLuma[pIdx])

            if (bgDelta > 50) totalGlobalShift++

            // Dynamic motion: must differ from background or previous frame
            // Rejects static walls, clothes, sheets, and furniture where delta ~ 0
            const hasDynamicMotion = (bgDelta >= MIN_MOTION_DELTA || prevDelta >= MIN_MOTION_DELTA) && bgDelta <= MAX_MOTION_DELTA

            if (hasDynamicMotion) {
              grid[pIdx] = 1
              totalSmokePixels++
            } else {
              // Slowly adapt background for static regions
              this.bgLuma[pIdx] = this.bgLuma[pIdx] * 0.94 + luma * 0.06
            }
          } else {
            // Non-smoke pixel: adapt background
            this.bgLuma[pIdx] = this.bgLuma[pIdx] * 0.92 + luma * 0.08
          }
        }
      }

      this.frameCount++

      // Reject sudden camera jerk or light switch (more than 45% of frame has massive shift)
      const totalPixels = sw * sh
      if (!isWarmup && (totalGlobalShift / totalPixels) > 0.45) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // Fast reject if fewer than minimum smoke pixels
      if (totalSmokePixels < MIN_PLUME_PIXELS) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // BFS Connected-Component Clustering to locate cohesive smoke plume
      const visited = new Uint8Array(sw * sh)
      let bestCluster = null
      let bestClusterSize = 0

      for (let y = 0; y < sh; y++) {
        const rowOffset = y * sw
        for (let x = 0; x < sw; x++) {
          const pIdx = rowOffset + x
          if (grid[pIdx] === 1 && visited[pIdx] === 0) {
            let clusterSize = 0
            let cMinX = x, cMaxX = x
            let cMinY = y, cMaxY = y

            const queue = [x, y]
            visited[pIdx] = 1

            let head = 0
            while (head < queue.length) {
              const cx = queue[head++]
              const cy = queue[head++]
              clusterSize++

              if (cx < cMinX) cMinX = cx
              if (cx > cMaxX) cMaxX = cx
              if (cy < cMinY) cMinY = cy
              if (cy > cMaxY) cMaxY = cy

              const neighbors = [
                cx - 1, cy,
                cx + 1, cy,
                cx, cy - 1,
                cx, cy + 1,
              ]
              for (let i = 0; i < neighbors.length; i += 2) {
                const nx = neighbors[i]
                const ny = neighbors[i + 1]
                if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                  const nIdx = ny * sw + nx
                  if (grid[nIdx] === 1 && visited[nIdx] === 0) {
                    visited[nIdx] = 1
                    queue.push(nx, ny)
                  }
                }
              }
            }

            // Cluster geometric evaluation
            const bw = cMaxX - cMinX + 1
            const bh = cMaxY - cMinY + 1
            const wRatio = bw / sw
            const hRatio = bh / sh
            const density = clusterSize / (bw * bh)

            if (
              clusterSize >= MIN_PLUME_PIXELS &&
              clusterSize <= MAX_PLUME_PIXELS &&
              wRatio <= MAX_BOX_W_RATIO &&
              hRatio <= MAX_BOX_H_RATIO &&
              density >= MIN_PLUME_DENSITY
            ) {
              if (clusterSize > bestClusterSize) {
                bestClusterSize = clusterSize
                bestCluster = {
                  minX: cMinX, maxX: cMaxX, minY: cMinY, maxY: cMaxY,
                  size: clusterSize, density,
                }
              }
            }
          }
        }
      }

      this._updateLuma(curLuma)

      if (!bestCluster) {
        return this._decay()
      }

      // Increment consecutive sustained smoke frames
      this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 8)

      if (this.counter >= CONFIRMED_FRAMES) {
        this.state = 'confirmed'
      } else if (this.counter >= VERIFYING_FRAMES) {
        this.state = 'verifying'
      } else {
        this.state = 'none'
      }

      // Calculate tight bounding box with padding
      const pad = 10
      const boxW = (bestCluster.maxX - bestCluster.minX + 1) + pad * 2
      const boxH = (bestCluster.maxY - bestCluster.minY + 1) + pad * 2

      this.lastBbox = {
        x:      Math.max(0, bestCluster.minX - pad) / sw,
        y:      Math.max(0, bestCluster.minY - pad) / sh,
        width:  Math.min(sw, boxW) / sw,
        height: Math.min(sh, boxH) / sh,
      }

      // Calculate evidence-based visual detection confidence
      let confidence = 0
      if (this.state === 'confirmed') {
        const sizeBonus    = Math.min(0.08, bestCluster.size * 0.003)
        const densityBonus = Math.min(0.05, (bestCluster.density - MIN_PLUME_DENSITY) * 0.15)
        const persistBonus = Math.min(0.05, (this.counter - CONFIRMED_FRAMES) * 0.015)
        confidence = Math.min(0.96, Math.max(0.82, 0.82 + sizeBonus + densityBonus + persistBonus))
        this.lastConfidence = Math.round(confidence * 100) / 100
      }

      return {
        isGasHazard:      this.state === 'confirmed',
        isSmoke:          this.state === 'confirmed',
        state:            this.state,
        visualConfidence: this.state === 'confirmed' ? this.lastConfidence : 0,
        bbox:             this.state === 'confirmed' ? this.lastBbox : null,
        pixelCount:       bestCluster.size,
      }
    } catch {
      return {
        isGasHazard:      false,
        isSmoke:          false,
        state:            'none',
        visualConfidence: 0,
        bbox:             null,
        pixelCount:       0,
      }
    }
  }

  _updateLuma(curLuma) {
    this.prevLuma.set(curLuma)
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
      isGasHazard:      this.state === 'confirmed',
      isSmoke:          this.state === 'confirmed',
      state:            this.state,
      visualConfidence: this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:             this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount:       0,
    }
  }
}

// Export as both SmokePlumeDetector and GasTrainingDetector for backward compatibility
export const GasTrainingDetector = SmokePlumeDetector
