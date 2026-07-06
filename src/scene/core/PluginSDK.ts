import { SceneNode, MaterialConfig, LightNode, Asset3D } from "./types";
import { SceneGraph } from "../graph/SceneGraph";
import { MaterialEngine } from "../material/MaterialEngine";
import { AssetEngine } from "../assets/AssetEngine";

export interface ThreeDPlugin {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  enabled: boolean;
  onLoad: (sdk: PluginSDK) => void;
  onUnload: (sdk: PluginSDK) => void;
}

export class PluginSDK {
  private static instance: PluginSDK | null = null;

  // Track loaded plugins list
  private plugins: Map<string, ThreeDPlugin> = new Map();

  // Custom registered procedural shapes creators
  private customProceduralGeometryCreators: Map<string, (name: string) => SceneNode> = new Map();

  private constructor() {
    this.registerBuiltinMockPlugins();
  }

  public static getInstance(): PluginSDK {
    if (!PluginSDK.instance) {
      PluginSDK.instance = new PluginSDK();
    }
    return PluginSDK.instance;
  }

  private registerBuiltinMockPlugins(): void {
    // 1. Procedural Sci-Fi Generator plugin
    this.registerPlugin({
      id: "pl_scifi_gen",
      name: "Procedural Sci-Fi Greebles",
      author: "Neo-Tokyo FX Division",
      version: "1.4.2",
      description: "Generates ultra-detailed surface detailing (Greebles) dynamically over mesh faces.",
      enabled: false,
      onLoad: (sdk) => {
        sdk.registerProceduralGeometry("SciFi_Greeble_Box", (name) => {
          return {
            id: `mesh_greeble_${Date.now()}`,
            name: `${name}_Greebles`,
            type: "mesh",
            parent: null,
            children: [],
            transform: { position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            visible: true, selected: true, tags: ["procedural", "greeble_plugin"], layer: "geometry_layer", collectionId: "col_props"
          };
        });
      },
      onUnload: (sdk) => {
        sdk.unregisterProceduralGeometry("SciFi_Greeble_Box");
      }
    });

    // 2. Liquid Glass Shader plugin
    this.registerPlugin({
      id: "pl_liquid_shading",
      name: "Chroma-Fluid PBR Extension",
      author: "VFX Liquid Inc.",
      version: "2.0.1",
      description: "Adds custom iridescent liquid refractive index shader templates to the materials engine.",
      enabled: false,
      onLoad: (sdk) => {
        // Registers custom material
        const liquidMetal: MaterialConfig = {
          id: "mat_liquid_chroma",
          name: "Chroma-Fluid Glass",
          albedo: { r: 255, g: 10, b: 200 },
          metallic: 0.15,
          roughness: 0.02,
          emissionColor: { r: 80, g: 10, b: 240 },
          emissionIntensity: 1.8,
          opacity: 0.7,
          transparent: true,
          normalScale: 1.5,
          albedoTextureId: null,
          metallicRoughnessTextureId: null,
          normalTextureId: "tex_slime_ripples_normal",
          emissionTextureId: null,
          opacityTextureId: null,
          isInstance: false,
          parentMaterialId: null
        };
        MaterialEngine.getInstance().addMaterial(liquidMetal);

        // Register asset listing
        const asset: Asset3D = {
          id: "asset_mat_liquid_chroma",
          name: "Chroma-Fluid Refractor",
          type: "material",
          tags: ["liquid", "chroma", "refractive", "plugin_shader"],
          isFavorite: false,
          sizeBytes: 1024 * 16,
          version: "v2.0_plugin",
          thumbnail: "🦄",
          filePath: "/plugins/materials/chroma_fluid.json"
        };
        AssetEngine.getInstance().importAssetRecord(asset);
      },
      onUnload: (sdk) => {
        MaterialEngine.getInstance().removeMaterial("mat_liquid_chroma");
        AssetEngine.getInstance().removeAssetRecord("asset_mat_liquid_chroma");
      }
    });
  }

  // --- SDK Core Plugin Registrations ---

  public getPlugins(): ThreeDPlugin[] {
    return Array.from(this.plugins.values());
  }

  public registerPlugin(plugin: ThreeDPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public togglePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    plugin.enabled = !plugin.enabled;

    if (plugin.enabled) {
      plugin.onLoad(this);
      console.log(`[PluginSDK] Plugin activated: "${plugin.name}" v${plugin.version}`);
    } else {
      plugin.onUnload(this);
      console.log(`[PluginSDK] Plugin deactivated: "${plugin.name}"`);
    }

    return true;
  }

  // --- Procedural shapes custom extensions injections ---

  public registerProceduralGeometry(key: string, creator: (name: string) => SceneNode): void {
    this.customProceduralGeometryCreators.set(key, creator);
  }

  public unregisterProceduralGeometry(key: string): void {
    this.customProceduralGeometryCreators.delete(key);
  }

  public getProceduralKeys(): string[] {
    return Array.from(this.customProceduralGeometryCreators.keys());
  }

  public createProceduralGeometry(key: string, nodeName: string): SceneNode | null {
    const creator = this.customProceduralGeometryCreators.get(key);
    if (!creator) return null;

    const node = creator(nodeName);
    SceneGraph.getInstance().addNode(node);
    return node;
  }
}
