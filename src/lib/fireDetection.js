/**
 * SurakshaAR — Robust Computer Vision Fire & Flame Detection Engine
 *
 * Exclusively detects active combustion flames (match, candle, lighter).
 * Verified against live webcam feeds to:
 * - Detect small candle/lighter/matchstick flames
 * - Reject human skin & faces ((R - B) < 40, (R - G) < 25)
 * - Reject white t-shirts & reflections ((R - B) < 25, (R - G) < 10)
 * - Reject walls, lamps, and background objects
 */

const SAMPLE_WIDTH  = 160
const SAMPLE_HEIGHT = 120

// Spatial constraints (Candle / match / lighter scale)
const MIN_CLUSTER_PIXELS  = 6     // Minimum flame pixels in cluster
const MAX_CLUSTER_PIXELS  = 120   // Real candle/match is small (not a whole shirt)
const MAX_BOX_W_RATIO     = 0.25  // Max width 25% of frame
const MAX_BOX_H_RATIO     = 0.32  // Max height 32% of frame
const MIN_CLUSTER_DENSITY = 0.16  // Cluster pixels / bounding box area

// Temporal thresholds (responsive ~20 FPS)
const VERIFYING_FRAMES = 2   // ~100ms to enter verifying state
const CONFIRMED_FRAMES = 5   // ~250ms of sustained flame to confirm
const DECAY_RATE       = 2   // Clearance within ~100ms when flame removed

/**
 * Evaluates whether a pixel belongs to an active flame mantle.
 * A real combustion flame has high red, low-to-medium blue, and red dominance:
 * - R >= 210
 * - (R - B) >= 55  (White shirts have R-B < 25; Skin has R-B < 40)
 * - (R - G) >= 20  (Warm flame chromaticity; Yellow fabric has R-G < 18 when G is high)
 * - B <= 165       (Combustion emits predominantly warm spectrum)
 */
export function isFlamePixel(r, g, b) {
  return r >= 210 && (r - b) >= 55 && (r - g) >= 20 && b <= 165
}

/**
 * Stateful FireDetector with spatial cluster extraction and temporal verification.
 */
export class FireDetector {
  constructor(options = {}) {
    this.sampleWidth  = options.sampleWidth  || SAMPLE_WIDTH
    this.sampleHeight = options.sampleHeight || SAMPLE_HEIGHT

    this.canvas = document.createElement('canvas')
    this.canvas.width  = this.sampleWidth
    this.canvas.height = this.sampleHeight
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

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

    // Grid of flame pixels for connected component analysis
    const grid = new Uint8Array(sampleWidth * sampleHeight)
    let totalFlamePixels = 0

    for (let y = 0; y < sampleHeight; y++) {
      const rowOffset = y * sampleWidth
      for (let x = 0; x < sampleWidth; x++) {
        const idx = (rowOffset + x) * 4
        const r   = data[idx]
        const g   = data[idx + 1]
        const b   = data[idx + 2]

        if (isFlamePixel(r, g, b)) {
          grid[rowOffset + x] = 1
          totalFlamePixels++
        }
      }
    }

    // Fast check: if not enough total pixels, decay
    if (totalFlamePixels < MIN_CLUSTER_PIXELS) {
      return this._decay()
    }

    // Find the largest connected flame cluster (BFS flood fill)
    const visited = new Uint8Array(sampleWidth * sampleHeight)
    let bestCluster = null
    let bestClusterSize = 0

    for (let y = 0; y < sampleHeight; y++) {
      const rowOffset = y * sampleWidth
      for (let x = 0; x < sampleWidth; x++) {
        const pIdx = rowOffset + x
        if (grid[pIdx] === 1 && visited[pIdx] === 0) {
          // BFS flood fill for this cluster
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

            // 4-neighborhood
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

          // Evaluate cluster against flame scale constraints
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
              bestCluster = { minX: cMinX, maxX: cMaxX, minY: cMinY, maxY: cMaxY, size: clusterSize, density }
            }
          }
        }
      }
    }

    if (!bestCluster) {
      return this._decay()
    }

    // Valid flame cluster detected in this frame -> increment consecutive counter
    this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 10)

    if (this.counter >= CONFIRMED_FRAMES) {
      this.state = 'confirmed'
    } else if (this.counter >= VERIFYING_FRAMES) {
      this.state = 'verifying'
    } else {
      this.state = 'none'
    }

    // Pad bounding box for AR overlay
    const pad = 6
    const boxW = (bestCluster.maxX - bestCluster.minX + 1) + pad * 2
    const boxH = (bestCluster.maxY - bestCluster.minY + 1) + pad * 2

    this.lastBbox = {
      x:      Math.max(0, bestCluster.minX - pad) / sampleWidth,
      y:      Math.max(0, bestCluster.minY - pad) / sampleHeight,
      width:  Math.min(sampleWidth, boxW) / sampleWidth,
      height: Math.min(sampleHeight, boxH) / sampleHeight,
    }

    // Compute evidence-based confidence
    let confidence = 0
    if (this.state === 'confirmed') {
      const sizeBonus     = Math.min(0.08, (bestCluster.size / 40) * 0.08)
      const densityBonus  = Math.min(0.08, (bestCluster.density - MIN_CLUSTER_DENSITY) * 0.2)
      const persistBonus  = Math.min(0.06, (this.counter - CONFIRMED_FRAMES) * 0.008)
      confidence = Math.min(0.96, Math.max(0.78, 0.78 + sizeBonus + densityBonus + persistBonus))
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
      isFire:     this.state === 'confirmed',
      state:      this.state,
      confidence: this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:       this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount: 0,
    }
  }
}
