import { CurvePoint } from "../core/Types";
import { GradingEngine } from "../grading/GradingEngine";

export class ColorMatchEngine {
  private static instance: ColorMatchEngine | null = null;

  constructor() {}

  public static getInstance(): ColorMatchEngine {
    if (!ColorMatchEngine.instance) {
      ColorMatchEngine.instance = new ColorMatchEngine();
    }
    return ColorMatchEngine.instance;
  }

  /**
   * AUTOMATIC SHOT MATCHING VIA HISTOGRAM SPECIFICATION / MATCHING
   * Compares source and reference image arrays, computes mapping curves, 
   * and populates non-destructive grading curves automatically.
   */
  public matchShots(
    sourcePixels: Uint8ClampedArray,
    refPixels: Uint8ClampedArray
  ): {
    redCurve: CurvePoint[];
    greenCurve: CurvePoint[];
    blueCurve: CurvePoint[];
  } {
    // 1. Calculate histograms for Source & Reference
    const sHistR = new Float32Array(256);
    const sHistG = new Float32Array(256);
    const sHistB = new Float32Array(256);

    const rHistR = new Float32Array(256);
    const rHistG = new Float32Array(256);
    const rHistB = new Float32Array(256);

    const sCount = sourcePixels.length / 4;
    const rCount = refPixels.length / 4;

    // Downsample loop for performance
    const sStep = Math.max(1, Math.floor(sCount / 5000));
    const rStep = Math.max(1, Math.floor(rCount / 5000));

    let sTotal = 0;
    for (let i = 0; i < sCount; i += sStep) {
      const idx = i * 4;
      sHistR[sourcePixels[idx]]++;
      sHistG[sourcePixels[idx + 1]]++;
      sHistB[sourcePixels[idx + 2]]++;
      sTotal++;
    }

    let rTotal = 0;
    for (let i = 0; i < rCount; i += rStep) {
      const idx = i * 4;
      rHistR[refPixels[idx]]++;
      rHistG[refPixels[idx + 1]]++;
      rHistB[refPixels[idx + 2]]++;
      rTotal++;
    }

    // 2. Compute Cumulative Distribution Functions (CDFs)
    const sCdfR = new Float32Array(256);
    const sCdfG = new Float32Array(256);
    const sCdfB = new Float32Array(256);

    const rCdfR = new Float32Array(256);
    const rCdfG = new Float32Array(256);
    const rCdfB = new Float32Array(256);

    let sumSR = 0, sumSG = 0, sumSB = 0;
    let sumRR = 0, sumRG = 0, sumRB = 0;

    for (let i = 0; i < 256; i++) {
      sumSR += sHistR[i]; sCdfR[i] = sumSR / sTotal;
      sumSG += sHistG[i]; sCdfG[i] = sumSG / sTotal;
      sumSB += sHistB[i]; sCdfB[i] = sumSB / sTotal;

      sumRR += rHistR[i]; rCdfR[i] = sumRR / rTotal;
      sumRG += rHistG[i]; rCdfG[i] = sumRG / rTotal;
      sumRB += rHistB[i]; rCdfB[i] = sumRB / rTotal;
    }

    // 3. Perform CDF mapping specification (Find closest reference match for each source bucket)
    const mapChannel = (sCdf: Float32Array, rCdf: Float32Array): CurvePoint[] => {
      const lookup = new Uint8Array(256);
      let refIdx = 0;

      for (let sIdx = 0; sIdx < 256; sIdx++) {
        const sVal = sCdf[sIdx];
        // Find b such that rCdf[b] is closest to sCdf[a]
        while (refIdx < 255 && rCdf[refIdx] < sVal) {
          refIdx++;
        }
        lookup[sIdx] = refIdx;
      }

      // Convert lookup into smooth, simplified spline-ready curve points (downsample to 8 key curve nodes)
      const points: CurvePoint[] = [];
      const numNodes = 8;
      for (let i = 0; i < numNodes; i++) {
        const bin = Math.floor((i / (numNodes - 1)) * 255);
        const mappedBin = lookup[bin];
        points.push({
          x: bin / 255,
          y: mappedBin / 255
        });
      }

      return points;
    };

    const redCurve = mapChannel(sCdfR, rCdfR);
    const greenCurve = mapChannel(sCdfG, rCdfG);
    const blueCurve = mapChannel(sCdfB, rCdfB);

    // 4. Update the active GradingEngine with matched curves
    const grading = GradingEngine.getInstance();
    grading.updateCurve("red", redCurve);
    grading.updateCurve("green", greenCurve);
    grading.updateCurve("blue", blueCurve);

    return { redCurve, greenCurve, blueCurve };
  }

  /**
   * SCENE MATCHING MATRIX CODES
   * Normalizes black and white points of a source frame based on average anchor points of a target
   */
  public matchSceneLuminance(sourcePixels: Uint8ClampedArray, targetPixels: Uint8ClampedArray): void {
    let sSum = 0;
    let sMin = 255;
    let sMax = 0;

    let tSum = 0;
    let tMin = 255;
    let tMax = 0;

    const sStep = Math.max(1, Math.floor(sourcePixels.length / 4000));
    const tStep = Math.max(1, Math.floor(targetPixels.length / 4000));

    let sCount = 0;
    for (let i = 0; i < sourcePixels.length; i += sStep * 4) {
      const l = 0.2126 * sourcePixels[i] + 0.7152 * sourcePixels[i+1] + 0.0722 * sourcePixels[i+2];
      sSum += l;
      if (l < sMin) sMin = l;
      if (l > sMax) sMax = l;
      sCount++;
    }

    let tCount = 0;
    for (let i = 0; i < targetPixels.length; i += tStep * 4) {
      const l = 0.2126 * targetPixels[i] + 0.7152 * targetPixels[i+1] + 0.0722 * targetPixels[i+2];
      tSum += l;
      if (l < tMin) tMin = l;
      if (l > tMax) tMax = l;
      tCount++;
    }

    const sAvg = sSum / (sCount || 1);
    const tAvg = tSum / (tCount || 1);

    // Solve for matching exposure offset & contrast pivot factors non-destructively
    const scaleFactor = (tMax - tMin) / Math.max(1, sMax - sMin);
    const exposureStopShift = Math.log2(tAvg / Math.max(0.1, sAvg));

    const grading = GradingEngine.getInstance();
    grading.updatePrimaryParams({
      exposure: Math.max(-3.0, Math.min(3.0, exposureStopShift)),
      contrast: Math.max(-50, Math.min(50, (scaleFactor - 1.0) * 100)),
      blackPoint: Math.round(tMin),
      whitePoint: Math.round(tMax)
    });
  }
}
