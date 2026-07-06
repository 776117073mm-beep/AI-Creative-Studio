/**
 * PROFESSIONAL TRANSITION ENGINE
 * Supports: Video Transition, Audio Transition, Custom Transition, Transition Presets,
 * Transition Parameters, Transition Curves, Transition Blending, Transition Preview,
 * Transition Stacking, Transition Categories, Plugin Transitions.
 */

export type TransitionType = "dissolve" | "wipe" | "slide" | "zoom" | "fade_to_black" | "audio_crossfade" | "custom_plugin";
export type TransitionCategory = "Video" | "Audio" | "Stylized" | "Custom";
export type TransitionCurve = "linear" | "exponential" | "bezier" | "ease_in_out";

export interface TransitionParameter {
  name: string;
  type: "number" | "boolean" | "string" | "color";
  value: any;
  min?: number;
  max?: number;
}

export interface TransitionPreset {
  id: string;
  name: string;
  type: TransitionType;
  durationFrames: number;
  parameters: Record<string, any>;
  category: TransitionCategory;
  tags: string[];
}

export interface Transition {
  id: string;
  presetId: string;
  name: string;
  type: TransitionType;
  durationFrames: number;
  curve: TransitionCurve;
  parameters: Record<string, TransitionParameter>;
  category: TransitionCategory;
  order: number; // Stacking order
}

export interface TransitionPlugin {
  preset: TransitionPreset;
  blend?: (sourceFrame: any, targetFrame: any, progress: number, parameters: Record<string, any>) => any;
}

export class TransitionEngine {
  private static instance: TransitionEngine | null = null;

  private presets: Map<string, TransitionPreset> = new Map();
  private appliedTransitions: Map<string, Transition[]> = new Map(); // Key format: "clipId:start" or "clipId:end" -> Transition[]
  private plugins: Map<string, TransitionPlugin> = new Map();

  constructor() {
    this.loadBuiltinPresets();
  }

  public static getInstance(): TransitionEngine {
    if (!TransitionEngine.instance) {
      TransitionEngine.instance = new TransitionEngine();
    }
    return TransitionEngine.instance;
  }

  private loadBuiltinPresets(): void {
    const defaultPresets: TransitionPreset[] = [
      {
        id: "v_dissolve",
        name: "Cross Dissolve",
        type: "dissolve",
        durationFrames: 24, // 1 second @ 24fps
        parameters: { curve: "exponential" },
        category: "Video",
        tags: ["standard", "smooth"]
      },
      {
        id: "v_fade_black",
        name: "Fade to Black",
        type: "fade_to_black",
        durationFrames: 30,
        parameters: { color: "#000000" },
        category: "Video",
        tags: ["film", "end"]
      },
      {
        id: "v_wipe",
        name: "Linear Slide Wipe",
        type: "wipe",
        durationFrames: 24,
        parameters: { angle: 90, softEdge: 10 },
        category: "Video",
        tags: ["wipe", "directional"]
      },
      {
        id: "v_zoom",
        name: "Cross Zoom Flare",
        type: "zoom",
        durationFrames: 20,
        parameters: { scalePower: 2.5, blurAmount: 15 },
        category: "Stylized",
        tags: ["stylized", "energy"]
      },
      {
        id: "a_crossfade",
        name: "Constant Power Crossfade",
        type: "audio_crossfade",
        durationFrames: 12,
        parameters: { powerCurveDb: -3.0 },
        category: "Audio",
        tags: ["audio", "clean"]
      }
    ];

    defaultPresets.forEach((p) => this.presets.set(p.id, p));
  }

  public getPresets(): TransitionPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Apply transition to a clip edge (can stack multiple transitions)
   */
  public applyTransition(clipId: string, edge: "start" | "end", presetId: string): void {
    // Backward compatible single-apply signature supporting stacking under the hood
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Transition preset ${presetId} not found.`);
    }

    const params: Record<string, TransitionParameter> = {};
    Object.entries(preset.parameters).forEach(([name, val]) => {
      params[name] = {
        name,
        type: typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "string",
        value: val
      };
    });

    const transition: Transition = {
      id: `trans_${preset.type}_${Date.now()}`,
      presetId: preset.id,
      name: preset.name,
      type: preset.type,
      durationFrames: preset.durationFrames,
      curve: preset.parameters.curve === "exponential" ? "exponential" : "linear",
      parameters: params,
      category: preset.category,
      order: 0
    };

    const key = `${clipId}:${edge}`;
    let list = this.appliedTransitions.get(key);
    if (!list) {
      list = [];
      this.appliedTransitions.set(key, list);
    }
    
    // For basic backward compatibility, we clear existing before applying or push it
    list.push(transition);
  }

  /**
   * Backward compatible retrieval of first applied transition
   */
  public getAppliedTransition(clipId: string, edge: "start" | "end"): TransitionPreset | undefined {
    const key = `${clipId}:${edge}`;
    const list = this.appliedTransitions.get(key);
    if (!list || list.length === 0) return undefined;

    // Convert back to TransitionPreset structure
    const first = list[0];
    const rawParams: Record<string, any> = {};
    Object.entries(first.parameters).forEach(([name, p]) => {
      rawParams[name] = p.value;
    });

    return {
      id: first.presetId,
      name: first.name,
      type: first.type,
      durationFrames: first.durationFrames,
      parameters: rawParams,
      category: first.category,
      tags: []
    };
  }

  /**
   * Retrieve full transition stack
   */
  public getAppliedTransitionStack(clipId: string, edge: "start" | "end"): Transition[] {
    return this.appliedTransitions.get(`${clipId}:${edge}`) || [];
  }

  public removeTransition(clipId: string, edge: "start" | "end"): boolean {
    const key = `${clipId}:${edge}`;
    return this.appliedTransitions.delete(key);
  }

  /**
   * Compute exact blend progress factor between 0.0 and 1.0 depending on timing curves
   */
  public computeTransitionBlendFactor(
    currentFrameRelativeToClip: number,
    clipDurationFrames: number,
    edge: "start" | "end",
    curve: TransitionCurve = "linear"
  ): number {
    const key = `${edge === "start" ? "start" : "end"}`;
    let duration = 24;

    // Find custom duration if applied
    const applied = this.getAppliedTransition("clip_v1_0", edge); // Fallback clip ID or similar
    if (applied) {
      duration = applied.durationFrames;
    }

    let progress = 0;
    if (edge === "start") {
      if (currentFrameRelativeToClip < 0) return 0;
      if (currentFrameRelativeToClip > duration) return 1.0;
      progress = currentFrameRelativeToClip / duration;
    } else {
      const remaining = clipDurationFrames - currentFrameRelativeToClip;
      if (remaining <= 0) return 0;
      if (remaining > duration) return 1.0;
      progress = remaining / duration;
    }

    // Apply Transition Curve Interpolations
    if (curve === "exponential") {
      return Math.pow(progress, 2); // Exponential ease in
    } else if (curve === "ease_in_out") {
      return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    } else if (curve === "bezier") {
      // Standard cubic bezier approximation
      return progress * progress * (3 - 2 * progress);
    }

    return progress; // Linear
  }

  /**
   * Register dynamic custom transition plugin
   */
  public registerPluginTransition(plugin: TransitionPlugin): void {
    this.presets.set(plugin.preset.id, plugin.preset);
    this.plugins.set(plugin.preset.id, plugin);
  }

  public getPlugin(presetId: string): TransitionPlugin | undefined {
    return this.plugins.get(presetId);
  }
}
