export interface CacheStats {
  hits: number;
  misses: number;
  totalSizeInBytes: number;
  itemCount: number;
  maxMemoryBytes: number;
}

export class MediaCache {
  private static instance: MediaCache;
  private cache: Map<string, { value: any; bytes: number; lastAccess: number }> = new Map();
  private maxMemoryBytes = 128 * 1024 * 1024; // 128MB RAM cache by default
  private currentMemoryBytes = 0;
  private hitsCount = 0;
  private missesCount = 0;

  private constructor() {}

  public static getInstance(): MediaCache {
    if (!MediaCache.instance) {
      MediaCache.instance = new MediaCache();
    }
    return MediaCache.instance;
  }

  /**
   * Put an item in cache
   */
  public put(key: string, value: any, estimatedBytes: number): void {
    if (estimatedBytes > this.maxMemoryBytes) {
      console.warn(`[MediaCache] Item ${key} is too large (${(estimatedBytes / 1024 / 1024).toFixed(2)} MB) to cache.`);
      return;
    }

    // If key exists, evict it first to update memory tracker
    this.evict(key);

    // Evict items if memory budget is exceeded
    while (this.currentMemoryBytes + estimatedBytes > this.maxMemoryBytes) {
      const oldestKey = this.findLeastRecentlyUsedKey();
      if (!oldestKey) break;
      this.evict(oldestKey);
    }

    this.cache.set(key, {
      value,
      bytes: estimatedBytes,
      lastAccess: Date.now()
    });

    this.currentMemoryBytes += estimatedBytes;
    console.log(`[MediaCache] Cached item: ${key} (${(estimatedBytes / 1024).toFixed(2)} KB)`);
  }

  /**
   * Get an item from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      this.hitsCount++;
      entry.lastAccess = Date.now(); // update LRU timeline
      return entry.value as T;
    }

    this.missesCount++;
    return null;
  }

  /**
   * Evict specific item from cache
   */
  public evict(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemoryBytes -= entry.bytes;
      this.cache.delete(key);
    }
  }

  /**
   * Flush all caches
   */
  public clear(): void {
    this.cache.clear();
    this.currentMemoryBytes = 0;
    this.hitsCount = 0;
    this.missesCount = 0;
    console.log("[MediaCache] Flush complete. All cached media handles released.");
  }

  /**
   * Adjust max cache memory bound limit
   */
  public setMaxMemoryBytes(bytes: number): void {
    this.maxMemoryBytes = bytes;
    while (this.currentMemoryBytes > this.maxMemoryBytes) {
      const oldestKey = this.findLeastRecentlyUsedKey();
      if (!oldestKey) break;
      this.evict(oldestKey);
    }
  }

  /**
   * Fetch diagnostics report
   */
  public getStats(): CacheStats {
    return {
      hits: this.hitsCount,
      misses: this.missesCount,
      totalSizeInBytes: this.currentMemoryBytes,
      itemCount: this.cache.size,
      maxMemoryBytes: this.maxMemoryBytes
    };
  }

  private findLeastRecentlyUsedKey(): string | null {
    let oldestTime = Infinity;
    let lruKey: string | null = null;

    this.cache.forEach((entry, key) => {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        lruKey = key;
      }
    });

    return lruKey;
  }
}
