export interface VideoFrameBuffer {
  frameIndex: number;
  presentationTimestampMs: number;
  width: number;
  height: number;
  pixelData: Uint8ClampedArray | null; // Simulates raw RGBA frame buffers in memory
  metadata: {
    isKeyframe: boolean;
    colorSpace: string;
    decodedDurationMs: number;
  };
}

export class FrameEngine {
  private static instance: FrameEngine | null = null;
  private frameBuffers: Map<string, VideoFrameBuffer[]> = new Map();
  private maxBufferedFramesPerAsset: number = 240; // Approx 10 seconds of 24fps video

  private constructor() {}

  public static getInstance(): FrameEngine {
    if (!FrameEngine.instance) {
      FrameEngine.instance = new FrameEngine();
    }
    return FrameEngine.instance;
  }

  /**
   * Buffer a decoded frame in RAM
   */
  public pushFrameToBuffer(assetId: string, frame: VideoFrameBuffer): void {
    let buffer = this.frameBuffers.get(assetId);
    if (!buffer) {
      buffer = [];
      this.frameBuffers.set(assetId, buffer);
    }

    buffer.push(frame);
    // Sort chronologically
    buffer.sort((a, b) => a.frameIndex - b.frameIndex);

    // Enforce size limit (evicts oldest frames)
    if (buffer.length > this.maxBufferedFramesPerAsset) {
      buffer.shift();
    }
  }

  /**
   * Retrieve cached frame for frame-accurate playback
   */
  public getFrame(assetId: string, frameIndex: number): VideoFrameBuffer | null {
    const buffer = this.frameBuffers.get(assetId);
    if (!buffer) return null;

    const frame = buffer.find((f) => f.frameIndex === frameIndex);
    return frame || null;
  }

  /**
   * Safe frame synchronization retrieval based on presentation timestamp
   */
  public getFrameAtTime(assetId: string, timestampMs: number): VideoFrameBuffer | null {
    const buffer = this.frameBuffers.get(assetId);
    if (!buffer || buffer.length === 0) return null;

    // Find frame closest to the timestamp
    let closestFrame = buffer[0];
    let minDiff = Math.abs(closestFrame.presentationTimestampMs - timestampMs);

    for (const frame of buffer) {
      const diff = Math.abs(frame.presentationTimestampMs - timestampMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frame;
      }
    }

    return closestFrame;
  }

  /**
   * Frame Interpolation Foundation:
   * Generates intermediate virtual frames when playing back at fractional speeds (e.g. 0.5x slow-mo)
   * Supports Linear blend and placeholder Optical Flow triggers.
   */
  public interpolateFrames(
    frameA: VideoFrameBuffer,
    frameB: VideoFrameBuffer,
    fraction: number, // 0.0 to 1.0 representing blend
    mode: "blend" | "optical_flow" = "blend"
  ): VideoFrameBuffer {
    const interpolatedIndex = frameA.frameIndex + fraction;
    const interpolatedPts = frameA.presentationTimestampMs + (frameB.presentationTimestampMs - frameA.presentationTimestampMs) * fraction;

    let blendedPixels: Uint8ClampedArray | null = null;

    if (frameA.pixelData && frameB.pixelData && frameA.pixelData.length === frameB.pixelData.length) {
      blendedPixels = new Uint8ClampedArray(frameA.pixelData.length);
      if (mode === "blend") {
        for (let i = 0; i < frameA.pixelData.length; i++) {
          blendedPixels[i] = Math.round(frameA.pixelData[i] * (1 - fraction) + frameB.pixelData[i] * fraction);
        }
      } else {
        // Optical Flow Vector shifting simulation
        // Moving block vectors are shifted along calculated vectors
        for (let i = 0; i < frameA.pixelData.length; i++) {
          blendedPixels[i] = frameA.pixelData[i]; // Simulated flow vectors fallback
        }
      }
    }

    return {
      frameIndex: Math.floor(interpolatedIndex),
      presentationTimestampMs: interpolatedPts,
      width: frameA.width,
      height: frameA.height,
      pixelData: blendedPixels,
      metadata: {
        isKeyframe: false,
        colorSpace: frameA.metadata.colorSpace,
        decodedDurationMs: frameB.presentationTimestampMs - frameA.presentationTimestampMs,
      },
    };
  }

  /**
   * Flush frame caches
   */
  public clearBuffers(assetId?: string): void {
    if (assetId) {
      this.frameBuffers.delete(assetId);
    } else {
      this.frameBuffers.clear();
    }
  }

  public getStats(): { totalBufferedAssets: number; totalBufferedFrames: number } {
    let frameCount = 0;
    this.frameBuffers.forEach((buf) => {
      frameCount += buf.length;
    });

    return {
      totalBufferedAssets: this.frameBuffers.size,
      totalBufferedFrames: frameCount,
    };
  }
}
