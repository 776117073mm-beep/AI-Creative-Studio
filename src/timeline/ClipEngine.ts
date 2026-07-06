export interface Clip {
  id: string;
  name: string;
  sourceAssetId: string;
  startFrame: number; // Cut in-point in the source material
  durationFrames: number; // Active clip length
  timelineStartFrame: number; // Position on the track timeline
  trackId: string;
  type: string;
  isLocked: boolean;
  isVisible: boolean;
  labelColor: string;
  linkedClipIds: string[]; // Linked clips (e.g. linked audio track for video)
  groupId: string | null;
  referenceClipId: string | null; // Pointer to master clip
  metadata: Record<string, any>;
}

export class ClipEngine {
  private clips: Map<string, Clip> = new Map();

  constructor() {}

  public getClips(): Clip[] {
    return Array.from(this.clips.values());
  }

  public getClip(clipId: string): Clip | undefined {
    return this.clips.get(clipId);
  }

  /**
   * Create a new clip instance on the timeline
   */
  public createClip(params: Omit<Clip, "linkedClipIds" | "groupId" | "referenceClipId" | "metadata">): Clip {
    const clip: Clip = {
      ...params,
      linkedClipIds: [],
      groupId: null,
      referenceClipId: null,
      metadata: {},
    };
    this.clips.set(clip.id, clip);
    return clip;
  }

  /**
   * Duplicate an existing clip with a new ID
   */
  public duplicateClip(clipId: string, newId: string, timelineOffsetFrames: number = 0): Clip {
    const original = this.clips.get(clipId);
    if (!original) {
      throw new Error(`Clip with ID ${clipId} not found for duplication.`);
    }

    const copy: Clip = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      timelineStartFrame: original.timelineStartFrame + timelineOffsetFrames,
      linkedClipIds: [],
      metadata: { ...original.metadata },
    };
    this.clips.set(newId, copy);
    return copy;
  }

  /**
   * Links two or more clips together (e.g., sync audio to a video clip)
   */
  public linkClips(clipIds: string[]): void {
    clipIds.forEach((id) => {
      const clip = this.clips.get(id);
      if (clip) {
        clip.linkedClipIds = Array.from(new Set([...clip.linkedClipIds, ...clipIds.filter((cid) => cid !== id)]));
      }
    });
  }

  /**
   * Group clips together under a single group ID
   */
  public groupClips(clipIds: string[], groupId: string): void {
    clipIds.forEach((id) => {
      const clip = this.clips.get(id);
      if (clip) {
        clip.groupId = groupId;
      }
    });
  }

  /**
   * Splice/trim clip's in-point or out-point
   */
  public trimClip(clipId: string, startFrameOffset: number, durationDelta: number): void {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return;

    clip.startFrame = Math.max(0, clip.startFrame + startFrameOffset);
    clip.durationFrames = Math.max(1, clip.durationFrames + durationDelta);
  }

  /**
   * Split a clip at a specific timeline frame address, creating two adjacent clips
   */
  public splitClip(clipId: string, splitTimelineFrame: number, newClipId: string): Clip[] {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return [];

    const relativeSplitPoint = splitTimelineFrame - clip.timelineStartFrame;
    if (relativeSplitPoint <= 0 || relativeSplitPoint >= clip.durationFrames) {
      throw new Error("Split point lies outside of active clip boundaries.");
    }

    const firstDuration = relativeSplitPoint;
    const secondDuration = clip.durationFrames - relativeSplitPoint;

    // Second half clip creation
    const secondHalf: Clip = {
      ...clip,
      id: newClipId,
      name: `${clip.name} (Split Part)`,
      startFrame: clip.startFrame + relativeSplitPoint,
      durationFrames: secondDuration,
      timelineStartFrame: splitTimelineFrame,
      linkedClipIds: [],
      metadata: { ...clip.metadata },
    };

    // First half trim
    clip.durationFrames = firstDuration;

    this.clips.set(newClipId, secondHalf);
    return [clip, secondHalf];
  }

  /**
   * Merge two adjacent clips referencing the same asset
   */
  public mergeClips(firstClipId: string, secondClipId: string): Clip | null {
    const first = this.clips.get(firstClipId);
    const second = this.clips.get(secondClipId);

    if (!first || !second || first.isLocked || second.isLocked) return null;
    if (first.sourceAssetId !== second.sourceAssetId) return null;

    // Must be contiguous on the timeline
    if (first.timelineStartFrame + first.durationFrames !== second.timelineStartFrame) {
      return null;
    }

    // Must be contiguous in source material
    if (first.startFrame + first.durationFrames !== second.startFrame) {
      return null;
    }

    // Merge into the first clip
    first.durationFrames += second.durationFrames;
    this.clips.delete(secondClipId);

    return first;
  }

  /**
   * Compute Snapping offset from target clip coordinates
   */
  public calculateSnapOffset(
    draggingClip: Clip,
    otherClips: Clip[],
    snapToleranceFrames: number = 5
  ): number {
    const draggingStart = draggingClip.timelineStartFrame;
    const draggingEnd = draggingStart + draggingClip.durationFrames;

    let minOffset = Infinity;

    for (const other of otherClips) {
      if (other.id === draggingClip.id) continue;

      const otherStart = other.timelineStartFrame;
      const otherEnd = otherStart + other.durationFrames;

      // Snapping points checks: start-to-start, end-to-start, start-to-end, end-to-end
      const points = [
        otherStart - draggingStart,
        otherStart - draggingEnd,
        otherEnd - draggingStart,
        otherEnd - draggingEnd,
      ];

      for (const offset of points) {
        if (Math.abs(offset) <= snapToleranceFrames && Math.abs(offset) < Math.abs(minOffset)) {
          minOffset = offset;
        }
      }
    }

    return minOffset === Infinity ? 0 : minOffset;
  }

  /**
   * Toggle metadata or specific properties
   */
  public setClipProperties(clipId: string, props: Partial<Pick<Clip, "isLocked" | "isVisible" | "labelColor" | "name">>): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      Object.assign(clip, props);
    }
  }

  public deleteClip(clipId: string): boolean {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return false;
    return this.clips.delete(clipId);
  }
}
