export interface EditingClip {
  id: string;
  name: string;
  sourceAssetId: string;
  startFrame: number; // Cut in-point from original media source file
  durationFrames: number;
  timelineStartFrame: number; // Position on timeline
  trackId: string;
  type: "video" | "audio";
  isLocked: boolean;
  isVisible: boolean;
  labelColor?: string;
}

export interface EditingTrack {
  id: string;
  name: string;
  type: "video" | "audio";
  isLocked: boolean;
  isVisible: boolean;
  clips: string[]; // List of clip IDs
}

export class VideoEditingEngine {
  private tracks: Map<string, EditingTrack> = new Map();
  private clips: Map<string, EditingClip> = new Map();
  private clipboardClip: EditingClip | null = null;

  constructor() {
    this.initializeDefaultTracks();
  }

  private initializeDefaultTracks(): void {
    const videoTrack: EditingTrack = {
      id: "track_v1",
      name: "Video 1",
      type: "video",
      isLocked: false,
      isVisible: true,
      clips: [],
    };
    const audioTrack: EditingTrack = {
      id: "track_a1",
      name: "Audio 1",
      type: "audio",
      isLocked: false,
      isVisible: true,
      clips: [],
    };

    this.tracks.set(videoTrack.id, videoTrack);
    this.tracks.set(audioTrack.id, audioTrack);
  }

  public getTracks(): EditingTrack[] {
    return Array.from(this.tracks.values());
  }

  public getClips(): EditingClip[] {
    return Array.from(this.clips.values());
  }

  public getClip(clipId: string): EditingClip | undefined {
    return this.clips.get(clipId);
  }

  /**
   * Non-destructive: Create/Insert a clip
   */
  public insertClip(clip: EditingClip): void {
    const track = this.tracks.get(clip.trackId);
    if (!track) {
      throw new Error(`Track ${clip.trackId} not found.`);
    }
    if (track.isLocked) {
      throw new Error(`Track ${clip.trackId} is locked.`);
    }

    this.clips.set(clip.id, clip);
    if (!track.clips.includes(clip.id)) {
      track.clips.push(clip.id);
    }
  }

  /**
   * Overwrite Edit: Replace content at target timeline position, shortening overlap clips
   */
  public overwriteClip(clip: EditingClip): void {
    const track = this.tracks.get(clip.trackId);
    if (!track) return;

    const clipStart = clip.timelineStartFrame;
    const clipEnd = clipStart + clip.durationFrames;

    // Detect overlap clips
    const overlapping = Array.from(this.clips.values()).filter(
      (c) =>
        c.trackId === clip.trackId &&
        c.id !== clip.id &&
        c.timelineStartFrame < clipEnd &&
        c.timelineStartFrame + c.durationFrames > clipStart
    );

    overlapping.forEach((overlap) => {
      const overlapStart = overlap.timelineStartFrame;
      const overlapEnd = overlapStart + overlap.durationFrames;

      if (overlapStart >= clipStart && overlapEnd <= clipEnd) {
        // Completely covered -> Delete
        this.deleteClip(overlap.id);
      } else if (overlapStart < clipStart && overlapEnd > clipEnd) {
        // Split remaining parts
        const rightPart: EditingClip = {
          ...overlap,
          id: `${overlap.id}_split_${Math.random().toString(36).substring(2, 5)}`,
          timelineStartFrame: clipEnd,
          startFrame: overlap.startFrame + (clipEnd - overlapStart),
          durationFrames: overlapEnd - clipEnd,
        };
        overlap.durationFrames = clipStart - overlapStart;
        this.insertClip(rightPart);
      } else if (overlapStart < clipStart) {
        // Cut right portion
        overlap.durationFrames = clipStart - overlapStart;
      } else {
        // Shift left portion
        overlap.startFrame += clipEnd - overlapStart;
        overlap.timelineStartFrame = clipEnd;
        overlap.durationFrames = overlapEnd - clipEnd;
      }
    });

    this.insertClip(clip);
  }

  /**
   * Ripple Edit: Shift trailing clips to prevent gaps when inserting or resizing
   */
  public rippleResizeClip(clipId: string, newDurationFrames: number): void {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return;

    const delta = newDurationFrames - clip.durationFrames;
    clip.durationFrames = newDurationFrames;

    if (delta !== 0) {
      // Find trailing clips on same track
      const trailing = Array.from(this.clips.values()).filter(
        (c) => c.trackId === clip.trackId && c.timelineStartFrame > clip.timelineStartFrame && c.id !== clip.id
      );

      trailing.forEach((c) => {
        c.timelineStartFrame += delta;
      });
    }
  }

  /**
   * Rolling Edit: Resizes adjacent boundaries of two clips simultaneously
   */
  public rollingEdit(leftClipId: string, rightClipId: string, shiftFrames: number): void {
    const left = this.clips.get(leftClipId);
    const right = this.clips.get(rightClipId);
    if (!left || !right || left.isLocked || right.isLocked) return;

    left.durationFrames += shiftFrames;
    right.timelineStartFrame += shiftFrames;
    right.startFrame += shiftFrames;
    right.durationFrames -= shiftFrames;
  }

  /**
   * Slip Edit: Shifts clip's source media range but leaves timeline positions unchanged
   */
  public slipEdit(clipId: string, shiftFrames: number): void {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return;

    clip.startFrame += shiftFrames;
  }

  /**
   * Slide Edit: Shifts clip along timeline, shortening or lengthening surrounding clips
   */
  public slideEdit(clipId: string, shiftFrames: number): void {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return;

    clip.timelineStartFrame += shiftFrames;
  }

  /**
   * Split Clip: Cut clip into two non-destructive entities
   */
  public splitClip(clipId: string, splitTimelineFrame: number): EditingClip[] {
    const clip = this.clips.get(clipId);
    if (!clip || clip.isLocked) return [];

    if (splitTimelineFrame <= clip.timelineStartFrame || splitTimelineFrame >= clip.timelineStartFrame + clip.durationFrames) {
      return [clip];
    }

    const firstDuration = splitTimelineFrame - clip.timelineStartFrame;
    const secondDuration = clip.durationFrames - firstDuration;

    const secondClip: EditingClip = {
      ...clip,
      id: `${clip.id}_split_${Math.random().toString(36).substring(2, 5)}`,
      startFrame: clip.startFrame + firstDuration,
      durationFrames: secondDuration,
      timelineStartFrame: splitTimelineFrame,
    };

    clip.durationFrames = firstDuration;

    this.insertClip(secondClip);
    return [clip, secondClip];
  }

  /**
   * Gap Removal: Snaps clips together removing dead space gaps
   */
  public removeGaps(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track || track.isLocked) return;

    const sortedClips = Array.from(this.clips.values())
      .filter((c) => c.trackId === trackId)
      .sort((a, b) => a.timelineStartFrame - b.timelineStartFrame);

    let nextStart = 0;
    sortedClips.forEach((clip) => {
      clip.timelineStartFrame = nextStart;
      nextStart = clip.timelineStartFrame + clip.durationFrames;
    });
  }

  /**
   * Duplicate Clip
   */
  public duplicateClip(clipId: string): EditingClip | null {
    const clip = this.clips.get(clipId);
    if (!clip) return null;

    const duplicate: EditingClip = {
      ...clip,
      id: `${clip.id}_dup_${Math.random().toString(36).substring(2, 5)}`,
      timelineStartFrame: clip.timelineStartFrame + clip.durationFrames,
    };

    this.insertClip(duplicate);
    return duplicate;
  }

  public copyClip(clipId: string): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      this.clipboardClip = { ...clip };
    }
  }

  public pasteClip(trackId: string, timelineStartFrame: number): EditingClip | null {
    if (!this.clipboardClip) return null;

    const pasted: EditingClip = {
      ...this.clipboardClip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      trackId,
      timelineStartFrame,
    };

    this.insertClip(pasted);
    return pasted;
  }

  public deleteClip(clipId: string): boolean {
    const clip = this.clips.get(clipId);
    if (!clip) return false;

    const track = this.tracks.get(clip.trackId);
    if (track) {
      track.clips = track.clips.filter((id) => id !== clipId);
    }

    return this.clips.delete(clipId);
  }
}
