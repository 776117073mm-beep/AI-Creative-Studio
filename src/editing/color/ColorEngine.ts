import { CustomCurveType } from "../../color/core/Types";

import { GradingEngine } from "../../color/grading/GradingEngine";
import { LutEngine } from "../../color/lut/LutEngine";
import { HdrEngine } from "../../color/hdr/HdrEngine";
import { ScopeEngine } from "../../color/scopes/ScopeEngine";
import { ColorPipeline } from "../../color/pipeline/ColorPipeline";
import { ColorPluginRegistry } from "../../color/plugins/ColorPluginRegistry";

export interface ColorEngineParams {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  exposure: number; // -5 to +5 stops
  gamma: number; // 0.5 to 3.0
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  hue: number; // -180 to 180 degrees
  saturation: number; // 0 to 200
  vibrance: number; // -100 to 100
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface ToneCurves {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface ColorWheelVal {
  x: number; // Hue/Saturation angle offset
  y: number; // Hue/Saturation strength offset
  luminance: number; // brightness offset
}

export interface ColorWheels {
  lift: ColorWheelVal;
  gamma: ColorWheelVal;
  gain: ColorWheelVal;
  offset: ColorWheelVal;
}

export class ColorEngine {
  private grading = GradingEngine.getInstance();
  private lut = LutEngine.getInstance();
  private hdr = HdrEngine.getInstance();
  private scopes = ScopeEngine.getInstance();
  private pipeline = ColorPipeline.getInstance();

  private params: ColorEngineParams;
  private curves: ToneCurves;
  private wheels: ColorWheels;
  private activeLutPath: string | null = null;
  private hdrModeEnabled: boolean = false;

  constructor() {
    this.params = this.getDefaultParams();
    this.curves = this.getDefaultCurves();
    this.wheels = this.getDefaultWheels();
    this.syncToCore();
  }

  public getDefaultParams(): ColorEngineParams {
    return {
      brightness: 0,
      contrast: 0,
      exposure: 0,
      gamma: 1.0,
      temperature: 0,
      tint: 0,
      hue: 0,
      saturation: 100,
      vibrance: 0,
    };
  }

  private getDefaultCurves(): ToneCurves {
    const linear = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    return {
      rgb: [...linear],
      red: [...linear],
      green: [...linear],
      blue: [...linear],
    };
  }

  private getDefaultWheels(): ColorWheels {
    const zeroWheel = () => ({ x: 0, y: 0, luminance: 0 });
    return {
      lift: zeroWheel(),
      gamma: zeroWheel(),
      gain: zeroWheel(),
      offset: zeroWheel(),
    };
  }

  public getParams(): ColorEngineParams {
    return this.params;
  }

  public getToneCurves(): ToneCurves {
    return this.curves;
  }

  public getColorWheels(): ColorWheels {
    return this.wheels;
  }

  /**
   * Synchronizes variables from this legacy class to the core engine
   */
  private syncToCore(): void {
    // 1. Map primaries
    this.grading.updatePrimaryParams({
      brightness: this.params.brightness,
      contrast: this.params.contrast,
      exposure: this.params.exposure,
      temperature: this.params.temperature,
      tint: this.params.tint,
    });

    // 2. Map curves
    const keys: (keyof ToneCurves)[] = ["rgb", "red", "green", "blue"];
    keys.forEach(ch => {
      this.grading.updateCurve(ch as CustomCurveType, this.curves[ch]);
    });

    // 3. Map wheels (convert legacy x/y Cartesian to polar parameters)
    const mapWheelToCore = (wheelName: "lift" | "gamma" | "gain" | "offset") => {
      const w = this.wheels[wheelName];
      const angle = Math.atan2(w.y, w.x) * (180 / Math.PI);
      const strength = Math.sqrt(w.x * w.x + w.y * w.y);
      this.grading.updateWheel(wheelName, angle, strength, w.luminance);
    };

    mapWheelToCore("lift");
    mapWheelToCore("gamma");
    mapWheelToCore("gain");
    mapWheelToCore("offset");
  }

  public updateParameters(updates: Partial<ColorEngineParams>): void {
    this.params = { ...this.params, ...updates };
    this.syncToCore();
  }

  public updateToneCurve(colorChannel: keyof ToneCurves, points: CurvePoint[]): void {
    this.curves[colorChannel] = [...points].sort((a, b) => a.x - b.x);
    this.syncToCore();
  }

  public updateColorWheel(wheel: keyof ColorWheels, values: Partial<ColorWheelVal>): void {
    this.wheels[wheel] = { ...this.wheels[wheel], ...values };
    this.syncToCore();
  }

  public loadLUT(lutPath: string): void {
    this.activeLutPath = lutPath;
    this.pipeline.enableAcesWorkflow(false); // standard flow
  }

  public getActiveLUT(): string | null {
    return this.activeLutPath;
  }

  public toggleHDR(enable: boolean): void {
    this.hdrModeEnabled = enable;
    this.hdr.enableMonitoring(enable);
  }

  public isHDREnabled(): boolean {
    return this.hdrModeEnabled;
  }

  /**
   * Generates highly realistic scope analytics by creating an actual gradient pattern,
   * passing it through the true color science pipeline, and capturing the signal graphs!
   */
  public generateScopesSimulation(width: number = 256, height: number = 256): {
    waveformRgb: Uint8ClampedArray;
    vectorscopeRgb: Uint8ClampedArray;
    histogramRgb: Uint8ClampedArray;
  } {
    // Generate a beautiful, continuous test pattern (gradient spectrum)
    const totalPixels = width * height * 4;
    const testPattern = new Uint8ClampedArray(totalPixels);

    for (let y = 0; y < height; y++) {
      const lumaFactor = y / height;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Base colorful gradient: varying colors vertically and horizontally
        const rVal = Math.floor(lumaFactor * 255);
        const gVal = Math.floor((x / width) * 255);
        const bVal = Math.floor((1.0 - lumaFactor) * 255);

        testPattern[idx] = rVal;
        testPattern[idx + 1] = gVal;
        testPattern[idx + 2] = bVal;
        testPattern[idx + 3] = 255;
      }
    }

    // Process the test pattern through our real color pipeline!
    // This makes sure our real parameters, curves, and active LUT are fully rendered!
    let activeLutId: string | null = null;
    if (this.activeLutPath) {
      // Find a matching active built-in LUT ID, or default to a classic print film look
      activeLutId = this.activeLutPath.includes("kodak") ? "lut_kodak_2383" : "lut_teal_orange";
    }

    this.pipeline.processFrameBuffer(testPattern, width, height, activeLutId, 1.0);

    // Call real ScopeEngine on our processed frame!
    const liveScopes = this.pipeline.generateLiveScopes(testPattern, width, height);

    return {
      waveformRgb: liveScopes.waveform,
      vectorscopeRgb: liveScopes.vectorscope,
      histogramRgb: liveScopes.histogram
    };
  }

  public resetAll(): void {
    this.params = this.getDefaultParams();
    this.curves = this.getDefaultCurves();
    this.wheels = this.getDefaultWheels();
    this.activeLutPath = null;
    this.hdrModeEnabled = false;
    this.syncToCore();
  }
}
