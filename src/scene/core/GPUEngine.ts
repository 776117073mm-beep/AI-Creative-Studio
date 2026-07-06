import { GPUMemoryStats } from "./types";

export class GPUEngine {
  private static instance: GPUEngine | null = null;

  // Active GPU driver stats
  private stats: GPUMemoryStats = {
    vramTotalBytes: 1024 * 1024 * 1024 * 8, // 8GB Virtual Total
    vramAllocatedBytes: 1024 * 1024 * 1024 * 1.82, // ~1.82GB Allocated
    drawCallsCount: 142,
    activePipelinesCount: 28,
    gpuUsagePercent: 32.5,
    activeThreads: 12,
    mode: "WebGL_3D" // Default rendering pipeline driver
  };

  private constructor() {}

  public static getInstance(): GPUEngine {
    if (!GPUEngine.instance) {
      GPUEngine.instance = new GPUEngine();
    }
    return GPUEngine.instance;
  }

  // --- Getter/Setter ---

  public getStats(): GPUMemoryStats {
    return this.stats;
  }

  public updateStats(updates: Partial<GPUMemoryStats>): void {
    this.stats = {
      ...this.stats,
      ...updates
    };
  }

  // --- Dynamic calculations simulated ---

  public recalculateVRAMAllocations(nodeCount: number, texturesCount: number): void {
    // Basic nodes vertices allocation: ~2MB per mesh average
    const meshBytes = nodeCount * 1024 * 1024 * 2.2;
    // Basic textures allocation: ~12MB per active compressed map average
    const texBytes = texturesCount * 1024 * 1024 * 8.5;

    this.stats.vramAllocatedBytes = 1024 * 1024 * 512 + meshBytes + texBytes; // baseline driver + resources
    this.stats.gpuUsagePercent = Math.round(15.0 + Math.random() * 5.0 + (nodeCount * 1.2));
  }

  // --- Device Switcher simulation ---

  public toggleDriverAPI(mode: GPUMemoryStats["mode"]): void {
    this.stats.mode = mode;
    if (mode === "WebGPU_Vulkan") {
      this.stats.activePipelinesCount = 56; // Vulkan pipeline binds
      this.stats.activeThreads = 16;
      console.log("[GPUEngine] Switched graphics hardware driver API to high performance: WebGPU Vulkan native");
    } else if (mode === "WebGL_3D") {
      this.stats.activePipelinesCount = 28;
      this.stats.activeThreads = 8;
      console.log("[GPUEngine] Downscaled graphics driver API: WebGL 2.0 Canvas Core");
    } else {
      this.stats.activePipelinesCount = 12;
      this.stats.activeThreads = 1;
      console.log("[GPUEngine] Falling back to Software Rasterizer thread path (CPU Emulation Mode)");
    }
  }
}
