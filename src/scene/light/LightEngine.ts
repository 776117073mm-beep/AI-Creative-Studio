import { LightNode, LightParams, ColorRGB, Vector3D } from "../core/types";

export class LightEngine {
  private static instance: LightEngine | null = null;

  // Active virtual light nodes
  private lights: Map<string, LightNode> = new Map();

  // Environment HDRI factor
  private hdriIntensity: number = 1.0;
  private activeHdriPresetName: string = "studio_industrial.hdr";

  private constructor() {
    this.createDefaultLightsSetup();
  }

  public static getInstance(): LightEngine {
    if (!LightEngine.instance) {
      LightEngine.instance = new LightEngine();
    }
    return LightEngine.instance;
  }

  private createDefaultLightsSetup(): void {
    // 1. Directional Sun Keylight
    this.lights.set("light_sun_key", {
      id: "light_sun_key",
      name: "Sun Key Directional",
      type: "light",
      parent: null,
      children: [],
      transform: {
        position: { x: 10.0, y: 16.0, z: 8.0 },
        rotation: { x: -45.0, y: 35.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 }
      },
      visible: true,
      selected: false,
      tags: ["directional", "key", "shadow_caster"],
      layer: "lighting_layer",
      collectionId: "col_lighting",
      lightParams: {
        type: "directional",
        color: { r: 255, g: 248, b: 230 }, // Warm sun glow
        intensity: 4.5,
        spotAngle: 45,
        shadowsEnabled: true,
        shadowResolution: 2048,
        lightMask: 0b111111 // Linked to all rendering layers by default
      }
    });

    // 2. Spot Rim Separation Light
    this.lights.set("light_rim_spot", {
      id: "light_rim_spot",
      name: "Rim Backlight Spot",
      type: "light",
      parent: null,
      children: [],
      transform: {
        position: { x: -2.0, y: 6.0, z: -8.0 },
        rotation: { x: -15.0, y: 180.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 }
      },
      visible: true,
      selected: false,
      tags: ["spot", "rim", "accent"],
      layer: "lighting_layer",
      collectionId: "col_lighting",
      lightParams: {
        type: "spot",
        color: { r: 160, g: 215, b: 255 }, // Cold blue rim contrast
        intensity: 8.0,
        spotAngle: 38,
        shadowsEnabled: true,
        shadowResolution: 1024,
        lightMask: 0b000011 // Filtered link target
      }
    });

    // 3. Point Fill Light
    this.lights.set("light_fill_point", {
      id: "light_fill_point",
      name: "Ambient Fill Point",
      type: "light",
      parent: null,
      children: [],
      transform: {
        position: { x: -8.0, y: 4.0, z: 5.0 },
        rotation: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 }
      },
      visible: true,
      selected: false,
      tags: ["point", "fill", "ambient"],
      layer: "lighting_layer",
      collectionId: "col_lighting",
      lightParams: {
        type: "point",
        color: { r: 120, g: 110, b: 140 }, // Neutral ambient purple tint
        intensity: 2.0,
        spotAngle: 90,
        shadowsEnabled: false,
        shadowResolution: 512,
        lightMask: 0b111111
      }
    });
  }

  // --- CRUD Methods ---

  public getLights(): LightNode[] {
    return Array.from(this.lights.values());
  }

  public getLight(id: string): LightNode | undefined {
    return this.lights.get(id);
  }

  public addLight(light: LightNode): void {
    this.lights.set(light.id, light);
  }

  public removeLight(id: string): boolean {
    return this.lights.delete(id);
  }

  // --- HDRI & Env factors ---

  public getHdriIntensity(): number {
    return this.hdriIntensity;
  }

  public setHdriIntensity(val: number): void {
    this.hdriIntensity = val;
  }

  public getActiveHdriPreset(): string {
    return this.activeHdriPresetName;
  }

  public setActiveHdriPreset(preset: string): void {
    this.activeHdriPresetName = preset;
  }

  // --- Preconfigured Light Layout Rig Presets ---

  public applyLightingRigPreset(rigName: "studio_three_point" | "cyber_street_neon" | "sunset_silhouette" | "flat_ambient"): void {
    this.lights.clear();

    if (rigName === "studio_three_point") {
      this.createDefaultLightsSetup(); // Restores Key, Fill, Rim
    } else if (rigName === "cyber_street_neon") {
      // Pink Neon Point Light
      this.lights.set("light_neon_pink", {
        id: "light_neon_pink",
        name: "Neon Pink Left",
        type: "light",
        parent: null,
        children: [],
        transform: { position: { x: -6, y: 3, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        visible: true, selected: false, tags: ["neon"], layer: "lighting_layer", collectionId: "col_lighting",
        lightParams: { type: "point", color: { r: 255, g: 20, b: 180 }, intensity: 10.0, spotAngle: 90, shadowsEnabled: false, shadowResolution: 512, lightMask: 0b111111 }
      });
      // Cyan Area Panel
      this.lights.set("light_neon_cyan", {
        id: "light_neon_cyan",
        name: "Neon Cyan Area Right",
        type: "light",
        parent: null,
        children: [],
        transform: { position: { x: 6, y: 5, z: 1 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 3, y: 3, z: 1 } },
        visible: true, selected: false, tags: ["area", "neon"], layer: "lighting_layer", collectionId: "col_lighting",
        lightParams: { type: "area", color: { r: 0, g: 240, b: 255 }, intensity: 15.0, spotAngle: 60, shadowsEnabled: true, shadowResolution: 1024, lightMask: 0b111111 }
      });
    } else if (rigName === "sunset_silhouette") {
      // Golden Sun backing
      this.lights.set("light_sunset_sun", {
        id: "light_sunset_sun",
        name: "Golden Backing Sun",
        type: "light",
        parent: null,
        children: [],
        transform: { position: { x: 0, y: 2, z: -15 }, rotation: { x: 5, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        visible: true, selected: false, tags: ["sun"], layer: "lighting_layer", collectionId: "col_lighting",
        lightParams: { type: "directional", color: { r: 255, g: 90, b: 10 }, intensity: 12.0, spotAngle: 45, shadowsEnabled: true, shadowResolution: 2048, lightMask: 0b111111 }
      });
    } else { // flat_ambient
      this.lights.set("light_flat_ambient", {
        id: "light_flat_ambient",
        name: "Flat Overhead Sky",
        type: "light",
        parent: null,
        children: [],
        transform: { position: { x: 0, y: 20, z: 0 }, rotation: { x: -90, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        visible: true, selected: false, tags: ["ambient"], layer: "lighting_layer", collectionId: "col_lighting",
        lightParams: { type: "environment", color: { r: 240, g: 245, b: 255 }, intensity: 3.5, spotAngle: 180, shadowsEnabled: false, shadowResolution: 512, lightMask: 0b111111 }
      });
    }
  }

  // --- Light Linking bitmask evaluations ---

  public static isLightLinkedToNode(lightMask: number, nodeLayerId: string): boolean {
    // Map layer id to a specific bit index for bitwise and logic evaluation
    let layerBit = 1;
    if (nodeLayerId === "geometry_layer") layerBit = 1 << 0; // bit 0
    if (nodeLayerId === "vfx_layer") layerBit = 1 << 1;      // bit 1
    if (nodeLayerId === "ui_layer") layerBit = 1 << 2;       // bit 2
    if (nodeLayerId === "custom_layer") layerBit = 1 << 3;   // bit 3

    return (lightMask & layerBit) !== 0;
  }
}
