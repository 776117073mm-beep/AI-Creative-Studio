import { MeshGeometry, Vector3D } from "../core/types";

export class MeshEngine {
  private static instance: MeshEngine | null = null;

  // Global static meshes metadata cache registry
  private meshCache: Map<string, {
    id: string;
    name: string;
    polygonCount: number;
    vertexCount: number;
    hasNormals: boolean;
    hasUvs: boolean;
    lodsCount: number;
    basePrimitive: string;
  }> = new Map();

  private constructor() {
    this.populateInitialMeshMetadata();
  }

  public static getInstance(): MeshEngine {
    if (!MeshEngine.instance) {
      MeshEngine.instance = new MeshEngine();
    }
    return MeshEngine.instance;
  }

  private populateInitialMeshMetadata(): void {
    this.meshCache.set("mesh_cube", {
      id: "mesh_cube",
      name: "Unit Geometric Cube",
      polygonCount: 12,
      vertexCount: 24,
      hasNormals: true,
      hasUvs: true,
      lodsCount: 1,
      basePrimitive: "cube"
    });

    this.meshCache.set("mesh_sphere", {
      id: "mesh_sphere",
      name: "High-Poly Quad Sphere",
      polygonCount: 1280,
      vertexCount: 642,
      hasNormals: true,
      hasUvs: true,
      lodsCount: 3, // High, Med, Low LOD profiles
      basePrimitive: "sphere"
    });

    this.meshCache.set("mesh_torus", {
      id: "mesh_torus",
      name: "Chambered Ring Torus",
      polygonCount: 2560,
      vertexCount: 1280,
      hasNormals: true,
      hasUvs: true,
      lodsCount: 2,
      basePrimitive: "torus"
    });

    this.meshCache.set("mesh_cyber_mech", {
      id: "mesh_cyber_mech",
      name: "Cyber Mech Guardian Armor",
      polygonCount: 86400,
      vertexCount: 45200,
      hasNormals: true,
      hasUvs: true,
      lodsCount: 4, // Film quality down to mobile distance
      basePrimitive: "custom"
    });

    this.meshCache.set("mesh_scifi_drone", {
      id: "mesh_scifi_drone",
      name: "Modular Recon Sci-Fi Drone",
      polygonCount: 32000,
      vertexCount: 18400,
      hasNormals: true,
      hasUvs: true,
      lodsCount: 3,
      basePrimitive: "custom"
    });

    this.meshCache.set("mesh_temple_ruins", {
      id: "mesh_temple_ruins",
      name: "Ancient Grotto Temple Ruins",
      polygonCount: 154000,
      vertexCount: 89000,
      hasNormals: true,
      hasUvs: true,
      lodsCount: 4,
      basePrimitive: "custom"
    });
  }

  // --- Core API ---

  public getMeshCache() {
    return Array.from(this.meshCache.values());
  }

  public getMeshMetadata(id: string) {
    return this.meshCache.get(id);
  }

  // --- LOD Level selector ---

  public static selectLODLevel(
    cameraPos: Vector3D,
    nodePos: Vector3D,
    focalLengthMm: number
  ): "lod_high" | "lod_medium" | "lod_low" | "lod_cull" {
    const dx = nodePos.x - cameraPos.x;
    const dy = nodePos.y - cameraPos.y;
    const dz = nodePos.z - cameraPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Zoom factor scaling based on lens magnification
    const zoomScale = focalLengthMm / 35.0;
    const effectiveDistance = distance / zoomScale;

    if (effectiveDistance > 120.0) {
      return "lod_cull"; // culled entirely (beyond far plane)
    }
    if (effectiveDistance > 45.0) {
      return "lod_low"; // low lod representation (e.g. 5% polygons)
    }
    if (effectiveDistance > 15.0) {
      return "lod_medium"; // medium lod (e.g. 30% polygons)
    }
    return "lod_high"; // pristine detail lod
  }

  // --- Mesh Optimization Decimations (Decimation ratios) ---

  public static getOptimizedMeshVertexCount(originalCount: number, optimizationFactor: number): number {
    // Simulates quadric edge collapse mesh decimation optimizations
    const factor = Math.min(1.0, Math.max(0.1, optimizationFactor));
    return Math.round(originalCount * factor);
  }

  // --- Instanced rendering drawing ---

  public static computeInstanceOffsetsBuffer(
    count: number,
    boundary: { min: Vector3D; max: Vector3D }
  ): Float32Array {
    // Generates flat Float32 translation offset buffer mapping matrix parameters
    const buffer = new Float32Array(count * 3);
    const rx = boundary.max.x - boundary.min.x;
    const ry = boundary.max.y - boundary.min.y;
    const rz = boundary.max.z - boundary.min.z;

    for (let i = 0; i < count; i++) {
      buffer[i * 3 + 0] = boundary.min.x + Math.random() * rx;
      buffer[i * 3 + 1] = boundary.min.y + Math.random() * ry;
      buffer[i * 3 + 2] = boundary.min.z + Math.random() * rz;
    }

    return buffer;
  }
}
