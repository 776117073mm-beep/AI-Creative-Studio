export interface SceneColorReport {
  averageLuminance: number; // 0 to 255
  contrastRatio: number; // ratio value
  clippedHighlightsPercent: number; // percentage of pixels above 240
  clippedShadowsPercent: number; // percentage of pixels below 15
  dominantHueAngle: number; // 0 to 360
  skinToneExposure: number; // average luminance of skin pixels, -1 if none
  skinToneCoveragePercent: number; // percentage of image containing skin tones
  estimatedTemperatureNits: number; // estimated Kelvin warmness
}

export class ColorAnalysisEngine {
  private static instance: ColorAnalysisEngine | null = null;

  constructor() {}

  public static getInstance(): ColorAnalysisEngine {
    if (!ColorAnalysisEngine.instance) {
      ColorAnalysisEngine.instance = new ColorAnalysisEngine();
    }
    return ColorAnalysisEngine.instance;
  }

  /**
   * FULL COMPREHENSIVE IMAGE SIGNAL ANALYSIS
   * Audits the raw frames to detect shadow clippings, highlight limits, skin regions, and key luminance curves
   */
  public analyzeFrame(rgbaData: Uint8ClampedArray, width: number, height: number): SceneColorReport {
    let lumaSum = 0;
    let lumaSqSum = 0;
    let highlightCount = 0;
    let shadowCount = 0;

    let skinLumaSum = 0;
    let skinPixelCount = 0;

    const hueCounts = new Uint32Array(360);
    const totalPixels = width * height;

    // Process downsampled grid for high-speed analysis
    const step = Math.max(1, Math.floor(totalPixels / 6000));
    let sampleCount = 0;

    let redSum = 0;
    let blueSum = 0;

    for (let i = 0; i < totalPixels; i += step) {
      const idx = i * 4;
      const r = rgbaData[idx];
      const g = rgbaData[idx + 1];
      const b = rgbaData[idx + 2];

      redSum += r;
      blueSum += b;

      // ITU-R BT.709 Luma
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lumaSum += luma;
      lumaSqSum += luma * luma;

      if (luma > 240) highlightCount++;
      if (luma < 15) shadowCount++;

      // 1. SKIN TONE ISOLATION MATHEMATICS
      // In YCbCr space, skin tones (regardless of ethnicity) fall into a very narrow Cb/Cr range
      // Cb is roughly [-30, -5] and Cr is roughly [10, 45] (or normalized chroma angles ~ 123 degrees)
      const cb = -0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 0.5 * r - 0.418688 * g - 0.081312 * b;

      if (cb >= -35 && cb <= -3 && cr >= 8 && cr <= 48) {
        skinLumaSum += luma;
        skinPixelCount++;
      }

      // 2. DOMINANT HUE ANGLE CALCULATION
      // RGB -> Hue angle
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max !== min) {
        const d = max - min;
        let h = 0;
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        const angle = Math.floor(h * 60) % 360;
        hueCounts[angle]++;
      }

      sampleCount++;
    }

    const avgLuma = lumaSum / (sampleCount || 1);
    const meanSq = lumaSqSum / (sampleCount || 1);
    const standardDeviation = Math.sqrt(Math.max(0, meanSq - avgLuma * avgLuma));

    // Dynamic contrast ratio calculation based on standard deviations
    const contrastRatio = (avgLuma + 2 * standardDeviation) / Math.max(1.0, avgLuma - 2 * standardDeviation);

    // Find peak dominant hue channel
    let peakHueAngle = 0;
    let maxHueCount = 0;
    for (let angle = 0; angle < 360; angle++) {
      if (hueCounts[angle] > maxHueCount) {
        maxHueCount = hueCounts[angle];
        peakHueAngle = angle;
      }
    }

    const skinToneExposure = skinPixelCount > 0 ? skinLumaSum / skinPixelCount : -1;
    const skinToneCoverage = (skinPixelCount / sampleCount) * 100;

    // Estimate relative warmth temperature (Kelvin ratio representation)
    const redBlueRatio = redSum / Math.max(1.0, blueSum);
    const estimatedKelvin = 5500 + (1.0 - redBlueRatio) * 3500;

    return {
      averageLuminance: Math.round(avgLuma),
      contrastRatio: parseFloat(contrastRatio.toFixed(2)),
      clippedHighlightsPercent: parseFloat(((highlightCount / sampleCount) * 100).toFixed(2)),
      clippedShadowsPercent: parseFloat(((shadowCount / sampleCount) * 100).toFixed(2)),
      dominantHueAngle: peakHueAngle,
      skinToneExposure: skinToneExposure !== -1 ? Math.round(skinToneExposure) : -1,
      skinToneCoveragePercent: parseFloat(skinToneCoverage.toFixed(2)),
      estimatedTemperatureNits: Math.round(estimatedKelvin)
    };
  }

  /**
   * COLOR DISTRIBUTION HISTOGRAM PLOT
   * Analyzes percentage layout across standard color buckets
   */
  public getColorDistribution(rgbaData: Uint8ClampedArray): Record<string, number> {
    let rSum = 0, gSum = 0, bSum = 0;
    const total = rgbaData.length;
    const step = Math.max(4, Math.floor(total / 2000) * 4);

    let count = 0;
    for (let i = 0; i < total; i += step) {
      rSum += rgbaData[i];
      gSum += rgbaData[i + 1];
      bSum += rgbaData[i + 2];
      count++;
    }

    const totalChannels = rSum + gSum + bSum || 1;
    return {
      red: parseFloat(((rSum / totalChannels) * 100).toFixed(1)),
      green: parseFloat(((gSum / totalChannels) * 100).toFixed(1)),
      blue: parseFloat(((bSum / totalChannels) * 100).toFixed(1))
    };
  }
}
