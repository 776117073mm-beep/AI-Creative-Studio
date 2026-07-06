import { ITool, ToolMetadata } from "../interfaces";

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ITool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public register(metadata: ToolMetadata, executeFn: (params: Record<string, any>) => Promise<any>): void {
    if (this.tools.has(metadata.name)) {
      console.warn(`[ToolRegistry] Tool with name [${metadata.name}] already registered. Overwriting.`);
    }

    const tool: ITool = {
      metadata,
      execute: executeFn
    };

    this.tools.set(metadata.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${metadata.name} (${metadata.category})`);
  }

  public unregister(toolName: string): void {
    if (this.tools.delete(toolName)) {
      console.log(`[ToolRegistry] Unregistered tool: ${toolName}`);
    }
  }

  public getTool(toolName: string): ITool | undefined {
    return this.tools.get(toolName);
  }

  public listTools(category?: string): ITool[] {
    const list = Array.from(this.tools.values());
    if (category) {
      return list.filter(t => t.metadata.category.toLowerCase() === category.toLowerCase());
    }
    return list;
  }

  public hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  private registerDefaultTools(): void {
    // 1. AI Video Upscaler
    this.register({
      name: "ai_video_upscaler",
      description: "Enhance resolution from SD/HD up to pristine Cinematic 4K/8K using neural super-resolution models.",
      inputs: ["video_file", "target_resolution", "model_profile"],
      outputs: ["upscaled_video_file"],
      requiredPermissions: ["premium", "gpu_access"],
      estimatedRuntime: "10m - 30m",
      gpuRequired: true,
      cpuRequired: true,
      memoryUsage: "16GB",
      supportedFileTypes: [".mp4", ".mov", ".mkv"],
      category: "AI",
      examples: ["Upscale 1080p source clip to 4K Ultra HD using Neural Flow v3"],
      documentation: "https://studio.agency.com/docs/tools/ai-video-upscaler"
    }, async (params) => {
      console.log("[ToolRegistry] Running AI Video Upscaler with parameters:", params);
      return { success: true, path: "/replicated/assets/upscaled_video_4k.mp4", durationSec: 120 };
    });

    // 2. Audio Noise Filter
    this.register({
      name: "audio_noise_filter",
      description: "Surgically extract vocal frequencies and isolate ambient noise, static, or electrical hums.",
      inputs: ["audio_file", "db_threshold", "spectral_subtraction_pct"],
      outputs: ["clean_audio_file"],
      requiredPermissions: ["basic"],
      estimatedRuntime: "10s - 30s",
      gpuRequired: false,
      cpuRequired: true,
      memoryUsage: "2GB",
      supportedFileTypes: [".wav", ".mp3", ".aac", ".ogg"],
      category: "Audio",
      examples: ["Remove air conditioning static noise from dialog track 2"],
      documentation: "https://studio.agency.com/docs/tools/audio-noise-filter"
    }, async (params) => {
      console.log("[ToolRegistry] Running Audio Noise Filter with parameters:", params);
      return { success: true, path: "/replicated/assets/dialog_cleaned.wav", snrImprovement: "14.5dB" };
    });

    // 3. VFX Particle Fire Generator
    this.register({
      name: "vfx_particle_fire_generator",
      description: "Compile hyper-realistic flame particles and secondary heat ripples on coordinate-mapped masks.",
      inputs: ["alpha_mask", "temperature", "turbulence", "wind_velocity"],
      outputs: ["vfx_fire_render_clip"],
      requiredPermissions: ["premium", "vfx_pipeline"],
      estimatedRuntime: "2m - 5m",
      gpuRequired: true,
      cpuRequired: true,
      memoryUsage: "12GB",
      supportedFileTypes: [".exr", ".png", ".tiff"],
      category: "Visual Effects",
      examples: ["Attach cinematic flame turbulence onto actor rotoscope coordinates"],
      documentation: "https://studio.agency.com/docs/tools/vfx-particle-fire"
    }, async (params) => {
      console.log("[ToolRegistry] Running VFX Particle Fire Generator with parameters:", params);
      return { success: true, renderedFrames: 240, cachePath: "/tmp/render_vfx_fire" };
    });
  }
}
