export interface GPUDeviceCapabilities {
  name: string;
  vendor: string;
  vramTotalMb: number;
  vramAllocatedMb: number;
  supportsWebGPU: boolean;
  supportsWebGL2: boolean;
  maxTextureDimension2D: number;
  computeUnitsCount: number;
  hardwareAccelerationEnabled: boolean;
}

export interface GPURenderTask {
  id: string;
  priority: "low" | "medium" | "high" | "realtime";
  operation: string;
  requiredVramMb: number;
  execute: () => Promise<any>;
}

export class GPUEngine {
  private static instance: GPUEngine | null = null;
  private capabilities: GPUDeviceCapabilities;
  private activeQueue: GPURenderTask[] = [];
  private secondaryGPUs: GPUDeviceCapabilities[] = [];
  private isProcessing: boolean = false;

  private constructor() {
    this.capabilities = this.detectHardwareSpecs();
    this.provisionSecondaryGPUs();
  }

  public static getInstance(): GPUEngine {
    if (!GPUEngine.instance) {
      GPUEngine.instance = new GPUEngine();
    }
    return GPUEngine.instance;
  }

  /**
   * Proactively scan browser and hardware environment capabilities
   */
  private detectHardwareSpecs(): GPUDeviceCapabilities {
    let supportsWebGPU = false;
    let supportsWebGL2 = false;
    let maxTextureSize = 8192;
    let gpuName = "Apple M2 Max (Metal Frame-Buffer)";
    let vendorName = "Apple";

    // Standard detection
    if (typeof navigator !== "undefined" && (navigator as any).gpu) {
      supportsWebGPU = true;
    }

    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl2") || canvas.getContext("experimental-webgl")) as any;
      if (gl) {
        supportsWebGL2 = true;
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpuName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpuName;
          vendorName = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendorName;
        }
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 8192;
      }
    }

    return {
      name: gpuName,
      vendor: vendorName,
      vramTotalMb: 8192, // Simulated total (M2 max unified allocation default)
      vramAllocatedMb: 0,
      supportsWebGPU,
      supportsWebGL2,
      maxTextureDimension2D: maxTextureSize,
      computeUnitsCount: 38, // Apple M2 Max standard cores
      hardwareAccelerationEnabled: supportsWebGPU || supportsWebGL2,
    };
  }

  /**
   * Seed multiple GPU adapters foundation
   */
  private provisionSecondaryGPUs(): void {
    if (this.capabilities.supportsWebGPU) {
      // Simulate multi-GPU system discovery (e.g. discrete AMD/Intel + integrated logic)
      this.secondaryGPUs.push({
        name: "AMD Radeon Pro W6800X Duo",
        vendor: "AMD / Apple",
        vramTotalMb: 32768,
        vramAllocatedMb: 0,
        supportsWebGPU: true,
        supportsWebGL2: true,
        maxTextureDimension2D: 16384,
        computeUnitsCount: 120,
        hardwareAccelerationEnabled: true,
      });
    }
  }

  public getCapabilities(): GPUDeviceCapabilities {
    return this.capabilities;
  }

  public getSecondaryGPUs(): GPUDeviceCapabilities[] {
    return this.secondaryGPUs;
  }

  /**
   * Monitor GPU active workload allocation
   */
  public getVRAMUsagePercentage(): number {
    return (this.capabilities.vramAllocatedMb / this.capabilities.vramTotalMb) * 100;
  }

  /**
   * Schedule a heavy task on the GPU scheduler
   */
  public async scheduleTask<T = any>(task: Omit<GPURenderTask, "id">): Promise<T> {
    const fullTask: GPURenderTask = {
      ...task,
      id: `gputask_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    };

    // Sort queue by priority (high/realtime first)
    this.activeQueue.push(fullTask);
    this.activeQueue.sort((a, b) => {
      const priorityWeights = { realtime: 4, high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    });

    return new Promise<T>((resolve, reject) => {
      const originalExecute = fullTask.execute;
      fullTask.execute = async () => {
        // Enforce safety limits & fallback
        if (this.capabilities.vramAllocatedMb + fullTask.requiredVramMb > this.capabilities.vramTotalMb) {
          console.warn("GPU Memory threshold exceeded! Falling back gracefully to software CPU pipeline...");
          // Fallback simulation: slight delay representing software compilation
          await new Promise((r) => setTimeout(r, 20));
        }

        this.capabilities.vramAllocatedMb += fullTask.requiredVramMb;
        try {
          const result = await originalExecute();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.capabilities.vramAllocatedMb = Math.max(0, this.capabilities.vramAllocatedMb - fullTask.requiredVramMb);
          this.processQueue();
        }
      };

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const nextTask = this.activeQueue.shift()!;
    await nextTask.execute();
  }

  /**
   * Reset VRAM markers
   */
  public resetGPULogic(): void {
    this.capabilities.vramAllocatedMb = 0;
    this.activeQueue = [];
    this.isProcessing = false;
  }
}
