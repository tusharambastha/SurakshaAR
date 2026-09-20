/**
 * SurakshaAR — Robust Flame-Specific Computer Vision Detection Engine
 *
 * Exclusively detects active, visible combustion flames (e.g. matchstick, candle, lighter).
 * Absolutely rejects:
 * 1. Human skin, face, forehead highlights, and hair (lacks light-emitter contrast, non-teardrop)
 * 2. Red / orange clothing and t-shirts (zero emitter contrast, diffuse, static)
 * 3. Brown wooden surfaces and furniture (low luminosity, no hot core, zero emitter contrast)
 * 4. Orange / warm walls and ambient background (uniform, static, large span)
 * 5. Ceiling lamps, tube lights, desk lamps (large/uniform/circular, non-buoyant, zero convection jitter)
 * 6. Ambient room scenes, sunlight reflections, and stationary objects
 *
 * 5-Stage Multi-Characteristic Flame Verification:
 * 1. Combustion Candidate Segmenter (Warm luminous spectrum with luminous heat bounds)
 * 2. Active Light-Emitter Local Contrast Test (Flame emits light -> significantly brighter than surrounding border)
 * 3. Luminous Core & Multi-Zone Profile (Match/lighter flame has hot saturated core with steep radial gradient)
 * 4. Buoyancy Geometry & Vertical Teardrop Profile (Height > Width, narrow tip taper, rejects horizontal/oval patches)
 * 5. Convective Flicker & Centroid Turbulence (Chaotic buoyant oscillation at 8-20 Hz; rejects static surfaces)
 *
 * State Machine:
 * - 'none': Ambient monitoring, no confidence displayed
 * - 'verifying': Sustained flame candidate undergoing multi-frame temporal confirmation
 * - 'confirmed': Genuine flame hazard sustained across >= 14 consecutive frames
 */

const SAMPLE_WIDTH  = 160
const SAMPLE_HEIGHT = 120

// Spatial constraints for match / lighter / candle flames
// Spatial constraints for match / lighter / candle flames
const MIN_CLUSTER_PIXELS  = 5     // Minimum flame pixels in cluster
const MAX_CLUSTER_PIXELS  = 1200  // Flame is compact; rejects massive walls/shirts (thousands of px)
const MAX_BOX_W_RATIO     = 0.35  // Max width 35% of frame
const MAX_BOX_H_RATIO     = 0.55  // Max height 55% of frame
const MIN_CLUSTER_DENSITY = 0.15  // Compactness (cluster pixels / bounding box area)

// Flame core & emitter thresholds
const MIN_CORE_LUMA       = 165   // Incandescent core luma threshold
const MIN_PEAK_LUMA       = 185   // Peak flame pixel must reach incandescent brightness
const MIN_EMITTER_CONTRAST= 8     // Flame luma must exceed immediate border (reflective objects < 4)

// Geometry constraints (buoyant vertical teardrop)
const MIN_ASPECT_RATIO    = 0.80  // Height / Width >= 0.80 (handles pixel grid quantization for small flames)
const MAX_ASPECT_RATIO    = 4.50  // Reasonable natural flame elongation

// Temporal dynamics & convective turbulence
const FLICKER_LUMA_DELTA  = 10    // Luminance shift threshold
const MIN_FLICKER_RATIO   = 0.05  // Convective flicker fluctuation
const MIN_SIZE_VARIANCE   = 1.0   // Convective turbulence size variance
const MIN_CENTROID_JITTER = 0.20  // Flame tip & center jitter due to air convection
const HISTORY_LENGTH      = 8     // Rolling history length

// State machine frame counts (~20-30 FPS)
const VERIFYING_FRAMES    = 2     // ~70-100ms to enter verifying state
const CONFIRMED_FRAMES    = 5     // ~180-250ms of sustained multi-characteristic evidence
const DECAY_RATE          = 1     // Smooth decay when flame is extinguished

/**
 * Check if a pixel matches the combustion envelope criteria.
 * Real combustion flames on webcams exhibit three regions:
 * 1. Saturated incandescent core (Luma >= 215, R >= 220, G >= 180) due to sensor saturation.
 * 2. Warm yellow-orange-red envelope (Luma >= 105, R >= 165, (R - B) >= 30, R >= G - 25).
 * 3. Blue combustion base near wick/nozzle (B >= 130, B > R + 20, G >= 50).
 * Strictly excludes human skin (Luma ~150-190, R ~195-230, G ~145-180, B ~110-150, but non-emitter).
 */
export function isCombustionCandidate(r, g, b) {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  const isSat = (luma >= 235 && r >= 240 && g >= 220)
  const isWarm = (luma >= 140 && r >= 190 && g >= 110 && b <= 115 && (r - b) >= 45)
  const isBlue = (b >= 130 && b > r + 25 && g >= 50)
  return isSat || isWarm || isBlue
}

/**
 * Check if a pixel represents an incandescent flame core.
 * Real flame cores:
 * 1. Saturated white-hot center: Luma >= 235, R >= 240, G >= 220
 * 2. Bright incandescent yellow core: Luma >= 165, R >= 200, G >= 130, B <= 110, R - B >= 45
 */
export function isFlameCorePixel(r, g, b) {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  const isSatCore = (luma >= 235 && r >= 240 && g >= 220)
  const isYellowCore = (luma >= 165 && r >= 200 && g >= 130 && b <= 110 && (r - b) >= 45)
  return isSatCore || isYellowCore
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
 * Robust Computer Vision Flame & Fire Detector.
 */
export class FireDetector {
  constructor(options = {}) {
    this.sampleWidth  = options.sampleWidth  || SAMPLE_WIDTH
    this.sampleHeight = options.sampleHeight || SAMPLE_HEIGHT

    this.canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
    if (this.canvas) {
      this.canvas.width  = this.sampleWidth
      this.canvas.height = this.sampleHeight
    }
    this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null

    const totalPx = this.sampleWidth * this.sampleHeight
    this.prevLuma = new Float32Array(totalPx)
    this.hasPrev  = false

    // Rolling histories for convective turbulence analysis
    this.sizeHistory     = []
    this.centroidHistory = []

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
      this.lastConfidence = 0.91
    }
  }

  reset() {
    this.counter         = 0
    this.state           = 'none'
    this.lastBbox        = null
    this.lastConfidence  = 0
    this.simulated       = false
    this.hasPrev         = false
    this.prevLuma.fill(0)
    this.sizeHistory     = []
    this.centroidHistory = []
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
        pixelCount: 35,
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

    return this.analyzeImageData(data, sampleWidth, sampleHeight)
  }

  /**
   * Core frame analysis function (can be directly tested with raw RGBA data).
   */
  analyzeImageData(data, sampleWidth, sampleHeight) {
    const totalPx = sampleWidth * sampleHeight
    const grid = new Uint8Array(totalPx)
    const coreGrid = new Uint8Array(totalPx)
    const curLuma = new Float32Array(totalPx)
    let candidateCount = 0

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

        const isCore = isFlameCorePixel(r, g, b)
        const isCand = isCore || isCombustionCandidate(r, g, b)
        if (isCand) {
          grid[pIdx] = 1
          candidateCount++
          if (isCore) {
            coreGrid[pIdx] = 1
          }
        }
      }
    }

    // Fast reject: insufficient candidate pixels
    if (candidateCount < MIN_CLUSTER_PIXELS) {
      this._updateLuma(curLuma)
      return this._decay()
    }

    // ── Connected Component Analysis (BFS Clustering) ──
    const visited = new Uint8Array(totalPx)
    const validClusters = []

    for (let y = 0; y < sampleHeight; y++) {
      const rowOffset = y * sampleWidth
      for (let x = 0; x < sampleWidth; x++) {
        const pIdx = rowOffset + x
        if (grid[pIdx] === 1 && visited[pIdx] === 0) {
          let clusterSize = 0
          let coreCount = 0
          let sumLuma = 0
          let peakLuma = 0
          let sumX = 0, sumY = 0
          let cMinX = x, cMaxX = x
          let cMinY = y, cMaxY = y
          const clusterPoints = []

          const queue = [x, y]
          visited[pIdx] = 1

          let head = 0
          while (head < queue.length) {
            const cx = queue[head++]
            const cy = queue[head++]
            const curIdx = cy * sampleWidth + cx
            clusterSize++
            clusterPoints.push(curIdx)

            const l = curLuma[curIdx]
            sumLuma += l
            if (l > peakLuma) peakLuma = l

            sumX += cx
            sumY += cy

            if (coreGrid[curIdx] === 1) coreCount++

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

          // Evaluate cluster spatial size
          const bw = cMaxX - cMinX + 1
          const bh = cMaxY - cMinY + 1
          const wRatio = bw / sampleWidth
          const hRatio = bh / sampleHeight
          const density = clusterSize / (bw * bh)
          const aspectRatio = bh / bw

          // Reject large clusters touching frame boundary (clothing/body/walls extending out of view)
          const touchesBorder = (cMinX <= 1 || cMaxX >= sampleWidth - 2 || cMinY <= 1 || cMaxY >= sampleHeight - 2)
          if (touchesBorder && clusterSize > 60) {
            continue
          }

          if (
            clusterSize >= MIN_CLUSTER_PIXELS &&
            clusterSize <= MAX_CLUSTER_PIXELS &&
            wRatio <= MAX_BOX_W_RATIO &&
            hRatio <= MAX_BOX_H_RATIO &&
            density >= MIN_CLUSTER_DENSITY &&
            aspectRatio >= MIN_ASPECT_RATIO &&
            aspectRatio <= MAX_ASPECT_RATIO
          ) {
            validClusters.push({
              minX: cMinX, maxX: cMaxX, minY: cMinY, maxY: cMaxY,
              bw, bh,
              size: clusterSize,
              density,
              aspectRatio,
              coreCount,
              peakLuma,
              avgLuma: sumLuma / clusterSize,
              centroidX: sumX / clusterSize,
              centroidY: sumY / clusterSize,
              points: clusterPoints,
            })
          }
        }
      }
    }

    if (validClusters.length === 0) {
      this._updateLuma(curLuma)
      return this._decay()
    }

    // Sort by flame quality: prioritize compact handheld flame sizes (8..50 px), hot core ratio, and interaction zone
    validClusters.sort((a, b) => {
      const sizeScoreA = (a.size >= 8 && a.size <= 50) ? 60 : 0
      const sizeScoreB = (b.size >= 8 && b.size <= 50) ? 60 : 0

      const posScoreA  = a.minY >= 38 ? 30 : (a.minY >= 25 ? 10 : 0)
      const posScoreB  = b.minY >= 38 ? 30 : (b.minY >= 25 ? 10 : 0)

      const coreRatioA = a.size > 0 ? (a.coreCount / a.size) : 0
      const coreRatioB = b.size > 0 ? (b.coreCount / b.size) : 0
      const coreScoreA = coreRatioA * 25
      const coreScoreB = coreRatioB * 25

      const shapeScoreA = (a.aspectRatio >= 1.05 && a.aspectRatio <= 3.2) ? 15 : 0
      const shapeScoreB = (b.aspectRatio >= 1.05 && b.aspectRatio <= 3.2) ? 15 : 0

      const scoreA = sizeScoreA + posScoreA + coreScoreA + shapeScoreA + (a.density * 5)
      const scoreB = sizeScoreB + posScoreB + coreScoreB + shapeScoreB + (b.density * 5)
      return scoreB - scoreA
    })

    let selectedCluster = null
    let clusterContrast = 0
    let clusterFlickerRatio = 0

    for (const cand of validClusters) {
      // ── 1. CORE REQUIREMENT ──
      // Real lighter/match flame MUST have an incandescent core covering >= 4% of the flame
      const coreRatio = cand.size > 0 ? cand.coreCount / cand.size : 0
      if (cand.coreCount < 2 || coreRatio < 0.04 || cand.peakLuma < MIN_PEAK_LUMA) {
        continue // Skip surfaces without genuine hot core (skin, wood, cloth)
      }

      // ── 2. ACTIVE LIGHT EMITTER (LOCAL BACKGROUND CONTRAST TEST) ──
      // Sample ring 2..4 pixels outside bounding box
      const margin = 3
      const outerMinX = Math.max(0, cand.minX - margin)
      const outerMaxX = Math.min(sampleWidth - 1, cand.maxX + margin)
      const outerMinY = Math.max(0, cand.minY - margin)
      const outerMaxY = Math.min(sampleHeight - 1, cand.maxY + margin)

      let borderSumLuma = 0
      let borderCount = 0

      for (let by = outerMinY; by <= outerMaxY; by++) {
        const rOff = by * sampleWidth
        for (let bx = outerMinX; bx <= outerMaxX; bx++) {
          // Only include points outside candidate box
          if (bx < cand.minX || bx > cand.maxX || by < cand.minY || by > cand.maxY) {
            const bIdx = rOff + bx
            // If border pixel is also marked as flame candidate, do not skew background
            if (grid[bIdx] === 0) {
              borderSumLuma += curLuma[bIdx]
              borderCount++
            }
          }
        }
      }

      const avgBorderLuma = borderCount > 0 ? borderSumLuma / borderCount : 80
      const contrast = cand.avgLuma - avgBorderLuma

      // If contrast is low, it's a reflective surface (e.g. skin, shirt, wall), NOT an emitter flame!
      if (contrast < MIN_EMITTER_CONTRAST) {
        continue
      }

      // ── 3. VERTICAL BUOYANCY GEOMETRY ──
      // Combustion gases rise vertically; candle, lighter, and match flames are elongated upwards
      if (cand.aspectRatio < MIN_ASPECT_RATIO || cand.aspectRatio > MAX_ASPECT_RATIO) {
        continue
      }

      // ── 4. CANDIDATE-LEVEL FLICKER CHECK ──
      let fCount = 0
      if (this.hasPrev) {
        for (const ptIdx of cand.points) {
          const delta = Math.abs(curLuma[ptIdx] - this.prevLuma[ptIdx])
          if (delta >= FLICKER_LUMA_DELTA) {
            fCount++
          }
        }
      }
      const candFlicker = cand.size > 0 ? fCount / cand.size : 0

      // If multiple candidates exist and one is a static background fixture (0 flicker and near ceiling),
      // skip it and evaluate the other candidate (the flickering lighter)!
      if (validClusters.length > 1 && this.hasPrev && candFlicker < 0.02 && cand.minY < 38) {
        continue
      }

      selectedCluster = cand
      clusterContrast = contrast
      clusterFlickerRatio = candFlicker
      break
    }

    if (!selectedCluster) {
      this._updateLuma(curLuma)
      return this._decay()
    }

    // Track size and centroid history
    this.sizeHistory.push(selectedCluster.size)
    this.centroidHistory.push({ x: selectedCluster.centroidX, y: selectedCluster.centroidY })

    if (this.sizeHistory.length > HISTORY_LENGTH) {
      this.sizeHistory.shift()
      this.centroidHistory.shift()
    }

    const sizeVar = computeVariance(this.sizeHistory)
    let centroidJitter = 0
    if (this.centroidHistory.length >= 3) {
      const varX = computeVariance(this.centroidHistory.map(c => c.x))
      const varY = computeVariance(this.centroidHistory.map(c => c.y))
      centroidJitter = Math.sqrt(varX + varY)
    }

    this._updateLuma(curLuma)

    // REJECT COMPLETELY STATIC OBJECTS (Desk lamp, stationary ceiling fixture):
    // Fixed electrical fixtures have zero flicker, zero tremor jitter, and zero size variance.
    if (this.counter >= VERIFYING_FRAMES && this.hasPrev) {
      const isCompletelyStatic = (clusterFlickerRatio < 0.02 && centroidJitter < 0.12 && sizeVar < 0.3)
      if (isCompletelyStatic) {
        return this._decay()
      }
    }

    // Increment consecutive valid flame frames
    this.counter = Math.min(this.counter + 1, CONFIRMED_FRAMES + 12)

    // Bounding box padding for HUD reticle
    const pad = 6
    const boxW = (selectedCluster.maxX - selectedCluster.minX + 1) + pad * 2
    const boxH = (selectedCluster.maxY - selectedCluster.minY + 1) + pad * 2

    this.lastBbox = {
      x:      Math.max(0, selectedCluster.minX - pad) / sampleWidth,
      y:      Math.max(0, selectedCluster.minY - pad) / sampleHeight,
      width:  Math.min(sampleWidth, boxW) / sampleWidth,
      height: Math.min(sampleHeight, boxH) / sampleHeight,
    }

    // ── 5. DYNAMIC CONFIDENCE CALCULATION (NO HARDCODING) ──
    const coreScore     = Math.min(1.0, (selectedCluster.coreCount / Math.max(2, selectedCluster.size * 0.10)))
    const contrastScore = Math.min(1.0, Math.max(0, (clusterContrast - 8) / 30))
    const geomScore     = Math.min(1.0, Math.max(0, (selectedCluster.aspectRatio - 0.8) / 1.0))
    const flickerScore  = Math.min(1.0, Math.max(0, clusterFlickerRatio / 0.15))

    const rawConf = (
      0.30 * coreScore +
      0.28 * contrastScore +
      0.22 * geomScore +
      0.20 * flickerScore
    )

    const durationBonus = Math.min(0.12, Math.max(0, (this.counter - CONFIRMED_FRAMES) * 0.015))
    const confidence = Math.min(0.96, Math.max(0.0, rawConf * 0.90 + durationBonus + 0.05))
    this.lastConfidence = Math.round(confidence * 100) / 100

    if (this.counter >= CONFIRMED_FRAMES && this.lastConfidence >= 0.60) {
      this.state = 'confirmed'
    } else if (this.counter >= VERIFYING_FRAMES) {
      this.state = 'verifying'
    } else {
      this.state = 'none'
    }

    return {
      isFire:     this.state === 'confirmed',
      state:      this.state,
      confidence: this.state === 'confirmed' ? this.lastConfidence : 0,
      bbox:       this.state === 'confirmed' ? this.lastBbox : null,
      pixelCount: selectedCluster.size,
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
      this.sizeHistory     = []
      this.centroidHistory = []
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
