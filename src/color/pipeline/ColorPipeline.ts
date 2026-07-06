import { ColorSpaceType } from "../core/Types";
import { ColorSpaceConverter } from "../core/ColorSpace";
import { GradingEngine } from "../grading/GradingEngine";
import { LutEngine } from "../lut/LutEngine";
import { AcesEngine } from "../aces/AcesEngine";
import { HdrEngine } from "../hdr/HdrEngine";
import { ScopeEngine } from "../scopes/ScopeEngine";
import { ColorAnalysisEngine, SceneColorReport } from "../analysis/ColorAnalysisEngine";

export class ColorPipeline {
  private static instance: ColorPipeline | null = null;

  private gradingEngine: GradingEngine;
  private lutEngine: LutEngine;
  private acesEngine: AcesEngine;
  private hdrEngine: HdrEngine;
  private scopeEngine: ScopeEngine;
  private analysisEngine: ColorAnalysisEngine;

  private inputSpace: ColorSpaceType = "Rec709";
  private outputSpace: ColorSpaceType = "Rec709";
  private isAcesWorkflowEnabled = false;

  private lastAnalysisReport: SceneColorReport | null = null;

  constructor() {
    this.gradingEngine = GradingEngine.getInstance();
    this.lutEngine = LutEngine.getInstance();
    this.acesEngine = AcesEngine.getInstance();
    this.hdrEngine = HdrEngine.getInstance();
    this.scopeEngine = ScopeEngine.getInstance();
    this.analysisEngine = ColorAnalysisEngine.getInstance();
  }

  public static getInstance(): ColorPipeline {
    if (!ColorPipeline.instance) {
      ColorPipeline.instance = new ColorPipeline();
    }
    return ColorPipeline.instance;
  }

  public setInputSpace(space: ColorSpaceType): void {
    this.inputSpace = space;
  }

  public getInputSpace(): ColorSpaceType {
    return this.inputSpace;
  }

  public setOutputSpace(space: ColorSpaceType): void {
    this.outputSpace = space;
  }

  public getOutputSpace(): ColorSpaceType {
    return this.outputSpace;
  }

  public enableAcesWorkflow(enable: boolean): void {
    this.isAcesWorkflowEnabled = enable;
  }

  public isAcesEnabled(): boolean {
    return this.isAcesWorkflowEnabled;
  }

  /**
   * PROCESS SINGLE COLOR TRIPLET THROUGH THE COMPREHENSIVE PIPELINE
   */
  public processColor(
    r: number, g: number, b: number,
    x: number, y: number,
    width: number, height: number,
    activeLutId: string | null = null,
    lutIntensity: number = 1.0
  ): [number, number, number] {
    let pr = r; let pg = g; let pb = b;

    if (this.isAcesWorkflowEnabled) {
      // --- ACES COLOR MANAGED PIPELINE WORKFLOW ---
      return this.acesEngine.processPipeline(r, g, b, (rw, gw, bw) => {
        // Grade inside ACEScc or ACEScct working spaces
        let graded = this.gradingEngine.gradePixel(rw, gw, bw, x, y, width, height);
        
        // Creative LUT Blending inside the linear working space (standard film grading)
        if (activeLutId) {
          graded = this.lutEngine.applyLut(graded[0], graded[1], graded[2], activeLutId, lutIntensity);
        }

        return graded;
      });
    }

    // --- STANDARD NON-ACES COLOR GRADED PIPELINE ---
    
    // Stage 1: Input Transform / Linearization (e.g., SLog3 to Linear Rec.709)
    const linear = ColorSpaceConverter.linearize(pr, pg, pb, this.inputSpace);
    pr = linear[0]; pg = linear[1]; pb = linear[2];

    // Stage 2: Color Space Primary adaptation
    const adaptive = ColorSpaceConverter.transformPrimaries(pr, pg, pb, this.inputSpace, "Rec709");
    pr = adaptive[0]; pg = adaptive[1]; pb = adaptive[2];

    // Stage 3: Grading & Curves Correction (Applied in linear or Rec709 Gamma 2.4)
    const graded = this.gradingEngine.gradePixel(pr, pg, pb, x, y, width, height);
    pr = graded[0]; pg = graded[1]; pb = graded[2];

    // Stage 4: Creative Look creation & LUT Engine
    if (activeLutId) {
      const lutApplied = this.lutEngine.applyLut(pr, pg, pb, activeLutId, lutIntensity);
      pr = lutApplied[0]; pg = lutApplied[1]; pg = lutApplied[1]; pb = lutApplied[2];
    }

    // Stage 5: Tone Mapping / HDR Range management
    const toneMapped = this.hdrEngine.toneMapColor(pr, pg, pb);
    pr = toneMapped[0]; pg = toneMapped[1]; pb = toneMapped[2];

    // Stage 6: Output / Display transform and Rec709 encoding (OETF encoding)
    const encoded = ColorSpaceConverter.transformPrimaries(pr, pg, pb, "Rec709", this.outputSpace);
    return ColorSpaceConverter.delinearize(encoded[0], encoded[1], encoded[2], this.outputSpace);
  }

  /**
   * PROCESS ENTIRE RGBA CANVAS FRAME BUFFER IN REALTIME
   * Directly mutates the frame canvas buffer according to active grading, color spaces, LUTs and masks.
   */
  public processFrameBuffer(
    rgbaData: Uint8ClampedArray,
    width: number,
    height: number,
    activeLutId: string | null = null,
    lutIntensity: number = 1.0
  ): void {
    const totalPixels = width * height;
    
    // Process every individual pixel through the non-destructive pipeline
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = rgbaData[idx] / 255;
      const g = rgbaData[idx + 1] / 255;
      const b = rgbaData[idx + 2] / 255;

      const px = i % width;
      const py = Math.floor(i / width);

      const processed = this.processColor(r, g, b, px, py, width, height, activeLutId, lutIntensity);

      rgbaData[idx] = Math.max(0, Math.min(255, Math.floor(processed[0] * 255)));
      rgbaData[idx + 1] = Math.max(0, Math.min(255, Math.floor(processed[1] * 255)));
      rgbaData[idx + 2] = Math.max(0, Math.min(255, Math.floor(processed[2] * 255)));
      // Leave Alpha intact
    }

    // Perform background async/realtime frame analysis on the newly graded output
    this.lastAnalysisReport = this.analysisEngine.analyzeFrame(rgbaData, width, height);
  }

  public getLastAnalysisReport(): SceneColorReport | null {
    return this.lastAnalysisReport;
  }

  /**
   * QUICK ANALYSIS RUNNER (returns scopes ready to mount into Canvas nodes)
   */
  public generateLiveScopes(
    rgbaData: Uint8ClampedArray,
    width: number,
    height: number
  ): {
    waveform: Uint8ClampedArray;
    parade: Uint8ClampedArray;
    vectorscope: Uint8ClampedArray;
    histogram: Uint8ClampedArray;
  } {
    return {
      waveform: this.scopeEngine.generateWaveform(rgbaData, width, height),
      parade: this.scopeEngine.generateRGBParade(rgbaData, width, height),
      vectorscope: this.scopeEngine.generateVectorscope(rgbaData, width, height),
      histogram: this.scopeEngine.generateHistogram(rgbaData)
    };
  }
}
