import { ColorSpaceType } from "../core/Types";
import { ColorSpaceConverter } from "../core/ColorSpace";

export interface AcesConfiguration {
  idt: ColorSpaceType; // Input Device Transform
  odt: ColorSpaceType; // Output Device Transform
  workingSpace: "ACEScg" | "ACEScc" | "ACEScct"; // Color grading space
  applyRrt: boolean; // Reference Rendering Transform
}

export class AcesEngine {
  private static instance: AcesEngine | null = null;
  private currentConfig: AcesConfiguration;

  constructor() {
    this.currentConfig = {
      idt: "SLog3",
      odt: "Rec709",
      workingSpace: "ACEScct",
      applyRrt: true
    };
  }

  public static getInstance(): AcesEngine {
    if (!AcesEngine.instance) {
      AcesEngine.instance = new AcesEngine();
    }
    return AcesEngine.instance;
  }

  public configure(config: Partial<AcesConfiguration>): void {
    this.currentConfig = { ...this.currentConfig, ...config };
  }

  public getConfig(): AcesConfiguration {
    return this.currentConfig;
  }

  /**
   * Run full Input Device Transform (IDT)
   * Converts camera raw or camera log (S-Log3, LogC, etc.) to ACES AP0 Linear.
   */
  public inputTransform(r: number, g: number, b: number): [number, number, number] {
    const space = this.currentConfig.idt;
    // 1. Convert to linear RGB
    const linearRGB = ColorSpaceConverter.linearize(r, g, b, space);
    // 2. Transform Primaries to AP0 (represented by ACEScc/ACEScg bounds)
    return ColorSpaceConverter.transformPrimaries(
      linearRGB[0], linearRGB[1], linearRGB[2],
      space,
      "ACEScg"
    );
  }

  /**
   * Translates ACES AP0 Linear data to the Working Grading space (ACEScc or ACEScct).
   * This is logarithmic, providing analog wheel behavior for grading.
   */
  public toWorkingSpace(r: number, g: number, b: number): [number, number, number] {
    const space = this.currentConfig.workingSpace;
    // ACEScg (AP1 linear) -> ACEScc / ACEScct (AP1 log)
    return ColorSpaceConverter.delinearize(r, g, b, space);
  }

  /**
   * Translates graded colors from the Working Grading space back to ACES linear AP0.
   */
  public fromWorkingSpace(r: number, g: number, b: number): [number, number, number] {
    const space = this.currentConfig.workingSpace;
    // ACEScc / ACEScct (AP1 log) -> ACEScg (AP1 linear)
    return ColorSpaceConverter.linearize(r, g, b, space);
  }

  /**
   * Reference Rendering Transform (RRT)
   * Simulates the highly complex ACES photographic tone-reproduction film system.
   * Compresses high dynamic range (0 to 100 nits/stops) with cinematic shoulder curves.
   */
  public referenceRenderingTransform(r: number, g: number, b: number): [number, number, number] {
    if (!this.currentConfig.applyRrt) return [r, g, b];

    // Reference mathematical approximation of the ACES RRT tone scale
    const rrtScurve = (val: number): number => {
      if (val <= 0) return 0;
      const x = val;
      const a = 2.43;
      const b = 0.03;
      const c = 2.43;
      const d = 0.59;
      const e = 0.14;
      return (x * (a * x + b)) / (x * (c * x + d) + e);
    };

    return [rrtScurve(r), rrtScurve(g), rrtScurve(b)];
  }

  /**
   * Run full Output Device Transform (ODT)
   * Transforms Reference or Linear ACES to target monitor display space (Rec.709, Rec.2020, etc.).
   */
  public outputTransform(r: number, g: number, b: number): [number, number, number] {
    const space = this.currentConfig.odt;

    // 1. Transform primaries from AP1 (ACEScg) to output color space primaries
    const displayLinear = ColorSpaceConverter.transformPrimaries(r, g, b, "ACEScg", space);

    // 2. Apply display non-linear OETF curve (standard display gamma or PQ)
    return ColorSpaceConverter.delinearize(displayLinear[0], displayLinear[1], displayLinear[2], space);
  }

  /**
   * Run full color-managed pipeline from Input to Display
   */
  public processPipeline(r: number, g: number, b: number, gradingCallback: (rW: number, gW: number, bW: number) => [number, number, number]): [number, number, number] {
    // Stage 1: IDT (Camera -> ACES AP1 Linear)
    const idtOut = this.inputTransform(r, g, b);

    // Stage 2: Transform to log Working space (ACEScc/ACEScct)
    const workingIn = this.toWorkingSpace(idtOut[0], idtOut[1], idtOut[2]);

    // Stage 3: Apply professional color grading parameters (Wheels, Curves, etc.)
    const workingOut = gradingCallback(workingIn[0], workingIn[1], workingIn[2]);

    // Stage 4: Transform graded color back to ACES Linear
    const linearGraded = this.fromWorkingSpace(workingOut[0], workingOut[1], workingOut[2]);

    // Stage 5: Reference Rendering Transform (RRT film look simulation)
    const rrtOut = this.referenceRenderingTransform(linearGraded[0], linearGraded[1], linearGraded[2]);

    // Stage 6: ODT (Output Transform to monitor space e.g. Rec709 display)
    return this.outputTransform(rrtOut[0], rrtOut[1], rrtOut[2]);
  }
}
