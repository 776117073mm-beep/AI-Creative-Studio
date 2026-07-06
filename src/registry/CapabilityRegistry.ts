import { IModule } from "../interfaces";

export interface CapabilityDeclaration {
  moduleId: string;
  moduleName: string;
  capabilities: string[];
  supportedActions: string[];
  supportedMediaTypes: string[];
  supportedWorkflows: string[];
  supportedCommands: string[];
  supportedAiFunctions: string[];
}

export class CapabilityRegistry {
  private static instance: CapabilityRegistry;
  private declarations: Map<string, CapabilityDeclaration> = new Map();

  private constructor() {
    this.registerDefaultCapabilities();
  }

  public static getInstance(): CapabilityRegistry {
    if (!CapabilityRegistry.instance) {
      CapabilityRegistry.instance = new CapabilityRegistry();
    }
    return CapabilityRegistry.instance;
  }

  public registerCapability(moduleId: string, declaration: Omit<CapabilityDeclaration, "moduleId">): void {
    this.declarations.set(moduleId, {
      moduleId,
      ...declaration
    });
    console.log(`[CapabilityRegistry] Registered capabilities for module: ${moduleId}`);
  }

  public unregisterCapability(moduleId: string): void {
    this.declarations.delete(moduleId);
    console.log(`[CapabilityRegistry] Unregistered capabilities for module: ${moduleId}`);
  }

  public getCapabilities(moduleId: string): CapabilityDeclaration | undefined {
    return this.declarations.get(moduleId);
  }

  public listAllCapabilities(): CapabilityDeclaration[] {
    return Array.from(this.declarations.values());
  }

  public searchByCapability(capability: string): CapabilityDeclaration[] {
    return this.listAllCapabilities().filter(decl => 
      decl.capabilities.some(cap => cap.toLowerCase().includes(capability.toLowerCase()))
    );
  }

  public supportsMediaType(mediaType: string): CapabilityDeclaration[] {
    return this.listAllCapabilities().filter(decl => 
      decl.supportedMediaTypes.some(type => type.toLowerCase() === mediaType.toLowerCase())
    );
  }

  private registerDefaultCapabilities(): void {
    this.registerCapability("mod_vfx_composer", {
      moduleName: "vfx_composer",
      capabilities: ["chroma_key", "particle_effects", "displacement_mapping", "neural_inpainting"],
      supportedActions: ["apply_chroma", "spawn_particles", "displace_geometry"],
      supportedMediaTypes: ["video/mp4", "video/mov", "image/png", "image/exr"],
      supportedWorkflows: ["cinematic_post_production", "retro_grading"],
      supportedCommands: ["cmd_apply_matte", "cmd_render_particles"],
      supportedAiFunctions: ["ai_auto_rotoscope", "ai_face_blur"]
    });

    this.registerCapability("mod_audio_mixing", {
      moduleName: "audio_mixing",
      capabilities: ["equalization", "comp_limiting", "surround_panning", "vocals_isolation"],
      supportedActions: ["apply_eq", "limit_gain", "pan_5.1_surround"],
      supportedMediaTypes: ["audio/wav", "audio/mp3", "audio/aac"],
      supportedWorkflows: ["podcast_mastering", "cinematic_soundtrack_mix"],
      supportedCommands: ["cmd_set_track_fader", "cmd_apply_limiter"],
      supportedAiFunctions: ["ai_vocals_enhancer", "ai_noise_reduction"]
    });

    this.registerCapability("mod_color_grading", {
      moduleName: "color_grading",
      capabilities: ["lrg_color", "lut_baking", "aces_pipeline", "hdr_gamut_mapping"],
      supportedActions: ["adjust_wheels", "bake_lut_preset", "convert_color_space"],
      supportedMediaTypes: ["video/mp4", "video/mov", "image/tiff"],
      supportedWorkflows: ["aces_grading_pipeline", "fujifilm_color_grade"],
      supportedCommands: ["cmd_modify_grading_lift", "cmd_load_lut_preset"],
      supportedAiFunctions: ["ai_shot_matching", "ai_skin_tone_protection"]
    });
  }
}
