import { CameraParams, CameraBookmark, Vector3D } from "../core/types";

export class CameraEngine {
  private static instance: CameraEngine | null = null;

  // Active camera parameters
  private activeCameraParams: CameraParams = {
    type: "perspective",
    fov: 45,
    orthoScale: 10,
    near: 0.1,
    far: 1000,
    safeArea: true,
    aspectRatio: 16 / 9,
    focalLength: 35, // 35mm lens
    shakeAmplitude: 0.1
  };

  // Camera presets
  private presets: Map<string, { name: string; params: CameraParams; position: Vector3D; rotation: Vector3D }> = new Map();

  // Active camera view coordinates
  private currentPosition: Vector3D = { x: 0.0, y: 5.0, z: 12.0 };
  private currentRotation: Vector3D = { x: -15.0, y: 0.0, z: 0.0 };

  // Targets for constraints
  private lookAtTargetNodeId: string | null = "mesh_mech_0"; // Target object to track
  private focalDepthOffset: number = 10;

  // Bookmarks list
  private bookmarks: CameraBookmark[] = [
    { id: "bm_front", name: "Est. Hero Front", position: { x: 0, y: 3, z: 10 }, rotation: { x: -5, y: 0, z: 0 } },
    { id: "bm_low_angle", name: "Action Low Angle", position: { x: -4, y: 1, z: 7 }, rotation: { x: 12, y: 30, z: -5 } },
    { id: "bm_top_down", name: "Tactical Top-Down", position: { x: 0, y: 15, z: 0.5 }, rotation: { x: -89, y: 0, z: 0 } },
    { id: "bm_dutch_rim", name: "Dutch Extreme Rim", position: { x: 8, y: 4, z: -8 }, rotation: { x: -18, y: -135, z: 15 } }
  ];

  private constructor() {
    this.registerDefaultPresets();
  }

  public static getInstance(): CameraEngine {
    if (!CameraEngine.instance) {
      CameraEngine.instance = new CameraEngine();
    }
    return CameraEngine.instance;
  }

  private registerDefaultPresets(): void {
    this.presets.set("pres_cinematic_35mm", {
      name: "Standard Cinematic 35mm",
      params: {
        type: "perspective",
        fov: 48,
        orthoScale: 10,
        near: 0.1,
        far: 500,
        safeArea: true,
        aspectRatio: 2.39 / 1, // Cinemascope
        focalLength: 35,
        shakeAmplitude: 0.15
      },
      position: { x: 0, y: 3.5, z: 11 },
      rotation: { x: -8, y: 0, z: 0 }
    });

    this.presets.set("pres_closeup_85mm", {
      name: "Detail Close-Up 85mm",
      params: {
        type: "perspective",
        fov: 24,
        orthoScale: 10,
        near: 0.05,
        far: 200,
        safeArea: true,
        aspectRatio: 16 / 9,
        focalLength: 85,
        shakeAmplitude: 0.04 // very low shake due to tripod
      },
      position: { x: -2.5, y: 2.0, z: 5.5 },
      rotation: { x: 5, y: 25, z: 0 }
    });

    this.presets.set("pres_ultra_wide_18mm", {
      name: "Dynamic Action 18mm",
      params: {
        type: "perspective",
        fov: 75,
        orthoScale: 10,
        near: 0.1,
        far: 1000,
        safeArea: true,
        aspectRatio: 16 / 9,
        focalLength: 18,
        shakeAmplitude: 0.45 // high handheld kinetic shake
      },
      position: { x: 3.5, y: 1.5, z: 4.0 },
      rotation: { x: -15, y: -45, z: 5 }
    });

    this.presets.set("pres_ortho_blueprint", {
      name: "Ortho Technical Blueprint",
      params: {
        type: "orthographic",
        fov: 45,
        orthoScale: 8.5,
        near: 1.0,
        far: 2000,
        safeArea: false,
        aspectRatio: 1,
        focalLength: 50,
        shakeAmplitude: 0.0
      },
      position: { x: 0, y: 10, z: 15 },
      rotation: { x: -30, y: 45, z: 0 }
    });
  }

  // --- Core Parameters ---

  public getParams(): CameraParams {
    return this.activeCameraParams;
  }

  public updateParams(params: Partial<CameraParams>): void {
    this.activeCameraParams = {
      ...this.activeCameraParams,
      ...params
    };
    // Sync focal length to approximate FOV automatically for convenience
    if (params.focalLength !== undefined) {
      // rough mathematical FOV from focal length
      this.activeCameraParams.fov = 2 * Math.atan(36 / (2 * params.focalLength)) * (180 / Math.PI);
    } else if (params.fov !== undefined) {
      this.activeCameraParams.focalLength = 36 / (2 * Math.tan((params.fov * Math.PI) / 360));
    }
  }

  public getPosition(): Vector3D {
    return this.currentPosition;
  }

  public setPosition(pos: Vector3D): void {
    this.currentPosition = pos;
  }

  public getRotation(): Vector3D {
    return this.currentRotation;
  }

  public setRotation(rot: Vector3D): void {
    this.currentRotation = rot;
  }

  // --- Presets & switching ---

  public getPresets() {
    return Array.from(this.presets.entries()).map(([id, val]) => ({
      id,
      ...val
    }));
  }

  public applyPreset(presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (!preset) return false;

    this.activeCameraParams = { ...preset.params };
    this.currentPosition = { ...preset.position };
    this.currentRotation = { ...preset.rotation };

    return true;
  }

  // --- Bookmarks management ---

  public getBookmarks(): CameraBookmark[] {
    return this.bookmarks;
  }

  public addBookmark(name: string): string {
    const id = `bm_${Date.now()}`;
    this.bookmarks.push({
      id,
      name,
      position: { ...this.currentPosition },
      rotation: { ...this.currentRotation }
    });
    return id;
  }

  public removeBookmark(id: string): void {
    this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
  }

  public jumpToBookmark(id: string): boolean {
    const bm = this.bookmarks.find((b) => b.id === id);
    if (!bm) return false;

    this.currentPosition = { ...bm.position };
    this.currentRotation = { ...bm.rotation };
    return true;
  }

  // --- Constraints (Look At, tracking) ---

  public getLookAtTargetNodeId(): string | null {
    return this.lookAtTargetNodeId;
  }

  public setLookAtTargetNodeId(nodeId: string | null): void {
    this.lookAtTargetNodeId = nodeId;
  }

  public computeLookAtAngles(targetPos: Vector3D): { x: number; y: number; z: number } {
    const dx = targetPos.x - this.currentPosition.x;
    const dy = targetPos.y - this.currentPosition.y;
    const dz = targetPos.z - this.currentPosition.z;

    const distance2D = Math.sqrt(dx * dx + dz * dz);
    
    // Euler angles calculation in degrees
    const pitch = -Math.atan2(dy, distance2D) * (180 / Math.PI);
    const yaw = Math.atan2(dx, dz) * (180 / Math.PI);

    return { x: pitch, y: yaw, z: 0.0 };
  }

  // --- Procedural Handheld Shake ---

  public getShakeOffset(timeSec: number): Vector3D {
    if (this.activeCameraParams.shakeAmplitude === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const amp = this.activeCameraParams.shakeAmplitude;
    // Layering multiple sine frequencies to simulate natural organic tremors
    const sx = Math.sin(timeSec * 4.5) * 0.25 + Math.sin(timeSec * 1.8) * 0.45 + Math.cos(timeSec * 8.2) * 0.12;
    const sy = Math.cos(timeSec * 3.8) * 0.35 + Math.sin(timeSec * 2.2) * 0.38 + Math.sin(timeSec * 7.5) * 0.15;
    const sz = Math.sin(timeSec * 5.2) * 0.15 + Math.cos(timeSec * 1.1) * 0.35;

    return {
      x: sx * amp,
      y: sy * amp,
      z: sz * amp
    };
  }

  // --- Safe Area Guidelines overlay computation ---

  public getSafeAreaGuides(width: number, height: number) {
    // Standard industry 90% action safe and 80% title safe bounds
    return {
      actionSafe: {
        x: width * 0.05,
        y: height * 0.05,
        w: width * 0.9,
        h: height * 0.9
      },
      titleSafe: {
        x: width * 0.1,
        y: height * 0.1,
        w: width * 0.8,
        h: height * 0.8
      }
    };
  }
}
