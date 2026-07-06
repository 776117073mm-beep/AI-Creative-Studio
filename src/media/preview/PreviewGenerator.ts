import { VideoEngine } from "../video/VideoEngine";
import { AudioEngine } from "../audio/AudioEngine";

export interface StoryboardThumb {
  timeSec: number;
  frameIndex: number;
  imageUrl: string;
}

export class PreviewGenerator {
  private static instance: PreviewGenerator;

  private constructor() {}

  public static getInstance(): PreviewGenerator {
    if (!PreviewGenerator.instance) {
      PreviewGenerator.instance = new PreviewGenerator();
    }
    return PreviewGenerator.instance;
  }

  /**
   * Generates a series of thumbnail structures spread evenly along the timeline for storyboard views
   */
  public generateStoryboardStrip(durationSec: number, thumbCount = 10): StoryboardThumb[] {
    console.log(`[PreviewGenerator] Slicing video timeline into ${thumbCount} storyboard intervals...`);
    
    const thumbs: StoryboardThumb[] = [];
    const interval = durationSec / thumbCount;

    for (let i = 0; i < thumbCount; i++) {
      const timeSec = i * interval;
      
      // Virtual canvas representing storyboard frames
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Draw frame background
        ctx.fillStyle = i % 2 === 0 ? "#1e293b" : "#0f172a";
        ctx.fillRect(0, 0, 160, 90);
        
        // Draw details
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`STAMP: ${timeSec.toFixed(1)}s`, 10, 25);
        ctx.fillStyle = "#64748b";
        ctx.font = "7px sans-serif";
        ctx.fillText(`Interval Slot #${i + 1}`, 10, 45);

        // Draw scenery outline
        ctx.strokeStyle = "#475569";
        ctx.beginPath();
        ctx.moveTo(10, 70);
        ctx.lineTo(40, 50);
        ctx.lineTo(80, 80);
        ctx.lineTo(120, 40);
        ctx.lineTo(150, 70);
        ctx.stroke();
      }

      thumbs.push({
        timeSec,
        frameIndex: Math.floor(timeSec * 23.976),
        imageUrl: canvas.toDataURL("image/png")
      });
    }

    return thumbs;
  }

  /**
   * Draw waveform onto a destination Canvas Element for high-performance visual display
   */
  public drawWaveformToCanvas(
    canvas: HTMLCanvasElement, 
    audioId: string, 
    color = "#38bdf8", 
    backgroundColor = "transparent"
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const waveform = AudioEngine.getInstance().generateWaveform(audioId, canvas.width / 2);
    const peaks = waveform.peaks;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = color;
    const midY = canvas.height / 2;
    const barWidth = canvas.width / peaks.length;

    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const barHeight = peak * midY * 0.9;
      const x = i * barWidth;
      
      // Draw symmetrical bar
      ctx.fillRect(x, midY - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
    }
  }
}
