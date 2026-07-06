import { PlaybackEngine } from "../playback/PlaybackEngine";
import { GPUEngine } from "../gpu/GPUEngine";

export type PreviewQuality = "low" | "high" | "adaptive";
export type RenderingPipelinePath = "gpu" | "cpu";

export interface PreviewEngineSettings {
  quality: PreviewQuality;
  targetPath: RenderingPipelinePath;
  frameBufferLimit: number;
}

export class PreviewEngine {
  private static instance: PreviewEngine | null = null;
  private settings: PreviewEngineSettings = {
    quality: "adaptive",
    targetPath: "gpu",
    frameBufferLimit: 60,
  };

  private invalidatedFrameRanges: { start: number; end: number }[] = [];
  private activeRenderScale: number = 1.0;
  private activeListeners: Set<() => void> = new Set();

  private constructor() {
    this.monitorAdaptiveLoop();
  }

  public static getInstance(): PreviewEngine {
    if (!PreviewEngine.instance) {
      PreviewEngine.instance = new PreviewEngine();
    }
    return PreviewEngine.instance;
  }

  public updateSettings(updates: Partial<PreviewEngineSettings>): void {
    this.settings = { ...this.settings, ...updates };
    if (this.settings.quality === "low") {
      this.activeRenderScale = 0.5;
    } else if (this.settings.quality === "high") {
      this.activeRenderScale = 1.0;
    }
    this.triggerRefresh();
  }

  public getSettings(): PreviewEngineSettings {
    return this.settings;
  }

  public getActiveRenderScale(): number {
    return this.activeRenderScale;
  }

  public addRefreshListener(l: () => void): () => void {
    this.activeListeners.add(l);
    return () => this.activeListeners.delete(l);
  }

  private triggerRefresh(): void {
    this.activeListeners.forEach((l) => l());
  }

  /**
   * Adaptive Feedback Loop:
   * Monitors PlaybackEngine diagnostics. If dropped frames are detected,
   * it dynamically scales down the preview resolution rendering factor
   * to maintain liquid-smooth real-time playback frames.
   */
  private monitorAdaptiveLoop(): void {
    setInterval(() => {
      if (this.settings.quality !== "adaptive") return;

      const playback = PlaybackEngine.getInstance();
      const diagnostics = playback.getDiagnostics();

      if (playback.getPlaybackState() === "playing") {
        if (diagnostics.droppedFramesCount > 5) {
          // Degrade quality scales to protect frame rates
          if (this.activeRenderScale > 0.4) {
            this.activeRenderScale = Math.max(0.4, this.activeRenderScale - 0.15);
            playback.resetDiagnostics(); // Reset count for the next window
            this.triggerRefresh();
          }
        } else if (diagnostics.droppedFramesCount === 0 && this.activeRenderScale < 1.0) {
          // Gradually restore quality once pipeline pressure subsides
          this.activeRenderScale = Math.min(1.0, this.activeRenderScale + 0.1);
          this.triggerRefresh();
        }
      }
    }, 1200);
  }

  /**
   * Invalidate preview frames range (e.g. clip split or trim action happened)
   */
  public invalidateFrames(startFrame: number, endFrame: number): void {
    this.invalidatedFrameRanges.push({ start: startFrame, end: endFrame });
    this.triggerRefresh();
  }

  /**
   * Query if a frame is clean or needs re-rendering
   */
  public isFrameStale(frameIndex: number): boolean {
    return this.invalidatedFrameRanges.some(
      (range) => frameIndex >= range.start && frameIndex <= range.end
    );
  }

  /**
   * Fully purge invalidation arrays once rendered frames are re-baked
   */
  public clearStaleRanges(): void {
    this.invalidatedFrameRanges = [];
  }

  /**
   * Select rendering pipeline path based on active GPU capability
   */
  public selectBestRenderingPath(): RenderingPipelinePath {
    const gpuCapabilities = GPUEngine.getInstance().getCapabilities();
    if (gpuCapabilities.hardwareAccelerationEnabled && this.settings.targetPath === "gpu") {
      return "gpu";
    }
    return "cpu";
  }
}
