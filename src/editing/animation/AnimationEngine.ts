export interface AnimationPreset {
  id: string;
  name: string;
  category: "Text" | "Shape" | "Cinematic" | "Dynamic";
  curve: string;
  durationFrames: number;
  transformKeys: Record<string, any>;
}

export class AnimationEngine {
  private presets: Map<string, AnimationPreset> = new Map();
  private activeAnimations: Map<string, { presetId: string; startFrame: number }> = new Map(); // Key: clipId

  constructor() {
    this.loadPresets();
  }

  private loadPresets(): void {
    const defaultPresets: AnimationPreset[] = [
      {
        id: "anim_slide_in_left",
        name: "Slide In Left",
        category: "Dynamic",
        curve: "ease-out",
        durationFrames: 24,
        transformKeys: {
          position: [
            { t: 0.0, v: { x: -1920, y: 0 } },
            { t: 1.0, v: { x: 0, y: 0 } },
          ],
        },
      },
      {
        id: "anim_bounce_text",
        name: "Organic Elastic Bounce",
        category: "Text",
        curve: "elastic",
        durationFrames: 30,
        transformKeys: {
          scale: [
            { t: 0.0, v: { x: 0, y: 0 } },
            { t: 0.6, v: { x: 120, y: 120 } },
            { t: 1.0, v: { x: 100, y: 100 } },
          ],
        },
      },
      {
        id: "anim_cinematic_zoom",
        name: "Slow Ken Burns Zoom",
        category: "Cinematic",
        curve: "linear",
        durationFrames: 120,
        transformKeys: {
          scale: [
            { t: 0.0, v: { x: 100, y: 100 } },
            { t: 1.0, v: { x: 112, y: 112 } },
          ],
        },
      },
    ];

    defaultPresets.forEach((p) => this.presets.set(p.id, p));
  }

  public getPresets(): AnimationPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Apply preset animation to target element on timeline
   */
  public attachAnimationToClip(clipId: string, presetId: string, startFrame: number): void {
    if (!this.presets.has(presetId)) {
      throw new Error(`Animation preset ${presetId} not found.`);
    }
    this.activeAnimations.set(clipId, { presetId, startFrame });
  }

  public getAttachedAnimation(clipId: string): { presetId: string; startFrame: number } | undefined {
    return this.activeAnimations.get(clipId);
  }

  /**
   * Evaluate anim transformation multipliers at an active playhead frame
   */
  public evaluateAnimation(clipId: string, currentTimelineFrame: number): Record<string, any> | null {
    const active = this.activeAnimations.get(clipId);
    if (!active) return null;

    const preset = this.presets.get(active.presetId)!;
    const elapsed = currentTimelineFrame - active.startFrame;

    if (elapsed < 0) return null;

    const fraction = Math.min(1.0, elapsed / preset.durationFrames);
    const result: Record<string, any> = {};

    Object.entries(preset.transformKeys).forEach(([propName, keys]: [string, any]) => {
      // Find left and right key percentage nodes
      let left = keys[0];
      let right = keys[keys.length - 1];

      for (let i = 0; i < keys.length - 1; i++) {
        if (fraction >= keys[i].t && fraction <= keys[i + 1].t) {
          left = keys[i];
          right = keys[i + 1];
          break;
        }
      }

      const totalDiff = right.t - left.t;
      const t = totalDiff === 0 ? 0 : (fraction - left.t) / totalDiff;

      // Linear numeric blending logic
      if (typeof left.v === "number" && typeof right.v === "number") {
        result[propName] = left.v + (right.v - left.v) * t;
      } else if (left.v.x !== undefined && right.v.x !== undefined) {
        result[propName] = {
          x: left.v.x + (right.v.x - left.v.x) * t,
          y: left.v.y + (right.v.y - left.v.y) * t,
        };
      }
    });

    return result;
  }

  public removeAnimation(clipId: string): boolean {
    return this.activeAnimations.delete(clipId);
  }
}
