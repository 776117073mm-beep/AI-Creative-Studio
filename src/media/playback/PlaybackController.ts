import { VideoEngine } from "../video/VideoEngine";
import { AudioEngine } from "../audio/AudioEngine";
import { SubtitleEngine } from "../subtitles/SubtitleEngine";

export type PlaybackState = "paused" | "playing" | "buffering" | "ended";

export class PlaybackController {
  private static instance: PlaybackController;
  private state: PlaybackState = "paused";
  private playheadTimeSec = 0;
  private playbackRate = 1.0; // speed (e.g. 1.0, 1.5, 2.0, 0.5)
  private isLoopEnabled = false;
  private durationSec = 0;
  private clockIntervalId: any = null;
  private listeners: Set<(timeSec: number, state: PlaybackState) => void> = new Set();

  private constructor() {}

  public static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController();
    }
    return PlaybackController.instance;
  }

  /**
   * Bind the timeline boundary
   */
  public setTimelineBounds(durationSec: number): void {
    this.durationSec = durationSec;
    if (this.playheadTimeSec > durationSec) {
      this.seek(0);
    }
  }

  /**
   * Listen to playhead tick transitions
   */
  public addListener(cb: (timeSec: number, state: PlaybackState) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Play timeline synchronized clock
   */
  public play(): void {
    if (this.state === "playing") return;

    this.state = "playing";
    const videoMeta = VideoEngine.getInstance().getActiveVideoMetadata();
    const fps = videoMeta ? videoMeta.fps : 23.976;
    const intervalMs = Math.floor(1000 / (fps * this.playbackRate));

    let lastTick = Date.now();

    // Start audio buffer if synchronized Audio exists
    AudioEngine.getInstance().playAudio(this.playheadTimeSec);

    this.clockIntervalId = setInterval(() => {
      const now = Date.now();
      const deltaSec = ((now - lastTick) / 1000) * this.playbackRate;
      lastTick = now;

      this.playheadTimeSec += deltaSec;

      // Handle boundaries
      if (this.playheadTimeSec >= this.durationSec) {
        if (this.isLoopEnabled) {
          this.seek(0);
        } else {
          this.playheadTimeSec = this.durationSec;
          this.pause();
          this.state = "ended";
          this.notifyListeners();
          return;
        }
      }

      // Sync active frame pointer in VideoEngine
      VideoEngine.getInstance().incrementPlaybackTick();

      this.notifyListeners();
    }, intervalMs);

    console.log(`[PlaybackController] Playback initiated at time: ${this.playheadTimeSec.toFixed(3)}s. Rate: ${this.playbackRate}x`);
    this.notifyListeners();
  }

  /**
   * Pause active clock loop
   */
  public pause(): void {
    if (this.state !== "playing") return;

    this.state = "paused";
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }

    AudioEngine.getInstance().stopAudio();
    console.log(`[PlaybackController] Playback suspended at playhead: ${this.playheadTimeSec.toFixed(3)}s`);
    this.notifyListeners();
  }

  /**
   * Perform seek playhead adjustment
   */
  public seek(timeSec: number): void {
    const boundTime = Math.max(0, Math.min(timeSec, this.durationSec));
    this.playheadTimeSec = boundTime;

    // Direct synchronization on subsystems
    VideoEngine.getInstance().seekToTime(boundTime);
    AudioEngine.getInstance().seekTo(boundTime);

    console.log(`[PlaybackController] Seeked playhead time address: ${boundTime.toFixed(3)}s`);
    this.notifyListeners();
  }

  /**
   * Shift timeline playhead by frames
   */
  public stepFrames(frameCount: number): void {
    const videoMeta = VideoEngine.getInstance().getActiveVideoMetadata();
    const fps = videoMeta ? videoMeta.fps : 23.976;
    const frameDuration = 1 / fps;
    this.seek(this.playheadTimeSec + (frameCount * frameDuration));
  }

  /**
   * Toggle speed rates
   */
  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    console.log(`[PlaybackController] Playback speed scalar calibrated: ${rate}x`);
    if (this.state === "playing") {
      // Re-trigger playback loop with new interval
      this.pause();
      this.play();
    }
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public setLoop(enabled: boolean): void {
    this.isLoopEnabled = enabled;
  }

  public isLooping(): boolean {
    return this.isLoopEnabled;
  }

  public getTime(): number {
    return this.playheadTimeSec;
  }

  public getStatus(): PlaybackState {
    return this.state;
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.playheadTimeSec, this.state));
  }
}
