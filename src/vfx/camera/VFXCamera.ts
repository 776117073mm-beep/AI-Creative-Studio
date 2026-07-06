import { CameraLensParams, Vector3D } from "../types";

export class VFXCamera {
  private static instance: VFXCamera | null = null;
  private params: CameraLensParams = {
    focalLength: 35.0, // Standard cinema lens
    sensorWidth: 36.0, // Full frame 35mm
    k1: -0.15, // Radial distortion coefficient 1 (barrel distortion)
    k2: 0.05, // Radial distortion coefficient 2
    p1: 0.001, // Tangential coefficient 1
    p2: -0.002, // Tangential coefficient 2
    cameraShakeFrequency: 2.5, // Hz
    cameraShakeAmplitude: 0.12 // Intensity
  };

  public static getInstance(): VFXCamera {
    if (!VFXCamera.instance) {
      VFXCamera.instance = new VFXCamera();
    }
    return VFXCamera.instance;
  }

  public getParams(): CameraLensParams {
    return this.params;
  }

  public updateParams(newParams: Partial<CameraLensParams>): void {
    this.params = { ...this.params, ...newParams };
  }

  /**
   * Applies optical Brown-Conrady lens distortion mapping
   * Maps a perfect pinhole projection point (x, y) to distorted coordinates (xd, yd)
   */
  public applyLensDistortion(x: number, y: number): { x: number; y: number } {
    // 1. Shift relative coordinates so origin is at optical center (0, 0)
    const cx = x - 0.5;
    const cy = y - 0.5;

    // 2. Radial distance squared
    const r2 = cx * cx + cy * cy;
    const r4 = r2 * r2;

    const radialFactor = 1.0 + this.params.k1 * r2 + this.params.k2 * r4;

    // 3. Tangential distortion displacement
    const tangentialX =
      2.0 * this.params.p1 * cx * cy + this.params.p2 * (r2 + 2.0 * cx * cx);
    const tangentialY =
      this.params.p1 * (r2 + 2.0 * cy * cy) + 2.0 * this.params.p2 * cx * cy;

    // 4. Distorted coordinates mapped back to standard [0, 1] frame space
    const xDistorted = cx * radialFactor + tangentialX + 0.5;
    const yDistorted = cy * radialFactor + tangentialY + 0.5;

    return {
      x: Math.max(0, Math.min(1.0, xDistorted)),
      y: Math.max(0, Math.min(1.0, yDistorted))
    };
  }

  /**
   * Generates dynamic 3D camera shake translations using multi-frequency octave noise vectors
   */
  public computeCameraShakeOffset(timeSec: number): Vector3D {
    const f = this.params.cameraShakeFrequency;
    const amp = this.params.cameraShakeAmplitude;

    if (amp <= 0) {
      return { x: 0, y: 0, z: 0 };
    }

    // Trigonometric octave summing representing continuous smooth brownian camera rumble
    const shakeX =
      Math.sin(timeSec * f) * 1.0 +
      Math.sin(timeSec * f * 2.1 + 0.5) * 0.4 +
      Math.sin(timeSec * f * 4.3 + 1.2) * 0.15;

    const shakeY =
      Math.cos(timeSec * f * 1.1 + 0.2) * 0.9 +
      Math.cos(timeSec * f * 2.3 + 0.8) * 0.45 +
      Math.cos(timeSec * f * 3.9 + 1.9) * 0.1;

    const shakeZ =
      Math.sin(timeSec * f * 0.7 + 0.9) * 0.5 +
      Math.sin(timeSec * f * 1.8 + 0.1) * 0.25;

    // Scale final output by target amplitude coefficients
    return {
      x: shakeX * amp * 0.05, // fine screen displacement
      y: shakeY * amp * 0.05,
      z: shakeZ * amp * 0.03
    };
  }

  /**
   * Calculates cinema camera Field of View (FOV) in degrees based on sensor geometries
   */
  public calculateHorizontalFOV(): number {
    // Horizontal FOV = 2 * arctan(sensorWidth / (2 * focalLength))
    const rad = 2.0 * Math.atan(this.params.sensorWidth / (2.0 * this.params.focalLength));
    return (rad * 180.0) / Math.PI;
  }
}
