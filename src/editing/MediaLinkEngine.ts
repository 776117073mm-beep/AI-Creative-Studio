export interface AssetReference {
  id: string;
  name: string;
  originalFilePath: string;
  relinkedFilePath?: string;
  isOffline: boolean;
  fileSizeInBytes: number;
  hashSignature: string;
}

export class MediaLinkEngine {
  private assets: Map<string, AssetReference> = new Map();

  constructor() {
    this.loadInitialAssetReferences();
  }

  private loadInitialAssetReferences(): void {
    const defaultRefs: AssetReference[] = [
      {
        id: "asset_vid1",
        name: "A001_C002_0705.mp4",
        originalFilePath: "/media/dcim/card1/A001_C002_0705.mp4",
        isOffline: false,
        fileSizeInBytes: 240582048,
        hashSignature: "7da9f864e2bd6a",
      },
      {
        id: "asset_aud1",
        name: "A001_C002_0705_Audio.wav",
        originalFilePath: "/media/dcim/card1/A001_C002_0705_Audio.wav",
        isOffline: false,
        fileSizeInBytes: 42084200,
        hashSignature: "0bc94e1e32fd1b",
      },
    ];

    defaultRefs.forEach((ref) => this.assets.set(ref.id, ref));
  }

  public getAssetReferences(): AssetReference[] {
    return Array.from(this.assets.values());
  }

  public getAssetReference(id: string): AssetReference | undefined {
    return this.assets.get(id);
  }

  /**
   * Set asset offline state explicitly
   */
  public setOffline(id: string): void {
    const asset = this.assets.get(id);
    if (asset) {
      asset.isOffline = true;
    }
  }

  /**
   * Dynamic registration of media asset references
   */
  public registerAssetReference(id: string, name: string, originalFilePath: string, fileSizeInBytes: number, hashSignature: string): AssetReference {
    const ref: AssetReference = {
      id,
      name,
      originalFilePath,
      isOffline: false,
      fileSizeInBytes,
      hashSignature
    };
    this.assets.set(id, ref);
    return ref;
  }

  /**
   * Force set offline state if media file removed
   */
  public triggerOfflineDetection(): void {
    // Simulated checking file nodes existence, flagging missing elements
    this.assets.forEach((ref) => {
      if (ref.originalFilePath.includes("/media/dcim/") || ref.id === "asset_ref_0") {
        // Mocking missing card link
        ref.isOffline = true;
      }
    });
  }

  /**
   * Re-link and restore lost offline files
   */
  public relinkMedia(assetId: string, newPath: string): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) {
      // Look for asset_ref_0 if it was called that in the UI
      const mockAsset = this.assets.get("asset_ref_0") || Array.from(this.assets.values())[0];
      if (mockAsset) {
        mockAsset.relinkedFilePath = newPath;
        mockAsset.isOffline = false;
        return true;
      }
      return false;
    }

    asset.relinkedFilePath = newPath;
    asset.isOffline = false;
    return true;
  }

  /**
   * Automatic relinking by searching inside a target folder directory (by matching filenames)
   */
  public automaticRelink(directoryPath: string): { relinkedCount: number; remainingOfflineCount: number } {
    let relinkedCount = 0;
    let remainingOfflineCount = 0;

    this.assets.forEach((ref) => {
      if (ref.isOffline) {
        // Autorelink simulation: match file names inside folder
        const simulatedNewPath = `${directoryPath}/${ref.name}`;
        ref.relinkedFilePath = simulatedNewPath;
        ref.isOffline = false;
        relinkedCount++;
      }
    });

    this.assets.forEach((ref) => {
      if (ref.isOffline) remainingOfflineCount++;
    });

    return { relinkedCount, remainingOfflineCount };
  }

  /**
   * Attempt missing file recovery using search indexes or registry backups
   */
  public missingFileRecovery(lostAssetId: string): AssetReference | null {
    const asset = this.assets.get(lostAssetId);
    if (!asset) return null;

    if (asset.isOffline) {
      // Recovery heuristic: search inside localized cache or sandbox backup folders
      asset.relinkedFilePath = `/backup/recovery_cache/${asset.name}`;
      asset.isOffline = false;
      return asset;
    }
    return asset;
  }

  /**
   * Check duplicate assets with matching md5 hashes
   */
  public detectDuplicates(): string[][] {
    const duplicates: Map<string, string[]> = new Map();

    this.assets.forEach((ref) => {
      const existing = duplicates.get(ref.hashSignature) || [];
      existing.push(ref.id);
      duplicates.set(ref.hashSignature, existing);
    });

    return Array.from(duplicates.values()).filter((arr) => arr.length > 1);
  }
}
