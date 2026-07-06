import { PermissionEngine } from "../../security/PermissionEngine";
import { PageId } from "../../types";

export interface IModuleMapping {
  moduleName: string;
  pageId: PageId;
  requiredPermissions: string[];
  healthStatus: "nominal" | "degraded";
}

export class ModuleSelector {
  private static instance: ModuleSelector;
  private mappings: Record<string, IModuleMapping> = {
    color: {
      moduleName: "Color Studio",
      pageId: "color-studio",
      requiredPermissions: ["gpu_access"],
      healthStatus: "nominal"
    },
    audio: {
      moduleName: "Audio Editing Suite",
      pageId: "audio-editing",
      requiredPermissions: ["basic"],
      healthStatus: "nominal"
    },
    vfx: {
      moduleName: "Visual Effects & Compositing Node Engine",
      pageId: "vfx",
      requiredPermissions: ["vfx_pipeline"],
      healthStatus: "nominal"
    },
    subtitle: {
      moduleName: "Subtitle & Dialog Studio",
      pageId: "subtitle-studio",
      requiredPermissions: ["basic"],
      healthStatus: "nominal"
    },
    video: {
      moduleName: "Video Primary Editor",
      pageId: "video-editing",
      requiredPermissions: ["basic"],
      healthStatus: "nominal"
    },
    render: {
      moduleName: "Universal Render Center",
      pageId: "render-center",
      requiredPermissions: ["gpu_access"],
      healthStatus: "nominal"
    },
    timeline: {
      moduleName: "Multi-track Timeline Canvas",
      pageId: "timeline",
      requiredPermissions: ["basic"],
      healthStatus: "nominal"
    }
  };

  private constructor() {}

  public static getInstance(): ModuleSelector {
    if (!ModuleSelector.instance) {
      ModuleSelector.instance = new ModuleSelector();
    }
    return ModuleSelector.instance;
  }

  /**
   * Evaluates the best studio module for a given action keyword and validates permissions
   */
  public routeAction(actionKeyword: string, clientId = "user"): { mapping: IModuleMapping; authorized: boolean; error?: string } {
    const key = actionKeyword.toLowerCase();
    let selectedKey = "video"; // default fallback module

    if (key.includes("color") || key.includes("grade") || key.includes("lut") || key.includes("gamma")) {
      selectedKey = "color";
    } else if (key.includes("audio") || key.includes("noise") || key.includes("decibel") || key.includes("fader")) {
      selectedKey = "audio";
    } else if (key.includes("vfx") || key.includes("particle") || key.includes("matte") || key.includes("roto")) {
      selectedKey = "vfx";
    } else if (key.includes("subtitle") || key.includes("caption") || key.includes("transcript")) {
      selectedKey = "subtitle";
    } else if (key.includes("render") || key.includes("export") || key.includes("compile")) {
      selectedKey = "render";
    } else if (key.includes("timeline") || key.includes("clip") || key.includes("track")) {
      selectedKey = "timeline";
    }

    const mapping = this.mappings[selectedKey];
    const engine = PermissionEngine.getInstance();
    
    // Validate all required permissions for the selected module
    const unauthorized = mapping.requiredPermissions.filter(perm => !engine.checkPermission(clientId, perm));

    if (unauthorized.length > 0) {
      return {
        mapping,
        authorized: false,
        error: `Client [${clientId}] lacks required permissions to access [${mapping.moduleName}]: ${unauthorized.join(", ")}`
      };
    }

    return {
      mapping,
      authorized: true
    };
  }

  /**
   * Validates if a cross-module workflow has compatible permission structures
   */
  public validateWorkflowCompatibility(moduleKeys: string[], clientId = "user"): boolean {
    const engine = PermissionEngine.getInstance();
    return moduleKeys.every(key => {
      const mapping = this.mappings[key];
      if (!mapping) return false;
      return mapping.requiredPermissions.every(perm => engine.checkPermission(clientId, perm));
    });
  }

  /**
   * Dynamically registers a third-party or custom studio module route
   */
  public registerModuleRoute(key: string, mapping: IModuleMapping): void {
    this.mappings[key.toLowerCase()] = mapping;
    console.log(`[ModuleSelector] Custom module route registered for [${key}]: ${mapping.moduleName}`);
  }
}
