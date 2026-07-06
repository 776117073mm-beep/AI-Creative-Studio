export type CacheBucketType =
  | "timeline"
  | "frame"
  | "render"
  | "preview"
  | "audio"
  | "waveform"
  | "proxy"
  | "thumbnail";

export interface CacheItem<T = any> {
  id: string;
  bucket: CacheBucketType;
  sizeBytes: number;
  priority: number; // Higher is safer from eviction (e.g. 10 = critical, 1 = low)
  lastAccessed: number;
  payload: T;
}

export class CacheEngine {
  private static instance: CacheEngine | null = null;
  private cacheStore: Map<string, CacheItem> = new Map();
  private maxCacheSizeInBytes: number = 256 * 1024 * 1024; // 256 MB Default limit
  private currentCacheSizeInBytes: number = 0;

  // Telemetry
  private hits: number = 0;
  private misses: number = 0;

  private constructor() {}

  public static getInstance(): CacheEngine {
    if (!CacheEngine.instance) {
      CacheEngine.instance = new CacheEngine();
    }
    return CacheEngine.instance;
  }

  public setMaxCacheSizeMb(megabytes: number): void {
    this.maxCacheSizeInBytes = megabytes * 1024 * 1024;
    this.performCleanupIfRequired();
  }

  /**
   * Set cache item
   */
  public put<T = any>(
    id: string,
    bucket: CacheBucketType,
    payload: T,
    sizeBytes: number,
    priority: number = 1
  ): void {
    // If single item exceeds memory bounds completely
    if (sizeBytes > this.maxCacheSizeInBytes) {
      console.warn(`Cache payload too large to fit in cache limits: ${id}`);
      return;
    }

    const existing = this.cacheStore.get(id);
    if (existing) {
      this.currentCacheSizeInBytes -= existing.sizeBytes;
    }

    const newItem: CacheItem<T> = {
      id,
      bucket,
      sizeBytes,
      priority,
      lastAccessed: Date.now(),
      payload,
    };

    this.cacheStore.set(id, newItem);
    this.currentCacheSizeInBytes += sizeBytes;

    this.performCleanupIfRequired();
  }

  /**
   * Retrieve cached payload
   */
  public get<T = any>(id: string): T | null {
    const item = this.cacheStore.get(id);
    if (item) {
      item.lastAccessed = Date.now();
      this.hits++;
      return item.payload as T;
    }

    this.misses++;
    return null;
  }

  /**
   * Eviction policy enforcement: Prioritized Least Recently Used (LRU)
   */
  private performCleanupIfRequired(): void {
    if (this.currentCacheSizeInBytes <= this.maxCacheSizeInBytes) return;

    // Sort items by priority (ascending) then by lastAccessed (ascending)
    const items = Array.from(this.cacheStore.values());
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Evict low priority first
      }
      return a.lastAccessed - b.lastAccessed; // Evict least recently accessed first
    });

    while (this.currentCacheSizeInBytes > this.maxCacheSizeInBytes && items.length > 0) {
      const target = items.shift()!;
      this.cacheStore.delete(target.id);
      this.currentCacheSizeInBytes -= target.sizeBytes;
    }
  }

  /**
   * Clear target buckets
   */
  public clearBuckets(buckets: CacheBucketType[]): void {
    this.cacheStore.forEach((item, id) => {
      if (buckets.includes(item.bucket)) {
        this.currentCacheSizeInBytes -= item.sizeBytes;
        this.cacheStore.delete(id);
      }
    });
  }

  public clearAll(): void {
    this.cacheStore.clear();
    this.currentCacheSizeInBytes = 0;
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): {
    currentSizeInBytes: number;
    maxSizeInBytes: number;
    itemCount: number;
    hits: number;
    misses: number;
    bucketDistribution: Record<CacheBucketType, number>;
  } {
    const distribution: Record<CacheBucketType, number> = {
      timeline: 0,
      frame: 0,
      render: 0,
      preview: 0,
      audio: 0,
      waveform: 0,
      proxy: 0,
      thumbnail: 0,
    };

    this.cacheStore.forEach((item) => {
      distribution[item.bucket] += item.sizeBytes;
    });

    return {
      currentSizeInBytes: this.currentCacheSizeInBytes,
      maxSizeInBytes: this.maxCacheSizeInBytes,
      itemCount: this.cacheStore.size,
      hits: this.hits,
      misses: this.misses,
      bucketDistribution: distribution,
    };
  }
}
