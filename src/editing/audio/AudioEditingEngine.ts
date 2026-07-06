export interface AudioChannelMap {
  sourceChannelIndex: number;
  destinationChannelIndex: number;
}

export class AudioEditingEngine {
  private gainMap: Map<string, number> = new Map(); // clipId -> DB Gain
  private panMap: Map<string, number> = new Map(); // clipId -> Pan value -1.0 (Left) to 1.0 (Right)
  private normalizations: Map<string, number> = new Map(); // clipId -> Target Peak dbFS
  private fadeConfigs: Map<string, { fadeInFrames: number; fadeOutFrames: number }> = new Map();
  private channelMappings: Map<string, AudioChannelMap[]> = new Map();

  constructor() {}

  public getGain(clipId: string): number {
    return this.gainMap.get(clipId) ?? 0.0; // 0.0 dbFS default
  }

  public setGain(clipId: string, decibels: number): void {
    this.gainMap.set(clipId, decibels);
  }

  public getPan(clipId: string): number {
    return this.panMap.get(clipId) ?? 0.0; // Center default
  }

  public setPan(clipId: string, pan: number): void {
    this.panMap.set(clipId, Math.max(-1.0, Math.min(1.0, pan)));
  }

  /**
   * Normalize DB levels to standard peak
   */
  public normalizeLevels(clipId: string, targetPeakDbFS: number = -1.0): void {
    this.normalizations.set(clipId, targetPeakDbFS);
  }

  public getNormalization(clipId: string): number | undefined {
    return this.normalizations.get(clipId);
  }

  /**
   * Set fade curve sizes
   */
  public setFades(clipId: string, fadeInFrames: number, fadeOutFrames: number): void {
    this.fadeConfigs.set(clipId, { fadeInFrames, fadeOutFrames });
  }

  public getFades(clipId: string): { fadeInFrames: number; fadeOutFrames: number } {
    return this.fadeConfigs.get(clipId) || { fadeInFrames: 0, fadeOutFrames: 0 };
  }

  /**
   * Audio compression / gate parameters
   */
  public applyCompressorSimulation(clipId: string, thresholdDb: number = -20, ratio: number = 4): {
    makeupGainDb: number;
    attackMs: number;
    releaseMs: number;
  } {
    return {
      makeupGainDb: Math.abs(thresholdDb) / ratio,
      attackMs: 15,
      releaseMs: 120,
    };
  }

  /**
   * Channel track mapping configuration
   */
  public setChannelMapping(clipId: string, maps: AudioChannelMap[]): void {
    this.channelMappings.set(clipId, maps);
  }

  public getChannelMapping(clipId: string): AudioChannelMap[] {
    return this.channelMappings.get(clipId) || [
      { sourceChannelIndex: 0, destinationChannelIndex: 0 },
      { sourceChannelIndex: 1, destinationChannelIndex: 1 },
    ];
  }

  /**
   * AI Audio Noise Reduction simulation metrics
   */
  public simulateVoiceIsolation(clipId: string, noiseReductionStrength: number = 85): {
    isolationPercentage: number;
    ambientDampeningDb: number;
  } {
    return {
      isolationPercentage: noiseReductionStrength,
      ambientDampeningDb: -32.0,
    };
  }
}
