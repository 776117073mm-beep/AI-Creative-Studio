import { TextureConfig } from "../core/types";

export class TextureEngine {
  private static instance: TextureEngine | null = null;

  // Cache repository of loaded texture configs
  private cache: Map<string, TextureConfig> = new Map();

  // Active streaming loading progress mapped by texture ID
  private streamingProgress: Map<string, number> = new Map();

  private constructor() {
    this.populateDefaultTextures();
  }

  public static getInstance(): TextureEngine {
    if (!TextureEngine.instance) {
      TextureEngine.instance = new TextureEngine();
    }
    return TextureEngine.instance;
  }

  private populateDefaultTextures(): void {
    // 1. Carbon Weave Normal map
    this.cache.set("tex_carbon_weave_normal", {
      id: "tex_carbon_weave_normal",
      name: "Carbon Fiber Weave Normal Map",
      width: 2048,
      height: 2048,
      format: "rgba8",
      compressed: true, // BC7 Block Compressed
      sizeBytes: 1024 * 1024 * 2.7, // ~2.7MB BC7
      isStreamed: false,
      previewUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHe..."
    });

    // 2. Sandblast Noise Normal
    this.cache.set("tex_noise_sandblast_normal", {
      id: "tex_noise_sandblast_normal",
      name: "Frosted Glass Noise Normal",
      width: 1024,
      height: 1024,
      format: "rgba8",
      compressed: true,
      sizeBytes: 1024 * 512,
      isStreamed: true, // Delayed loading stream
      previewUrl: ""
    });

    // 3. Emissive Rock veins
    this.cache.set("tex_rock_magma_emission", {
      id: "tex_rock_magma_emission",
      name: "Veined Magma Emissive Pattern",
      width: 4096,
      height: 4096,
      format: "rgba32f", // High dynamic range floats
      compressed: false,
      sizeBytes: 1024 * 1024 * 32.0, // Large 32MB Float array
      isStreamed: true,
      previewUrl: ""
    });

    // 4. Slime Ripples Normal
    this.cache.set("tex_slime_ripples_normal", {
      id: "tex_slime_ripples_normal",
      name: "Viscous Water Ripples Normal Map",
      width: 1024,
      height: 1024,
      format: "rgba8",
      compressed: true,
      sizeBytes: 1024 * 400,
      isStreamed: false,
      previewUrl: ""
    });

    // Seed initial streaming progress
    this.streamingProgress.set("tex_noise_sandblast_normal", 100); // Already streamed
    this.streamingProgress.set("tex_rock_magma_emission", 45); // Currently streaming
  }

  // --- Core Cache API ---

  public getCachedTextures(): TextureConfig[] {
    return Array.from(this.cache.values());
  }

  public getTexture(id: string): TextureConfig | undefined {
    return this.cache.get(id);
  }

  public addTextureToCache(tex: TextureConfig): void {
    this.cache.set(tex.id, tex);
    if (tex.isStreamed) {
      this.streamingProgress.set(tex.id, 0);
    } else {
      this.streamingProgress.set(tex.id, 100);
    }
  }

  // --- Texture Streaming Simulation ---

  public getStreamingProgress(id: string): number {
    return this.streamingProgress.get(id) ?? 100;
  }

  public advanceStreamingTick(deltaTimeSec: number): void {
    this.streamingProgress.forEach((progress, id) => {
      if (progress < 100) {
        // Stream 15% loading per second average
        const addition = Math.round(15 * deltaTimeSec + Math.random() * 5);
        const next = Math.min(100, progress + addition);
        this.streamingProgress.set(id, next);

        if (next === 100) {
          console.log(`[TextureEngine] Streaming complete. Cached & bound to GPU memory: "${id}"`);
        }
      }
    });
  }

  // --- Mipmaps Calculation Foundation ---

  public static computeMipmapChainDimensions(width: number, height: number): { w: number; h: number }[] {
    const chain: { w: number; h: number }[] = [];
    let w = width;
    let h = height;

    while (w > 1 || h > 1) {
      chain.push({ w, h });
      w = Math.max(1, Math.floor(w / 2));
      h = Math.max(1, Math.floor(h / 2));
    }
    chain.push({ w: 1, h: 1 });

    return chain;
  }

  // --- Texture Compression utilities helper ---

  public static getCompressionRatio(format: "rgba8" | "rgb8" | "r16f" | "rgba32f", targetFormat: "BC7" | "ASTC_8x8" | "ETC2"): number {
    // Returns compression saving multiplier index
    if (targetFormat === "BC7") {
      return format === "rgba32f" ? 0.06 : 0.25; // Massive reduction on floats, standard 4:1 on standard ubytes
    }
    if (targetFormat === "ASTC_8x8") {
      return 0.125; // ~8:1 ratio block size saving
    }
    return 0.35; // default etc2
  }
}
