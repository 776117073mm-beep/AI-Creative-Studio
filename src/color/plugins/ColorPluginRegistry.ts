import { SceneColorReport } from "../analysis/ColorAnalysisEngine";
import { CurvePoint } from "../core/Types";

export interface CustomColorToolPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  processPixel: (r: number, g: number, b: number, params: Record<string, any>) => [number, number, number];
}

export interface CustomLutPackagePlugin {
  id: string;
  name: string;
  lutSize: number;
  lutData: Float32Array;
}

export interface CustomScopePlugin {
  id: string;
  name: string;
  renderScope: (rgbaData: Uint8ClampedArray, imgWidth: number, imgHeight: number) => Uint8ClampedArray;
}

export interface CustomAnalysisPlugin {
  id: string;
  name: string;
  analyze: (rgbaData: Uint8ClampedArray, imgWidth: number, imgHeight: number) => Record<string, any>;
}

export interface CustomMatchAlgorithmPlugin {
  id: string;
  name: string;
  computeMatchCurves: (source: Uint8ClampedArray, reference: Uint8ClampedArray) => Record<string, CurvePoint[]>;
}

export class ColorPluginRegistry {
  private static instance: ColorPluginRegistry | null = null;

  private colorTools: Map<string, CustomColorToolPlugin> = new Map();
  private lutPackages: Map<string, CustomLutPackagePlugin> = new Map();
  private scopes: Map<string, CustomScopePlugin> = new Map();
  private analysisTools: Map<string, CustomAnalysisPlugin> = new Map();
  private matchAlgorithms: Map<string, CustomMatchAlgorithmPlugin> = new Map();

  constructor() {
    this.registerDefaultPlugins();
  }

  public static getInstance(): ColorPluginRegistry {
    if (!ColorPluginRegistry.instance) {
      ColorPluginRegistry.instance = new ColorPluginRegistry();
    }
    return ColorPluginRegistry.instance;
  }

  private registerDefaultPlugins(): void {
    // 1. Register a Bleach Bypass tool plugin
    this.registerColorTool({
      id: "tool_bleach_bypass",
      name: "Bleach Bypass Developer Tool",
      version: "1.0.0",
      author: "Creative Architect Studio",
      processPixel: (r, g, b, params) => {
        const amount = params.amount !== undefined ? params.amount : 0.6;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        // Blend between standard color and monochrome silver representation
        const gray = luma;
        const blendR = r * (1.0 - amount) + gray * amount;
        const blendG = g * (1.0 - amount) + gray * amount;
        const blendB = b * (1.0 - amount) + gray * amount;

        // Apply high contrast curve
        const curve = (v: number) => v < 0.5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v);
        
        return [
          blendR + (curve(blendR) - blendR) * amount,
          blendG + (curve(blendG) - blendG) * amount,
          blendB + (curve(blendB) - blendB) * amount
        ];
      }
    });

    // 2. Register a high-key exposure scope plugin
    this.registerScope({
      id: "scope_high_key",
      name: "High-Key Highlight Scope",
      renderScope: (rgbaData, w, h) => {
        const out = new Uint8ClampedArray(w * h * 4);
        for (let i = 0; i < rgbaData.length; i += 4) {
          const l = 0.2126 * rgbaData[i] + 0.7152 * rgbaData[i+1] + 0.0722 * rgbaData[i+2];
          if (l > 220) {
            out[i] = 255; out[i+1] = 100; out[i+2] = 100; out[i+3] = 255; // Highlight red overlay
          } else {
            out[i] = 16; out[i+1] = 16; out[i+2] = 20; out[i+3] = 255;
          }
        }
        return out;
      }
    });
  }

  // --- REGISTRY WRITERS ---

  public registerColorTool(plugin: CustomColorToolPlugin): void {
    this.colorTools.set(plugin.id, plugin);
  }

  public registerLutPackage(plugin: CustomLutPackagePlugin): void {
    this.lutPackages.set(plugin.id, plugin);
  }

  public registerScope(plugin: CustomScopePlugin): void {
    this.scopes.set(plugin.id, plugin);
  }

  public registerAnalysisTool(plugin: CustomAnalysisPlugin): void {
    this.analysisTools.set(plugin.id, plugin);
  }

  public registerMatchAlgorithm(plugin: CustomMatchAlgorithmPlugin): void {
    this.matchAlgorithms.set(plugin.id, plugin);
  }

  // --- REGISTRY READERS ---

  public getColorTools(): CustomColorToolPlugin[] {
    return Array.from(this.colorTools.values());
  }

  public getColorTool(id: string): CustomColorToolPlugin | undefined {
    return this.colorTools.get(id);
  }

  public getLutPackages(): CustomLutPackagePlugin[] {
    return Array.from(this.lutPackages.values());
  }

  public getScopes(): CustomScopePlugin[] {
    return Array.from(this.scopes.values());
  }

  public getAnalysisTools(): CustomAnalysisPlugin[] {
    return Array.from(this.analysisTools.values());
  }

  public getMatchAlgorithms(): CustomMatchAlgorithmPlugin[] {
    return Array.from(this.matchAlgorithms.values());
  }
}
