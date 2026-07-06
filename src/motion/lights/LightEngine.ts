import { MotionLightLayer, AnimatedProperty } from "../core/MotionTypes";
import { AnimationEngine } from "../animation/AnimationEngine";

export interface Light3DSource {
  id: string;
  type: "point" | "spot" | "directional" | "ambient";
  color: { r: number; g: number; b: number };
  intensity: number;
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  coneAngle?: number; // Spot angle
}

export class LightEngine {
  private static instance: LightEngine | null = null;
  private anim = AnimationEngine.getInstance();

  private lights: Map<string, MotionLightLayer> = new Map();

  public static getInstance(): LightEngine {
    if (!LightEngine.instance) {
      LightEngine.instance = new LightEngine();
    }
    return LightEngine.instance;
  }

  /**
   * PARSES A REVOLVING LIGHT LAYER INTO COMPUTATIONAL RGB INTENSITY
   */
  public evaluateLight(layer: MotionLightLayer, frame: number): Light3DSource {
    const intensity = this.anim.evaluateProperty(layer.intensity, frame);
    
    // Parse hex color to raw float RGB values
    const hex = layer.color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Evaluate light spatial parameters from animated properties
    const px = this.anim.evaluateProperty(layer.transform.positionX, frame);
    const py = this.anim.evaluateProperty(layer.transform.positionY, frame);
    const pz = this.anim.evaluateProperty(layer.transform.positionZ, frame);

    const rx = this.anim.evaluateProperty(layer.transform.rotationX, frame);
    const ry = this.anim.evaluateProperty(layer.transform.rotationY, frame);
    const rz = this.anim.evaluateProperty(layer.transform.rotationZ, frame);

    // Compute forward direction vector from Euler rotation angles
    const yaw = ry * (Math.PI / 180);
    const pitch = rx * (Math.PI / 180);

    const dirX = Math.sin(yaw) * Math.cos(pitch);
    const dirY = -Math.sin(pitch);
    const dirZ = Math.cos(yaw) * Math.cos(pitch);

    return {
      id: layer.id,
      type: layer.lightType,
      color: { r, g, b },
      intensity,
      position: { x: px, y: py, z: pz },
      direction: { x: dirX, y: dirY, z: dirZ },
      coneAngle: layer.coneAngle
    };
  }

  /**
   * LAMBERTIAN SHADING FORMULAS WITH MULTIPLE LIGHT INTERACTION
   * Computes diffuse color modifier at vertex/point coordinates.
   */
  public computeShading(
    point: { x: number; y: number; z: number },
    normal: { x: number; y: number; z: number },
    materialColor: { r: number; g: number; b: number },
    activeLights: Light3DSource[],
    ambientFactor = 0.15
  ): { r: number; g: number; b: number } {
    let finalR = materialColor.r * ambientFactor;
    let finalG = materialColor.g * ambientFactor;
    let finalB = materialColor.b * ambientFactor;

    // Normalize surface normal vector
    const nLen = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z) || 1;
    const nx = normal.x / nLen;
    const ny = normal.y / nLen;
    const nz = normal.z / nLen;

    activeLights.forEach((light) => {
      let lR = 0; let lG = 0; let lB = 0;
      let dot = 0;
      let atten = 1.0;

      if (light.type === "ambient") {
        lR = light.color.r * light.intensity;
        lG = light.color.g * light.intensity;
        lB = light.color.b * light.intensity;
        dot = 1.0;
      } else if (light.type === "directional") {
        // Dot product between surface normal and inverse light direction
        dot = Math.max(0, nx * -light.direction.x + ny * -light.direction.y + nz * -light.direction.z);
        lR = light.color.r * light.intensity;
        lG = light.color.g * light.intensity;
        lB = light.color.b * light.intensity;
      } else {
        // Point and Spotlights
        // Vector from point to light source
        const lx = light.position.x - point.x;
        const ly = light.position.y - point.y;
        const lz = light.position.z - point.z;
        const dist = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;

        const lnx = lx / dist;
        const lny = ly / dist;
        const lnz = lz / dist;

        dot = Math.max(0, nx * lnx + ny * lny + nz * lnz);

        // Attenuation based on distance (inverse square law)
        atten = 1.0 / (1.0 + 0.002 * dist + 0.00002 * dist * dist);

        // Spotlight cone angle check
        if (light.type === "spot" && light.coneAngle) {
          // Angle between reverse light direction and point vector
          const lDirDot = -(lnx * light.direction.x + lny * light.direction.y + lnz * light.direction.z);
          const minCos = Math.cos((light.coneAngle / 2) * (Math.PI / 180));

          if (lDirDot < minCos) {
            atten = 0; // Out of spotlight beam
          } else {
            // Smooth falloff boundary inside cone
            atten *= Math.pow((lDirDot - minCos) / (1.0 - minCos), 1.5);
          }
        }

        lR = light.color.r * light.intensity * atten;
        lG = light.color.g * light.intensity * atten;
        lB = light.color.b * light.intensity * atten;
      }

      finalR += materialColor.r * lR * dot;
      finalG += materialColor.g * lG * dot;
      finalB += materialColor.b * lB * dot;
    });

    return {
      r: Math.max(0, Math.min(1.0, finalR)),
      g: Math.max(0, Math.min(1.0, finalG)),
      b: Math.max(0, Math.min(1.0, finalB))
    };
  }

  /**
   * PROJECTION SHADOWS CALCULATOR (Shadow Foundation)
   * Project shadow polygon vertexes onto a baseline ground plane (e.g. y = groundHeight)
   */
  public projectShadowPoint(
    point: { x: number; y: number; z: number },
    lightPos: { x: number; y: number; z: number },
    groundY: number
  ): { x: number; z: number } {
    const dy = point.y - lightPos.y;
    // Guard parallel lights
    if (Math.abs(dy) < 0.001) return { x: point.x, z: point.z };

    const ratio = (groundY - lightPos.y) / dy;
    return {
      x: lightPos.x + (point.x - lightPos.x) * ratio,
      z: lightPos.z + (point.z - lightPos.z) * ratio
    };
  }
}
