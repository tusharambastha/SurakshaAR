/**
 * SurakshaAR — Robust Computer Vision Fire & Flame Detection Engine
 *
 * Exclusively detects active combustion flames (match, candle, lighter).
 * Absolutely rejects:
 * - Human faces, skin, and hair ((R - B) < 40, (R - G) < 22)
 * - White t-shirts and reflections ((R - B) < 25)
 * - Static background shelves, walls, and furniture (Zero temporal flicker, variance < 1.0)
 * - Ceiling lights / tube lights (B > 180, diffuse)
 *
 * 4-Tier Defense Architecture:
 * 1. Optical Combustion Filter (Warm spectrum, R >= 218, R-B >= 65, R-G >= 22, B <= 145)
 * 2. BFS Spatial Cluster Extraction (Small compact cluster: 6-100px, w <= 22%, h <= 28%, density >= 0.18)
 * 3. Temporal Flicker & Convection Variance (Real flame vibrates at 8-20 Hz; static objects have delta ~ 0)
 * 4. Multi-Frame State Machine ('none' -> 'verifying' -> 'confirmed' with rapid decay on absence)
 */

const SAMPLE_WIDTH  = 160
const SAMPLE_HEIGHT = 120

// Spatial constraints (Candle / match / lighter scale)
const MIN_CLUSTER_PIXELS  = 6     // Minimum flame pixels in cluster
const MAX_CLUSTER_PIXELS  = 100   // Real flame is compact (rejects large shirts/walls)
const MAX_BOX_W_RATIO     = 0.22  // Max width 22% of frame
const MAX_BOX_H_RATIO     = 0.28  // Max height 28% of frame
const MIN_CLUSTER_DENSITY = 0.18  // Cluster pixels / bounding box area

// Temporal flicker & variance
const FLICKER_LUMA_DELTA  = 12    // Min luminance shift for flickering pixel
const MIN_FLICKER_RATIO   = 0.15  // At least 15% of flame pixels must flicker dynamically
const MIN_SIZE_VARIANCE   = 2.0   // Real flame size oscillates due to air convection; static objects < 1.0
const HISTORY_LENGTH      = 6     // Frames to compute temporal variance

// State machine thresholds (~20 FPS)
const VERIFYING_FRAMES    = 3     // ~150ms to enter verifying state
const CONFIRMED_FRAMES    = 8     // ~400ms of sustained flickering evidence
const DECAY_RATE          = 3     // Fast clearance within ~100ms when flame removed

/**
 * Optical combustion pixel evaluation.
 * Returns true ONLY if pixel exhibits active flame radiation characteristics:
 * - High luminous red intensity (R >= 218)
 * - Red strongly dominates Blue ((R - B) >= 65) — rejects white shirts & skin
 * - Red dominates Green ((R - G) >= 22) — warm flame spectrum
 * - Blue is suppressed (B <= 145) — rejects walls and lamps
 */
export function isFlamePixel(r, g, b) {
  return (
    r >= 218 &&
    (r - b) >= 65 &&
    (r - g) >= 22 &&
    b <= 145 &&
    (r + g + b) >= 420
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

/**
 * Stateful FireDetector with BFS clustering and temporal flicker analysis.
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

    // Rolling history of cluster sizes for convection variance analysis
    this.sizeHistory = []

    this.counter        = 0
    this.state          = 'none' // 'none' | 'verifying' | 'confirmed'
    this.lastBbox       = null
    this.lastConfidence = 0
    this.simulated      = false
  }

  triggerSimulation(enabled = true) {
    this.simulated = enabled
    if (enabled) {
      this.counter = CONFIRMED_FRAMES
      this.state   = 'confirmed'
      this.lastBbox = { x: 0.65, y: 0.25, width: 0.14, height: 0.20 }
      this.lastConfidence = 0.92
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
   * @param {HTMLVideoElement} videoElement
   * @returns {{ isFire: boolean, state: 'none'|'verifying'|'confirmed', confidence: number, bbox: object|null, pixelCount: number }}
   */
  detect(videoElement) {
    if (this.simulated) {
      return {
        isFire:     true,
        state:      'confirmed',
        confidence: this.lastConfidence,
        bbox:       this.lastBbox,
        pixelCount: 30,
      }
    }

    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return {
        isFire:     false,
        state:      'none',
        confidence: 0,
        bbox:       null,
        pixelCount: 0,
      }
    }

    const { sampleWidth, sampleHeight, ctx } = this
    ctx.drawImage(videoElement, 0, 0, sampleWidth, sampleHeight)
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
    const data    = imgData.data

    // Grid of flame pixels and current frame luminance map
    const grid = new Uint8Array(sampleWidth * sampleHeight)
    const curLuma = new Float32Array(sampleWidth * sampleHeight)
    let totalFlamePixels = 0

    for (let y = 0; y < sampleHeight; y++) {
      const rowOffset = y * sampleWidth
      for (let x = 0; x < sampleWidth; x++) {
        const pIdx = rowOffset + x
        const idx  = pIdx * 4
        const r    = data[idx]
        const g    = data[idx + 1]
        const b    = data[idx + 2]
        const luma = 0.299 * r + 0.587 * g + 0.114 * b
        curLuma[pIdx] = luma

        if (isFlamePixel(r, g, b)) {
          grid[pIdx] = 1
          totalFlamePixels++
        }
      }
    }

    // Fast reject: if fewer than minimum flame pixels
    if (totalFlamePixels < MIN_CLUSTER_PIXELS) {
      this._updateLuma(curLuma)
      return this._decay()
    }

    // BFS Connected-Component Analysis to find true flame cluster
    const visited = new Uint8Array(sampleWidth * sampleHeight)
    let bestCluster = null
    let bestClusterSize = 0

    for (let y = 0; y < sampleHeight; y++) {
      const rowOffset = y * sampleWidth
      for (let x = 0; x < sampleWidth; x++) {
        const pIdx = rowOffset + x
        if (grid[pIdx] === 1 && visited[pIdx] === 0) {
          let clusterSize = 0
          let cMinX = x, cMaxX = x
          let cMinY = y, cMaxY = y
          const clusterPoints = []

          const queue = [x, y]
          visited[pIdx] = 1

          let head = 0
          while (head < queue.length) {
            const cx = queue[head++]
            const cy = queue[head++]
            clusterSize++
            clusterPoints.push(cy * sampleWidth + cx)

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
              if (nx >= 0 && nx < sampleWidth && ny >= 0 && ny < sampleHeight) {
                const nIdx = ny * sampleWidth + nx
                if (grid[nIdx] === 1 && visited[nIdx] === 0) {
                  visited[nIdx] = 1
                  queue.push(nx, ny)
                }
              }
            }
          }

          // Evaluate spatial geometry
          const bw = cMaxX - cMinX + 1
          const bh = cMaxY - cMinY + 1
          const wRatio = bw / sampleWidth
          const hRatio = bh / sampleHeight
          const density = clusterSize / (bw * bh)

          if (
            clusterSize >= MIN_CLUSTER_PIXELS &&
            clusterSize <= MAX_CLUSTER_PIXELS &&
            wRatio <= MAX_BOX_W_RATIO &&
            hRatio <= MAX_BOX_H_RATIO &&
            density >= MIN_CLUSTER_DENSITY
          ) {
            if (clusterSize > bestClusterSize) {
              bestClusterSize = clusterSize
              bestCluster = {
                minX: cMinX, maxX: cMaxX, minY: cMinY, maxY: cMaxY,
                size: clusterSize, density, points: clusterPoints,
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

    // ── Temporal Flicker & Variance Analysis ──
    let flickerCount = 0
    if (this.hasPrev) {
      for (const ptIdx of bestCluster.points) {
        const delta = Math.abs(curLuma[ptIdx] - this.prevLuma[ptIdx])
        if (delta >= FLICKER_LUMA_DELTA) {
          flickerCount++
        }
      }
    }
    const flickerRatio = bestCluster.size > 0 ? flickerCount / bestCluster.size : 0

    // Track size history for convection turbulence variance
    this.sizeHistory.push(bestCluster.size)
    if (this.sizeHistory.length > HISTORY_LENGTH) {
      this.sizeHistory.shift()
    }
    const sizeVar = computeVariance(this.sizeHistory)

    this._updateLuma(curLuma)

    // REJECT STATIC OBJECTS (Shelf, wall, lamp, human sitting still):
    // If we have history and the object has zero flicker AND zero variance, it is NOT fire!
    if (this.counter >= VERIFYING_FRAMES && this.hasPrev) {
      if (flickerRatio < MIN_FLICKER_RATIO && sizeVar < MIN_SIZE_VARIANCE) {
        // Static surface detected -> decay immediately!
        return this._decay()
      }
    }

    // Increment consecutive valid flame frames
    this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 10)

    if (this.counter >= CONFIRMED_FRAMES) {
      this.state = 'confirmed'
    } else if (this.counter >= VERIFYING_FRAMES) {
      this.state = 'verifying'
    } else {
      this.state = 'none'
    }

    // Bounding box padding for HUD reticle
    const pad = 6
    const boxW = (bestCluster.maxX - bestCluster.minX + 1) + pad * 2
    const boxH = (bestCluster.maxY - bestCluster.minY + 1) + pad * 2

    this.lastBbox = {
      x:      Math.max(0, bestCluster.minX - pad) / sampleWidth,
      y:      Math.max(0, bestCluster.minY - pad) / sampleHeight,
      width:  Math.min(sampleWidth, boxW) / sampleWidth,
      height: Math.min(sampleHeight, boxH) / sampleHeight,
    }

    // Calculated confidence based on actual visual evidence
    let confidence = 0
    if (this.state === 'confirmed') {
      const densityBonus  = Math.min(0.08, (bestCluster.density - MIN_CLUSTER_DENSITY) * 0.2)
      const flickerBonus  = Math.min(0.08, (flickerRatio - MIN_FLICKER_RATIO) * 0.25)
      const persistBonus  = Math.min(0.06, (this.counter - CONFIRMED_FRAMES) * 0.008)
      confidence = Math.min(0.96, Math.max(0.78, 0.78 + densityBonus + flickerBonus + persistBonus))
      this.lastConfidence = Math.round(confidence * 100) / 100
    }

    return {
      isFire:     this.state === 'confirmed',
      state:      this.state,
      confidence: this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:       this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount: bestCluster.size,
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
      isFire:     this.state === 'confirmed',
      state:      this.state,
      confidence: this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:       this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount: 0,
    }
  }
}
