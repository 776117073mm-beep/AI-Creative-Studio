/**
 * PROFESSIONAL COLOR SCIENCE CORE TYPES
 */

export type ColorSpaceType = 
  | "Rec709" 
  | "Rec2020" 
  | "ACEScg" 
  | "ACEScc" 
  | "ACEScct" 
  | "DCI_P3" 
  | "SRGB" 
  | "LinearRGB"
  | "SLog3" 
  | "LogC" 
  | "VLog";

export interface ColorSpace {
  name: string;
  type: ColorSpaceType;
  gamma: number;
  whitePoint: [number, number]; // [x, y] coordinates
  primaries: {
    r: [number, number];
    g: [number, number];
    b: [number, number];
  };
}

export interface PrimaryCorrectionParams {
  lift: [number, number, number]; // [R, G, B] -1.0 to 1.0
  gamma: [number, number, number]; // [R, G, B] -1.0 to 1.0
  gain: [number, number, number]; // [R, G, B] 0.0 to 4.0
  offset: [number, number, number]; // [R, G, B] -1.0 to 1.0
  exposure: number; // -4.0 to +4.0 stops
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  pivot: number; // 0.0 to 1.0
  temperature: number; // -100 (cool) to 100 (warm)
  tint: number; // -100 (green) to 100 (magenta)
  whiteBalance: {
    tempKelvin: number; // 1500 to 15000
    tint: number;
  };
  blackPoint: number; // 0 to 255
  whitePoint: number; // 0 to 255
  midtoneDetail: number; // -100 to 100
}

export interface CurvePoint {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

export type CustomCurveType = 
  | "rgb" 
  | "red" 
  | "green" 
  | "blue" 
  | "hue_vs_hue" 
  | "hue_vs_sat" 
  | "hue_vs_luma" 
  | "luma_vs_sat" 
  | "sat_vs_sat";

export interface CurvePreset {
  id: string;
  name: string;
  points: CurvePoint[];
  curveType: CustomCurveType;
}

export interface ColorWheelValue {
  angle: number; // 0 to 360 degrees
  strength: number; // 0.0 to 1.0
  luminance: number; // -1.0 to 1.0
  rgbOffset: [number, number, number]; // calculated RGB additions
}

export interface ColorWheelsState {
  lift: ColorWheelValue;
  gamma: ColorWheelValue;
  gain: ColorWheelValue;
  offset: ColorWheelValue;
  logShadows: ColorWheelValue;
  logMidtones: ColorWheelValue;
  logHighlights: ColorWheelValue;
  hdrLight: ColorWheelValue;
  hdrMedium: ColorWheelValue;
  hdrDark: ColorWheelValue;
}

export interface QualifierRange {
  center: number; // 0.0 to 1.0
  width: number; // 0.0 to 1.0
  softStart: number; // 0.0 to 1.0
  softEnd: number; // 0.0 to 1.0
  isEnabled: boolean;
}

export interface QualifierState {
  hue: QualifierRange;
  saturation: QualifierRange;
  luminance: QualifierRange;
  invert: boolean;
  blurRadius: number; // 0 to 50px
  denoise: number; // 0 to 100%
  feather: number; // 0 to 50px
  edgeRefinement: number; // 0 to 100%
}

export type PowerWindowType = "circle" | "rectangle" | "polygon" | "bezier" | "free_draw" | "gradient";

export interface PowerWindow {
  id: string;
  name: string;
  type: PowerWindowType;
  points: { x: number; y: number }[]; // Normalized coords 0.0 to 1.0
  feather: number; // pixels
  expansion: number; // pixels
  opacity: number; // 0.0 to 1.0
  inverted: boolean;
  groupId?: string;
  keyframes?: { frame: number; points: { x: number; y: number }[] }[];
}

export interface WindowGroup {
  id: string;
  name: string;
  windowIds: string[];
}

export interface TrackPoint {
  frame: number;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  confidence: number; // 0.0 to 1.0
}

export interface TrackingData {
  windowId: string;
  points: TrackPoint[];
  status: "idle" | "tracking" | "completed" | "failed";
}

export interface LutDescriptor {
  id: string;
  name: string;
  type: "1d" | "3d";
  size: number; // 17, 33, 65, etc.
  category: "utility" | "creative" | "camera";
  isBuiltIn: boolean;
  description?: string;
}

export interface LutInstance {
  descriptor: LutDescriptor;
  intensity: number; // 0.0 to 1.0 (blending)
  data3D?: Float32Array; // Flattened 3D RGB grid size^3 * 3
  data1D?: Float32Array; // Flattened 1D RGB grid size * 3
}

export interface ColorPreset {
  id: string;
  name: string;
  category: "User" | "Studio" | "Project" | "Cloud";
  primary: PrimaryCorrectionParams;
  wheels: ColorWheelsState;
  curves: Record<CustomCurveType, CurvePoint[]>;
  qualifier: QualifierState;
  windows: PowerWindow[];
  activeLuts: { lutId: string; intensity: number }[];
  acesConfig?: { idt: string; odt: string; workingSpace: string };
  hdrConfig?: { toneMapMode: string; peakLuma: number };
}
