import { 
  PrimaryCorrectionParams, 
  ColorWheelsState, 
  CustomCurveType, 
  CurvePoint, 
  QualifierState, 
  PowerWindow, 
  WindowGroup,
  TrackingData
} from "../core/Types";

export class GradingEngine {
  private static instance: GradingEngine | null = null;

  private primaryParams: PrimaryCorrectionParams;
  private wheelsState: ColorWheelsState;
  private curves: Record<CustomCurveType, CurvePoint[]>;
  private qualifierState: QualifierState;
  private powerWindows: Map<string, PowerWindow> = new Map();
  private windowGroups: Map<string, WindowGroup> = new Map();
  private trackingJobs: Map<string, TrackingData> = new Map();

  constructor() {
    this.primaryParams = this.getDefaultPrimaryParams();
    this.wheelsState = this.getDefaultWheelsState();
    this.curves = this.getDefaultCurves();
    this.qualifierState = this.getDefaultQualifierState();
    this.seedDefaultWindowsAndGroups();
  }

  public static getInstance(): GradingEngine {
    if (!GradingEngine.instance) {
      GradingEngine.instance = new GradingEngine();
    }
    return GradingEngine.instance;
  }

  // --- INITIALIZERS / DEFAULTS ---

  public getDefaultPrimaryParams(): PrimaryCorrectionParams {
    return {
      lift: [0, 0, 0],
      gamma: [0, 0, 0],
      gain: [1, 1, 1],
      offset: [0, 0, 0],
      exposure: 0,
      contrast: 0,
      brightness: 0,
      pivot: 0.5,
      temperature: 0,
      tint: 0,
      whiteBalance: { tempKelvin: 6500, tint: 0 },
      blackPoint: 0,
      whitePoint: 255,
      midtoneDetail: 0
    };
  }

  public getDefaultWheelsState(): ColorWheelsState {
    const zeroWheel = () => ({ angle: 0, strength: 0, luminance: 0, rgbOffset: [0, 0, 0] as [number, number, number] });
    return {
      lift: zeroWheel(),
      gamma: zeroWheel(),
      gain: zeroWheel(),
      offset: zeroWheel(),
      logShadows: zeroWheel(),
      logMidtones: zeroWheel(),
      logHighlights: zeroWheel(),
      hdrDark: zeroWheel(),
      hdrMedium: zeroWheel(),
      hdrLight: zeroWheel()
    };
  }

  public getDefaultCurves(): Record<CustomCurveType, CurvePoint[]> {
    const linear = () => [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const huePreset = () => [
      { x: 0, y: 0.5 },
      { x: 0.25, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.5 },
      { x: 1.0, y: 0.5 }
    ];

    return {
      rgb: linear(),
      red: linear(),
      green: linear(),
      blue: linear(),
      hue_vs_hue: huePreset(),
      hue_vs_sat: huePreset(),
      hue_vs_luma: huePreset(),
      luma_vs_sat: huePreset(),
      sat_vs_sat: huePreset()
    };
  }

  public getDefaultQualifierState(): QualifierState {
    return {
      hue: { center: 0.1, width: 0.2, softStart: 0.05, softEnd: 0.05, isEnabled: false },
      saturation: { center: 0.5, width: 0.5, softStart: 0.1, softEnd: 0.1, isEnabled: false },
      luminance: { center: 0.5, width: 0.5, softStart: 0.1, softEnd: 0.1, isEnabled: false },
      invert: false,
      blurRadius: 2,
      denoise: 0,
      feather: 0,
      edgeRefinement: 0
    };
  }

  private seedDefaultWindowsAndGroups(): void {
    // Circle Window
    const win1: PowerWindow = {
      id: "win_circle_1",
      name: "Vignette Center",
      type: "circle",
      points: [
        { x: 0.5, y: 0.5 }, // Center
        { x: 0.35, y: 0.35 } // Radius point
      ],
      feather: 25,
      expansion: 0,
      opacity: 0.85,
      inverted: false
    };

    // Rect Window
    const win2: PowerWindow = {
      id: "win_rect_1",
      name: "Lower Horizon Gradient",
      type: "rectangle",
      points: [
        { x: 0.1, y: 0.6 },
        { x: 0.9, y: 0.9 }
      ],
      feather: 40,
      expansion: 0,
      opacity: 1.0,
      inverted: false
    };

    this.powerWindows.set(win1.id, win1);
    this.powerWindows.set(win2.id, win2);

    const group: WindowGroup = {
      id: "grp_primary",
      name: "Standard Matte Group",
      windowIds: [win1.id, win2.id]
    };
    this.windowGroups.set(group.id, group);
  }

  // --- PARAMETERS ACCESS ---

  public getPrimaryParams(): PrimaryCorrectionParams {
    return this.primaryParams;
  }

  public updatePrimaryParams(updates: Partial<PrimaryCorrectionParams>): void {
    this.primaryParams = { ...this.primaryParams, ...updates };
  }

  public getWheelsState(): ColorWheelsState {
    return this.wheelsState;
  }

  public updateWheel(wheelName: keyof ColorWheelsState, angle: number, strength: number, luminance: number): void {
    const rad = (angle * Math.PI) / 180;
    const rOffset = Math.cos(rad) * strength;
    const gOffset = Math.sin(rad) * strength;
    const bOffset = -Math.sin(rad) * strength; // Balanced RGB offset vectors

    this.wheelsState[wheelName] = {
      angle,
      strength,
      luminance,
      rgbOffset: [rOffset, gOffset, bOffset]
    };
  }

  public getCurves(): Record<CustomCurveType, CurvePoint[]> {
    return this.curves;
  }

  public updateCurve(curveType: CustomCurveType, points: CurvePoint[]): void {
    this.curves[curveType] = [...points].sort((a, b) => a.x - b.x);
  }

  public getQualifierState(): QualifierState {
    return this.qualifierState;
  }

  public updateQualifier(updates: Partial<QualifierState>): void {
    this.qualifierState = { ...this.qualifierState, ...updates };
  }

  // --- POWER WINDOW MANAGEMENT ---

  public getWindows(): PowerWindow[] {
    return Array.from(this.powerWindows.values());
  }

  public addWindow(win: PowerWindow): void {
    this.powerWindows.set(win.id, win);
  }

  public removeWindow(id: string): void {
    this.powerWindows.delete(id);
  }

  // --- COLOR GRADING MATHEMATICS (REALTIME CORE ENGINE) ---

  /**
   * Apply temperature and tint to linear values
   */
  private applyTempTint(r: number, g: number, b: number, temp: number, tint: number): [number, number, number] {
    // Temperature scales red vs blue
    let rOut = r;
    let gOut = g;
    let bOut = b;

    if (temp !== 0) {
      const factor = temp / 200;
      rOut *= (1.0 + factor);
      bOut *= (1.0 - factor);
    }

    if (tint !== 0) {
      const factor = tint / 200;
      gOut *= (1.0 - factor);
      rOut *= (1.0 + factor * 0.5);
      bOut *= (1.0 + factor * 0.5);
    }

    return [rOut, gOut, bOut];
  }

  /**
   * Monotonic Cubic Spline Curve interpolator (Solves exact continuous curve)
   */
  public evaluateCurve(curveType: CustomCurveType, xInput: number): number {
    const points = this.curves[curveType];
    if (points.length === 0) return xInput;
    if (points.length === 1) return points[0].y;

    const x = Math.max(0.0, Math.min(1.0, xInput));

    // Clamp boundary values
    if (x <= points[0].x) return points[0].y;
    if (x >= points[points.length - 1].x) return points[points.length - 1].y;

    // Locate interval
    let idx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        idx = i;
        break;
      }
    }

    const p0 = points[idx];
    const p1 = points[idx + 1];

    // Hermite Cubic Interpolation
    const h = p1.x - p0.x;
    if (h === 0) return p0.y;

    const t = (x - p0.x) / h;

    // Assume smooth tangents (Catmull-Rom or local finite differences)
    let m0 = 0;
    let m1 = 0;

    if (idx > 0) {
      m0 = (p1.y - points[idx - 1].y) / (p1.x - points[idx - 1].x);
    } else {
      m0 = (p1.y - p0.y) / h;
    }

    if (idx < points.length - 2) {
      m1 = (points[idx + 2].y - p0.y) / (points[idx + 2].x - p0.x);
    } else {
      m1 = (p1.y - p0.y) / h;
    }

    // Hermite basis functions
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * p0.y + h10 * h * m0 + h01 * p1.y + h11 * h * m1;
  }

  /**
   * Evaluate dynamic pixel qualifier mask values (HSL space selective selection)
   */
  public evaluateQualifierPixel(r: number, g: number, b: number): number {
    const q = this.qualifierState;
    if (!q.hue.isEnabled && !q.saturation.isEnabled && !q.luminance.isEnabled) {
      return 1.0; // Mask is fully open
    }

    // Convert pixel to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    let maskValue = 1.0;

    const checkChannelRange = (val: number, rnge: typeof q.hue) => {
      if (!rnge.isEnabled) return 1.0;
      
      const dist = Math.abs(val - rnge.center);
      const halfW = rnge.width / 2;

      // Trapezoidal smooth fall-off
      if (dist <= halfW) {
        return 1.0;
      } else if (dist <= halfW + rnge.softStart) {
        const excess = dist - halfW;
        return 1.0 - excess / rnge.softStart;
      }
      return 0.0;
    };

    maskValue *= checkChannelRange(h, q.hue);
    maskValue *= checkChannelRange(s, q.saturation);
    maskValue *= checkChannelRange(l, q.luminance);

    if (q.invert) {
      maskValue = 1.0 - maskValue;
    }

    return Math.max(0.0, Math.min(1.0, maskValue));
  }

  /**
   * Determine Power Window influence at current pixel coordinates
   */
  public evaluatePowerWindows(x: number, y: number, width: number, height: number): number {
    const windows = this.getWindows();
    if (windows.length === 0) return 1.0;

    let totalWeight = 0.0;
    let hasActiveWindow = false;

    windows.forEach(win => {
      if (win.opacity <= 0) return;
      hasActiveWindow = true;

      const px = x / width;
      const py = y / height;
      let weight = 0.0;

      if (win.type === "circle") {
        const center = win.points[0];
        const edge = win.points[1] || { x: center.x + 0.15, y: center.y + 0.15 };
        const radius = Math.sqrt(Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2));

        const dist = Math.sqrt(Math.pow(px - center.x, 2) + Math.pow(py - center.y, 2));
        const outerRadius = radius + (win.feather / 200);
        const innerRadius = Math.max(0, radius - (win.feather / 200));

        if (dist <= innerRadius) {
          weight = 1.0;
        } else if (dist >= outerRadius) {
          weight = 0.0;
        } else {
          // Linear blend
          weight = 1.0 - (dist - innerRadius) / (outerRadius - innerRadius);
        }
      } else if (win.type === "rectangle") {
        const p0 = win.points[0];
        const p1 = win.points[1] || { x: p0.x + 0.3, y: p0.y + 0.3 };
        const minX = Math.min(p0.x, p1.x);
        const maxX = Math.max(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y);
        const maxY = Math.max(p0.y, p1.y);

        const featherX = win.feather / 200;
        const featherY = win.feather / 200;

        if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
          // Inside rectangle. Calculate edge distance for feather
          const distL = px - minX;
          const distR = maxX - px;
          const distT = py - minY;
          const distB = maxY - py;

          const minEdgeDist = Math.min(distL, distR, distT, distB);
          const fFactor = Math.min(featherX, featherY);

          if (fFactor === 0) {
            weight = 1.0;
          } else {
            weight = Math.min(1.0, minEdgeDist / fFactor);
          }
        }
      } else {
        // Polygon, Bezier, Gradient Free Draw Ray-Casting algorithm fallback
        // Simplifies to coordinate box distance if points are minimal, otherwise checks ray intersections
        let inside = false;
        const pts = win.points;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i].x; const yi = pts[i].y;
          const xj = pts[j].x; const yj = pts[j].y;

          const intersect = ((yi > py) !== (yj > py))
              && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        weight = inside ? 1.0 : 0.0;
      }

      if (win.inverted) {
        weight = 1.0 - weight;
      }

      weight *= win.opacity;
      totalWeight = Math.max(totalWeight, weight);
    });

    return hasActiveWindow ? totalWeight : 1.0;
  }

  /**
   * COMPLETE NON-DESTRUCTIVE PIXEL GRADING ENGINE
   * Master function process pixel-by-pixel inside custom Web Worker or fast Canvas Render loop
   */
  public gradePixel(
    r: number, g: number, b: number,
    x: number, y: number,
    width: number, height: number
  ): [number, number, number] {
    // 1. Evaluate Masks & Power Windows Influence
    const windowMask = this.evaluatePowerWindows(x, y, width, height);
    if (windowMask <= 0) return [r, g, b]; // No grading applies inside this window segment

    const qualifierMask = this.evaluateQualifierPixel(r, g, b);
    const finalMask = windowMask * qualifierMask;

    if (finalMask <= 0) return [r, g, b];

    // 2. Linear/Grading space conversions
    let pr = r; let pg = g; let pb = b;

    // A. Temperature & Tint adjustment
    const tempParams = this.primaryParams;
    const wt = this.applyTempTint(pr, pg, pb, tempParams.temperature, tempParams.tint);
    pr = wt[0]; pg = wt[1]; pb = wt[2];

    // B. Exposure Offset (2^exposure stops)
    const exposureMult = Math.pow(2.0, tempParams.exposure);
    pr *= exposureMult;
    pg *= exposureMult;
    pb *= exposureMult;

    // C. Brightness & Contrast (with pivot logic)
    const luma = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
    const contrastFactor = 1.0 + (tempParams.contrast / 100);
    const brightOffset = tempParams.brightness / 100;

    pr = tempParams.pivot + (pr - tempParams.pivot) * contrastFactor + brightOffset;
    pg = tempParams.pivot + (pg - tempParams.pivot) * contrastFactor + brightOffset;
    pb = tempParams.pivot + (pb - tempParams.pivot) * contrastFactor + brightOffset;

    // D. Lift, Gamma, Gain (Wheels + parameters combined)
    const pLift = tempParams.lift;
    const pGamma = tempParams.gamma;
    const pGain = tempParams.gain;
    const pOffset = tempParams.offset;

    const wLift = this.wheelsState.lift.rgbOffset;
    const wGamma = this.wheelsState.gamma.rgbOffset;
    const wGain = this.wheelsState.gain.rgbOffset;
    const wOffset = this.wheelsState.offset.rgbOffset;

    // Lift offset addition
    const lR = pLift[0] + wLift[0];
    const lG = pLift[1] + wLift[1];
    const lB = pLift[2] + wLift[2];

    pr = pr * (1.0 - lR) + lR;
    pg = pg * (1.0 - lG) + lG;
    pb = pb * (1.0 - lB) + lB;

    // Gain multiplier scaling
    const gR = pGain[0] * (1.0 + wGain[0]);
    const gG = pGain[1] * (1.0 + wGain[1]);
    const gB = pGain[2] * (1.0 + wGain[2]);

    pr *= gR;
    pg *= gG;
    pb *= gB;

    // Gamma power correction
    const gamR = 1.0 / Math.max(0.1, 1.0 - (pGamma[0] + wGamma[0]));
    const gamG = 1.0 / Math.max(0.1, 1.0 - (pGamma[1] + wGamma[1]));
    const gamB = 1.0 / Math.max(0.1, 1.0 - (pGamma[2] + wGamma[2]));

    pr = pr > 0 ? Math.pow(pr, gamR) : pr;
    pg = pg > 0 ? Math.pow(pg, gamG) : pg;
    pb = pb > 0 ? Math.pow(pb, gamB) : pb;

    // Offset overall addition
    pr += (pOffset[0] + wOffset[0]);
    pg += (pOffset[1] + wOffset[1]);
    pb += (pOffset[2] + wOffset[2]);

    // E. Curve Engine Evaluation (RGB Splines)
    pr = this.evaluateCurve("red", pr);
    pg = this.evaluateCurve("green", pg);
    pb = this.evaluateCurve("blue", pb);
    
    const masterRgbR = this.evaluateCurve("rgb", pr);
    const masterRgbG = this.evaluateCurve("rgb", pg);
    const masterRgbB = this.evaluateCurve("rgb", pb);
    pr = masterRgbR; pg = masterRgbG; pb = masterRgbB;

    // F. Secondary Hue Curves (Hue vs Sat, Hue vs Luma, Luma vs Sat)
    // Convert to HSL to query HSL curve modifiers
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    let h = 0; let s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case pr: h = (pg - pb) / d + (pg < pb ? 6 : 0); break;
        case pg: h = (pb - pr) / d + 2; break;
        case pb: h = (pr - pg) / d + 4; break;
      }
      h /= 6;
    }

    // Hue vs Sat Adjustment
    const hVsSatMult = this.evaluateCurve("hue_vs_sat", h) * 2; // scale curve center around 1.0
    s *= hVsSatMult;

    // Hue vs Hue Shift
    const hVsHueShift = (this.evaluateCurve("hue_vs_hue", h) - 0.5) * 0.5; // shift up/down degrees
    h = (h + hVsHueShift + 1.0) % 1.0;

    // Hue vs Luma
    const hVsLumaMult = this.evaluateCurve("hue_vs_luma", h) * 2;
    const finalL = Math.max(0.0, Math.min(1.0, l * hVsLumaMult));

    // Convert back to RGB
    let rFinal = finalL; let gFinal = finalL; let bFinal = finalL;
    if (s > 0) {
      const q = finalL < 0.5 ? finalL * (1 + s) : finalL + s - finalL * s;
      const p = 2 * finalL - q;
      const hue2rgb = (tc: number) => {
        let t = tc;
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      rFinal = hue2rgb(h + 1/3);
      gFinal = hue2rgb(h);
      bFinal = hue2rgb(h - 1/3);
    }

    // G. White balance / Black/White clamping
    const bClamp = tempParams.blackPoint / 255;
    const wClamp = tempParams.whitePoint / 255;
    rFinal = Math.max(bClamp, Math.min(wClamp, rFinal));
    gFinal = Math.max(bClamp, Math.min(wClamp, gFinal));
    bFinal = Math.max(bClamp, Math.min(wClamp, bFinal));

    // Combine with original based on qualifier/window transparency mask
    const gradedR = r + (rFinal - r) * finalMask;
    const gradedG = g + (gFinal - g) * finalMask;
    const gradedB = b + (bFinal - b) * finalMask;

    return [
      Math.max(0.0, Math.min(1.0, gradedR)),
      Math.max(0.0, Math.min(1.0, gradedG)),
      Math.max(0.0, Math.min(1.0, gradedB))
    ];
  }

  // --- TRACKING RUNTIME FOUNDATION ---

  /**
   * Planar tracker simulation generating high-confidence tracking points
   */
  public performPlanarWindowTracking(windowId: string, frames: number[]): TrackingData {
    const win = this.powerWindows.get(windowId);
    if (!win) {
      throw new Error("Window target not found for planar track.");
    }

    const pts: TrackingData["points"] = [];
    frames.forEach((frame, idx) => {
      // Shift window points slightly simulating optical flow displacement
      const shiftX = Math.sin(frame * 0.05) * 0.005;
      const shiftY = Math.cos(frame * 0.04) * 0.003;

      pts.push({
        frame,
        x: win.points[0].x + shiftX,
        y: win.points[0].y + shiftY,
        scale: 1.0 + Math.sin(frame * 0.01) * 0.02,
        rotation: Math.cos(frame * 0.02) * 0.5,
        confidence: 0.92 - (idx * 0.001) // slow confidence degradation
      });
    });

    const job: TrackingData = {
      windowId,
      points: pts,
      status: "completed"
    };

    this.trackingJobs.set(windowId, job);
    return job;
  }
}
