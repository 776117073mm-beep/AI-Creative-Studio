/**
 * PROFESSIONAL KEYFRAME RUNTIME ENGINE
 * Supports: Realtime evaluation, Bezier interpolation, Linear, Hold, Ease In, Ease Out,
 * Custom Curves, Grouped Keyframes, Nested Animation.
 * Features a high-precision numerical solver for true cubic-bezier timing curves.
 */

export type InterpolationMode = "linear" | "bezier" | "ease-in" | "ease-out" | "hold" | "auto" | "custom";

export interface KeyframePoint {
  id: string;
  frameIndex: number;
  value: any;
  interpolation: InterpolationMode;
  bezierControlPoints?: {
    incoming: { x: number; y: number };
    outgoing: { x: number; y: number };
  };
}

export interface KeyframePropertyTrack {
  propertyName: string; // E.g., "position", "rotation", "scale", "opacity", "gain", "saturation"
  keyframes: KeyframePoint[];
  nestedTrackReferences?: string[]; // Nested animation channels
}

export interface KeyframeGroup {
  id: string;
  name: string;
  trackNames: string[];
}

export class KeyframeEngine {
  private static instance: KeyframeEngine | null = null;

  private propertyTracks: Map<string, KeyframePropertyTrack> = new Map();
  private groups: Map<string, KeyframeGroup> = new Map();
  private clipboard: KeyframePoint[] = [];
  
  // Realtime evaluation cache: propertyName -> Map<frameIndex, evaluatedValue>
  private evalCache: Map<string, Map<number, any>> = new Map();

  constructor() {}

  public static getInstance(): KeyframeEngine {
    if (!KeyframeEngine.instance) {
      KeyframeEngine.instance = new KeyframeEngine();
    }
    return KeyframeEngine.instance;
  }

  /**
   * Add or update a keyframe for a given property at a specific frame index
   */
  public addKeyframe(
    propertyName: string,
    frameIndex: number,
    value: any,
    interpolation: InterpolationMode = "linear"
  ): KeyframePoint {
    let track = this.propertyTracks.get(propertyName);
    if (!track) {
      track = { propertyName, keyframes: [], nestedTrackReferences: [] };
      this.propertyTracks.set(propertyName, track);
    }

    // Check if keyframe already exists at this frame
    const existingIdx = track.keyframes.findIndex((k) => k.frameIndex === frameIndex);
    const kf: KeyframePoint = {
      id: `kf_${propertyName}_${frameIndex}_${Math.random().toString(36).substring(2, 5)}`,
      frameIndex,
      value,
      interpolation,
    };

    if (existingIdx >= 0) {
      track.keyframes[existingIdx] = kf;
    } else {
      track.keyframes.push(kf);
      track.keyframes.sort((a, b) => a.frameIndex - b.frameIndex);
    }

    // Clear caches
    this.evalCache.delete(propertyName);
    return kf;
  }

  // Alias for backward compatibility if any callers expect it
  public addKeyframePoint(propertyName: string, frameIndex: number, value: any, interpolation: InterpolationMode = "linear"): KeyframePoint {
    return this.addKeyframe(propertyName, frameIndex, value, interpolation);
  }

  /**
   * Delete keyframe
   */
  public removeKeyframe(propertyName: string, frameIndex: number): boolean {
    const track = this.propertyTracks.get(propertyName);
    if (!track) return false;

    const originalLength = track.keyframes.length;
    track.keyframes = track.keyframes.filter((k) => k.frameIndex !== frameIndex);
    
    // Clear caches
    this.evalCache.delete(propertyName);
    return track.keyframes.length < originalLength;
  }

  /**
   * Move an existing keyframe to a new frame index
   */
  public moveKeyframe(propertyName: string, oldFrameIndex: number, newFrameIndex: number): boolean {
    const track = this.propertyTracks.get(propertyName);
    if (!track) return false;

    const kf = track.keyframes.find((k) => k.frameIndex === oldFrameIndex);
    if (!kf) return false;

    // Check if another keyframe exists at the destination, remove it if so
    track.keyframes = track.keyframes.filter((k) => k.frameIndex !== newFrameIndex || k === kf);

    kf.frameIndex = newFrameIndex;
    track.keyframes.sort((a, b) => a.frameIndex - b.frameIndex);

    // Clear caches
    this.evalCache.delete(propertyName);
    return true;
  }

  /**
   * Duplicate a keyframe and put it at a new frame index
   */
  public duplicateKeyframe(propertyName: string, frameIndex: number, targetFrameIndex: number): boolean {
    const track = this.propertyTracks.get(propertyName);
    if (!track) return false;

    const kf = track.keyframes.find((k) => k.frameIndex === frameIndex);
    if (!kf) return false;

    this.addKeyframe(propertyName, targetFrameIndex, kf.value, kf.interpolation);
    return true;
  }

  /**
   * Evaluate the value of a property at an arbitrary frame index using interpolation with caching
   */
  public evaluateProperty(propertyName: string, frameIndex: number, defaultValue: any): any {
    // 1. Check evaluation cache
    let trackCache = this.evalCache.get(propertyName);
    if (trackCache && trackCache.has(frameIndex)) {
      return trackCache.get(frameIndex);
    }

    const track = this.propertyTracks.get(propertyName);
    if (!track || track.keyframes.length === 0) return defaultValue;

    const keyframes = track.keyframes;

    // 2. Evaluate nested track blends if any
    let nestedValueAccumulator = 0;
    let hasNestedTracks = false;
    if (track.nestedTrackReferences && track.nestedTrackReferences.length > 0) {
      hasNestedTracks = true;
      track.nestedTrackReferences.forEach(refTrackName => {
        const nestedVal = this.evaluateProperty(refTrackName, frameIndex, 0);
        if (typeof nestedVal === "number") {
          nestedValueAccumulator += nestedVal;
        }
      });
    }

    let evaluatedVal = defaultValue;

    // 3. Boundary checking
    if (frameIndex <= keyframes[0].frameIndex) {
      evaluatedVal = keyframes[0].value;
    } else if (frameIndex >= keyframes[keyframes.length - 1].frameIndex) {
      evaluatedVal = keyframes[keyframes.length - 1].value;
    } else {
      // 4. Locate interval keyframes
      let left = keyframes[0];
      let right = keyframes[keyframes.length - 1];

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (frameIndex >= keyframes[i].frameIndex && frameIndex <= keyframes[i + 1].frameIndex) {
          left = keyframes[i];
          right = keyframes[i + 1];
          break;
        }
      }

      // 5. Compute frame interpolant fraction
      const totalDiff = right.frameIndex - left.frameIndex;
      const currentDiff = frameIndex - left.frameIndex;
      const fraction = totalDiff === 0 ? 0 : currentDiff / totalDiff;

      evaluatedVal = this.interpolateValues(left, right, fraction);
    }

    // Mix nested animations value
    if (hasNestedTracks && typeof evaluatedVal === "number") {
      evaluatedVal = evaluatedVal + nestedValueAccumulator;
    }

    // Save in cache
    if (!trackCache) {
      trackCache = new Map();
      this.evalCache.set(propertyName, trackCache);
    }
    trackCache.set(frameIndex, evaluatedVal);

    return evaluatedVal;
  }

  // Alias for backward compatibility
  public evaluateKeyframeValue(propertyName: string, frameIndex: number, defaultValue = 0): any {
    return this.evaluateProperty(propertyName, frameIndex, defaultValue);
  }

  // Alias for backward compatibility
  public getKeyframePoints(propertyName: string): KeyframePoint[] {
    const track = this.propertyTracks.get(propertyName);
    return track ? track.keyframes : [];
  }

  // Alias for backward compatibility
  public setKeyframeInterpolation(propertyName: string, index: number, mode: InterpolationMode): void {
    const track = this.propertyTracks.get(propertyName);
    if (track && track.keyframes[index]) {
      track.keyframes[index].interpolation = mode;
      this.evalCache.delete(propertyName);
    }
  }

  /**
   * Scale/Shift entire group keyframes in sync
   */
  public transformGroupKeyframes(groupId: string, scaleFactor: number, shiftFrames: number): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    group.trackNames.forEach(trackName => {
      const track = this.propertyTracks.get(trackName);
      if (track) {
        track.keyframes.forEach(kf => {
          kf.frameIndex = Math.round(kf.frameIndex * scaleFactor) + shiftFrames;
        });
        track.keyframes.sort((a, b) => a.frameIndex - b.frameIndex);
        this.evalCache.delete(trackName);
      }
    });
  }

  /**
   * Link another track to achieve nested animations
   */
  public linkNestedAnimationTrack(parentTrackName: string, childTrackName: string): void {
    const track = this.propertyTracks.get(parentTrackName);
    if (track) {
      if (!track.nestedTrackReferences) {
        track.nestedTrackReferences = [];
      }
      if (!track.nestedTrackReferences.includes(childTrackName)) {
        track.nestedTrackReferences.push(childTrackName);
        this.evalCache.delete(parentTrackName);
      }
    }
  }

  /**
   * Keyframe Copying to internal clipboard
   */
  public copyKeyframes(propertyName: string, startFrame: number, endFrame: number): void {
    const track = this.propertyTracks.get(propertyName);
    if (!track) return;

    this.clipboard = track.keyframes
      .filter((k) => k.frameIndex >= startFrame && k.frameIndex <= endFrame)
      .map((k) => ({ ...k }));
  }

  /**
   * Keyframe Pasting at destination offset
   */
  public pasteKeyframes(propertyName: string, destStartFrame: number): number {
    if (this.clipboard.length === 0) return 0;

    let track = this.propertyTracks.get(propertyName);
    if (!track) {
      track = { propertyName, keyframes: [], nestedTrackReferences: [] };
      this.propertyTracks.set(propertyName, track);
    }

    const minSourceFrame = Math.min(...this.clipboard.map((k) => k.frameIndex));

    this.clipboard.forEach((k) => {
      const offset = k.frameIndex - minSourceFrame;
      const targetFrame = destStartFrame + offset;
      this.addKeyframe(propertyName, targetFrame, k.value, k.interpolation);
    });

    this.evalCache.delete(propertyName);
    return this.clipboard.length;
  }

  /**
   * Keyframe groups creation
   */
  public createGroup(id: string, name: string, trackNames: string[]): KeyframeGroup {
    const group: KeyframeGroup = { id, name, trackNames };
    this.groups.set(id, group);
    return group;
  }

  /**
   * Mathematical interpolation logic with specialized Newton-Raphson Bezier curve solving
   */
  private interpolateValues(left: KeyframePoint, right: KeyframePoint, fraction: number): any {
    const mode = right.interpolation;
    const v1 = left.value;
    const v2 = right.value;

    if (mode === "hold") {
      return v1;
    }

    let t = fraction;
    if (mode === "ease-in") {
      t = fraction * fraction * fraction; // Cubic ease in
    } else if (mode === "ease-out") {
      t = 1 - Math.pow(1 - fraction, 3); // Cubic ease out
    } else if (mode === "bezier" || mode === "auto") {
      // Numerical root finding for cubic Bezier solver (x -> t -> y)
      // Standard ease cubic bezier control points [0.25, 0.1, 0.25, 1.0]
      const p1x = 0.25; const p1y = 0.1;
      const p2x = 0.25; const p2y = 1.0;

      t = this.solveCubicBezier(fraction, p1x, p1y, p2x, p2y);
    } else if (mode === "custom" && right.bezierControlPoints) {
      const bcp = right.bezierControlPoints;
      t = this.solveCubicBezier(fraction, bcp.incoming.x, bcp.incoming.y, bcp.outgoing.x, bcp.outgoing.y);
    }

    // Number interpolation
    if (typeof v1 === "number" && typeof v2 === "number") {
      return v1 + (v2 - v1) * t;
    }

    // Array color/coordinate vectors [x, y, z] interpolation
    if (Array.isArray(v1) && Array.isArray(v2) && v1.length === v2.length) {
      return v1.map((val, idx) => {
        const otherVal = v2[idx];
        if (typeof val === "number" && typeof otherVal === "number") {
          return val + (otherVal - val) * t;
        }
        return val;
      });
    }

    return t < 0.5 ? v1 : v2;
  }

  /**
   * Solves for the Y value of a Bezier curve at a given target X coordinate
   */
  private solveCubicBezier(targetX: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
    if (targetX <= 0) return 0;
    if (targetX >= 1) return 1;

    // Use Newton-Raphson approximation
    let t = targetX;
    for (let i = 0; i < 8; i++) {
      const currentX = this.sampleCubicBezier(t, p1x, p2x);
      const derivativeX = this.sampleCubicBezierDerivative(t, p1x, p2x);
      if (Math.abs(derivativeX) < 1e-6) break;
      const diff = currentX - targetX;
      t -= diff / derivativeX;
    }

    return this.sampleCubicBezier(t, p1y, p2y);
  }

  private sampleCubicBezier(t: number, p1: number, p2: number): number {
    // Bernstein polynomial basis formula
    return 3 * t * Math.pow(1 - t, 2) * p1 + 3 * Math.pow(t, 2) * (1 - t) * p2 + Math.pow(t, 3);
  }

  private sampleCubicBezierDerivative(t: number, p1: number, p2: number): number {
    return 3 * Math.pow(1 - t, 2) * p1 + 6 * t * (1 - t) * (p2 - p1) + 3 * Math.pow(t, 2) * (1 - p2);
  }

  public getTracks(): Record<string, KeyframePoint[]> {
    const result: Record<string, KeyframePoint[]> = {};
    this.propertyTracks.forEach((track, name) => {
      result[name] = track.keyframes;
    });
    return result;
  }
}
