/**
 * SurakshaAR — High-Precision Computer Vision Smoke & Mist Plume Detection Engine
 * (Gas Leak & Confined Space Hazard Simulation)
 *
 * Specifically engineered to detect real visible smoke plumes (incense sticks / agarbatti,
 * smoke canisters, mist, vapor) in diverse real-world lighting environments:
 *
 * Multi-Tier Defense Pipeline:
 * 1. Optical Diffusion Filter:
 *    - Captures diffuse grey, white, and off-white smoke particles (chromaDiff <= 48, 50 <= Luma <= 250)
 *    - Rejects highly saturated colored clothes, signs, and furniture (chromaDiff > 48)
 *    - Compatible with indoor warm incandescent/fluorescent lighting and white uniform shirts
 * 2. Dynamic Motion & Dual Background EMA Model:
 *    - Combines Exponential Moving Average (EMA) background model + inter-frame delta
 *    - Rejects static background walls, hanging clothes, posters, and stationary furniture
 *    - Rejects sudden camera whip pans (global motion compensation)
 * 3. Edge Softness Gradient Analysis:
 *    - Rejects hard solid edges of chargers, power adapters, and furniture (steep gradient > 62)
 *    - Passes diffuse, soft-bordered gaseous smoke plumes
 * 4. Spatial Clustering (BFS) & Geometry:
 *    - Aggregates smoke pixels into coherent plumes (min 8px, tuned for incense stick wisps)
 *    - Bounds width/height ratios and cluster density
 * 5. Temporal Confirmation State Machine:
 *    - 'none' -> 'verifying' (2 frames) -> 'confirmed' (4 frames)
 *    - Resilient smooth decay preventing flicker
 *
 * NOTE: This is real-time visual smoke detection for simulated industrial safety training.
 * Smartphone cameras do not measure chemical gas molecules or ppm.
 */

const SAMPLE_WIDTH  = 160
const SAMPLE_HEIGHT = 120

// Spatial plume constraints (tuned for delicate incense smoke & larger plumes)
const MIN_PLUME_PIXELS  = 8     // Sensitive to delicate agarbatti / incense smoke streams
const MAX_PLUME_PIXELS  = 2200  // Rejects full-screen lens blockages
const MIN_BOX_W_RATIO   = 0.02  // Allows narrow vertical smoke wisps
const MAX_BOX_W_RATIO   = 0.85
const MIN_BOX_H_RATIO   = 0.02  // Allows short or tall plumes
const MAX_BOX_H_RATIO   = 0.85
const MIN_PLUME_DENSITY = 0.08  // Allows wispy, dispersed smoke
const MAX_PLUME_DENSITY = 0.88  // Rejects 100% solid flat plastic blocks

// Temporal motion thresholds
const MIN_MOTION_DELTA  = 2.5   // Min luminance shift for moving smoke curls
const MAX_MOTION_DELTA  = 70    // Max luminance shift (rejects harsh specular glare)
const MAX_GLOBAL_PAN    = 18    // Reject frame if camera is swinging/panning rapidly

// State machine temporal stability (~20 FPS)
const VERIFYING_FRAMES  = 2     // ~100ms of positive smoke evidence
const CONFIRMED_FRAMES  = 4     // ~200ms of sustained smoke dynamics
const DECAY_RATE        = 1     // Smooth decay preventing flicker

/**
 * Check if a pixel represents human skin.
 * Exported for testing and external utility usage.
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
 * Accommodates indoor warm lighting reflections (chromaDiff <= 48) and smoke in front of white shirts.
 */
export function isSmokeOptics(r, g, b) {
  const maxC = Math.max(r, g, b)
  const minC = Math.min(r, g, b)
  const chromaDiff = maxC - minC
  const luma = 0.299 * r + 0.587 * g + 0.114 * b

  // Rejects high-chroma saturated objects (bright colored clothes, badges, furniture)
  // Accepts diffuse smoke/mist across a wide luminance band (50 to 250)
  return chromaDiff <= 48 && luma >= 50 && luma <= 250
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
      this.lastBbox       = { x: 0.40, y: 0.30, width: 0.22, height: 0.32 }
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
   *   visualConfidence: number,
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
        pixelCount:       65,
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

      const curLuma = new Float32Array(sw * sh)
      const isWarmup = this.frameCount < 2
      let totalLumaDelta = 0
      let validPixels = 0

      // Compute current luminance & evaluate inter-frame delta
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

          if (isWarmup) {
            this.bgLuma[pIdx]   = luma
            this.prevLuma[pIdx] = luma
            continue
          }

          totalLumaDelta += Math.abs(luma - this.prevLuma[pIdx])
          validPixels++
        }
      }

      this.frameCount++

      if (isWarmup) {
        return {
          isGasHazard: false, isSmoke: false, state: 'none', visualConfidence: 0, bbox: null, pixelCount: 0,
        }
      }

      // Calculate global camera motion (mean frame delta)
      const globalMotion = validPixels > 0 ? (totalLumaDelta / validPixels) : 0

      // Rapid camera swipe/pan rejection
      if (globalMotion > MAX_GLOBAL_PAN) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // Second pass: Identify candidate smoke plume pixels
      // - Must match optical neutral/smoke palette
      // - Must exhibit local dynamic motion relative to background EMA model
      // - Must NOT be a hard solid object edge (rejects chargers, table borders, door frames)
      const grid = new Uint8Array(sw * sh)
      let totalSmokeCandidates = 0
      const border = 4

      for (let y = border; y < sh - border; y++) {
        const rowOffset = y * sw
        for (let x = border; x < sw - border; x++) {
          const pIdx = rowOffset + x
          const idx  = pIdx * 4
          const r    = data[idx]
          const g    = data[idx + 1]
          const b    = data[idx + 2]

          const luma = curLuma[pIdx]

          if (!isSmokeOptics(r, g, b)) {
            // Adapt background for non-smoke pixels
            this.bgLuma[pIdx] = this.bgLuma[pIdx] * 0.92 + luma * 0.08
            continue
          }

          // Motion analysis: check deviation from background model and previous frame
          const bgDelta   = Math.abs(luma - this.bgLuma[pIdx])
          const prevDelta = Math.abs(luma - this.prevLuma[pIdx])

          const hasDynamicMotion = (bgDelta >= MIN_MOTION_DELTA || prevDelta >= MIN_MOTION_DELTA) && bgDelta <= MAX_MOTION_DELTA

          if (!hasDynamicMotion) {
            // Adapt background for static neutral pixels (walls, white clothes)
            this.bgLuma[pIdx] = this.bgLuma[pIdx] * 0.95 + luma * 0.05
            continue
          }

          // Spatial edge gradient: solid objects (chargers, boxes) have sharp step edges > 62
          // Gaseous smoke is soft and diffuse
          const gradX = Math.abs(curLuma[pIdx + 1] - curLuma[pIdx - 1])
          const gradY = Math.abs(curLuma[pIdx + sw] - curLuma[pIdx - sw])
          const maxGrad = Math.max(gradX, gradY)

          if (maxGrad > 62) {
            // Hard edge detected (solid plastic / metal / edge)
            continue
          }

          grid[pIdx] = 1
          totalSmokeCandidates++
        }
      }

      // Fast reject if fewer than minimum smoke candidate pixels
      if (totalSmokeCandidates < MIN_PLUME_PIXELS) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // BFS Connected-Component Clustering to find cohesive smoke plume
      const visited = new Uint8Array(sw * sh)
      let bestCluster = null
      let bestClusterSize = 0

      for (let y = border; y < sh - border; y++) {
        const rowOffset = y * sw
        for (let x = border; x < sw - border; x++) {
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
                if (nx >= border && nx < sw - border && ny >= border && ny < sh - border) {
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

            // Plume criteria
            if (
              clusterSize >= MIN_PLUME_PIXELS &&
              clusterSize <= MAX_PLUME_PIXELS &&
              wRatio >= MIN_BOX_W_RATIO &&
              wRatio <= MAX_BOX_W_RATIO &&
              hRatio >= MIN_BOX_H_RATIO &&
              hRatio <= MAX_BOX_H_RATIO &&
              density >= MIN_PLUME_DENSITY &&
              density <= MAX_PLUME_DENSITY
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

      // Increment sustained smoke plume frame counter
      this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 8)

      if (this.counter >= CONFIRMED_FRAMES) {
        this.state = 'confirmed'
      } else if (this.counter >= VERIFYING_FRAMES) {
        this.state = 'verifying'
      } else {
        this.state = 'none'
      }

      // Calculate tightly centered bounding box with padding
      const pad = 8
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
        const sizeBonus    = Math.min(0.07, (bestCluster.size - MIN_PLUME_PIXELS) * 0.002)
        const densityBonus = Math.min(0.04, (bestCluster.density - MIN_PLUME_DENSITY) * 0.15)
        const persistBonus = Math.min(0.05, (this.counter - CONFIRMED_FRAMES) * 0.015)
        confidence = Math.min(0.96, Math.max(0.82, 0.84 + sizeBonus + densityBonus + persistBonus))
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
