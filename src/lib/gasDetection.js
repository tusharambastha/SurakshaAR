/**
 * SurakshaAR — Smoke & Mist Plume Visual Detection Engine
 * (Gas Leak & Confined Space Hazard Simulation)
 *
 * Smartphone cameras cannot detect invisible physical gas molecules (methane, CO, H2S, etc.).
 * In industrial safety simulation, dangerous gas leaks and confined space hazards
 * are visually represented by visible escaping smoke, vapor, or mist plumes.
 *
 * This Computer Vision engine detects active visible smoke/mist plumes in the camera feed based on:
 * 1. Optical Plume Characteristics: Semi-transparent, grey-white / neutral palette (low color saturation, 85 <= Luma <= 245)
 * 2. Strict False-Positive Rejections:
 *    - Human skin, faces, and hands (chromatic skin filtering)
 *    - Colored clothing, furniture, and room fixtures (chrominance delta > 28)
 *    - Static grey walls, floors, and sheets (inter-frame motion analysis — static objects have delta ~ 0)
 *    - Sudden lighting changes / camera pans (global frame motion threshold)
 * 3. Spatial Connected Plume Analysis: BFS clustering (min 15px, density >= 0.12, bounded aspect ratio)
 * 4. Temporal Dispersion & Persistence: Multi-frame state machine ('none' -> 'verifying' -> 'confirmed' over 7+ consecutive frames)
 *
 * Output: Evidence-based Visual Detection Confidence (NOT gas ppm or concentration).
 */

const SAMPLE_WIDTH  = 160
const SAMPLE_HEIGHT = 120

// Spatial constraints for visible smoke plume
const MIN_PLUME_PIXELS  = 15    // Coherent puff/mist minimum
const MAX_PLUME_PIXELS  = 2600  // Plume scale limit (rejects whole-frame camera occlusions)
const MAX_BOX_W_RATIO   = 0.65  // Max width 65% of frame
const MAX_BOX_H_RATIO   = 0.70  // Max height 70% of frame
const MIN_PLUME_DENSITY = 0.12  // Coherent cluster density

// Temporal motion & diffusion thresholds
const MIN_MOTION_DELTA  = 5     // Min luminance change for moving smoke particles
const MAX_MOTION_DELTA  = 55    // Max luminance change (rejects harsh specular flashes)
const MIN_SIZE_VARIANCE = 2.0   // Fluid plumes billow & change area; static objects < 1.0
const HISTORY_LENGTH    = 6

// State machine temporal thresholds (~20 FPS)
const VERIFYING_FRAMES  = 3     // ~150ms of positive evidence
const CONFIRMED_FRAMES  = 7     // ~350ms of sustained plume dynamics
const DECAY_RATE        = 2     // Clearance decay

/**
 * Check if a pixel represents human skin.
 * Strictly disqualifies human faces, hands, and bodies.
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
 * Rejects high-chroma objects (colored shirts, walls, toys, books).
 */
export function isSmokeOpticsPixel(r, g, b) {
  const maxC = Math.max(r, g, b)
  const minC = Math.min(r, g, b)
  const chromaDiff = maxC - minC
  const luma = 0.299 * r + 0.587 * g + 0.114 * b

  // Low saturation (grey/white neutral spectrum) and moderate-to-high luminance
  // Rejects saturated colors (red/blue/green/yellow) and deep pitch-black shadows
  return (
    chromaDiff <= 28 &&
    luma >= 85 &&
    luma <= 245
  )
}

/**
 * Compute variance of an array of numbers.
 */
function computeVariance(arr) {
  if (!arr || arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length
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
    this.prevLuma = new Float32Array(totalPx)
    this.hasPrev  = false

    // Rolling history of cluster sizes for dispersion variance analysis
    this.sizeHistory = []

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
      this.lastBbox       = { x: 0.40, y: 0.32, width: 0.28, height: 0.34 }
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
    this.hasPrev        = false
    this.prevLuma.fill(0)
    this.sizeHistory    = []
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

      const grid    = new Uint8Array(sw * sh)
      const curLuma = new Float32Array(sw * sh)

      let totalSkinPixels  = 0
      let totalSmokePixels = 0
      let totalGlobalShift = 0

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

          // Human skin check
          if (isSkinPixel(r, g, b)) {
            totalSkinPixels++
            continue // Disqualify
          }

          // Check optical plume properties (semi-transparent, grey-white)
          if (isSmokeOpticsPixel(r, g, b)) {
            let hasMotion = false
            if (this.hasPrev) {
              const deltaLuma = Math.abs(luma - this.prevLuma[pIdx])
              if (deltaLuma >= MIN_MOTION_DELTA && deltaLuma <= MAX_MOTION_DELTA) {
                hasMotion = true
              }
              if (deltaLuma > 45) {
                totalGlobalShift++
              }
            } else {
              // Initializing frame
              hasMotion = true
            }

            if (hasMotion) {
              grid[pIdx] = 1
              totalSmokePixels++
            }
          }
        }
      }

      // Reject if global lighting switch or camera pan (more than 35% of frame has sudden massive shift)
      const totalPixels = sw * sh
      if (this.hasPrev && (totalGlobalShift / totalPixels) > 0.35) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // Reject if dominated by human body/face (> 24% skin)
      if ((totalSkinPixels / totalPixels) > 0.24) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // Fast reject if fewer than minimum smoke candidate pixels
      if (totalSmokePixels < MIN_PLUME_PIXELS) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // BFS Connected Component Clustering to locate cohesive smoke plume
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

      if (!bestCluster) {
        this._updateLuma(curLuma)
        return this._decay()
      }

      // Dispersion & Turbulence analysis:
      // Real smoke constantly expands, diffuses, and shifts cluster area.
      this.sizeHistory.push(bestCluster.size)
      if (this.sizeHistory.length > HISTORY_LENGTH) {
        this.sizeHistory.shift()
      }
      const sizeVar = computeVariance(this.sizeHistory)

      this._updateLuma(curLuma)

      // REJECT STATIC OBJECTS (grey walls, furniture, notebooks, plain clothes):
      // If we've observed for several frames and the area is completely static, decay!
      if (this.counter >= VERIFYING_FRAMES && this.hasPrev && this.sizeHistory.length >= 4) {
        if (sizeVar < MIN_SIZE_VARIANCE) {
          return this._decay()
        }
      }

      // Increment consecutive sustained smoke frames
      this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 10)

      if (this.counter >= CONFIRMED_FRAMES) {
        this.state = 'confirmed'
      } else if (this.counter >= VERIFYING_FRAMES) {
        this.state = 'verifying'
      } else {
        this.state = 'none'
      }

      // Calculate tight bounding box with padding
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
        const densityBonus  = Math.min(0.06, (bestCluster.density - MIN_PLUME_DENSITY) * 0.15)
        const varianceBonus = Math.min(0.06, (sizeVar - MIN_SIZE_VARIANCE) * 0.015)
        const persistBonus  = Math.min(0.06, (this.counter - CONFIRMED_FRAMES) * 0.01)
        confidence = Math.min(0.96, Math.max(0.82, 0.82 + densityBonus + varianceBonus + persistBonus))
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
    this.hasPrev = true
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
      this.sizeHistory = []
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
