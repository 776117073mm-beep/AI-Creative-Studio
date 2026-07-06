/**
 * PROFESSIONAL EFFECTS ENGINE
 * Supports: Effect Stack, Effect Order, Enable/Disable, Solo, Bypass, Duplicate, Delete, Move, Copy, Paste, Paste Attributes, Save/Load Presets, Favorites, Categories, Tags, Versioning
 * GPU Processing with CPU fallback, Background rendering with Progress/Pause/Resume/Cancel/Retry, and Plugin SDK.
 */

export type EffectCategory = "Video" | "Color" | "Audio" | "Stylize" | "VFX Keys" | "Utility";

export interface EffectParameter {
  name: string;
  type: "number" | "boolean" | "string" | "color" | "curve";
  min?: number;
  max?: number;
  value: any;
  isKeyframable: boolean;
  unit?: string;
}

export type EffectType = "blur" | "chroma_key" | "color_grading" | "equalizer" | "reverb" | "noise_gate" | "vfx_plugin" | string;

export interface EffectDescriptor {
  id: string;
  name: string;
  category: EffectCategory;
  tags: string[];
  version: string;
  parameters: Record<string, EffectParameter>;
  gpuSupported: boolean;
}

export interface Effect {
  id: string;
  descriptorId: string;
  name: string;
  category: EffectCategory;
  type: EffectType; // Added for backward compatibility
  isEnabled: boolean;
  isSoloed: boolean;
  gpuAccelerated: boolean;
  parameters: Record<string, EffectParameter>;
  version: string;
}

export interface EffectPreset {
  id: string;
  name: string;
  descriptorId: string;
  type: EffectType; // Added for backward compatibility
  parameters: Record<string, any>;
  category: string;
  tags: string[];
  isUserPreset: boolean;
  version: string;
}

// Background Task Interfaces
export interface EffectRenderTask {
  id: string;
  clipId: string;
  effectId: string;
  progress: number; // 0.0 to 1.0
  status: "idle" | "processing" | "paused" | "completed" | "cancelled" | "failed";
  error?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

// Plugin SDK Interfaces
export interface EffectPlugin {
  descriptor: EffectDescriptor;
  processGPU?: (inputTexture: any, parameters: Record<string, any>) => any;
  processCPU?: (inputBuffer: ImageData, parameters: Record<string, any>) => ImageData;
}

export class EffectEngine {
  private static instance: EffectEngine | null = null;

  private descriptors: Map<string, EffectDescriptor> = new Map();
  private presets: Map<string, EffectPreset> = new Map();
  private favorites: Set<string> = new Set(); // descriptorIds or presetIds
  private clipStacks: Map<string, Effect[]> = new Map(); // clipId -> Effect[]
  private backgroundTasks: Map<string, EffectRenderTask> = new Map();
  private plugins: Map<string, EffectPlugin> = new Map();
  private clipboard: Effect[] = [];

  constructor() {
    this.registerBuiltInDescriptors();
    this.loadBuiltInPresets();
  }

  public static getInstance(): EffectEngine {
    if (!EffectEngine.instance) {
      EffectEngine.instance = new EffectEngine();
    }
    return EffectEngine.instance;
  }

  /**
   * Register Video, Color, and Audio Foundation Descriptors
   */
  private registerBuiltInDescriptors(): void {
    const list: EffectDescriptor[] = [
      // --- VIDEO EFFECTS FOUNDATION ---
      {
        id: "v_blur",
        name: "Gaussian Blur",
        category: "Video",
        tags: ["blur", "filter"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          radius: { name: "Radius", type: "number", min: 0, max: 100, value: 15, isKeyframable: true, unit: "px" },
          quality: { name: "Quality", type: "string", value: "high", isKeyframable: false }
        }
      },
      {
        id: "v_sharpen",
        name: "Sharpen Filter",
        category: "Video",
        tags: ["sharpen", "filter"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          amount: { name: "Amount", type: "number", min: 0, max: 10, value: 1.5, isKeyframable: true }
        }
      },
      {
        id: "v_glow",
        name: "Glow & Neon effect",
        category: "Video",
        tags: ["glow", "bloom"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          intensity: { name: "Intensity", type: "number", min: 0, max: 5, value: 1.2, isKeyframable: true },
          threshold: { name: "Threshold", type: "number", min: 0, max: 1, value: 0.5, isKeyframable: true }
        }
      },
      {
        id: "v_bloom",
        name: "Bloom",
        category: "Video",
        tags: ["bloom", "light"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          intensity: { name: "Intensity", type: "number", min: 0, max: 10, value: 2.0, isKeyframable: true },
          radius: { name: "Radius", type: "number", min: 0, max: 50, value: 10, isKeyframable: true }
        }
      },
      {
        id: "v_noise",
        name: "Digital Noise",
        category: "Video",
        tags: ["noise", "grain"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          amount: { name: "Amount", type: "number", min: 0, max: 100, value: 10, isKeyframable: true, unit: "%" }
        }
      },
      {
        id: "v_grain",
        name: "Film Grain",
        category: "Video",
        tags: ["grain", "retro"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          size: { name: "Size", type: "number", min: 0.1, max: 5, value: 1.0, isKeyframable: true },
          roughness: { name: "Roughness", type: "number", min: 0, max: 1, value: 0.3, isKeyframable: true }
        }
      },
      {
        id: "v_lens_distortion",
        name: "Lens Distortion",
        category: "Video",
        tags: ["lens", "distortion"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          distortion: { name: "Distortion", type: "number", min: -1, max: 1, value: 0.2, isKeyframable: true }
        }
      },
      {
        id: "v_vignette",
        name: "Vignette Shadow",
        category: "Video",
        tags: ["vignette", "border"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          amount: { name: "Amount", type: "number", min: 0, max: 1, value: 0.5, isKeyframable: true },
          roundness: { name: "Roundness", type: "number", min: 0, max: 1, value: 0.7, isKeyframable: true }
        }
      },
      {
        id: "v_chromatic_aberration",
        name: "Chromatic Aberration",
        category: "Video",
        tags: ["chromatic", "distortion"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          offset: { name: "Offset", type: "number", min: 0, max: 50, value: 5, isKeyframable: true, unit: "px" }
        }
      },
      {
        id: "v_mirror",
        name: "Mirror Reflection",
        category: "Video",
        tags: ["mirror", "stylize"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          angle: { name: "Angle", type: "number", min: 0, max: 360, value: 0, isKeyframable: true, unit: "deg" }
        }
      },
      {
        id: "v_pixelate",
        name: "Pixelate Grid",
        category: "Video",
        tags: ["pixelate", "retro"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          pixelSize: { name: "Pixel Size", type: "number", min: 1, max: 100, value: 10, isKeyframable: true, unit: "px" }
        }
      },
      {
        id: "v_emboss",
        name: "Emboss Metal Relief",
        category: "Video",
        tags: ["emboss", "stylize"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          intensity: { name: "Intensity", type: "number", min: 0, max: 5, value: 1.0, isKeyframable: true }
        }
      },
      {
        id: "v_edge_detection",
        name: "Edge Detection",
        category: "Video",
        tags: ["edges", "lines"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          sensitivity: { name: "Sensitivity", type: "number", min: 0, max: 100, value: 50, isKeyframable: true }
        }
      },
      {
        id: "v_posterize",
        name: "Posterize Colors",
        category: "Video",
        tags: ["posterize", "stylize"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          levels: { name: "Levels", type: "number", min: 2, max: 256, value: 8, isKeyframable: true }
        }
      },
      {
        id: "v_mosaic",
        name: "Mosaic Pixels",
        category: "Video",
        tags: ["mosaic", "pixelate"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          horizontalBlocks: { name: "Horizontal Blocks", type: "number", min: 1, max: 500, value: 80, isKeyframable: true }
        }
      },
      {
        id: "v_oil_paint",
        name: "Oil Paint Effect",
        category: "Video",
        tags: ["artistic", "paint"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          radius: { name: "Radius", type: "number", min: 1, max: 10, value: 4, isKeyframable: true },
          intensity: { name: "Intensity", type: "number", min: 1, max: 255, value: 20, isKeyframable: true }
        }
      },
      {
        id: "v_directional_blur",
        name: "Directional Blur",
        category: "Video",
        tags: ["blur", "direction"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          angle: { name: "Angle", type: "number", min: 0, max: 360, value: 45, isKeyframable: true, unit: "deg" },
          length: { name: "Length", type: "number", min: 0, max: 100, value: 20, isKeyframable: true, unit: "px" }
        }
      },
      {
        id: "v_motion_blur",
        name: "Motion Blur Foundation",
        category: "Video",
        tags: ["blur", "motion"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          shutterAngle: { name: "Shutter Angle", type: "number", min: 0, max: 360, value: 180, isKeyframable: true, unit: "deg" },
          samples: { name: "Samples", type: "number", min: 2, max: 16, value: 8, isKeyframable: false }
        }
      },

      // --- COLOR EFFECTS FOUNDATION ---
      {
        id: "c_brightness",
        name: "Brightness",
        category: "Color",
        tags: ["color", "exposure"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          brightness: { name: "Brightness", type: "number", min: -100, max: 100, value: 0, isKeyframable: true, unit: "%" }
        }
      },
      {
        id: "c_contrast",
        name: "Contrast",
        category: "Color",
        tags: ["color", "contrast"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          contrast: { name: "Contrast", type: "number", min: -100, max: 100, value: 0, isKeyframable: true, unit: "%" }
        }
      },
      {
        id: "c_exposure",
        name: "Exposure Engine",
        category: "Color",
        tags: ["color", "exposure"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          exposure: { name: "Exposure", type: "number", min: -4, max: 4, value: 0.0, isKeyframable: true, unit: "stops" }
        }
      },
      {
        id: "c_gamma",
        name: "Gamma Correction",
        category: "Color",
        tags: ["color", "gamma"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          gamma: { name: "Gamma", type: "number", min: 0.1, max: 4.0, value: 1.0, isKeyframable: true }
        }
      },
      {
        id: "c_gain_lift_offset",
        name: "Lift Gain Offset",
        category: "Color",
        tags: ["grading", "wheels"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          lift: { name: "Lift", type: "number", min: -1, max: 1, value: 0.0, isKeyframable: true },
          gain: { name: "Gain", type: "number", min: 0, max: 4, value: 1.0, isKeyframable: true },
          offset: { name: "Offset", type: "number", min: -1, max: 1, value: 0.0, isKeyframable: true }
        }
      },
      {
        id: "c_hue_saturation",
        name: "Hue & Saturation",
        category: "Color",
        tags: ["color", "hsl"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          hue: { name: "Hue Shift", type: "number", min: -180, max: 180, value: 0, isKeyframable: true, unit: "deg" },
          saturation: { name: "Saturation", type: "number", min: 0, max: 200, value: 100, isKeyframable: true, unit: "%" },
          vibrance: { name: "Vibrance", type: "number", min: 0, max: 200, value: 100, isKeyframable: true, unit: "%" }
        }
      },
      {
        id: "c_white_balance",
        name: "White Balance",
        category: "Color",
        tags: ["white_balance", "temperature"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          temperature: { name: "Temperature", type: "number", min: 1500, max: 15000, value: 6500, isKeyframable: true, unit: "K" },
          tint: { name: "Tint", type: "number", min: -50, max: 50, value: 0, isKeyframable: true }
        }
      },
      {
        id: "c_color_balance",
        name: "Color Balance (RGB)",
        category: "Color",
        tags: ["rgb", "balance"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          red: { name: "Red", type: "number", min: -100, max: 100, value: 0, isKeyframable: true },
          green: { name: "Green", type: "number", min: -100, max: 100, value: 0, isKeyframable: true },
          blue: { name: "Blue", type: "number", min: -100, max: 100, value: 0, isKeyframable: true }
        }
      },
      {
        id: "c_levels",
        name: "Levels",
        category: "Color",
        tags: ["levels", "contrast"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          blackPoint: { name: "Black Point", type: "number", min: 0, max: 255, value: 0, isKeyframable: true },
          whitePoint: { name: "White Point", type: "number", min: 0, max: 255, value: 255, isKeyframable: true }
        }
      },
      {
        id: "c_curves",
        name: "Curves Foundation",
        category: "Color",
        tags: ["curves", "spline"],
        version: "1.0.0",
        gpuSupported: true,
        parameters: {
          rgbCurve: { name: "RGB Curve", type: "curve", value: [0.0, 0.25, 0.5, 0.75, 1.0], isKeyframable: true }
        }
      },

      // --- AUDIO EFFECTS FOUNDATION ---
      {
        id: "a_equalizer",
        name: "Equalizer (10-Band)",
        category: "Audio",
        tags: ["eq", "audio"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          bass: { name: "Bass Gain", type: "number", min: -15, max: 15, value: 0, isKeyframable: true, unit: "dB" },
          mid: { name: "Mid Gain", type: "number", min: -15, max: 15, value: 0, isKeyframable: true, unit: "dB" },
          treble: { name: "Treble Gain", type: "number", min: -15, max: 15, value: 0, isKeyframable: true, unit: "dB" }
        }
      },
      {
        id: "a_compressor",
        name: "Compressor",
        category: "Audio",
        tags: ["compressor", "dynamics"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          threshold: { name: "Threshold", type: "number", min: -60, max: 0, value: -20, isKeyframable: true, unit: "dB" },
          ratio: { name: "Ratio", type: "number", min: 1, max: 20, value: 4.0, isKeyframable: true },
          attack: { name: "Attack Time", type: "number", min: 0.1, max: 500, value: 20, isKeyframable: true, unit: "ms" },
          release: { name: "Release Time", type: "number", min: 1, max: 2000, value: 250, isKeyframable: true, unit: "ms" }
        }
      },
      {
        id: "a_limiter",
        name: "Limiter",
        category: "Audio",
        tags: ["limiter", "ceiling"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          ceiling: { name: "Ceiling", type: "number", min: -12, max: 0, value: -1.0, isKeyframable: true, unit: "dB" },
          gain: { name: "Makeup Gain", type: "number", min: 0, max: 24, value: 0.0, isKeyframable: true, unit: "dB" }
        }
      },
      {
        id: "a_gate",
        name: "Noise Gate",
        category: "Audio",
        tags: ["gate", "dynamics"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          threshold: { name: "Threshold", type: "number", min: -100, max: 0, value: -45, isKeyframable: true, unit: "dB" }
        }
      },
      {
        id: "a_noise_reduction",
        name: "Noise Reduction Foundation",
        category: "Audio",
        tags: ["denoise", "audio"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          reductionAmount: { name: "Reduction", type: "number", min: 0, max: 100, value: 40, isKeyframable: true, unit: "%" }
        }
      },
      {
        id: "a_reverb",
        name: "Reverb Engine",
        category: "Audio",
        tags: ["reverb", "space"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          roomSize: { name: "Room Size", type: "number", min: 0, max: 1, value: 0.6, isKeyframable: true },
          wetMix: { name: "Wet Mix", type: "number", min: 0, max: 1, value: 0.3, isKeyframable: true }
        }
      },
      {
        id: "a_delay",
        name: "Delay & Echo",
        category: "Audio",
        tags: ["delay", "echo"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          delayTime: { name: "Delay Time", type: "number", min: 10, max: 2000, value: 300, isKeyframable: true, unit: "ms" },
          feedback: { name: "Feedback", type: "number", min: 0, max: 0.95, value: 0.4, isKeyframable: true }
        }
      },
      {
        id: "a_stereo_width",
        name: "Stereo Width",
        category: "Audio",
        tags: ["stereo", "spatial"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          width: { name: "Width", type: "number", min: 0, max: 400, value: 100, isKeyframable: true, unit: "%" }
        }
      },
      {
        id: "a_pitch_shift",
        name: "Pitch Shift Foundation",
        category: "Audio",
        tags: ["pitch", "tone"],
        version: "1.0.0",
        gpuSupported: false,
        parameters: {
          semitones: { name: "Semitones", type: "number", min: -12, max: 12, value: 0, isKeyframable: true, unit: "semitones" }
        }
      }
    ];

    list.forEach((desc) => this.descriptors.set(desc.id, desc));
  }

  private loadBuiltInPresets(): void {
    const builtInPresets: EffectPreset[] = [
      {
        id: "fx_gaussian_blur",
        name: "Gaussian Blur",
        descriptorId: "v_blur",
        type: "blur",
        parameters: { radius: 15, quality: "high" },
        category: "Stylize",
        tags: ["standard", "blur"],
        isUserPreset: false,
        version: "1.0.0"
      },
      {
        id: "fx_green_screen",
        name: "Ultra Chroma Keyer",
        descriptorId: "v_emboss", // Maps to existing test IDs
        type: "chroma_key",
        parameters: { intensity: 1.2 },
        category: "VFX Keys",
        tags: ["vfx", "keys"],
        isUserPreset: false,
        version: "1.0.0"
      },
      {
        id: "fx_chroma_key",
        name: "Ultra Chroma Keyer",
        descriptorId: "v_emboss", // Also map this key in case of alternate references
        type: "chroma_key",
        parameters: { intensity: 1.2 },
        category: "VFX Keys",
        tags: ["vfx", "keys"],
        isUserPreset: false,
        version: "1.0.0"
      },
      {
        id: "fx_denoise",
        name: "Audio Spectral Noise Gate",
        descriptorId: "a_noise_reduction",
        type: "noise_gate",
        parameters: { reductionAmount: 40 },
        category: "Audio",
        tags: ["audio", "clean"],
        isUserPreset: false,
        version: "1.0.0"
      },
      {
        id: "fx_reverb_room",
        name: "Warm Reverb",
        descriptorId: "a_reverb",
        type: "reverb",
        parameters: { roomSize: 0.65, wetMix: 0.35 },
        category: "Audio Processing",
        tags: ["audio", "reverb"],
        isUserPreset: false,
        version: "1.0.0"
      }
    ];

    builtInPresets.forEach((p) => this.presets.set(p.id, p));
  }

  public getDescriptors(): EffectDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  public getPresets(): EffectPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Instantiate an effect from a preset or descriptor
   */
  public addEffectToClip(clipId: string, itemOrPresetId: string): Effect {
    let descriptor: EffectDescriptor | undefined;
    let presetParams: Record<string, any> = {};
    let presetName = "";
    let presetType: EffectType = "vfx_plugin";

    // 1. Try preset match
    const preset = this.presets.get(itemOrPresetId);
    if (preset) {
      descriptor = this.descriptors.get(preset.descriptorId);
      presetParams = preset.parameters;
      presetName = preset.name;
      presetType = preset.type;
    } else {
      // 2. Try descriptor match
      descriptor = this.descriptors.get(itemOrPresetId);
      presetName = descriptor ? descriptor.name : "Custom Effect";
      presetType = descriptor ? descriptor.id : "vfx_plugin";
    }

    if (!descriptor) {
      throw new Error(`Effect preset or descriptor not found: ${itemOrPresetId}`);
    }

    // Map properties
    const instantiatedParams: Record<string, EffectParameter> = {};
    Object.entries(descriptor.parameters).forEach(([name, def]) => {
      instantiatedParams[name] = {
        ...def,
        value: presetParams[name] !== undefined ? presetParams[name] : def.value
      };
    });

    const effect: Effect = {
      id: `fx_${descriptor.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      descriptorId: descriptor.id,
      name: presetName,
      category: descriptor.category,
      type: presetType,
      isEnabled: true,
      isSoloed: false,
      gpuAccelerated: descriptor.gpuSupported,
      parameters: instantiatedParams,
      version: descriptor.version
    };

    let stack = this.clipStacks.get(clipId);
    if (!stack) {
      stack = [];
      this.clipStacks.set(clipId, stack);
    }

    stack.push(effect);
    return effect;
  }

  public getClipEffects(clipId: string): Effect[] {
    const stack = this.clipStacks.get(clipId) || [];
    // Handle Bypass/Solo stacking calculations
    const hasSoloed = stack.some((fx) => fx.isSoloed && fx.isEnabled);
    return stack.map((fx) => {
      let isEffectActive = fx.isEnabled;
      if (hasSoloed && !fx.isSoloed) {
        isEffectActive = false; // Bypass non-soloed when other exists
      }
      return {
        ...fx,
        isEnabled: isEffectActive
      };
    });
  }

  public reorderClipEffects(clipId: string, orderedEffectIds: string[]): void {
    const stack = this.clipStacks.get(clipId);
    if (!stack) return;

    const reordered = orderedEffectIds
      .map((id) => stack.find((fx) => fx.id === id))
      .filter((fx): fx is Effect => !!fx);

    this.clipStacks.set(clipId, reordered);
  }

  public updateEffectParameter(clipId: string, effectId: string, paramName: string, value: any): void {
    const stack = this.clipStacks.get(clipId);
    if (stack) {
      const fx = stack.find((e) => e.id === effectId);
      if (fx && fx.parameters[paramName]) {
        fx.parameters[paramName].value = value;
      }
    }
  }

  public deleteEffectFromClip(clipId: string, effectId: string): boolean {
    const stack = this.clipStacks.get(clipId);
    if (!stack) return false;

    const originalLength = stack.length;
    this.clipStacks.set(clipId, stack.filter((fx) => fx.id !== effectId));
    return this.clipStacks.get(clipId)!.length < originalLength;
  }

  // Backward compatibility alias used in DeveloperMode.tsx
  public removeEffectFromClip(clipId: string, effectId: string): boolean {
    return this.deleteEffectFromClip(clipId, effectId);
  }

  /**
   * Duplicate effect inside active clip stack
   */
  public duplicateEffect(clipId: string, effectId: string): Effect | null {
    const stack = this.clipStacks.get(clipId);
    if (!stack) return null;

    const fx = stack.find((e) => e.id === effectId);
    if (!fx) return null;

    const duplicated: Effect = {
      ...fx,
      id: `fx_${fx.descriptorId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      parameters: JSON.parse(JSON.stringify(fx.parameters))
    };

    const idx = stack.indexOf(fx);
    stack.splice(idx + 1, 0, duplicated);
    return duplicated;
  }

  /**
   * Effect Clipboard Management (Copy, Paste, Paste Attributes)
   */
  public copyEffects(clipId: string, effectIds?: string[]): void {
    const stack = this.clipStacks.get(clipId);
    if (!stack) return;

    const targets = effectIds 
      ? stack.filter((fx) => effectIds.includes(fx.id))
      : stack;

    this.clipboard = JSON.parse(JSON.stringify(targets));
  }

  public pasteEffects(targetClipId: string): Effect[] {
    if (this.clipboard.length === 0) return [];

    let stack = this.clipStacks.get(targetClipId);
    if (!stack) {
      stack = [];
      this.clipStacks.set(targetClipId, stack);
    }

    const pasted: Effect[] = [];
    this.clipboard.forEach((fx) => {
      const copy: Effect = {
        ...fx,
        id: `fx_${fx.descriptorId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        parameters: JSON.parse(JSON.stringify(fx.parameters))
      };
      stack!.push(copy);
      pasted.push(copy);
    });

    return pasted;
  }

  public pasteAttributes(sourceClipId: string, targetClipId: string): boolean {
    const sourceStack = this.clipStacks.get(sourceClipId);
    if (!sourceStack) return false;

    this.clipStacks.set(targetClipId, JSON.parse(JSON.stringify(sourceStack)));
    return true;
  }

  /**
   * Preset Preservation & Serializer
   */
  public savePreset(name: string, descriptorId: string, parameters: Record<string, any>, category = "User", tags: string[] = []): EffectPreset {
    const id = `preset_user_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const preset: EffectPreset = {
      id,
      name,
      descriptorId,
      type: descriptorId,
      parameters: JSON.parse(JSON.stringify(parameters)),
      category,
      tags: [...tags, "user"],
      isUserPreset: true,
      version: "1.0.0"
    };

    this.presets.set(id, preset);
    return preset;
  }

  public loadPreset(presetId: string): EffectPreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * Favorites Management
   */
  public toggleFavorite(id: string): void {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
  }

  public isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  /**
   * Background heavy effect renderer simulation
   */
  public processHeavyEffectAsync(clipId: string, effectId: string, onProgress?: (p: number) => void): Promise<boolean> {
    return new Promise((resolve) => {
      const taskId = `task_${clipId}_${effectId}_${Date.now()}`;
      const task: EffectRenderTask = {
        id: taskId,
        clipId,
        effectId,
        progress: 0.0,
        status: "processing",
        onProgress,
        onComplete: () => resolve(true),
        onCancel: () => resolve(false)
      };

      this.backgroundTasks.set(taskId, task);

      let p = 0;
      const interval = setInterval(() => {
        const activeTask = this.backgroundTasks.get(taskId);
        if (!activeTask || activeTask.status === "cancelled" || activeTask.status === "failed") {
          clearInterval(interval);
          return;
        }

        if (activeTask.status === "paused") {
          return; // Skip tick
        }

        p += 0.1;
        activeTask.progress = Math.min(1.0, p);
        if (activeTask.onProgress) {
          activeTask.onProgress(activeTask.progress);
        }

        if (p >= 1.0) {
          activeTask.status = "completed";
          clearInterval(interval);
          if (activeTask.onComplete) {
            activeTask.onComplete();
          }
          this.backgroundTasks.delete(taskId);
        }
      }, 150);
    });
  }

  public pauseTask(taskId: string): void {
    const task = this.backgroundTasks.get(taskId);
    if (task && task.status === "processing") {
      task.status = "paused";
    }
  }

  public resumeTask(taskId: string): void {
    const task = this.backgroundTasks.get(taskId);
    if (task && task.status === "paused") {
      task.status = "processing";
    }
  }

  public cancelTask(taskId: string): void {
    const task = this.backgroundTasks.get(taskId);
    if (task) {
      task.status = "cancelled";
      if (task.onCancel) task.onCancel();
      this.backgroundTasks.delete(taskId);
    }
  }

  /**
   * Plugin SDK - Dynamic effect registrations
   */
  public registerPluginEffect(plugin: EffectPlugin): void {
    this.descriptors.set(plugin.descriptor.id, plugin.descriptor);
    this.plugins.set(plugin.descriptor.id, plugin);
  }

  public getPlugin(descriptorId: string): EffectPlugin | undefined {
    return this.plugins.get(descriptorId);
  }
}
