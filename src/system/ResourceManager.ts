export interface AllocationRequest {
  clientId: string;
  ramBytesNeeded: number;
  gpuVramBytesNeeded: number;
  priority: "low" | "medium" | "high";
}

export class ResourceManager {
  private static instance: ResourceManager;

  private ramUsageBytes = 1024 * 1024 * 512; // 512MB default startup
  private gpuVramUsageBytes = 1024 * 1024 * 128; // 128MB
  private cpuUsagePercent = 12;
  private storageUsageBytes = 1024 * 1024 * 2048; // 2GB
  private activeNetworkSockets = 2;

  // Cache sizes in bytes
  private caches = {
    asset: 1024 * 1024 * 40,
    thumbnail: 1024 * 1024 * 12,
    preview: 1024 * 1024 * 150,
    timeline: 1024 * 1024 * 30,
    audio: 1024 * 1024 * 20,
    video: 1024 * 1024 * 350,
  };

  private allocations: Map<string, AllocationRequest> = new Map();

  private constructor() {
    this.startHousekeepingLoop();
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  public requestAllocation(request: AllocationRequest): boolean {
    const totalRamLimit = 1024 * 1024 * 1024 * 8; // 8GB
    const totalGpuLimit = 1024 * 1024 * 1024 * 6; // 6GB

    if (this.ramUsageBytes + request.ramBytesNeeded > totalRamLimit) {
      if (request.priority !== "high") {
        console.warn(`[ResourceManager] RAM allocation request blocked for ${request.clientId}: Insufficient Memory.`);
        return false;
      }
      this.garbageCollect(); // Force purge cache
    }

    this.ramUsageBytes += request.ramBytesNeeded;
    this.gpuVramUsageBytes += request.gpuVramBytesNeeded;
    this.allocations.set(request.clientId, request);
    
    console.log(`[ResourceManager] Allocated resources to client [${request.clientId}]: RAM +${(request.ramBytesNeeded / 1024 / 1024).toFixed(1)}MB`);
    return true;
  }

  public releaseAllocation(clientId: string): void {
    const alloc = this.allocations.get(clientId);
    if (!alloc) return;

    this.ramUsageBytes = Math.max(0, this.ramUsageBytes - alloc.ramBytesNeeded);
    this.gpuVramUsageBytes = Math.max(0, this.gpuVramUsageBytes - alloc.gpuVramBytesNeeded);
    this.allocations.delete(clientId);
    console.log(`[ResourceManager] Released allocations for client: ${clientId}`);
  }

  public garbageCollect(): void {
    console.log("%c [ResourceManager] Running system-wide garbage collection...", "color: #eab308; font-weight: bold;");
    
    // Simulating clear of timeline and preview caches (LRU model)
    const originalCacheSize = Object.values(this.caches).reduce((a, b) => a + b, 0);
    
    this.caches.preview = Math.floor(this.caches.preview * 0.1); // Purge 90% previews
    this.caches.timeline = Math.floor(this.caches.timeline * 0.2); // Purge 80% timeline caches
    this.caches.thumbnail = Math.floor(this.caches.thumbnail * 0.5); // Purge half thumbnails

    const finalCacheSize = Object.values(this.caches).reduce((a, b) => a + b, 0);
    const reclaimed = originalCacheSize - finalCacheSize;

    this.ramUsageBytes = Math.max(1024 * 1024 * 128, this.ramUsageBytes - Math.floor(reclaimed * 0.3));
    console.log(`%c [ResourceManager] GC complete. Reclaimed ${(reclaimed / 1024 / 1024).toFixed(1)}MB memory assets.`, "color: #22c55e; font-weight: bold;");
  }

  public getStatus() {
    return {
      ramUsageBytes: this.ramUsageBytes,
      gpuVramUsageBytes: this.gpuVramUsageBytes,
      cpuUsagePercent: this.cpuUsagePercent,
      storageUsageBytes: this.storageUsageBytes,
      activeNetworkSockets: this.activeNetworkSockets,
      caches: { ...this.caches },
      activeAllocationsCount: this.allocations.size
    };
  }

  private startHousekeepingLoop(): void {
    setInterval(() => {
      // Simulating slight fluctuations in resource performance
      this.cpuUsagePercent = Math.floor(10 + Math.random() * 8);
      if (Math.random() > 0.85) {
        this.cpuUsagePercent += 35; // Rendering burst emulation
      }
    }, 4000);
  }
}
