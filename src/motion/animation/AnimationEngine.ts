import { Keyframe, AnimatedProperty, TransformGroup, MotionLayer, KeyframeEasingType } from "../core/MotionTypes";
import { GraphEditorEngine } from "../keyframes/GraphEditorEngine";

export interface AnimationPreset {
  id: string;
  name: string;
  category: "entrance" | "exit" | "loop" | "cinematic";
  description: string;
  apply: (layer: MotionLayer, startFrame: number, durationFrames: number) => void;
}

export class AnimationEngine {
  private static instance: AnimationEngine | null = null;
  private graphEngine = GraphEditorEngine.getInstance();
  private presetLibrary: Map<string, AnimationPreset> = new Map();

  private constructor() {
    this.registerDefaultPresets();
  }

  public static getInstance(): AnimationEngine {
    if (!AnimationEngine.instance) {
      AnimationEngine.instance = new AnimationEngine();
    }
    return AnimationEngine.instance;
  }

  /**
   * Evaluates any AnimatedProperty at a target frame.
   */
  public evaluateProperty(prop: AnimatedProperty, frame: number): number {
    if (prop.keyframes.length === 0) {
      return prop.value;
    }

    // Sort keyframes by frame
    const sortedKfs = [...prop.keyframes].sort((a, b) => a.frame - b.frame);

    // Clamp boundary states
    if (frame <= sortedKfs[0].frame) return sortedKfs[0].value;
    if (frame >= sortedKfs[sortedKfs.length - 1].frame) return sortedKfs[sortedKfs.length - 1].value;

    // Find interpolation interval
    for (let i = 0; i < sortedKfs.length - 1; i++) {
      const kfStart = sortedKfs[i];
      const kfEnd = sortedKfs[i + 1];
      if (frame >= kfStart.frame && frame <= kfEnd.frame) {
        return this.graphEngine.interpolate(kfStart, kfEnd, frame);
      }
    }

    return prop.value;
  }

  /**
   * Creates a default animated property.
   */
  public createProperty(name: string, defaultValue: number): AnimatedProperty {
    return {
      id: `prop_${name}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value: defaultValue,
      keyframes: []
    };
  }

  /**
   * Helper to create a complete TransformGroup.
   */
  public createTransformGroup(): TransformGroup {
    return {
      positionX: this.createProperty("positionX", 0),
      positionY: this.createProperty("positionY", 0),
      positionZ: this.createProperty("positionZ", 0),
      rotationX: this.createProperty("rotationX", 0),
      rotationY: this.createProperty("rotationY", 0),
      rotationZ: this.createProperty("rotationZ", 0),
      scaleX: this.createProperty("scaleX", 1.0),
      scaleY: this.createProperty("scaleY", 1.0),
      scaleZ: this.createProperty("scaleZ", 1.0),
      skewX: this.createProperty("skewX", 0),
      skewY: this.createProperty("skewY", 0),
      opacity: this.createProperty("opacity", 100),
      anchorX: this.createProperty("anchorX", 0),
      anchorY: this.createProperty("anchorY", 0),
      anchorZ: this.createProperty("anchorZ", 0),
    };
  }

  /**
   * Blend multiple animation layers together based on weight factors.
   */
  public blendTransforms(
    base: TransformGroup,
    layerAdditive: TransformGroup,
    weight: number,
    frame: number
  ): TransformGroup {
    const blended = this.createTransformGroup();
    const keys = Object.keys(base) as (keyof TransformGroup)[];

    keys.forEach((key) => {
      const baseVal = this.evaluateProperty(base[key], frame);
      const addVal = this.evaluateProperty(layerAdditive[key], frame);
      
      // Determine if scale or standard additive/multiplicative blending
      if (key.startsWith("scale")) {
        // Multiplicative scale blending
        blended[key].value = baseVal * (1.0 + (addVal - 1.0) * weight);
      } else if (key === "opacity") {
        // Multiplicative opacity blending
        blended[key].value = baseVal * ((addVal / 100) * weight + (1.0 - weight));
      } else {
        // Additive spatial blending
        blended[key].value = baseVal + addVal * weight;
      }
    });

    return blended;
  }

  /**
   * Retargets animations from a source layer to a target layer.
   */
  public retargetAnimation(source: MotionLayer, target: MotionLayer): void {
    const keys = Object.keys(source.transform) as (keyof TransformGroup)[];
    keys.forEach((key) => {
      // Copy over the deep keyframes structure safely
      target.transform[key].keyframes = source.transform[key].keyframes.map((kf) => ({
        ...kf,
        id: `kf_retargeted_${Math.random().toString(36).substr(2, 9)}`
      }));
    });
  }

  /**
   * Add a single keyframe to an AnimatedProperty.
   */
  public addKeyframe(
    prop: AnimatedProperty,
    frame: number,
    value: number,
    easing: KeyframeEasingType = "linear"
  ): Keyframe {
    // Remove if any keyframe already exists on that frame
    prop.keyframes = prop.keyframes.filter((k) => k.frame !== frame);

    const kf: Keyframe = {
      id: `kf_${Math.random().toString(36).substr(2, 9)}`,
      frame,
      value,
      easing,
      controlIn: easing === "bezier" ? { x: 0.33, y: 0.0 } : undefined,
      controlOut: easing === "bezier" ? { x: 0.67, y: 1.0 } : undefined
    };

    prop.keyframes.push(kf);
    prop.keyframes.sort((a, b) => a.frame - b.frame);
    return kf;
  }

  /**
   * REGISTER PRESET LIBRARY
   */
  private registerDefaultPresets(): void {
    // 1. Cinematic Slide In
    this.registerPreset({
      id: "slide_in_cinematic",
      name: "Cinematic Slide In",
      category: "entrance",
      description: "Elegant lateral dynamic wipe entry with custom easing.",
      apply: (layer, startFrame, duration) => {
        const t = layer.transform;
        // Position X Slide
        this.addKeyframe(t.positionX, startFrame, -1000, "bezier");
        const kfEnd = this.addKeyframe(t.positionX, startFrame + duration, 0, "bezier");
        kfEnd.controlIn = { x: 0.1, y: 0.9 }; // Strong ease in dynamic

        // Opacity Fade
        this.addKeyframe(t.opacity, startFrame, 0, "linear");
        this.addKeyframe(t.opacity, startFrame + Math.floor(duration * 0.5), 100, "linear");
      }
    });

    // 2. Elastic Bounce Scale
    this.registerPreset({
      id: "elastic_bounce_scale",
      name: "Elastic Bounce Scale",
      category: "entrance",
      description: "Elastic recoil bounce swell transition.",
      apply: (layer, startFrame, duration) => {
        const t = layer.transform;
        // Keyframe scale points for bouncing effect
        this.addKeyframe(t.scaleX, startFrame, 0.0, "bezier");
        this.addKeyframe(t.scaleY, startFrame, 0.0, "bezier");

        this.addKeyframe(t.scaleX, startFrame + Math.floor(duration * 0.5), 1.25, "bezier");
        this.addKeyframe(t.scaleY, startFrame + Math.floor(duration * 0.5), 1.25, "bezier");

        this.addKeyframe(t.scaleX, startFrame + Math.floor(duration * 0.75), 0.92, "bezier");
        this.addKeyframe(t.scaleY, startFrame + Math.floor(duration * 0.75), 0.92, "bezier");

        this.addKeyframe(t.scaleX, startFrame + duration, 1.0, "linear");
        this.addKeyframe(t.scaleY, startFrame + duration, 1.0, "linear");

        this.addKeyframe(t.opacity, startFrame, 0, "linear");
        this.addKeyframe(t.opacity, startFrame + 5, 100, "linear");
      }
    });

    // 3. Ambient Drift Loop
    this.registerPreset({
      id: "ambient_drift_loop",
      name: "Ambient Hover Drift",
      category: "loop",
      description: "Continuous floating movement for layers and graphics.",
      apply: (layer, startFrame, duration) => {
        const t = layer.transform;
        const half = Math.floor(duration / 2);

        this.addKeyframe(t.positionY, startFrame, 0, "bezier");
        this.addKeyframe(t.positionY, startFrame + half, -25, "bezier");
        this.addKeyframe(t.positionY, startFrame + duration, 0, "bezier");

        this.addKeyframe(t.rotationZ, startFrame, -1.5, "bezier");
        this.addKeyframe(t.rotationZ, startFrame + half, 1.5, "bezier");
        this.addKeyframe(t.rotationZ, startFrame + duration, -1.5, "bezier");
      }
    });
  }

  public registerPreset(preset: AnimationPreset): void {
    this.presetLibrary.set(preset.id, preset);
  }

  public getPresets(): AnimationPreset[] {
    return Array.from(this.presetLibrary.values());
  }

  public getPreset(id: string): AnimationPreset | undefined {
    return this.presetLibrary.get(id);
  }
}
