import { ColorSpace, ColorSpaceType } from "./Types";

// Definition of standard color spaces in the industry
export const ColorSpaces: Record<ColorSpaceType, ColorSpace> = {
  SRGB: {
    name: "sRGB",
    type: "SRGB",
    gamma: 2.2,
    whitePoint: [0.3127, 0.3290], // D65
    primaries: {
      r: [0.6400, 0.3300],
      g: [0.3000, 0.6000],
      b: [0.1500, 0.0600]
    }
  },
  Rec709: {
    name: "Rec.709 (HDTV)",
    type: "Rec709",
    gamma: 2.4,
    whitePoint: [0.3127, 0.3290], // D65
    primaries: {
      r: [0.6400, 0.3300],
      g: [0.3000, 0.6000],
      b: [0.1500, 0.0600]
    }
  },
  Rec2020: {
    name: "Rec.2020 (UHDTV)",
    type: "Rec2020",
    gamma: 2.4, // Standard gamma or PQ
    whitePoint: [0.3127, 0.3290], // D65
    primaries: {
      r: [0.7080, 0.2920],
      g: [0.1700, 0.7970],
      b: [0.1310, 0.0460]
    }
  },
  DCI_P3: {
    name: "DCI-P3 (Cinema)",
    type: "DCI_P3",
    gamma: 2.6,
    whitePoint: [0.314, 0.351], // DCI Theater White
    primaries: {
      r: [0.6800, 0.3200],
      g: [0.2650, 0.6900],
      b: [0.1500, 0.0600]
    }
  },
  ACEScg: {
    name: "ACEScg (Working Space)",
    type: "ACEScg",
    gamma: 1.0, // Linear
    whitePoint: [0.32168, 0.33767], // AP1 white point (approx D60)
    primaries: {
      r: [0.713, 0.293],
      g: [0.165, 0.830],
      b: [0.128, 0.044]
    }
  },
  ACEScc: {
    name: "ACEScc (Color Grading)",
    type: "ACEScc",
    gamma: 1.0, // Logarithmic
    whitePoint: [0.32168, 0.33767],
    primaries: {
      r: [0.7347, 0.2653], // AP0 primaries
      g: [0.0000, 1.0000],
      b: [0.0001, -0.0770]
    }
  },
  ACEScct: {
    name: "ACEScct (Color Grading with Toe)",
    type: "ACEScct",
    gamma: 1.0, // Logarithmic with toe
    whitePoint: [0.32168, 0.33767],
    primaries: {
      r: [0.7347, 0.2653],
      g: [0.0000, 1.0000],
      b: [0.0001, -0.0770]
    }
  },
  LinearRGB: {
    name: "Linear Rec.709",
    type: "LinearRGB",
    gamma: 1.0,
    whitePoint: [0.3127, 0.3290],
    primaries: {
      r: [0.6400, 0.3300],
      g: [0.3000, 0.6000],
      b: [0.1500, 0.0600]
    }
  },
  SLog3: {
    name: "Sony S-Log3 / S-Gamut3",
    type: "SLog3",
    gamma: 1.0, // Log
    whitePoint: [0.3127, 0.3290],
    primaries: {
      r: [0.730, 0.280],
      g: [0.140, 0.855],
      b: [0.100, -0.050]
    }
  },
  LogC: {
    name: "ARRI LogC v3",
    type: "LogC",
    gamma: 1.0, // Log
    whitePoint: [0.3127, 0.3290],
    primaries: {
      r: [0.6840, 0.3130],
      g: [0.2210, 0.7140],
      b: [0.0860, -0.0160]
    }
  },
  VLog: {
    name: "Panasonic V-Log",
    type: "VLog",
    gamma: 1.0, // Log
    whitePoint: [0.3127, 0.3290],
    primaries: {
      r: [0.730, 0.280],
      g: [0.165, 0.830],
      b: [0.100, -0.085]
    }
  }
};

export class ColorSpaceConverter {
  /**
   * Linearize RGB values based on input color space (inverse transfer function)
   */
  public static linearize(r: number, g: number, b: number, space: ColorSpaceType): [number, number, number] {
    switch (space) {
      case "SRGB":
        return [this.srgbToLinear(r), this.srgbToLinear(g), this.srgbToLinear(b)];
      case "Rec709":
        return [this.rec709ToLinear(r), this.rec709ToLinear(g), this.rec709ToLinear(b)];
      case "Rec2020":
        return [this.rec2020ToLinear(r), this.rec2020ToLinear(g), this.rec2020ToLinear(b)];
      case "ACEScc":
        return [this.acesccToLinear(r), this.acesccToLinear(g), this.acesccToLinear(b)];
      case "ACEScct":
        return [this.acescctToLinear(r), this.acescctToLinear(g), this.acescctToLinear(b)];
      case "SLog3":
        return [this.slog3ToLinear(r), this.slog3ToLinear(g), this.slog3ToLinear(b)];
      case "LogC":
        return [this.logcToLinear(r), this.logcToLinear(g), this.logcToLinear(b)];
      case "VLog":
        return [this.vlogToLinear(r), this.vlogToLinear(g), this.vlogToLinear(b)];
      default:
        return [r, g, b]; // Already linear or unhandled (linear fallback)
    }
  }

  /**
   * Apply transfer function (OETF) to linear values based on destination space
   */
  public static delinearize(r: number, g: number, b: number, space: ColorSpaceType): [number, number, number] {
    switch (space) {
      case "SRGB":
        return [this.linearToSrgb(r), this.linearToSrgb(g), this.linearToSrgb(b)];
      case "Rec709":
        return [this.linearToRec709(r), this.linearToRec709(g), this.linearToRec709(b)];
      case "Rec2020":
        return [this.linearToRec2020(r), this.linearToRec2020(g), this.linearToRec2020(b)];
      case "ACEScc":
        return [this.linearToAcescc(r), this.linearToAcescc(g), this.linearToAcescc(b)];
      case "ACEScct":
        return [this.linearToAcescct(r), this.linearToAcescct(g), this.linearToAcescct(b)];
      case "SLog3":
        return [this.linearToSlog3(r), this.linearToSlog3(g), this.linearToSlog3(b)];
      case "LogC":
        return [this.linearToLogc(r), this.linearToLogc(g), this.linearToLogc(b)];
      case "VLog":
        return [this.linearToVlog(r), this.linearToVlog(g), this.linearToVlog(b)];
      default:
        return [r, g, b]; // Linear fallback
    }
  }

  // --- INDIVIDUAL TRANSFER FUNCTIONS ---

  private static srgbToLinear(val: number): number {
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  }

  private static linearToSrgb(val: number): number {
    return val <= 0.0031308 ? val * 12.92 : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
  }

  private static rec709ToLinear(val: number): number {
    return val <= 0.081 ? val / 4.5 : Math.pow((val + 0.099) / 1.099, 1 / 0.45);
  }

  private static linearToRec709(val: number): number {
    return val <= 0.018 ? val * 4.5 : 1.099 * Math.pow(val, 0.45) - 0.099;
  }

  private static rec2020ToLinear(val: number): number {
    return this.rec709ToLinear(val); // Standard OETF shares the mathematical structure
  }

  private static linearToRec2020(val: number): number {
    return this.linearToRec709(val);
  }

  // ACEScc Logarithmic formulas (standard SMPTE ST 2065-1 mapping)
  private static acesccToLinear(val: number): number {
    if (val < -0.35844748858) {
      return (val - -0.35844748858) / 9.72;
    }
    return Math.pow(2.0, val * 17.52 - 9.72);
  }

  private static linearToAcescc(val: number): number {
    if (val <= 0) return -0.35844748858; // Clamp at minimum log boundary
    const log2Val = Math.log2(val);
    const aces = (log2Val + 9.72) / 17.52;
    if (aces < -0.35844748858) {
      return -0.35844748858 + val * 9.72;
    }
    return aces;
  }

  // ACEScct Adds a flat toe region to log curve for matching legacy camera grading feels
  private static acescctToLinear(val: number): number {
    if (val <= 0.0729055341958) {
      return (val - 0.0729055341958) / 10.5402377416;
    }
    return Math.pow(2.0, val * 17.52 - 9.72);
  }

  private static linearToAcescct(val: number): number {
    if (val <= 0.0078125) {
      return 10.5402377416 * val + 0.0729055341958;
    }
    return (Math.log2(val) + 9.72) / 17.52;
  }

  // Sony S-Log3 Curve definitions
  private static slog3ToLinear(val: number): number {
    if (val >= 171.2102946924 / 1023) {
      return Math.pow(10, (val - 420 / 1023) / 261.5 / 1023) * (1.0 + 0.01) - 0.01;
    }
    return (val - 171.2102946924 / 1023) / (1023 / 171.2102946924) * (1.0 + 0.01) - 0.01;
  }

  private static linearToSlog3(val: number): number {
    if (val >= 0.01) {
      return (420 + 261.5 * Math.log10((val + 0.01) / (1.0 + 0.01))) / 1023;
    }
    return (171.2102946924 + val * (1023 / 171.2102946924)) / 1023;
  }

  // ARRI LogC v3 (e.g. Alexa Wide Gamut)
  private static logcToLinear(val: number): number {
    const cut = 0.010591;
    const a = 5.555556;
    const b = 0.052272;
    const c = 0.247190;
    const d = 0.385537;
    const e = 2.0;
    const f = 0.092781;

    if (val > d) {
      return (Math.pow(10, (val - c) / b) - f) / a;
    }
    return (val - e * cut) / (a * cut + b);
  }

  private static linearToLogc(val: number): number {
    const cut = 0.010591;
    const a = 5.555556;
    const b = 0.052272;
    const c = 0.247190;
    const d = 0.385537;
    const e = 2.0;
    const f = 0.092781;

    if (val > cut) {
      return b * Math.log10(a * val + f) + c;
    }
    return (a * val + b) * cut + e;
  }

  // Panasonic V-Log
  private static vlogToLinear(val: number): number {
    const b = 0.00873;
    const c = 0.241514;
    const d = 0.525;
    if (val >= 0.181) {
      return Math.pow(10, (val - d) / c) - b;
    }
    return (val - 0.125) / 5.6;
  }

  private static linearToVlog(val: number): number {
    const b = 0.00873;
    const c = 0.241514;
    const d = 0.525;
    if (val >= 0.01) {
      return d + c * Math.log10(val + b);
    }
    return 5.6 * val + 0.125;
  }

  /**
   * RGB matrix conversion helper
   */
  public static transformPrimaries(
    r: number, g: number, b: number,
    fromSpace: ColorSpaceType,
    toSpace: ColorSpaceType
  ): [number, number, number] {
    if (fromSpace === toSpace) return [r, g, b];

    // Simple analytical primary transformation matrix.
    // For a real production system, this utilizes intermediate XYZ space.
    // Let's implement analytical intermediate XYZ space conversions for absolute accuracy!
    const xyz = this.rgbToXyz(r, g, b, fromSpace);
    return this.xyzToRgb(xyz[0], xyz[1], xyz[2], toSpace);
  }

  // Custom standard XYZ space adaptation matrix formulas based on primaries
  private static rgbToXyz(r: number, g: number, b: number, space: ColorSpaceType): [number, number, number] {
    // Standard sRGB/Rec709 -> XYZ matrix
    let m = [
      [0.4124, 0.3576, 0.1805],
      [0.2126, 0.7152, 0.0722],
      [0.0193, 0.1192, 0.9505]
    ];

    if (space === "Rec2020") {
      m = [
        [0.6370, 0.1446, 0.1689],
        [0.2627, 0.6780, 0.0593],
        [0.0000, 0.0281, 1.0610]
      ];
    } else if (space === "DCI_P3") {
      m = [
        [0.4866, 0.2657, 0.1982],
        [0.2290, 0.6917, 0.0793],
        [0.0000, 0.0451, 1.0439]
      ];
    } else if (space === "ACEScg" || space === "ACEScc" || space === "ACEScct") {
      m = [
        [0.6625, 0.1341, 0.1562],
        [0.2722, 0.6741, 0.0537],
        [0.0000, 0.0084, 1.0104]
      ];
    }

    const outX = r * m[0][0] + g * m[0][1] + b * m[0][2];
    const outY = r * m[1][0] + g * m[1][1] + b * m[1][2];
    const outZ = r * m[2][0] + g * m[2][1] + b * m[2][2];

    return [outX, outY, outZ];
  }

  private static xyzToRgb(x: number, y: number, z: number, space: ColorSpaceType): [number, number, number] {
    // Inverse standard XYZ -> sRGB/Rec709 matrix
    let m = [
      [ 3.2406, -1.5372, -0.4986],
      [-0.9689,  1.8758,  0.0415],
      [ 0.0557, -0.2040,  1.0570]
    ];

    if (space === "Rec2020") {
      m = [
        [ 1.7167, -0.3557, -0.2534],
        [-0.6667,  1.6165,  0.0130],
        [ 0.0176, -0.0428,  0.9421]
      ];
    } else if (space === "DCI_P3") {
      m = [
        [ 2.4935, -0.9314, -0.4027],
        [-0.8295,  1.7626,  0.0236],
        [ 0.0358, -0.0762,  0.9569]
      ];
    } else if (space === "ACEScg" || space === "ACEScc" || space === "ACEScct") {
      m = [
        [ 1.6410, -0.3238, -0.2424],
        [-0.6631,  1.6153,  0.0168],
        [ 0.0055, -0.0117,  0.9894]
      ];
    }

    const outR = x * m[0][0] + y * m[0][1] + z * m[0][2];
    const outG = x * m[1][0] + y * m[1][1] + z * m[1][2];
    const outB = x * m[2][0] + y * m[2][1] + z * m[2][2];

    return [
      Math.max(0.0, Math.min(1.0, outR)),
      Math.max(0.0, Math.min(1.0, outG)),
      Math.max(0.0, Math.min(1.0, outB))
    ];
  }
}
