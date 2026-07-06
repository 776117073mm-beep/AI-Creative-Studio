export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Transform3D {
  position: Vector3D;
  rotation: Vector3D; // Euler angles in degrees
  scale: Vector3D;
}

export type SceneNodeType =
  | "empty"
  | "mesh"
  | "camera"
  | "light"
  | "audio"
  | "locator"
  | "null_object"
  | "custom";

export interface SceneNode {
  id: string;
  name: string;
  type: SceneNodeType;
  parent: string | null; // ID of the parent node
  children: string[]; // IDs of children nodes
  transform: Transform3D;
  visible: boolean;
  selected: boolean;
  tags: string[];
  layer: string; // Layer identifier for rendering passes / visibility
  collectionId: string | null; // Group collection identifier
  customTypeKey?: string; // For plugin nodes
}

// Camera Configuration
export type CameraType = "perspective" | "orthographic";

export interface CameraParams {
  type: CameraType;
  fov: number; // Field of View (perspective)
  orthoScale: number; // Zoom level (orthographic)
  near: number;
  far: number;
  safeArea: boolean; // Display cinematic action/title safe area guidelines
  aspectRatio: number;
  focalLength: number; // Lens focal length in mm (e.g. 35mm, 50mm, 85mm)
  shakeAmplitude: number;
}

export interface CameraBookmark {
  id: string;
  name: string;
  position: Vector3D;
  rotation: Vector3D;
}

export interface CameraNode extends SceneNode {
  type: "camera";
  cameraParams: CameraParams;
  bookmarks: CameraBookmark[];
  activeBookmarkId: string | null;
}

// Light Configuration
export type LightType = "point" | "spot" | "directional" | "area" | "environment";

export interface LightParams {
  type: LightType;
  color: ColorRGB;
  intensity: number;
  spotAngle: number; // Spot light cone angle
  shadowsEnabled: boolean;
  shadowResolution: number; // 512, 1024, 2048, 4096
  lightMask: number; // Binary flags for light linking to specific layers
}

export interface LightNode extends SceneNode {
  type: "light";
  lightParams: LightParams;
}

// Material Configuration
export interface MaterialConfig {
  id: string;
  name: string;
  albedo: ColorRGB;
  metallic: number;
  roughness: number;
  emissionColor: ColorRGB;
  emissionIntensity: number;
  opacity: number;
  transparent: boolean;
  normalScale: number;
  albedoTextureId: string | null;
  metallicRoughnessTextureId: string | null;
  normalTextureId: string | null;
  emissionTextureId: string | null;
  opacityTextureId: string | null;
  isInstance: boolean;
  parentMaterialId: string | null; // For material instancing
}

// Texture Configuration
export interface TextureConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  format: "rgba8" | "rgb8" | "r16f" | "rgba32f";
  compressed: boolean;
  sizeBytes: number;
  isStreamed: boolean;
  previewUrl: string;
}

// Mesh Configuration
export interface MeshGeometry {
  vertices: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  primitiveType: "cube" | "sphere" | "torus" | "plane" | "custom";
}

export interface MeshNode extends SceneNode {
  type: "mesh";
  geometryType: "cube" | "sphere" | "torus" | "plane" | "scifi_drone" | "cyber_mech" | "temple_ruins";
  materialId: string | null;
  instanced: boolean;
  lodLevels: { distance: number; geometryType: string }[];
  polygonCount: number;
}

// Asset Registry
export interface Asset3D {
  id: string;
  name: string;
  type: "mesh" | "material" | "environment" | "texture" | "scene_preset";
  tags: string[];
  isFavorite: boolean;
  sizeBytes: number;
  version: string;
  thumbnail: string;
  filePath: string;
}

// Environment Config
export type EnvironmentPreset = "sunset" | "studio" | "cyberpunk_street" | "nebula" | "daylight";

export interface EnvironmentConfig {
  skyPreset: EnvironmentPreset;
  fogEnabled: boolean;
  fogColor: ColorRGB;
  fogDensity: number;
  groundVisible: boolean;
  groundReflection: number; // 0.0 to 1.0 reflection factor
  hdriIntensity: number;
}

// Animation Tracks
export interface AnimationKeyframe {
  timeSec: number;
  value: Vector3D | number | ColorRGB;
}

export interface AnimationTrack {
  id: string;
  targetNodeId: string;
  property: "position" | "rotation" | "scale" | "lightIntensity" | "materialRoughness" | "materialMetallic";
  keyframes: AnimationKeyframe[];
}

// Physics Config
export type PhysicsBodyType = "rigid" | "soft" | "cloth" | "fluid" | "hair";

export interface PhysicsParams {
  bodyType: PhysicsBodyType;
  mass: number;
  gravityScale: number;
  restitution: number; // Bounciness
  friction: number;
  windResistance: number;
  collisionGroup: number;
  enabled: boolean;
}

// GPU Engine Monitor Stats
export interface GPUMemoryStats {
  vramTotalBytes: number;
  vramAllocatedBytes: number;
  drawCallsCount: number;
  activePipelinesCount: number;
  gpuUsagePercent: number;
  activeThreads: number;
  mode: "WebGL_3D" | "WebGPU_Vulkan" | "Software_Rasterizer";
}
