export type HdrStandard = "HDR10" | "HDR10_Plus" | "HLG" | "DolbyVision";
export type ToneMappingOperator = "Reinhard" | "ACES_Film" | "Hable" | "None";

export interface HdrMetadata {
  standard: HdrStandard;
  maxContentLightLevel: number; // MaxCLL (nits, e.g. 1000)
  maxFrameAverageLightLevel: number; // MaxFALL (nits, e.g. 400)
  masteringDisplayLuminance: { min: number; max: number }; // nits
  dolbyVisionVersion?: string;
}

export class HdrEngine {
  private static instance: HdrEngine | null = null;
  private isHdrMonitoringEnabled = false;
  private currentMetadata: HdrMetadata | null = null;
  private toneMappingOperator: ToneMappingOperator = "ACES_Film";
  private targetPeakBrightness = 100; // nits (SDR standard)

  constructor() {
    this.currentMetadata = {
      standard: "HDR10",
      maxContentLightLevel: 1000,
      maxFrameAverageLightLevel: 400,
      masteringDisplayLuminance: { min: 0.005, max: 1000 }
    };
  }

  public static getInstance(): HdrEngine {
    if (!HdrEngine.instance) {
      HdrEngine.instance = new HdrEngine();
    }
    return HdrEngine.instance;
  }

  public enableMonitoring(enable: boolean): void {
    this.isHdrMonitoringEnabled = enable;
  }

  public isMonitoringEnabled(): boolean {
    return this.isHdrMonitoringEnabled;
  }

  public setHdrMetadata(meta: HdrMetadata): void {
    this.currentMetadata = { ...meta };
  }

  public getHdrMetadata(): HdrMetadata | null {
    return this.currentMetadata;
  }

  public setToneMappingOperator(op: ToneMappingOperator): void {
    this.toneMappingOperator = op;
  }

  public getToneMappingOperator(): ToneMappingOperator {
    return this.toneMappingOperator;
  }

  public setTargetPeakBrightness(nits: number): void {
    this.targetPeakBrightness = nits;
  }

  public getTargetPeakBrightness(): number {
    return this.targetPeakBrightness;
  }

  /**
   * SMPTE ST 2084 Perceptual Quantizer (PQ) EOTF
   * Converts digital code values to absolute luminance (nits)
   */
  public pqEotf(v: number): number {
    const m1 = 2610 / 16384;
    const m2 = 2523 / 32;
    const c1 = 3424 / 4096;
    const c2 = 2413 / 4096;
    const c3 = 2392 / 4096;

    const vPow = Math.pow(v, 1 / m2);
    const num = Math.max(0, vPow - c1);
    const den = c2 - c3 * vPow;
    const l = Math.pow(num / den, 1 / m1);

    return l * 10000; // Peak luminance scale 10,000 nits
  }

  /**
   * SMPTE ST 2084 Perceptual Quantizer (PQ) Inverse EOTF (OETF)
   * Converts absolute luminance (nits) to digital code values
   */
  public pqOetf(l: number): number {
    const y = Math.max(0.0, Math.min(1.0, l / 10000));
    const m1 = 2610 / 16384;
    const m2 = 2523 / 32;
    const c1 = 3424 / 4096;
    const c2 = 2413 / 4096;
    const c3 = 2392 / 4096;

    const yPow = Math.pow(y, m1);
    const num = c1 + c2 * yPow;
    const den = 1 + c3 * yPow;
    return Math.pow(num / den, m2);
  }

  /**
   * Hybrid Log-Gamma (HLG) standard OETF
   */
  public hlgOetf(l: number): number {
    const a = 0.17883277;
    const b = 1 - 4 * a;
    const c = 0.5 - a * Math.log(4 * a);

    if (l <= 1 / 12) {
      return Math.sqrt(3 * l);
    }
    return a * Math.log(12 * l - b) + c;
  }

  /**
   * Hybrid Log-Gamma (HLG) standard Inverse EOTF
   */
  public hlgEotf(v: number): number {
    const a = 0.17883277;
    const b = 1 - 4 * a;
    const c = 0.5 - a * Math.log(4 * a);

    if (v <= 0.5) {
      return (v * v) / 3;
    }
    return (Math.exp((v - c) / a) + b) / 12;
  }

  /**
   * Translates High Dynamic Range color (0.0 to 100.0+ linear values)
   * to SDR color space (0.0 to 1.0) using modern tone-mapping operators.
   */
  public toneMapColor(r: number, g: number, b: number): [number, number, number] {
    if (this.toneMappingOperator === "None") {
      return [
        Math.max(0, Math.min(1, r)),
        Math.max(0, Math.min(1, g)),
        Math.max(0, Math.min(1, b))
      ];
    }

    if (this.toneMappingOperator === "Reinhard") {
      // Classic Reinhard operator
      const rM = r / (r + 1.0);
      const gM = g / (g + 1.0);
      const bM = b / (b + 1.0);
      return [rM, gM, bM];
    }

    if (this.toneMappingOperator === "Hable") {
      // Uncharted 2 filmic tone mapper
      const hable = (x: number) => {
        const A = 0.15;
        const B = 0.50;
        const C = 0.10;
        const D = 0.20;
        const E = 0.02;
        const F = 0.30;
        return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
      };
      const w = 11.2;
      const whiteScale = 1.0 / hable(w);
      return [hable(r) * whiteScale, hable(g) * whiteScale, hable(b) * whiteScale];
    }

    // Default: ACES Filmic Tone Mapping approximation
    const acesFilmic = (x: number) => {
      const a = 2.51;
      const b = 0.03;
      const c = 2.43;
      const d = 0.59;
      const e = 0.14;
      return (x * (a * x + b)) / (x * (c * x + d) + e);
    };

    return [
      Math.max(0.0, Math.min(1.0, acesFilmic(r))),
      Math.max(0.0, Math.min(1.0, acesFilmic(g))),
      Math.max(0.0, Math.min(1.0, acesFilmic(b)))
    ];
  }

  /**
   * Generates standard HDR dynamic tone mapping curves representing Dolby Vision metadata blocks
   */
  public generateDolbyVisionDynamicCurves(sceneLumaAvg: number): {
    toneCurvePoints: { x: number; y: number }[];
    saturationBoost: number;
  } {
    // Dolby Vision adjusts mapping dynamic to average scene brightness
    const points: { x: number; y: number }[] = [];
    const compressionFactor = Math.max(0.2, Math.min(1.0, 1.0 / (sceneLumaAvg + 0.5)));

    for (let i = 0; i <= 10; i++) {
      const x = i / 10;
      // High average luma triggers strong highlight compression to protect details
      const y = Math.pow(x, compressionFactor);
      points.push({ x, y });
    }

    return {
      toneCurvePoints: points,
      saturationBoost: 1.0 + (1.0 - compressionFactor) * 0.3 // compensate saturation loss in compression
    };
  }
}
