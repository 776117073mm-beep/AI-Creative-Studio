/**
 * SMPTE Timecode implementation.
 * Supports standard frame rates, non-drop-frame (NDF) and drop-frame (DF) conversions.
 */
export interface TimecodeMarker {
  id: string;
  name: string;
  comment?: string;
  frame: number;
  color: string;
  label?: string;
}

export interface TimecodeRegion {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  color: string;
  comment?: string;
}

export class Timecode {
  private frameRate: number;
  private isDropFrame: boolean;

  constructor(frameRate: number = 23.976) {
    this.frameRate = frameRate;
    // Standard NTSC drop frame rates are 29.97 and 59.94
    this.isDropFrame = Math.abs(frameRate - 29.97) < 0.01 || Math.abs(frameRate - 59.94) < 0.01;
  }

  public getFrameRate(): number {
    return this.frameRate;
  }

  public isDropFrameEnabled(): boolean {
    return this.isDropFrame;
  }

  /**
   * Convert raw frame index to SMPTE timecode string (HH:MM:SS:FF)
   */
  public framesToTimecode(frames: number): string {
    const fps = Math.round(this.frameRate);
    let f = frames;

    if (this.isDropFrame) {
      // SMPTE 12M drop-frame calculations
      const dropFrames = Math.round(this.frameRate * 0.066666); // 2 drop frames per minute for 29.97
      const framesPerHour = Math.round(this.frameRate * 3600);
      const framesPer10Minutes = Math.round(this.frameRate * 600);
      const framesPerMinute = Math.round(this.frameRate * 60) - dropFrames;

      const d = Math.floor(f / framesPer10Minutes);
      const m = f % framesPer10Minutes;

      if (m > dropFrames) {
        f += dropFrames * 9 * d + dropFrames * Math.floor((m - dropFrames) / framesPerMinute);
      } else {
        f += dropFrames * 9 * d;
      }
    }

    const frame = f % fps;
    const sec = Math.floor(f / fps) % 60;
    const min = Math.floor(f / (fps * 60)) % 60;
    const hour = Math.floor(f / (fps * 3600)) % 24;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const separator = this.isDropFrame ? ";" : ":";

    return `${pad(hour)}:${pad(min)}:${pad(sec)}${separator}${pad(frame)}`;
  }

  /**
   * Convert SMPTE timecode string back to absolute frame index
   */
  public timecodeToFrames(timecode: string): number {
    const parts = timecode.split(/[:;]/);
    if (parts.length !== 4) {
      throw new Error(`Invalid timecode format: ${timecode}. Expected HH:MM:SS:FF`);
    }

    const hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    const frames = parseInt(parts[3], 10);

    const fps = Math.round(this.frameRate);
    const totalMinutes = hrs * 60 + mins;

    if (this.isDropFrame) {
      const baseFrames = ((hrs * 3600 + mins * 60 + secs) * fps) + frames;
      const dropFrames = Math.round(this.frameRate * 0.066666); // e.g. 2
      const dropFrameCount = totalMinutes - Math.floor(totalMinutes / 10);
      return baseFrames - (dropFrames * dropFrameCount);
    }

    return ((hrs * 3600 + mins * 60 + secs) * fps) + frames;
  }

  /**
   * Convert seconds to frame count
   */
  public secondsToFrames(seconds: number): number {
    return Math.floor(seconds * this.frameRate);
  }

  /**
   * Convert frame count to seconds
   */
  public framesToSeconds(frames: number): number {
    return frames / this.frameRate;
  }

  /**
   * Safe frame addition
   */
  public addFrames(start: number, count: number): number {
    return Math.max(0, start + count);
  }
}
