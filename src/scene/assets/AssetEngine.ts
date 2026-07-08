import { Asset3D } from "../core/types";

export type { Asset3D };

export class AssetEngine {
  private static instance: AssetEngine | null = null;

  // Global browser assets registry
  private assets: Map<string, Asset3D> = new Map();

  private constructor() {
    this.registerDefaultAssets();
  }

  public static getInstance(): AssetEngine {
    if (!AssetEngine.instance) {
      AssetEngine.instance = new AssetEngine();
    }
    return AssetEngine.instance;
  }

  private registerDefaultAssets(): void {
    // Sci-Fi drone model asset
    this.assets.set("asset_mesh_drone", {
      id: "asset_mesh_drone",
      name: "Sci-Fi Recon Drone",
      type: "mesh",
      tags: ["scifi", "prop", "flying", "metallic"],
      isFavorite: true,
      sizeBytes: 1024 * 1024 * 14.5, // 14.5MB
      version: "v2.1",
      thumbnail: "🛰️",
      filePath: "/models/props/scifi_recon_drone.fbx"
    });

    // Cyberpunk mech model asset
    this.assets.set("asset_mesh_mech", {
      id: "asset_mesh_mech",
      name: "Cyber Mech Guardian Armor",
      type: "mesh",
      tags: ["cyberpunk", "character", "hero", "biped"],
      isFavorite: true,
      sizeBytes: 1024 * 1024 * 42.8, // 42.8MB
      version: "v4.0_gold",
      thumbnail: "🤖",
      filePath: "/models/characters/cyber_mech_guardian.gltf"
    });

    // Temple ruins model asset
    this.assets.set("asset_mesh_ruins", {
      id: "asset_mesh_ruins",
      name: "Ancient Grotto Temple Ruins",
      type: "mesh",
      tags: ["ancient", "environment", "rocks", "static"],
      isFavorite: false,
      sizeBytes: 1024 * 1024 * 88.2, // 88.2MB
      version: "v1.2",
      thumbnail: "🏛️",
      filePath: "/models/environments/temple_ruins.usd"
    });

    // Gold material asset
    this.assets.set("asset_mat_gold", {
      id: "asset_mat_gold",
      name: "Polished Gold Alloy",
      type: "material",
      tags: ["metal", "gold", "polished", "pbr"],
      isFavorite: false,
      sizeBytes: 1024 * 45, // 45KB shader config
      version: "v1.0",
      thumbnail: "🟡",
      filePath: "/materials/pbr/polished_gold.json"
    });

    // Lava rock material asset
    this.assets.set("asset_mat_lava", {
      id: "asset_mat_lava",
      name: "Emissive Lava Rock",
      type: "material",
      tags: ["lava", "rock", "emissive", "volcanic"],
      isFavorite: true,
      sizeBytes: 1024 * 112,
      version: "v1.5",
      thumbnail: "🌋",
      filePath: "/materials/pbr/emissive_lava_rock.json"
    });

    // Chrome material asset
    this.assets.set("asset_mat_chrome", {
      id: "asset_mat_chrome",
      name: "Brushed Chrome",
      type: "material",
      tags: ["chrome", "silver", "reflective", "metallic"],
      isFavorite: false,
      sizeBytes: 1024 * 32,
      version: "v2.0",
      thumbnail: "💿",
      filePath: "/materials/pbr/brushed_chrome.json"
    });

    // Cyberpunk street environment preset
    this.assets.set("asset_env_cyber", {
      id: "asset_env_cyber",
      name: "Cyberpunk Alleyway Neon HDRI",
      type: "environment",
      tags: ["hdr", "neon", "cyberpunk", "rainy", "night"],
      isFavorite: true,
      sizeBytes: 1024 * 1024 * 24.0, // 24MB EXR HDRI
      version: "v3.1",
      thumbnail: "🌃",
      filePath: "/environments/hdri/cyberpunk_alleyway_4k.exr"
    });

    // Studio lighting environment
    this.assets.set("asset_env_studio", {
      id: "asset_env_studio",
      name: "Studio Industrial Spotlight HDRI",
      type: "environment",
      tags: ["hdr", "studio", "monochrome", "three-point"],
      isFavorite: false,
      sizeBytes: 1024 * 1024 * 12.5,
      version: "v1.0",
      thumbnail: "💡",
      filePath: "/environments/hdri/studio_industrial_2k.hdr"
    });
  }

  // --- Browser API Methods ---

  public getAssets(): Asset3D[] {
    return Array.from(this.assets.values());
  }

  public getAsset(id: string): Asset3D | undefined {
    return this.assets.get(id);
  }

  public toggleFavorite(id: string): void {
    const asset = this.assets.get(id);
    if (asset) {
      asset.isFavorite = !asset.isFavorite;
    }
  }

  public getAssetsByType(type: Asset3D["type"]): Asset3D[] {
    return this.getAssets().filter((a) => a.type === type);
  }

  public queryAssets(query: string, typeFilter: string | null = null): Asset3D[] {
    const q = query.toLowerCase().trim();
    return this.getAssets().filter((a) => {
      // Type match check
      if (typeFilter && typeFilter !== "all" && a.type !== typeFilter) {
        return false;
      }
      // String match check
      if (q === "") return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        a.filePath.toLowerCase().includes(q)
      );
    });
  }

  // --- Custom Asset ingestion ---

  public importAssetRecord(asset: Asset3D): void {
    this.assets.set(asset.id, asset);
  }

  public removeAssetRecord(id: string): boolean {
    return this.assets.delete(id);
  }
}
