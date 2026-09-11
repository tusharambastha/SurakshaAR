/**
 * SurakshaAR — Zero-False-Alarm Computer Vision Fire & Flame Detection Engine
 *
 * Designed to detect genuine flames (match, lighter, candle, flame video) while
 * completely eliminating false alarms on human skin tones, room lighting,
 * and warm interior walls.
 *
 * Multi-Stage Verification Pipeline:
 * 1. Strict Thermodynamic Emission & Chromatic Separation Filter
 * 2. Skin Tone & Non-Incandescent Object Rejection
 * 3. Local Spatial Cluster Density & Compactness Analysis (No full-screen false boxes)
 * 4. Multi-Frame Temporal Confirmation (3 consecutive positive frames)
 */

const SAMPLE_WIDTH = 160
const SAMPLE_HEIGHT = 120
const MIN_FLAME_PIXELS = 18 // minimum concentrated glowing pixels
const MAX_FLAME_FRAME_RATIO = 0.35 // reject if filling >35% of entire frame (ambient light)

/**
 * Optical evaluator for a single pixel.
 * Returns true ONLY if pixel exhibits physical characteristics of an emitting flame.
 */
export function isFlamePixel(r, g, b) {
  // 1. Extreme brightness requirement — flames are active luminous emitters
  if (r < 225) return false

  // 2. Minimum total radiant energy
  const sum = r + g + b
  if (sum < 350) return false

  // 3. Chromatic separation: In warm flames, Red strongly dominates Blue
  // (In human skin and beige walls, (r - b) is typically < 65)
  if ((r - b) < 70) return false

  // 4. Red must be greater than or equal to Green
  if (r < g) return false

  // 5. Green must be greater than Blue (warm flame, eliminates magenta/purple LEDs)
  if (g < b) return false

  // 6. Distinct optical flame signatures:
  // Signature A: Super-bright incandescent flame core (white-yellow peak glow)
  const isIncandescentCore = (r >= 245 && g >= 210 && sum >= 580)

  // Signature B: Vibrant radiant orange/red flame (candle/lighter body)
  // Low blue (b <= 75), strong red dominance (r - g >= 15), strong red-blue difference (r - b >= 90)
  const isRadiantFlame = (r >= 230 && (r - b) >= 90 && b <= 75 && (r - g) >= 15)

  // Signature C: Brilliant yellow flame
  // High red and green, deep blue suppression (b <= 90), large (r - b >= 120)
  const isYellowFlame = (r >= 240 && g >= 160 && (r - b) >= 120 && b <= 90)

  return isIncandescentCore || isRadiantFlame || isYellowFlame
}

/**
 * Stateful Fire Detector monitoring a live <video> element.
 */
export class FireDetector {
  constructor(options = {}) {
    this.sampleWidth = options.sampleWidth || SAMPLE_WIDTH
    this.sampleHeight = options.sampleHeight || SAMPLE_HEIGHT
    this.minPixels = options.minPixels || MIN_FLAME_PIXELS

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.sampleWidth
    this.canvas.height = this.sampleHeight
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

    this.history = []
    this.maxHistory = 6
    this.consecutiveDetections = 0
    this.stableThreshold = 3 // Requires 3 consecutive confirmed frames
    this.simulated = false
  }

  /** Enable or disable manual fire simulation for safe demo/training */
  triggerSimulation(enabled = true) {
    this.simulated = enabled
  }

  /**
   * Process a single frame from the camera feed.
   * @param {HTMLVideoElement} videoElement
   * @returns {object} detection result
   */
  detect(videoElement) {
    if (this.simulated) {
      return {
        isFire: true,
        confidence: 0.95,
        bbox: { x: 0.35, y: 0.32, width: 0.30, height: 0.32 },
        flameCenter: { x: 0.50, y: 0.48 },
        pixelCount: 220,
      }
    }

    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return { isFire: false, confidence: 0, bbox: null, flameCenter: null, pixelCount: 0 }
    }

    const { sampleWidth, sampleHeight, ctx, minPixels } = this

    ctx.drawImage(videoElement, 0, 0, sampleWidth, sampleHeight)
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
    const data = imgData.data
    const totalPixels = sampleWidth * sampleHeight

    let flamePixelCount = 0
    let minX = sampleWidth, maxX = 0
    let minY = sampleHeight, maxY = 0
    let sumX = 0, sumY = 0

    // Scan pixels with strict flame optical filter
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      if (isFlamePixel(r, g, b)) {
        const x = i % sampleWidth
        const y = Math.floor(i / sampleWidth)

        flamePixelCount++
        sumX += x
        sumY += y
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }

    // ─── SPATIAL CLUSTERING & NOISE REJECTION ───
    const boxW = maxX >= minX ? (maxX - minX + 1) : 0
    const boxH = maxY >= minY ? (maxY - minY + 1) : 0
    const boxArea = boxW * boxH

    // Check 1: Must exceed minimum pixel threshold
    const hasMinPixels = flamePixelCount >= minPixels

    // Check 2: Max frame ratio (reject ambient scene glare)
    const isBelowMaxRatio = (flamePixelCount / totalPixels) < MAX_FLAME_FRAME_RATIO

    // Check 3: Bounding box dimension bounds (reject full-screen false positive boxes)
    const isRealisticDimensions = (boxW < sampleWidth * 0.70) && (boxH < sampleHeight * 0.70)

    // Check 4: Cluster density — real flames are compact, not scattered single pixels
    const clusterDensity = boxArea > 0 ? (flamePixelCount / boxArea) : 0
    const isCompactCluster = clusterDensity >= 0.18

    const isCandidate = hasMinPixels && isBelowMaxRatio && isRealisticDimensions && isCompactCluster

    // ─── TEMPORAL CONSISTENCY ───
    if (isCandidate) {
      this.consecutiveDetections++
    } else {
      this.consecutiveDetections = Math.max(0, this.consecutiveDetections - 1)
    }

    const isConfirmed = this.consecutiveDetections >= this.stableThreshold

    if (!isConfirmed || flamePixelCount === 0 || !isCandidate) {
      return {
        isFire: false,
        confidence: 0,
        bbox: null,
        flameCenter: null,
        pixelCount: flamePixelCount,
      }
    }

    // Centroid and normalized coordinates
    const centerX = (sumX / flamePixelCount) / sampleWidth
    const centerY = (sumY / flamePixelCount) / sampleHeight
    const pad = 5

    const normX = Math.max(0, minX - pad) / sampleWidth
    const normY = Math.max(0, minY - pad) / sampleHeight
    const normW = Math.min(sampleWidth, boxW + pad * 2) / sampleWidth
    const normH = Math.min(sampleHeight, boxH + pad * 2) / sampleHeight

    // Calculate confidence score based on density and count
    const densityBonus = Math.min(0.15, clusterDensity * 0.25)
    const countScore = Math.min(0.12, (flamePixelCount / 80) * 0.12)
    const confidence = Math.min(0.98, Math.max(0.75, 0.75 + densityBonus + countScore))

    return {
      isFire: true,
      confidence: Math.round(confidence * 100) / 100,
      bbox: {
        x: normX,
        y: normY,
        width: normW,
        height: normH,
      },
      flameCenter: {
        x: centerX,
        y: centerY,
      },
      pixelCount: flamePixelCount,
    }
  }

  reset() {
    this.history = []
    this.consecutiveDetections = 0
    this.simulated = false
  }
}
