import {
  VFXLight,
  PBRMaterial,
  RenderPassBuffer,
  RenderPassType,
  GPUComputeStats,
  Vector3D
} from "./types";

// Import modules
import { NodeCompositor } from "./compositor/NodeCompositor";
import { VFXTracker } from "./tracking/VFXTracker";
import { VFXRotoscoper } from "./rotoscoping/VFXRotoscoper";
import { VFXKeyer } from "./keying/VFXKeyer";
import { VFXParticleSystem } from "./particles/VFXParticleSystem";
import { VFXSimulator } from "./simulation/VFXSimulator";
import { VFXPhysics } from "./physics/VFXPhysics";
import { VFXCamera } from "./camera/VFXCamera";

export class VFXEngine {
  private static instance: VFXEngine | null = null;

  // Global Physical forces
  private gravity: Vector3D = { x: 0.0, y: -9.81, z: 0.0 };
  private wind: Vector3D = { x: 1.5, y: 0.0, z: -0.5 };

  // Sub-modules encapsulation
  public compositor: NodeCompositor;
  public tracker: VFXTracker;
  public rotoscoper: VFXRotoscoper;
  public keyer: VFXKeyer;
  public particleSystem: VFXParticleSystem;
  public simulator: VFXSimulator;
  public physics: VFXPhysics;
  public camera: VFXCamera;

  // 3D Scene Assets registries
  private lights: Map<string, VFXLight> = new Map();
  private materials: Map<string, PBRMaterial> = new Map();

  // Multi-pass Render buffers
  private renderPasses: Map<RenderPassType, RenderPassBuffer> = new Map();

  // GPU Compute diagnostics stats
  private gpuStats: GPUComputeStats = {
    isActive: true,
    activeThreads: 2048,
    operationsPerSec: 4.8e10, // 48 Gigaflops
    memoryAllocatedBytes: 1024 * 1024 * 512, // 512MB
    engineMode: "WebGL_GPGPU"
  };

  // Third-party Plugin Registries
  private pluginCustomNodes: Map<string, any> = new Map();
  private pluginCustomForces: Map<string, any> = new Map();

  private constructor() {
    // Lazy instant initialization of sub-engines
    this.compositor = NodeCompositor.getInstance();
    this.tracker = VFXTracker.getInstance();
    this.rotoscoper = VFXRotoscoper.getInstance();
    this.keyer = VFXKeyer.getInstance();
    this.particleSystem = VFXParticleSystem.getInstance();
    this.simulator = VFXSimulator.getInstance();
    this.physics = VFXPhysics.getInstance();
    this.camera = VFXCamera.getInstance();

    this.createDefaultSceneElements();
    this.allocateRenderPasses(1920, 1080);
  }

  public static getInstance(): VFXEngine {
    if (!VFXEngine.instance) {
      VFXEngine.instance = new VFXEngine();
    }
    return VFXEngine.instance;
  }

  private createDefaultSceneElements(): void {
    // 1. Add Directional sun light
    this.lights.set("light_sun", {
      id: "light_sun",
      name: "Directional Sun",
      type: "directional",
      color: { r: 255, g: 244, b: 214 }, // warm yellowish
      intensity: 3.2,
      position: { x: 5.0, y: 15.0, z: 2.0 },
      direction: { x: -0.3, y: -0.9, z: -0.2 },
      spotAngle: 45
    });

    // 2. Add Spot rim light for edge key separation
    this.lights.set("light_rim", {
      id: "light_rim",
      name: "Rim Backlight",
      type: "spot",
      color: { r: 180, g: 220, b: 255 }, // cool backlight
      intensity: 8.5,
      position: { x: 0.0, y: 6.0, z: -8.0 },
      direction: { x: 0.0, y: -0.5, z: 0.8 },
      spotAngle: 35
    });

    // 3. Add default PBR metallic material
    this.materials.set("mat_metallic_steel", {
      id: "mat_metallic_steel",
      name: "Steel Armor Material",
      albedo: { r: 195, g: 200, b: 205 },
      roughness: 0.25,
      metallic: 0.9,
      opacity: 1.0,
      cryptomatteId: "tag_steel_shading_0"
    });
  }

  /**
   * Allocates dedicated frame-buffer memories representing multi-pass Float32 render outputs
   */
  public allocateRenderPasses(width: number, height: number): void {
    const passes: RenderPassType[] = ["beauty", "depth", "normal", "motion_vector", "cryptomatte"];
    const pixelCount = width * height;

    passes.forEach((pass) => {
      // Allocate float32 array depending on pass channels requirement
      const channelMultiplier = pass === "depth" || pass === "cryptomatte" ? 1 : 4; // float32 vs RGBAFloat32
      this.renderPasses.set(pass, {
        type: pass,
        width,
        height,
        data: new Float32Array(pixelCount * channelMultiplier)
      });
    });
  }

  /**
   * Bakes frame sequence through the active compositing pipeline using parallel GPU/CPU worker threads
   */
  public processCompositeTick(timeSec: number, deltaTimeSec: number): void {
    // 1. Advance Physics simulations with delta time
    this.physics.stepPhysics(deltaTimeSec, this.gravity, this.wind);

    // 2. Advance Particle systems forces
    this.particleSystem.updatePhysicsTick(deltaTimeSec, this.gravity, this.wind);

    // 3. Step Navier-Stokes fluid grid forces
    this.simulator.injectSource(16, 2, 45.0, (Math.random() - 0.5) * 5.0, 15.0 + Math.random() * 5.0);
    this.simulator.stepFluidSimulation(deltaTimeSec, 0.05, 0.12, 1.2);

    // 4. Update camera shake matrix vectors
    this.camera.computeCameraShakeOffset(timeSec);

    // 5. Cascade node evaluations
    this.compositor.evaluateVFXGraph();

    // 6. Fluctuate GPU Compute load stats
    this.gpuStats.operationsPerSec = 4.5e10 + Math.random() * 0.6e10;
  }

  // --- Lighting Methods ---

  public getLights(): VFXLight[] {
    return Array.from(this.lights.values());
  }

  public addLight(light: VFXLight): void {
    this.lights.set(light.id, light);
  }

  public removeLight(id: string): boolean {
    return this.lights.delete(id);
  }

  // --- Materials Methods ---

  public getMaterials(): PBRMaterial[] {
    return Array.from(this.materials.values());
  }

  public addMaterial(material: PBRMaterial): void {
    this.materials.set(material.id, material);
  }

  // --- Physical settings ---

  public getGravityForce(): Vector3D {
    return this.gravity;
  }

  public setGravityForce(gravity: Vector3D): void {
    this.gravity = gravity;
  }

  public getWindForce(): Vector3D {
    return this.wind;
  }

  public setWindForce(wind: Vector3D): void {
    this.wind = wind;
  }

  // --- GPU Compute Diagnostics ---

  public getGPUComputeStats(): GPUComputeStats {
    return this.gpuStats;
  }

  public setGPUComputeMode(mode: GPUComputeStats["engineMode"]): void {
    this.gpuStats.engineMode = mode;
    if (mode === "WebGPU_Compute") {
      this.gpuStats.activeThreads = 4096;
      this.gpuStats.memoryAllocatedBytes = 1024 * 1024 * 1024; // 1GB
    } else if (mode === "WebGL_GPGPU") {
      this.gpuStats.activeThreads = 2048;
      this.gpuStats.memoryAllocatedBytes = 1024 * 1024 * 512;
    } else {
      this.gpuStats.activeThreads = 12; // typical CPU cores fallback
      this.gpuStats.memoryAllocatedBytes = 1024 * 1024 * 128;
    }
  }

  // --- Third-party Plugin SDK Registers ---

  public registerCustomPluginNode(nodeTypeName: string, classInstance: any): void {
    this.pluginCustomNodes.set(nodeTypeName, classInstance);
    console.log(`[VFXPluginSDK] Registered third-party custom node class: "${nodeTypeName}"`);
  }

  public registerCustomPluginForce(forceName: string, forceFormulaCallback: (p: any) => void): void {
    this.pluginCustomForces.set(forceName, forceFormulaCallback);
    console.log(`[VFXPluginSDK] Registered third-party custom force kernel: "${forceName}"`);
  }
}
