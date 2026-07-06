import { MotionCameraLayer, AnimatedProperty } from "../core/MotionTypes";
import { AnimationEngine } from "../animation/AnimationEngine";

export interface CameraMatrix {
  x: number;
  y: number;
  z: number;
  pitch: number; // in degrees
  yaw: number;   // in degrees
  roll: number;  // in degrees
}

export class CameraEngine {
  private static instance: CameraEngine | null = null;
  private anim = AnimationEngine.getInstance();

  private activeCamera: MotionCameraLayer | null = null;

  public static getInstance(): CameraEngine {
    if (!CameraEngine.instance) {
      CameraEngine.instance = new CameraEngine();
    }
    return CameraEngine.instance;
  }

  public setActiveCamera(camera: MotionCameraLayer | null): void {
    this.activeCamera = camera;
  }

  public getActiveCamera(): MotionCameraLayer | null {
    return this.activeCamera;
  }

  /**
   * COMPUTES 3D TO 2D PERSPECTIVE PROJECTION MATRIX
   * Projects an arbitrary 3D point (X, Y, Z) into 2D Canvas coordinate space
   */
  public project3DPoint(
    x: number, y: number, z: number,
    camState: CameraMatrix,
    fov: number,
    viewportWidth: number,
    viewportHeight: number
  ): { x: number; y: number; scale: number; visible: boolean } {
    // 1. Translate relative to camera origin position
    let dx = x - camState.x;
    let dy = y - camState.y;
    let dz = z - camState.z;

    // 2. Rotate yaw (Y axis)
    const radYaw = camState.yaw * (Math.PI / 180);
    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const rx = dx * cosY - dz * sinY;
    const rz1 = dx * sinY + dz * cosY;

    // 3. Rotate pitch (X axis)
    const radPitch = camState.pitch * (Math.PI / 180);
    const cosP = Math.cos(radPitch);
    const sinP = Math.sin(radPitch);
    const ry = dy * cosP - rz1 * sinP;
    const rz = dy * sinP + rz1 * cosP;

    // Guard clipping plane
    if (rz <= 10) {
      return { x: 0, y: 0, scale: 0, visible: false };
    }

    // 4. Perspective projection formula
    // Scale factor derived from FOV and depth Z
    const f = Math.tan((90 - fov / 2) * (Math.PI / 180));
    const projScale = (viewportWidth / 2) / (rz * f);
    
    const px = rx * projScale + viewportWidth / 2;
    const py = ry * projScale + viewportHeight / 2;

    return {
      x: px,
      y: py,
      scale: projScale,
      visible: px >= 0 && px <= viewportWidth && py >= 0 && py <= viewportHeight
    };
  }

  /**
   * PROCEDURAL CAMERA SHAKE GENERATION
   * Returns positional offsets to emulate camera shakes.
   */
  public computeCameraShake(
    frequency: number,
    amount: number,
    frame: number
  ): { x: number; y: number; z: number } {
    if (frequency === 0 || amount === 0) return { x: 0, y: 0, z: 0 };

    const time = frame * frequency * 0.05;
    return {
      x: Math.sin(time) * Math.cos(time * 0.7) * amount,
      y: Math.cos(time * 1.1) * Math.sin(time * 0.4) * amount,
      z: Math.sin(time * 0.8) * amount * 0.5
    };
  }

  /**
   * DEPTH OF FIELD BLUR RADIUS (Circle of Confusion)
   */
  public computeBlurRadius(
    zDistance: number,
    focusDistance: number,
    aperture: number
  ): number {
    if (aperture === 0) return 0;
    // Circle of confusion calculation: blur is proportional to focal distance offset
    const coc = Math.abs(zDistance - focusDistance) / Math.max(1.0, zDistance);
    return Math.min(25, coc * aperture);
  }

  /**
   * GENERATE ORBIT PATH COORDINATES
   */
  public getOrbitCoordinates(
    radius: number,
    angleDegrees: number,
    center: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): { x: number; y: number; z: number; yaw: number } {
    const rad = angleDegrees * (Math.PI / 180);
    return {
      x: center.x + radius * Math.sin(rad),
      y: center.y,
      z: center.z - radius * Math.cos(rad),
      yaw: angleDegrees
    };
  }
}
