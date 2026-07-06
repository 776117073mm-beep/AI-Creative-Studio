export interface MulticamAngle {
  id: string;
  name: string;
  cameraName: string;
  mediaAssetId: string;
  timecodeOffsetFrames: number; // Sync offset alignment
  audioGainOffsetDb: number;
  metadata: {
    lensDetails?: string;
    codec?: string;
    resolution?: string;
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
  };
}

export interface LiveCutPoint {
  timelineFrame: number;
  angleId: string;
}

export class MulticamFoundation {
  private angles: Map<string, MulticamAngle> = new Map();
  private activeAngleId: string | null = null;
  private cutHistory: LiveCutPoint[] = [];

  constructor() {}

  /**
   * Register a camera angle
   */
  public registerAngle(angle: MulticamAngle): void {
    this.angles.set(angle.id, angle);
    if (!this.activeAngleId) {
      this.activeAngleId = angle.id;
    }
  }

  public getAngles(): MulticamAngle[] {
    return Array.from(this.angles.values());
  }

  public getAngle(angleId: string): MulticamAngle | undefined {
    return this.angles.get(angleId);
  }

  public getActiveAngleId(): string | null {
    return this.activeAngleId;
  }

  /**
   * Switch the active preview angle or make a live cut
   */
  public switchAngle(angleId: string, timelineFrame?: number): void {
    if (!this.angles.has(angleId)) {
      throw new Error(`Angle ID ${angleId} is not registered in this multicam group.`);
    }

    this.activeAngleId = angleId;

    if (timelineFrame !== undefined) {
      this.cutHistory.push({
        timelineFrame,
        angleId,
      });
      // Sort cuts chronologically
      this.cutHistory.sort((a, b) => a.timelineFrame - b.timelineFrame);
    }
  }

  /**
   * Sync matching algorithms: Clocks alignment via timecode matching
   */
  public synchronizeClocksViaTimecode(masterTimecodeStr: string, angleTimecodeStrs: Record<string, string>, fps: number = 23.976): void {
    const convertToFrames = (tc: string) => {
      const parts = tc.split(/[:;]/).map(Number);
      const roundedFps = Math.round(fps);
      return ((parts[0] * 3600 + parts[1] * 60 + parts[2]) * roundedFps) + parts[3];
    };

    const masterFrames = convertToFrames(masterTimecodeStr);

    Object.entries(angleTimecodeStrs).forEach(([angleId, tcStr]) => {
      const angle = this.angles.get(angleId);
      if (angle) {
        const angleFrames = convertToFrames(tcStr);
        // Compute offset frames relative to master time
        angle.timecodeOffsetFrames = masterFrames - angleFrames;
      }
    });
  }

  /**
   * Sync via audio waveform cross-correlation (Offset simulation)
   */
  public synchronizeViaWaveformCorrelation(masterAssetId: string, angleId: string, sampleData: Float32Array, sampleRate: number = 48000): number {
    // Cross-correlation peak calculation simulation
    // Real NLE platforms check peak cross-correlations between audio tracks
    const simulatedOffsetSec = Math.random() * 2.5 - 1.25; // Random range -1.25s to 1.25s
    const simulatedOffsetFrames = Math.round(simulatedOffsetSec * 24);

    const angle = this.angles.get(angleId);
    if (angle) {
      angle.timecodeOffsetFrames = simulatedOffsetFrames;
    }

    return simulatedOffsetFrames;
  }

  /**
   * Retrieve active angle at any timeline frame based on cuts history
   */
  public getAngleAtTimelineFrame(frame: number): string | null {
    if (this.cutHistory.length === 0) {
      return this.activeAngleId;
    }

    let activeId = this.activeAngleId;
    for (const cut of this.cutHistory) {
      if (frame >= cut.timelineFrame) {
        activeId = cut.angleId;
      } else {
        break;
      }
    }

    return activeId;
  }

  public getCutHistory(): LiveCutPoint[] {
    return this.cutHistory;
  }

  public clearCuts(): void {
    this.cutHistory = [];
  }
}
