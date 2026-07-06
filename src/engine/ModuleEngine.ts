import { IModule, ModuleMetadata, ModuleState, ModuleSettings } from "../interfaces";
import { MediaEngine } from "../media/MediaEngine";

export class ModuleEngine {
  private static instance: ModuleEngine;
  private modules: Map<string, IModule> = new Map();

  constructor() {
    this.loadDefaultModules();
  }

  public static getInstance(): ModuleEngine {
    if (!ModuleEngine.instance) {
      ModuleEngine.instance = new ModuleEngine();
    }
    return ModuleEngine.instance;
  }

  public async registerModule(module: IModule): Promise<void> {
    if (!this.validateModule(module)) {
      throw new Error(`[ModuleEngine] Structural validation failed for module: ${module.metadata.displayName}`);
    }

    if (!this.checkCompatibility(module)) {
      throw new Error(`[ModuleEngine] Dependency conflict or missing requirement for module: ${module.metadata.id}`);
    }

    this.modules.set(module.metadata.id, module);
    module.state.status = "loaded";
    console.log(`[ModuleEngine] Registered Module: ${module.metadata.displayName} (v${module.metadata.version})`);
  }

  public async installModule(module: IModule): Promise<void> {
    console.log(`[ModuleEngine] Installing module ${module.metadata.displayName}...`);
    // Simulate setup downloads or permissions grant
    module.state.status = "loading";
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.registerModule(module);
  }

  public async removeModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (module) {
      if (module.state.status === "active") {
        await this.stopModule(id);
      }
      this.modules.delete(id);
      console.log(`[ModuleEngine] Removed module: ${id}`);
    }
  }

  public async startModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) throw new Error(`[ModuleEngine] Module not found: ${id}`);

    if (module.state.status === "active") {
      console.warn(`[ModuleEngine] Module ${id} is already active.`);
      return;
    }

    console.log(`[ModuleEngine] Starting module: ${module.metadata.displayName}...`);
    module.state.status = "loading";
    
    try {
      await module.initialize();
      await module.start();
      module.state.status = "active";
      module.state.health = "healthy";
      module.state.uptime = Date.now();
      console.log(`[ModuleEngine] Successfully started module: ${module.metadata.displayName}`);
    } catch (err: any) {
      module.state.status = "error";
      module.state.health = "failing";
      module.state.error = err?.message || "Initialization error";
      console.error(`[ModuleEngine] FAILED to start module ${module.metadata.displayName}`, err);
    }
  }

  public async stopModule(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) throw new Error(`[ModuleEngine] Module not found: ${id}`);

    if (module.state.status !== "active") {
      console.warn(`[ModuleEngine] Module ${id} is not currently active.`);
      return;
    }

    console.log(`[ModuleEngine] Stopping module: ${module.metadata.displayName}...`);
    try {
      await module.stop();
      module.state.status = "loaded";
      module.state.uptime = undefined;
      console.log(`[ModuleEngine] Stopped module: ${module.metadata.displayName}`);
    } catch (err: any) {
      module.state.status = "error";
      module.state.error = `Stop failure: ${err?.message}`;
      console.error(`[ModuleEngine] Error stopping module ${module.metadata.displayName}`, err);
    }
  }

  public async restartModule(id: string): Promise<void> {
    console.log(`[ModuleEngine] Restart sequence initiated for module: ${id}`);
    await this.stopModule(id);
    await this.startModule(id);
  }

  public async updateModule(id: string, updatedModule: IModule): Promise<void> {
    console.log(`[ModuleEngine] Updating module: ${id}`);
    await this.removeModule(id);
    await this.installModule(updatedModule);
  }

  public validateModule(module: IModule): boolean {
    const meta = module.metadata;
    if (!meta || !meta.id || !meta.name || !meta.displayName || !meta.version || !meta.category) {
      return false;
    }
    if (!module.initialize || !module.start || !module.stop || !module.restart) {
      return false;
    }
    return true;
  }

  public checkCompatibility(module: IModule): boolean {
    const deps = module.metadata.dependencies;
    for (const depId of deps) {
      if (!this.modules.has(depId)) {
        console.warn(`[ModuleEngine] Compatibility check failed: ${module.metadata.id} requires ${depId}`);
        return false;
      }
    }
    return true;
  }

  public getModule(id: string): IModule | undefined {
    return this.modules.get(id);
  }

  public listModules(category?: string): IModule[] {
    const list = Array.from(this.modules.values());
    if (category) {
      return list.filter(m => m.metadata.category.toLowerCase() === category.toLowerCase());
    }
    return list;
  }

  private loadDefaultModules(): void {
    const createMockModule = (meta: ModuleMetadata): IModule => {
      let state: ModuleState = { status: "unloaded", health: "healthy" };
      let settings: ModuleSettings = { activeMode: "standard", bufferSize: 1024 };

      return {
        metadata: meta,
        state,
        settings,
        async initialize() {
          console.log(`[Module] ${meta.displayName} initialized.`);
        },
        async start() {
          console.log(`[Module] ${meta.displayName} started processing loops.`);
        },
        async stop() {
          console.log(`[Module] ${meta.displayName} stopped processing loops.`);
        },
        async restart() {
          console.log(`[Module] ${meta.displayName} restarting...`);
        },
        updateSettings(newSettings) {
          settings = { ...settings, ...newSettings };
        },
        getApi() {
          return {
            getVersion: () => meta.version,
            getCategory: () => meta.category,
            triggerInternalSync: () => console.log(`[Module API] Triggered sync in ${meta.name}`)
          };
        }
      };
    };

    // Native Media Processing Subsystem
    const mediaEngineInstance = MediaEngine.getInstance();
    this.registerModule(mediaEngineInstance)
      .then(() => mediaEngineInstance.initialize())
      .then(() => this.startModule("mod_media_foundation"));

    // Standard pre-registered studio modules
    this.registerModule(createMockModule({
      id: "mod_vfx_composer",
      name: "vfx_composer",
      displayName: "VFX Composer Subsystem",
      description: "Applies hardware-accelerated particle layers, flames, chroma keys, and image noise shaders.",
      version: "2.4.0",
      developer: "VFX Engineering Core Group",
      dependencies: [],
      permissions: ["gpu_access", "storage_write"],
      inputs: ["alpha_channel", "background_node"],
      outputs: ["composed_composite_frame"],
      capabilities: ["chroma_key", "particle_effects", "displacement_mapping"],
      category: "Visual Effects",
      documentationUrl: "https://studio.agency.com/docs/modules/vfx-composer",
      icon: "Sparkles"
    })).then(() => this.startModule("mod_vfx_composer"));

    this.registerModule(createMockModule({
      id: "mod_audio_mixing",
      name: "audio_mixing",
      displayName: "Surround Audio Mixing Board",
      description: "Dynamic spectral equalizers, multi-band compressors, and real-time noise reduction loops.",
      version: "1.8.5",
      developer: "Acme Audio Lab",
      dependencies: [],
      permissions: ["audio_io"],
      inputs: ["multi_track_wav"],
      outputs: ["master_audio_stereo", "master_surround_5.1"],
      capabilities: ["equalization", "comp_limiting", "surround_panning"],
      category: "Audio",
      documentationUrl: "https://studio.agency.com/docs/modules/audio-mixer",
      icon: "Music"
    })).then(() => this.startModule("mod_audio_mixing"));

    this.registerModule(createMockModule({
      id: "mod_color_grading",
      name: "color_grading",
      displayName: "Color Grading Wheels",
      description: "Hardware lift-gamma-gain correction vectors, cinematic LUT loading, and HDR calibration panels.",
      version: "3.1.2",
      developer: "Siddharth Studio Tools",
      dependencies: [],
      permissions: ["gpu_access"],
      inputs: ["rec709_feed", "luma_mattes"],
      outputs: ["calibrated_grade_feed"],
      capabilities: ["lrg_color", "lut_baking", "aces_pipeline"],
      category: "Visual Effects",
      documentationUrl: "https://studio.agency.com/docs/modules/color-wheels",
      icon: "Sliders"
    })).then(() => this.startModule("mod_color_grading"));
  }
}
