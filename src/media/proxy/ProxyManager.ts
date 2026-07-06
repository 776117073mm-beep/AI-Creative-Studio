export interface ProxyDefinition {
  originalMediaId: string;
  proxyMediaId: string;
  proxyPath: string;
  status: "pending" | "processing" | "ready" | "failed";
  resolutionWidth: number;
  resolutionHeight: number;
  bitrateKbps: number;
  fileSizeInBytes: number;
  progressPercent: number;
}

export class ProxyManager {
  private static instance: ProxyManager;
  private proxies: Map<string, ProxyDefinition> = new Map();
  private isEditingModeProxy = true; // Use proxy by default for timeline snappiness

  private constructor() {}

  public static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  /**
   * Request async proxy rendering for high-resolution file
   */
  public async generateProxy(
    originalMediaId: string, 
    originalWidth: number, 
    originalHeight: number, 
    originalSize: number,
    onProgress?: (progress: number) => void
  ): Promise<ProxyDefinition> {
    console.log(`[ProxyManager] Queueing proxy generation for media: ${originalMediaId} (${originalWidth}x${originalHeight})...`);
    
    const proxyId = `prx_${originalMediaId}`;
    
    // Low-resolution preview targets
    const proxyWidth = originalWidth > 1280 ? 1280 : 960;
    const proxyHeight = originalHeight > 720 ? 720 : 540;
    const estimatedSizeBytes = Math.floor(originalSize * 0.15); // proxy is 15% of size

    const proxy: ProxyDefinition = {
      originalMediaId,
      proxyMediaId: proxyId,
      proxyPath: `/proxies/${proxyId}.mp4`,
      status: "pending",
      resolutionWidth: proxyWidth,
      resolutionHeight: proxyHeight,
      bitrateKbps: 2000,
      fileSizeInBytes: estimatedSizeBytes,
      progressPercent: 0
    };

    this.proxies.set(originalMediaId, proxy);

    // Simulate async downsampling in background loop
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const progress = Math.floor((i / steps) * 100);
      proxy.progressPercent = progress;
      proxy.status = "processing";
      if (onProgress) onProgress(progress);
    }

    proxy.status = "ready";
    console.log(`[ProxyManager] Successfully completed proxy downsample for: ${originalMediaId}`, proxy);
    return proxy;
  }

  /**
   * Retrieve proxy descriptor
   */
  public getProxyForMedia(originalMediaId: string): ProxyDefinition | undefined {
    return this.proxies.get(originalMediaId);
  }

  /**
   * Toggle proxy resolution versus raw high-res resolution on timeline
   */
  public setPlaybackProxyMode(useProxy: boolean): void {
    this.isEditingModeProxy = useProxy;
    console.log(`[ProxyManager] Timeline playback target altered to: ${useProxy ? "720p PROXY (FAST)" : "ORIGINAL HIGH-RES (ACCURATE)"}`);
  }

  /**
   * Check active resolution state
   */
  public isProxyEnabled(): boolean {
    return this.isEditingModeProxy;
  }

  /**
   * Clear proxy catalog
   */
  public clear(): void {
    this.proxies.clear();
  }
}
