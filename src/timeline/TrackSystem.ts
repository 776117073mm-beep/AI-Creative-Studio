export type TrackType =
  | "video"
  | "audio"
  | "subtitle"
  | "motion"
  | "effect"
  | "adjustment"
  | "camera"
  | "3d"
  | "ai"
  | "custom";

export interface TrackMetadata {
  description?: string;
  bitrateKbps?: number;
  codecPreference?: string;
  channelMapping?: string[]; // E.g., ["L", "R", "C", "LFE"]
  customAttributes?: Record<string, any>;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  index: number;
  isLocked: boolean;
  isMuted: boolean;
  isSolo: boolean;
  color: string; // Hex color or class name
  metadata: TrackMetadata;
  clipIds: string[]; // Linked clips within this track
  height?: number; // Height in pixels for resizing
  isCollapsed?: boolean; // Collapse state for expanding/collapsing
}

export class TrackSystem {
  private tracks: Map<string, Track> = new Map();

  constructor() {}

  public getTracks(): Track[] {
    return Array.from(this.tracks.values()).sort((a, b) => a.index - b.index);
  }

  public getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Add a new track to the system
   */
  public createTrack(
    id: string,
    name: string,
    type: TrackType,
    index: number,
    color: string = "#3b82f6"
  ): Track {
    const track: Track = {
      id,
      name,
      type,
      index,
      isLocked: false,
      isMuted: false,
      isSolo: false,
      color,
      metadata: {},
      clipIds: [],
    };
    this.tracks.set(id, track);
    return track;
  }

  /**
   * Remove track
   */
  public deleteTrack(trackId: string): boolean {
    return this.tracks.delete(trackId);
  }

  /**
   * Toggle track lock state
   */
  public setTrackLock(trackId: string, isLocked: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.isLocked = isLocked;
    }
  }

  /**
   * Toggle mute
   */
  public setTrackMute(trackId: string, isMuted: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.isMuted = isMuted;
    }
  }

  /**
   * Toggle solo state
   */
  public setTrackSolo(trackId: string, isSolo: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.isSolo = isSolo;
    }
  }

  /**
   * Update track metadata
   */
  public updateTrackMetadata(trackId: string, meta: Partial<TrackMetadata>): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.metadata = { ...track.metadata, ...meta };
    }
  }

  /**
   * Re-order tracks based on direct swap or index reallocation
   */
  public reorderTracks(orderedIds: string[]): void {
    orderedIds.forEach((id, idx) => {
      const track = this.tracks.get(id);
      if (track) {
        track.index = idx;
      }
    });
  }

  /**
   * Bind clip ID to track
   */
  public addClipToTrack(trackId: string, clipId: string): void {
    const track = this.tracks.get(trackId);
    if (track && !track.clipIds.includes(clipId)) {
      track.clipIds.push(clipId);
    }
  }

  /**
   * Remove clip ID binding from track
   */
  public removeClipFromTrack(trackId: string, clipId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.clipIds = track.clipIds.filter((id) => id !== clipId);
    }
  }

  /**
   * Set the display height of a track for vertical timeline resizing
   */
  public setTrackHeight(trackId: string, height: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.height = height;
    }
  }

  /**
   * Set track collapse or expand state
   */
  public setTrackCollapsed(trackId: string, isCollapsed: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.isCollapsed = isCollapsed;
    }
  }
}
