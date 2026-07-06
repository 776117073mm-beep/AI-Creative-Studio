/**
 * PROFESSIONAL VFX TYPES DEFINITIONS
 * Film Industry Ready, Enterprise Grade, Multi-pass Cinematic Pipeline
 */

export type VFXDataType = "rgb" | "alpha" | "vector3" | "float" | "matrix4" | "pbr_material";

export interface VFXTerminal {
  id: string;
  name: string;
  type: VFXDataType;
  value: any;
  isConnected: boolean;
  connectedToId?: string; // Terminal ID
  connectedNodeId?: string; // Node ID
}

export interface VFXNode {
  id: string;
  name: string;
  type:
    | "SourceNode"
    | "KeyerNode"
    | "RotoNode"
    | "TrackerNode"
    | "ParticleNode"
    | "SimulationNode"
    | "PhysicsNode"
    | "CameraSolveNode"
    | "Light3DNode"
    | "PBRMaterialNode"
    | "MultiPassMergeNode"
    | "OutputNode";
  parameters: Record<string, any>;
  inputs: VFXTerminal[];
  outputs: VFXTerminal[];
  position: { x: number; y: number };
}

export interface VFXConnection {
  id: string;
  fromNodeId: string;
  fromTerminalId: string;
  toNodeId: string;
  toTerminalId: string;
}

// TRACKING MODULE TYPES
export interface TrackingPoint {
  frame: number;
  x: number; // Normalized 0-1 coordinate
  y: number;
  confidence: number;
}

export interface TrackedFeature {
  id: string;
  name: string;
  type: "point" | "planar" | "camera" | "object" | "face" | "motion";
  points: TrackingPoint[];
  isActive: boolean;
  color: string;
  homographyMatrix?: number[]; // 3x3 planar transformation matrix
  solved3DPosition?: [number, number, number]; // [X, Y, Z] in 3D camera coordinate space
}

// ROTOSCOPING MODULE TYPES
export interface BezierAnchor {
  id: string;
  point: { x: number; y: number };
  handleIn: { x: number; y: number }; // Relative coordinates
  handleOut: { x: number; y: number };
}

export interface RotoCurve {
  id: string;
  name: string;
  anchors: BezierAnchor[];
  closed: boolean;
  featherRadius: number;
  opacity: number; // 0-1
  blendMode: "add" | "subtract" | "intersect" | "difference";
  motionBlurEnabled: boolean;
  linkedTrackerId?: string; // Bound tracking feature
}

export interface RotoMask {
  id: string;
  name: string;
  curves: RotoCurve[];
  isActive: boolean;
}

// KEYING MODULE TYPES
export interface KeyerSettings {
  keyColor: { r: number; g: number; b: number };
  colorSpace: "RGB" | "YUV" | "HSV";
  tolerance: number; // 0 - 100
  softness: number; // 0 - 100
  spillSuppression: number; // 0 - 1.0 (scaling green/blue channels)
  clipWhite: number; // 0 - 100 matte white balance
  clipBlack: number; // 0 - 100 matte black balance
  erode: number; // border shrink
  blurMatte: number; // border soft edge blur
}

// PARTICLE MODULE TYPES
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface VFXParticle {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  acceleration: Vector3D;
  color: { r: number; g: number; b: number; a: number };
  size: number;
  life: number; // remaining life in seconds
  maxLife: number; // total life in seconds
  mass: number;
  rotation: number;
  angularVelocity: number;
}

export interface ParticleEmitter {
  id: string;
  name: string;
  type: "point" | "box" | "sphere" | "mesh";
  position: Vector3D;
  direction: Vector3D;
  spreadAngle: number; // in degrees
  rate: number; // particles spawned per second
  speed: number;
  lifetime: number; // in seconds
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
  sizeStart: number;
  sizeEnd: number;
}

// SIMULATION MODULE TYPES
export interface FluidCell {
  density: number;
  temperature: number;
  u: number; // Velocity X
  v: number; // Velocity Y
  uPrev: number;
  vPrev: number;
  densityPrev: number;
}

export interface PhysicsBody {
  id: string;
  name: string;
  type: "rigid" | "soft";
  position: Vector3D;
  velocity: Vector3D;
  angularVelocity: Vector3D;
  mass: number;
  restitution: number; // bounciness (0 to 1)
  friction: number;
  dimensions: Vector3D; // bounding box or scale
  isStatic: boolean;
  springK?: number; // Soft body spring constant
  damping?: number; // Soft body damping
}

// CAMERA VFX TYPES
export interface CameraLensParams {
  focalLength: number; // mm, e.g., 35
  sensorWidth: number; // mm, e.g., 36 (Full Frame)
  k1: number; // Radial distortion coefficient 1
  k2: number; // Radial distortion coefficient 2
  p1: number; // Tangential distortion coefficient 1
  p2: number; // Tangential distortion coefficient 2
  cameraShakeFrequency: number; // Hz
  cameraShakeAmplitude: number; // intensity
}

// LIGHTING & MATERIALS
export interface VFXLight {
  id: string;
  name: string;
  type: "point" | "spot" | "directional" | "hdri";
  color: { r: number; g: number; b: number };
  intensity: number; // Lumens / watts
  position: Vector3D;
  direction: Vector3D;
  spotAngle: number; // for Spot light
  hdriMapUrl?: string; // HDR environment map path
}

export interface PBRMaterial {
  id: string;
  name: string;
  albedo: { r: number; g: number; b: number };
  roughness: number; // 0 to 1
  metallic: number; // 0 to 1
  opacity: number; // 0 to 1
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metallicMapUrl?: string;
  cryptomatteId: string; // Unique ID tag for rendering pass isolation
}

// MULTI-PASS RENDER TYPES
export type RenderPassType = "beauty" | "depth" | "normal" | "motion_vector" | "cryptomatte";

export interface RenderPassBuffer {
  type: RenderPassType;
  width: number;
  height: number;
  data: Float32Array; // Real pixel buffers representing float32 HDR channels
}

export interface GPUComputeStats {
  isActive: boolean;
  activeThreads: number;
  operationsPerSec: number;
  memoryAllocatedBytes: number;
  engineMode: "WebGL_GPGPU" | "WebGPU_Compute" | "CPU_Worker_Fallback";
}
