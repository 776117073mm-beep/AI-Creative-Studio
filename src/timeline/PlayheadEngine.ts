import { Timecode, TimecodeMarker } from "./Timecode";
import { Clip } from "./ClipEngine";

export interface PlaybackRegion {
  startFrame: number;
  endFrame: number;
  isEnabled: boolean;
}

export interface Bookmark {
  id: string;
  name: string;
  frame: number;
  notes?: string;
}

export class PlayheadEngine {
  private currentFrame: number = 0;
  private timecode: Timecode;
  private region: PlaybackRegion = { startFrame: 0, endFrame: 0, isEnabled: false };
  private bookmarks: Map<string, Bookmark> = new Map();
  private listeners: Set<(frame: number) => void> = new Set();

  constructor(fps: number = 23.976) {
    this.timecode = new Timecode(fps);
  }

  public addListener(listener: (frame: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.currentFrame));
  }

  public getCurrentFrame(): number {
    return this.currentFrame;
  }

  public getCurrentTimeSeconds(): number {
    return this.timecode.framesToSeconds(this.currentFrame);
  }

  public getCurrentTimecode(): string {
    return this.timecode.framesToTimecode(this.currentFrame);
  }

  /**
   * Directly jump the playhead position to a frame
   */
  public seekToFrame(frame: number): void {
    let target = Math.max(0, frame);
    if (this.region.isEnabled) {
      if (target > this.region.endFrame) {
        target = this.region.startFrame; // Loop boundary
      } else if (target < this.region.startFrame) {
        target = this.region.startFrame;
      }
    }
    this.currentFrame = target;
    this.notifyListeners();
  }

  /**
   * Jump playhead via SMPTE timecode string
   */
  public seekToTimecode(tcStr: string): void {
    try {
      const frame = this.timecode.timecodeToFrames(tcStr);
      this.seekToFrame(frame);
    } catch (err) {
      console.error("Invalid timecode seek requested", err);
    }
  }

  /**
   * Stepping frame-by-frame
   */
  public stepFrames(count: number): void {
    this.seekToFrame(this.currentFrame + count);
  }

  /**
   * Set playback limits
   */
  public setRegion(startFrame: number, endFrame: number, enable: boolean = true): void {
    this.region = { startFrame, endFrame, isEnabled: enable };
  }

  public getRegion(): PlaybackRegion {
    return this.region;
  }

  /**
   * Jump to marker position
   */
  public jumpToMarker(marker: TimecodeMarker): void {
    this.seekToFrame(marker.frame);
  }

  /**
   * Jump to clip start or end address
   */
  public jumpToClipEdge(clip: Clip, edge: "start" | "end"): void {
    if (edge === "start") {
      this.seekToFrame(clip.timelineStartFrame);
    } else {
      this.seekToFrame(clip.timelineStartFrame + clip.durationFrames);
    }
  }

  /**
   * Bookmarks managing
   */
  public addBookmark(id: string, name: string, notes?: string): Bookmark {
    const bm: Bookmark = { id, name, frame: this.currentFrame, notes };
    this.bookmarks.set(id, bm);
    return bm;
  }

  public getBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values());
  }

  public deleteBookmark(id: string): boolean {
    return this.bookmarks.delete(id);
  }
}
