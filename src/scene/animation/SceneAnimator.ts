import { AnimationTrack, AnimationKeyframe, Vector3D, ColorRGB } from "../core/types";
import { SceneGraph } from "../graph/SceneGraph";
import { LightEngine } from "../light/LightEngine";
import { CameraEngine } from "../camera/CameraEngine";
import { MaterialEngine } from "../material/MaterialEngine";

export class SceneAnimator {
  private static instance: SceneAnimator | null = null;

  // Active loaded animation tracks registered
  private tracks: Map<string, AnimationTrack> = new Map();

  // Active play state
  private isPlaying: boolean = true;
  private currentTimeSec: number = 0.0;
  private maxDurationSec: number = 10.0;

  private constructor() {
    this.createDefaultAnimationTracks();
  }

  public static getInstance(): SceneAnimator {
    if (!SceneAnimator.instance) {
      SceneAnimator.instance = new SceneAnimator();
    }
    return SceneAnimator.instance;
  }

  private createDefaultAnimationTracks(): void {
    // 1. Orbital rotation of the Cyber Mech subject
    this.tracks.set("track_mech_rotation", {
      id: "track_mech_rotation",
      targetNodeId: "mesh_mech_0",
      property: "rotation",
      keyframes: [
        { timeSec: 0.0, value: { x: 0, y: 180, z: 0 } },
        { timeSec: 2.5, value: { x: 0, y: 270, z: 0 } },
        { timeSec: 5.0, value: { x: 0, y: 360, z: 0 } },
        { timeSec: 7.5, value: { x: 0, y: 450, z: 0 } },
        { timeSec: 10.0, value: { x: 0, y: 540, z: 0 } }
      ]
    });

    // 2. Linear zoom-in of the camera position
    this.tracks.set("track_cam_position", {
      id: "track_cam_position",
      targetNodeId: "cam_cinema_0",
      property: "position",
      keyframes: [
        { timeSec: 0.0, value: { x: 0.0, y: 5.0, z: 12.0 } },
        { timeSec: 5.0, value: { x: -3.0, y: 3.5, z: 8.5 } },
        { timeSec: 10.0, value: { x: 0.0, y: 5.0, z: 12.0 } }
      ]
    });

    // 3. Fluctuation of the Sun lighting intensity
    this.tracks.set("track_light_intensity", {
      id: "track_light_intensity",
      targetNodeId: "light_sun_key",
      property: "lightIntensity",
      keyframes: [
        { timeSec: 0.0, value: 4.5 },
        { timeSec: 3.0, value: 8.0 },
        { timeSec: 6.5, value: 1.5 },
        { timeSec: 10.0, value: 4.5 }
      ]
    });

    // 4. Oscillating roughness parameter on Chromium material
    this.tracks.set("track_mat_roughness", {
      id: "track_mat_roughness",
      targetNodeId: "mat_chrome",
      property: "materialRoughness",
      keyframes: [
        { timeSec: 0.0, value: 0.12 },
        { timeSec: 5.0, value: 0.85 },
        { timeSec: 10.0, value: 0.12 }
      ]
    });
  }

  // --- Track managers ---

  public getTracks(): AnimationTrack[] {
    return Array.from(this.tracks.values());
  }

  public addTrack(track: AnimationTrack): void {
    this.tracks.set(track.id, track);
  }

  public removeTrack(id: string): void {
    this.tracks.delete(id);
  }

  // --- Animation Evaluator & Interpolation Math ---

  /**
   * Main ticking trigger evaluating and updating scene components at specific time points
   */
  public evaluateSceneTracksAtTime(timeSec: number): void {
    const clampedTime = timeSec % this.maxDurationSec;
    const sceneGraph = SceneGraph.getInstance();
    const lightEngine = LightEngine.getInstance();
    const cameraEngine = CameraEngine.getInstance();
    const matEngine = MaterialEngine.getInstance();

    this.tracks.forEach((track) => {
      const value = this.interpolateTrackValueAtTime(track, clampedTime);
      if (value === null) return;

      // Map values to appropriate sub-engines
      if (track.property === "position" || track.property === "rotation" || track.property === "scale") {
        // Target is standard node transform
        const node = sceneGraph.getNode(track.targetNodeId);
        if (node) {
          node.transform[track.property] = value as Vector3D;
        }

        // Keep CameraEngine matching viewport if node is the active cam
        if (track.targetNodeId === "cam_cinema_0") {
          if (track.property === "position") {
            cameraEngine.setPosition(value as Vector3D);
          } else if (track.property === "rotation") {
            cameraEngine.setRotation(value as Vector3D);
          }
        }
      } else if (track.property === "lightIntensity") {
        const light = lightEngine.getLight(track.targetNodeId);
        if (light) {
          light.lightParams.intensity = value as number;
        }
      } else if (track.property === "materialRoughness" || track.property === "materialMetallic") {
        const mat = matEngine.getMaterial(track.targetNodeId);
        if (mat) {
          if (track.property === "materialRoughness") {
            mat.roughness = value as number;
          } else {
            mat.metallic = value as number;
          }
        }
      }
    });
  }

  private interpolateTrackValueAtTime(track: AnimationTrack, time: number): any {
    const keys = track.keyframes;
    if (keys.length === 0) return null;
    if (keys.length === 1) return keys[0].value;

    // Sort keys by time points
    const sorted = [...keys].sort((a, b) => a.timeSec - b.timeSec);

    // If time is outside bounding box boundaries
    if (time <= sorted[0].timeSec) return sorted[0].value;
    if (time >= sorted[sorted.length - 1].timeSec) return sorted[sorted.length - 1].value;

    // Find bounding keyframes
    let prevKey = sorted[0];
    let nextKey = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (time >= sorted[i].timeSec && time <= sorted[i + 1].timeSec) {
        prevKey = sorted[i];
        nextKey = sorted[i + 1];
        break;
      }
    }

    const duration = nextKey.timeSec - prevKey.timeSec;
    const t = duration === 0 ? 0.0 : (time - prevKey.timeSec) / duration;

    // Choose interpolation formula
    return this.interpolateType(prevKey.value, nextKey.value, t);
  }

  private interpolateType(v0: any, v1: any, t: number): any {
    if (typeof v0 === "number" && typeof v1 === "number") {
      // Linear lerp
      return v0 + (v1 - v0) * t;
    }

    if (this.isVector3D(v0) && this.isVector3D(v1)) {
      return {
        x: v0.x + (v1.x - v0.x) * t,
        y: v0.y + (v1.y - v0.y) * t,
        z: v0.z + (v1.z - v0.z) * t
      };
    }

    return v0; // default constant fallback
  }

  private isVector3D(obj: any): obj is Vector3D {
    return obj && typeof obj.x === "number" && typeof obj.y === "number" && typeof obj.z === "number";
  }
}
