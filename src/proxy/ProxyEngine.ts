export type ProxyResolutionPreset = "360p" | "540p" | "720p" | "1080p";

export interface ProxyAsset {
  id: string;
  originalAssetId: string;
  preset: ProxyResolutionPreset;
  width: number;
  height: number;
  sizeBytes: number;
  filePath: string;
  synchronized: boolean;
}

export class ProxyEngine {
  private static instance: ProxyEngine | null = null;
  private proxies: Map<string, ProxyAsset> = new Map();
  private autoProxyThresholdWidth: number = 1920; // Auto proxy if width > 1080p width
  private activeProxyMode: boolean = true; // Use proxies by default if available

  private constructor() {}

  public static getInstance(): ProxyEngine {
    if (!ProxyEngine.instance) {
      ProxyEngine.instance = new ProxyEngine();
    }
    return ProxyEngine.instance;
  }

  public setProxyPlaybackMode(useProxy: boolean): void {
    this.activeProxyMode = useProxy;
  }

  public isProxyPlaybackModeEnabled(): boolean {
    return this.activeProxyMode;
  }

  /**
   * Automatic proxy generation trigger based on video metadata sizes
   */
  public shouldAutoGenerate(width: number): boolean {
    return width > this.autoProxyThresholdWidth;
  }

  /**
   * Simulate transcode / proxy compilation
   */
  public async generateProxy(
    originalAssetId: string,
    preset: ProxyResolutionPreset = "720p"
  ): Promise<ProxyAsset> {
    const id = `proxy_${originalAssetId}_${preset}`;

    // Resolution boundaries parsing
    let width = 1280;
    let height = 720;
    if (preset === "360p") {
      width = 640;
      height = 360;
    } else if (preset === "540p") {
      width = 960;
      height = 540;
    } else if (preset === "1080p") {
      width = 1920;
      height = 1080;
    }

    // Simulate encoder rendering wait
    await new Promise((resolve) => setTimeout(resolve, 800));

    const proxy: ProxyAsset = {
      id,
      originalAssetId,
      preset,
      width,
      height,
      sizeBytes: Math.round(width * height * 1.5 * 24 * 0.15), // Reduced bitrate formula
      filePath: `/workspace/proxies/${id}.mp4`,
      synchronized: true,
    };

    this.proxies.set(originalAssetId, proxy);
    return proxy;
  }

  /**
   * Check if asset should switch reference during playback
   */
  public resolveAssetPlaybackPath(originalAssetId: string, originalPath: string): { path: string; isProxy: boolean } {
    if (!this.activeProxyMode) {
      return { path: originalPath, isProxy: false };
    }

    const proxy = this.proxies.get(originalAssetId);
    if (proxy && proxy.synchronized) {
      return { path: proxy.filePath, isProxy: true };
    }

    return { path: originalPath, isProxy: false };
  }

  public getProxyForAsset(assetId: string): ProxyAsset | undefined {
    return this.proxies.get(assetId);
  }

  public deleteProxy(originalAssetId: string): boolean {
    return this.proxies.delete(originalAssetId);
  }

  public getStats(): {
    totalProxiesCreated: number;
    totalSizeBytes: number;
    presetsCount: Record<ProxyResolutionPreset, number>;
  } {
    let size = 0;
    const counts: Record<ProxyResolutionPreset, number> = {
      "360p": 0,
      "540p": 0,
      "720p": 0,
      "1080p": 0,
    };

    this.proxies.forEach((proxy) => {
      size += proxy.sizeBytes;
      counts[proxy.preset]++;
    });

    return {
      totalProxiesCreated: this.proxies.size,
      totalSizeBytes: size,
      presetsCount: counts,
    };
  }

  public clearProxies(): void {
    this.proxies.clear();
  }
}
