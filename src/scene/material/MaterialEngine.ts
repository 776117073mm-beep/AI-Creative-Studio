import { MaterialConfig, ColorRGB } from "../core/types";

export class MaterialEngine {
  private static instance: MaterialEngine | null = null;

  // Active loaded material setups
  private materials: Map<string, MaterialConfig> = new Map();

  private constructor() {
    this.createInitialMaterialsLibrary();
  }

  public static getInstance(): MaterialEngine {
    if (!MaterialEngine.instance) {
      MaterialEngine.instance = new MaterialEngine();
    }
    return MaterialEngine.instance;
  }

  private createInitialMaterialsLibrary(): void {
    // 1. Brushed Chrome Steel
    this.materials.set("mat_chrome", {
      id: "mat_chrome",
      name: "Brushed Chrome",
      albedo: { r: 210, g: 215, b: 220 },
      metallic: 0.95,
      roughness: 0.12,
      emissionColor: { r: 0, g: 0, b: 0 },
      emissionIntensity: 0.0,
      opacity: 1.0,
      transparent: false,
      normalScale: 0.4,
      albedoTextureId: null,
      metallicRoughnessTextureId: null,
      normalTextureId: "tex_noise_brushed_normal",
      emissionTextureId: null,
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });

    // 2. Polished Gold Alloy
    this.materials.set("mat_gold", {
      id: "mat_gold",
      name: "Polished Gold Alloy",
      albedo: { r: 255, g: 210, b: 64 },
      metallic: 0.9,
      roughness: 0.08,
      emissionColor: { r: 0, g: 0, b: 0 },
      emissionIntensity: 0.0,
      opacity: 1.0,
      transparent: false,
      normalScale: 0.2,
      albedoTextureId: null,
      metallicRoughnessTextureId: null,
      normalTextureId: null,
      emissionTextureId: null,
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });

    // 3. Frosted Glass
    this.materials.set("mat_glass", {
      id: "mat_glass",
      name: "Frosted Glass",
      albedo: { r: 240, g: 250, b: 255 },
      metallic: 0.05,
      roughness: 0.22,
      emissionColor: { r: 0, g: 0, b: 0 },
      emissionIntensity: 0.0,
      opacity: 0.45,
      transparent: true,
      normalScale: 0.6,
      albedoTextureId: null,
      metallicRoughnessTextureId: null,
      normalTextureId: "tex_noise_sandblast_normal",
      emissionTextureId: null,
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });

    // 4. Carbon Fiber
    this.materials.set("mat_carbon_fiber", {
      id: "mat_carbon_fiber",
      name: "Weave Carbon Fiber",
      albedo: { r: 25, g: 25, b: 27 },
      metallic: 0.35,
      roughness: 0.45,
      emissionColor: { r: 0, g: 0, b: 0 },
      emissionIntensity: 0.0,
      opacity: 1.0,
      transparent: false,
      normalScale: 1.2,
      albedoTextureId: "tex_carbon_diffuse",
      metallicRoughnessTextureId: null,
      normalTextureId: "tex_carbon_weave_normal",
      emissionTextureId: null,
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });

    // 5. Lava Rock Shading
    this.materials.set("mat_lava_rock", {
      id: "mat_lava_rock",
      name: "Emissive Lava Rock",
      albedo: { r: 55, g: 30, b: 30 },
      metallic: 0.1,
      roughness: 0.85,
      emissionColor: { r: 255, g: 45, b: 5 }, // Intense orange magma veins
      emissionIntensity: 6.5,
      opacity: 1.0,
      transparent: false,
      normalScale: 1.8,
      albedoTextureId: "tex_rock_diffuse",
      metallicRoughnessTextureId: null,
      normalTextureId: "tex_rock_cracks_normal",
      emissionTextureId: "tex_rock_magma_emission",
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });

    // 6. Alien Slime
    this.materials.set("mat_alien_slime", {
      id: "mat_alien_slime",
      name: "Viscous Toxic Slime",
      albedo: { r: 20, g: 255, b: 40 },
      metallic: 0.15,
      roughness: 0.05,
      emissionColor: { r: 10, g: 180, b: 30 },
      emissionIntensity: 2.2,
      opacity: 0.8,
      transparent: true,
      normalScale: 1.0,
      albedoTextureId: null,
      metallicRoughnessTextureId: null,
      normalTextureId: "tex_slime_ripples_normal",
      emissionTextureId: null,
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });

    // 7. Holographic Laser Grid
    this.materials.set("mat_hologram", {
      id: "mat_hologram",
      name: "Cyber Holographic Grid",
      albedo: { r: 0, g: 150, b: 255 },
      metallic: 0.05,
      roughness: 0.15,
      emissionColor: { r: 0, g: 190, b: 255 },
      emissionIntensity: 8.0,
      opacity: 0.5,
      transparent: true,
      normalScale: 0.0,
      albedoTextureId: null,
      metallicRoughnessTextureId: null,
      normalTextureId: null,
      emissionTextureId: "tex_holo_grid_lines",
      opacityTextureId: null,
      isInstance: false,
      parentMaterialId: null
    });
  }

  // --- CRUD Methods ---

  public getMaterials(): MaterialConfig[] {
    return Array.from(this.materials.values());
  }

  public getMaterial(id: string): MaterialConfig | undefined {
    const mat = this.materials.get(id);
    if (!mat) return undefined;

    // Handle material instancing: if material is an instance, inherit missing values from parent
    if (mat.isInstance && mat.parentMaterialId) {
      const parentMat = this.materials.get(mat.parentMaterialId);
      if (parentMat) {
        return {
          ...parentMat,
          ...mat, // Override only specified items
          id: mat.id,
          name: mat.name,
          isInstance: true,
          parentMaterialId: mat.parentMaterialId
        };
      }
    }

    return mat;
  }

  public addMaterial(material: MaterialConfig): void {
    this.materials.set(material.id, material);
  }

  public removeMaterial(id: string): boolean {
    if (id.startsWith("mat_chrome") || id.startsWith("mat_gold") || id.startsWith("mat_glass")) {
      console.warn(`[MaterialEngine] System pre-baked materials cannot be deleted.`);
      return false;
    }
    return this.materials.delete(id);
  }

  // --- Material Instancing Creator ---

  public createMaterialInstance(parentMaterialId: string, instanceName: string): string | null {
    const parentMat = this.materials.get(parentMaterialId);
    if (!parentMat) return null;

    const instanceId = `mat_inst_${Date.now()}`;
    const instance: MaterialConfig = {
      id: instanceId,
      name: instanceName,
      albedo: { ...parentMat.albedo },
      metallic: parentMat.metallic,
      roughness: parentMat.roughness,
      emissionColor: { ...parentMat.emissionColor },
      emissionIntensity: parentMat.emissionIntensity,
      opacity: parentMat.opacity,
      transparent: parentMat.transparent,
      normalScale: parentMat.normalScale,
      albedoTextureId: parentMat.albedoTextureId,
      metallicRoughnessTextureId: parentMat.metallicRoughnessTextureId,
      normalTextureId: parentMat.normalTextureId,
      emissionTextureId: parentMat.emissionTextureId,
      opacityTextureId: parentMat.opacityTextureId,
      isInstance: true,
      parentMaterialId: parentMaterialId
    };

    this.materials.set(instanceId, instance);
    return instanceId;
  }

  // --- Material Layering Blending simulation ---

  public static blendMaterialLayers(
    base: MaterialConfig,
    overlay: MaterialConfig,
    blendFactor: number // 0.0 to 1.0
  ): Partial<MaterialConfig> {
    const f = Math.min(1.0, Math.max(0.0, blendFactor));
    const invF = 1.0 - f;

    const blendedAlbedo: ColorRGB = {
      r: Math.round(base.albedo.r * invF + overlay.albedo.r * f),
      g: Math.round(base.albedo.g * invF + overlay.albedo.g * f),
      b: Math.round(base.albedo.b * invF + overlay.albedo.b * f)
    };

    const blendedEmission: ColorRGB = {
      r: Math.round(base.emissionColor.r * invF + overlay.emissionColor.r * f),
      g: Math.round(base.emissionColor.g * invF + overlay.emissionColor.g * f),
      b: Math.round(base.emissionColor.b * invF + overlay.emissionColor.b * f)
    };

    return {
      albedo: blendedAlbedo,
      metallic: base.metallic * invF + overlay.metallic * f,
      roughness: base.roughness * invF + overlay.roughness * f,
      emissionColor: blendedEmission,
      emissionIntensity: base.emissionIntensity * invF + overlay.emissionIntensity * f,
      opacity: base.opacity * invF + overlay.opacity * f
    };
  }
}
