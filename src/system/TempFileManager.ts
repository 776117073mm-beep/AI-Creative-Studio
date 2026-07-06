export interface TempFileDescriptor {
  handleId: string;
  originalName: string;
  virtualPath: string;
  sizeBytes: number;
  createdAt: number;
  expiresAt: number;
  isRecoverable: boolean;
  recoveryDataPayload?: any;
}

export class TempFileManager {
  private static instance: TempFileManager;

  private tempFiles: Map<string, TempFileDescriptor> = new Map();
  private maxTempDirectorySize = 1024 * 1024 * 1024 * 5; // 5GB limit
  private runningTempBytes = 0;

  private constructor() {
    this.startAutoCleanLoop();
  }

  public static getInstance(): TempFileManager {
    if (!TempFileManager.instance) {
      TempFileManager.instance = new TempFileManager();
    }
    return TempFileManager.instance;
  }

  public createTempFile(
    originalName: string,
    sizeBytes: number,
    options: { ttlMs?: number; isRecoverable?: boolean; recoveryPayload?: any } = {}
  ): TempFileDescriptor {
    const handleId = `tmp_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const ttl = options.ttlMs || 1000 * 60 * 30; // 30 min default
    const isRecoverable = options.isRecoverable ?? false;

    // Direct folder space constraints check
    if (this.runningTempBytes + sizeBytes > this.maxTempDirectorySize) {
      console.warn("[TempFileManager] Disk temp threshold exceeded! Forcing aggressive cleanup first.");
      this.cleanExpiredOrTrash(true);
    }

    const descriptor: TempFileDescriptor = {
      handleId,
      originalName,
      virtualPath: `/tmp/studio/${handleId}_${originalName}`,
      sizeBytes,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      isRecoverable,
      recoveryDataPayload: options.recoveryPayload,
    };

    this.tempFiles.set(handleId, descriptor);
    this.runningTempBytes += sizeBytes;
    console.log(`[TempFileManager] Created temporary file descriptor: ${descriptor.virtualPath} (${(sizeBytes / 1024 / 1024).toFixed(1)}MB)`);

    return descriptor;
  }

  public releaseTempFile(handleId: string): void {
    const file = this.tempFiles.get(handleId);
    if (file) {
      this.runningTempBytes = Math.max(0, this.runningTempBytes - file.sizeBytes);
      this.tempFiles.delete(handleId);
      console.log(`[TempFileManager] Released temporary file: ${file.virtualPath}`);
    }
  }

  public cleanExpiredOrTrash(forceAggressive = false): void {
    const now = Date.now();
    let deletedCount = 0;
    let releasedBytes = 0;

    for (const [id, file] of this.tempFiles.entries()) {
      const isExpired = now > file.expiresAt;
      
      // If forceAggressive, delete everything that is older than 5 minutes or isn't marked recoverable
      const shouldDelete = isExpired || (forceAggressive && (!file.isRecoverable || (now - file.createdAt > 1000 * 60 * 5)));

      if (shouldDelete) {
        releasedBytes += file.sizeBytes;
        this.tempFiles.delete(id);
        deletedCount++;
      }
    }

    this.runningTempBytes = Math.max(0, this.runningTempBytes - releasedBytes);
    if (deletedCount > 0) {
      console.log(`[TempFileManager] Auto-Clean wiped ${deletedCount} temp files. Reclaimed ${(releasedBytes / 1024 / 1024).toFixed(1)}MB.`);
    }
  }

  public recoverFile(handleId: string): TempFileDescriptor {
    const file = this.tempFiles.get(handleId);
    if (!file) {
      throw new Error(`[TempFileManager] Cannot recover. File handle is missing or purged: ${handleId}`);
    }
    if (!file.isRecoverable) {
      throw new Error(`[TempFileManager] File is not marked as recoverable: ${handleId}`);
    }

    console.log(`[TempFileManager] Safely recovered temp session parameters for: ${file.originalName}`);
    // Refresh expires time
    file.expiresAt = Date.now() + (1000 * 60 * 30);
    return file;
  }

  public getStats() {
    return {
      activeFileCount: this.tempFiles.size,
      totalUsageBytes: this.runningTempBytes,
      maxLimitBytes: this.maxTempDirectorySize,
      percentUsed: ((this.runningTempBytes / this.maxTempDirectorySize) * 100).toFixed(1),
    };
  }

  private startAutoCleanLoop(): void {
    setInterval(() => {
      this.cleanExpiredOrTrash();
    }, 15000); // Check every 15s
  }
}
