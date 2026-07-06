export type CacheStorageTier = "memory" | "disk" | "cloud";

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  sizeBytes: number;
  tier: CacheStorageTier;
  expiresAt: number;
  lastAccessed: number;
  hits: number;
}

export class CacheEngine {
  private static instance: CacheEngine;

  // Fully independent store cache maps
  private caches: Record<string, Map<string, CacheEntry>> = {
    memory: new Map(),
    disk: new Map(),
    cloud: new Map(),
    thumbnail: new Map(),
    ai: new Map(),
    asset: new Map(),
    preview: new Map(),
    render: new Map(),
    timeline: new Map(),
    module: new Map(),
    plugin: new Map(),
  };

  private maxSizesBytes: Record<string, number> = {
    memory: 1024 * 1024 * 256, // 256MB
    disk: 1024 * 1024 * 1024 * 4, // 4GB
    cloud: 1024 * 1024 * 1024 * 50, // 50GB
    thumbnail: 1024 * 1024 * 50, // 50MB
    ai: 1024 * 1024 * 20, // 20MB
    asset: 1024 * 1024 * 512, // 512MB
    preview: 1024 * 1024 * 1024 * 2, // 2GB
    render: 1024 * 1024 * 1024 * 1, // 1GB
    timeline: 1024 * 1024 * 100, // 100MB
    module: 1024 * 1024 * 10, // 10MB
    plugin: 1024 * 1024 * 15, // 15MB
  };

  private currentSizesBytes: Record<string, number> = {};

  private constructor() {
    // Initialize current sizes
    for (const key of Object.keys(this.caches)) {
      this.currentSizesBytes[key] = 0;
    }
  }

  public static getInstance(): CacheEngine {
    if (!CacheEngine.instance) {
      CacheEngine.instance = new CacheEngine();
    }
    return CacheEngine.instance;
  }

  public set<T>(
    cacheBucket: keyof typeof this.caches,
    key: string,
    value: T,
    options: { ttlMs?: number; sizeBytes?: number; tier?: CacheStorageTier } = {}
  ): void {
    const bucket = this.caches[cacheBucket];
    if (!bucket) {
      throw new Error(`[CacheEngine] Invalid cache bucket specified: ${cacheBucket}`);
    }

    const ttl = options.ttlMs || 1000 * 60 * 10; // Default 10 min TTL
    const size = options.sizeBytes || JSON.stringify(value).length;
    const tier = options.tier || "memory";

    // Evict if over space
    const maxLimit = this.maxSizesBytes[cacheBucket] || 1024 * 1024 * 100;
    while (this.currentSizesBytes[cacheBucket] + size > maxLimit && bucket.size > 0) {
      this.evictOldest(cacheBucket);
    }

    const existing = bucket.get(key);
    if (existing) {
      this.currentSizesBytes[cacheBucket] -= existing.sizeBytes;
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      sizeBytes: size,
      tier,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      hits: 0,
    };

    bucket.set(key, entry);
    this.currentSizesBytes[cacheBucket] += size;
    console.log(`[CacheEngine:${cacheBucket}] Cached key [${key}] (${(size / 1024).toFixed(1)}KB)`);
  }

  public get<T>(cacheBucket: keyof typeof this.caches, key: string): T | null {
    const bucket = this.caches[cacheBucket];
    if (!bucket) return null;

    const entry = bucket.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      console.log(`[CacheEngine:${cacheBucket}] Key expired: ${key}`);
      this.delete(cacheBucket, key);
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.hits++;
    return entry.value as T;
  }

  public delete(cacheBucket: keyof typeof this.caches, key: string): void {
    const bucket = this.caches[cacheBucket];
    if (!bucket) return;

    const entry = bucket.get(key);
    if (entry) {
      this.currentSizesBytes[cacheBucket] = Math.max(0, this.currentSizesBytes[cacheBucket] - entry.sizeBytes);
      bucket.delete(key);
    }
  }

  public clearBucket(cacheBucket: keyof typeof this.caches): void {
    const bucket = this.caches[cacheBucket];
    if (bucket) {
      bucket.clear();
      this.currentSizesBytes[cacheBucket] = 0;
      console.log(`[CacheEngine] Cleared bucket: ${cacheBucket}`);
    }
  }

  public getBucketStats(cacheBucket: keyof typeof this.caches) {
    const bucket = this.caches[cacheBucket];
    if (!bucket) return null;

    return {
      itemCount: bucket.size,
      maxSizeBytes: this.maxSizesBytes[cacheBucket],
      currentSizeBytes: this.currentSizesBytes[cacheBucket],
      percentFull: ((this.currentSizesBytes[cacheBucket] / (this.maxSizesBytes[cacheBucket] || 1)) * 100).toFixed(1),
    };
  }

  private evictOldest(cacheBucket: keyof typeof this.caches): void {
    const bucket = this.caches[cacheBucket];
    if (!bucket || bucket.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of bucket.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      console.log(`[CacheEngine:${cacheBucket}] Evicting oldest key: ${oldestKey} due to space pressure`);
      this.delete(cacheBucket, oldestKey);
    }
  }
}
