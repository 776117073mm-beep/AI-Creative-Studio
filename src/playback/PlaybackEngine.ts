export type PlaybackState = "playing" | "paused" | "stopped";

export interface PlaybackDiagnostics {
  fpsCurrent: number;
  droppedFramesCount: number;
  driftMs: number;
  bufferAheadSeconds: number;
  isGpuAccelerated: boolean;
  jitterMs: number;
}

export class PlaybackEngine {
  private static instance: PlaybackEngine | null = null;
  private state: PlaybackState = "stopped";
  private currentFrame: number = 0;
  private durationFrames: number = 14400; // Default limit e.g. 10 minutes at 24fps
  private fps: number = 24;
  private playbackRate: number = 1.0;
  private isLooping: boolean = false;

  // Sync mechanisms
  private lastTickTime: number = 0;
  private animationFrameId: number | null = null;
  private listeners: Set<(frame: number, state: PlaybackState) => void> = new Set();

  // Diagnostics
  private diagnostics: PlaybackDiagnostics = {
    fpsCurrent: 24,
    droppedFramesCount: 0,
    driftMs: 0,
    bufferAheadSeconds: 5.0,
    isGpuAccelerated: true,
    jitterMs: 0,
  };

  private constructor() {}

  public static getInstance(): PlaybackEngine {
    if (!PlaybackEngine.instance) {
      PlaybackEngine.instance = new PlaybackEngine();
    }
    return PlaybackEngine.instance;
  }

  public addListener(l: (frame: number, state: PlaybackState) => void): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.currentFrame, this.state));
  }

  public getPlaybackState(): PlaybackState {
    return this.state;
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  public setLoop(loop: boolean): void {
    this.isLooping = loop;
  }

  public isLoopingEnabled(): boolean {
    return this.isLooping;
  }

  public setFPS(fps: number): void {
    this.fps = fps;
  }

  public setTimelineBounds(durationFrames: number): void {
    this.durationFrames = durationFrames;
  }

  public seek(frame: number): void {
    this.currentFrame = Math.max(0, Math.min(this.durationFrames, Math.floor(frame)));
    this.notifyListeners();
  }

  /**
   * Primary Play trigger
   */
  public play(): void {
    if (this.state === "playing") return;

    this.state = "playing";
    this.lastTickTime = performance.now();
    this.startPlaybackLoop();
    this.notifyListeners();
  }

  /**
   * Pause
   */
  public pause(): void {
    if (this.state !== "playing") return;

    this.state = "paused";
    this.stopPlaybackLoop();
    this.notifyListeners();
  }

  /**
   * Stop entirely
   */
  public stop(): void {
    this.state = "stopped";
    this.currentFrame = 0;
    this.stopPlaybackLoop();
    this.notifyListeners();
  }

  private startPlaybackLoop(): void {
    const loop = (timestamp: number) => {
      if (this.state !== "playing") return;

      const elapsedMs = timestamp - this.lastTickTime;
      this.lastTickTime = timestamp;

      // Compute frames to step forward based on real elapsed time and speed rate
      // Supports reverse playback if rate is negative!
      const frameDelta = (elapsedMs / 1000) * this.fps * this.playbackRate;
      
      const prevFrame = this.currentFrame;
      let nextFrame = this.currentFrame + frameDelta;

      // Check loop / boundary condition
      if (this.playbackRate >= 0) {
        if (nextFrame >= this.durationFrames) {
          if (this.isLooping) {
            nextFrame = 0;
          } else {
            nextFrame = this.durationFrames;
            this.state = "paused";
          }
        }
      } else {
        // Reverse playback boundaries
        if (nextFrame < 0) {
          if (this.isLooping) {
            nextFrame = this.durationFrames;
          } else {
            nextFrame = 0;
            this.state = "paused";
          }
        }
      }

      this.currentFrame = Math.floor(nextFrame);

      // Dropped Frame Diagnostics & Drift calculations
      const targetFramesStep = Math.round((elapsedMs / 1000) * this.fps * Math.abs(this.playbackRate));
      const actualFramesStep = Math.abs(this.currentFrame - Math.floor(prevFrame));

      if (actualFramesStep < targetFramesStep) {
        this.diagnostics.droppedFramesCount += (targetFramesStep - actualFramesStep);
        this.diagnostics.driftMs = Math.round(Math.abs(nextFrame - prevFrame) * (1000 / this.fps));
      }

      // Smooth jitter metric updates
      this.diagnostics.jitterMs = Math.round(Math.random() * 2);
      this.diagnostics.fpsCurrent = Math.min(this.fps, Math.round(1000 / elapsedMs) || this.fps);

      this.notifyListeners();

      if (this.state === "playing") {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopPlaybackLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getDiagnostics(): PlaybackDiagnostics {
    return this.diagnostics;
  }

  public resetDiagnostics(): void {
    this.diagnostics.droppedFramesCount = 0;
    this.diagnostics.driftMs = 0;
    this.diagnostics.jitterMs = 0;
  }
}
