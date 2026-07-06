import { MotionLayer, Keyframe, TransformGroup } from "../core/MotionTypes";

export interface MotionEffectPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  category: "effects" | "generators" | "transitions";
  applyEffect: (
    layer: MotionLayer,
    frame: number,
    params: Record<string, any>
  ) => void;
}

export interface CustomExpressionFunctionPlugin {
  name: string;
  func: (...args: any[]) => any;
}

export interface CustomShapeToolPlugin {
  id: string;
  name: string;
  drawShape: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: Record<string, any>
  ) => void;
}

export class PluginSDK {
  private static instance: PluginSDK | null = null;

  private effectPlugins: Map<string, MotionEffectPlugin> = new Map();
  private expressionFuncs: Map<string, CustomExpressionFunctionPlugin> = new Map();
  private shapeTools: Map<string, CustomShapeToolPlugin> = new Map();

  private constructor() {
    this.registerDefaultSdkPlugins();
  }

  public static getInstance(): PluginSDK {
    if (!PluginSDK.instance) {
      PluginSDK.instance = new PluginSDK();
    }
    return PluginSDK.instance;
  }

  /**
   * REGISTERS DEVELOPER UTILITIES
   */
  public registerEffect(plugin: MotionEffectPlugin): void {
    this.effectPlugins.set(plugin.id, plugin);
  }

  public registerExpressionFunction(plugin: CustomExpressionFunctionPlugin): void {
    this.expressionFuncs.set(plugin.name, plugin);
  }

  public registerShapeTool(plugin: CustomShapeToolPlugin): void {
    this.shapeTools.set(plugin.id, plugin);
  }

  public getEffects(): MotionEffectPlugin[] {
    return Array.from(this.effectPlugins.values());
  }

  public getExpressionFuncs(): CustomExpressionFunctionPlugin[] {
    return Array.from(this.expressionFuncs.values());
  }

  public getShapeTools(): CustomShapeToolPlugin[] {
    return Array.from(this.shapeTools.values());
  }

  private registerDefaultSdkPlugins(): void {
    // 1. Glitch Shake Plugin
    this.registerEffect({
      id: "plugin_glitch_shake",
      name: "Cyber Glitch Shake",
      version: "1.2.0",
      author: "Future VFX Lab",
      category: "effects",
      applyEffect: (layer, frame, params) => {
        const freq = params.frequency ?? 5;
        const amp = params.amount ?? 30;
        
        if (frame % freq === 0) {
          // Trigger instant horizontal coordinate jitter
          layer.transform.positionX.value += (Math.random() - 0.5) * amp;
          layer.transform.opacity.value = 50 + Math.random() * 50;
        }
      }
    });

    // 2. Halftone Dot Pattern Generator
    this.registerShapeTool({
      id: "plugin_halftone_dots",
      name: "Retro Halftone Grid",
      drawShape: (ctx, w, h, params) => {
        const dotSize = params.dotSize ?? 4;
        const spacing = params.spacing ?? 12;
        const color = params.color ?? "#ff007f";

        ctx.fillStyle = color;
        for (let x = -w/2; x < w/2; x += spacing) {
          for (let y = -h/2; y < h/2; y += spacing) {
            ctx.beginPath();
            ctx.arc(x + spacing/2, y + spacing/2, dotSize, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
    });
  }
}
