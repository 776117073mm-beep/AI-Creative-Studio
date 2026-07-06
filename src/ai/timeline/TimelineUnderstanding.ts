import { TimelineEngine } from "../../timeline/TimelineEngine";
import { ITimelineModel } from "../types";

export class TimelineUnderstanding {
  private static instance: TimelineUnderstanding;

  private constructor() {}

  public static getInstance(): TimelineUnderstanding {
    if (!TimelineUnderstanding.instance) {
      TimelineUnderstanding.instance = new TimelineUnderstanding();
    }
    return TimelineUnderstanding.instance;
  }

  /**
   * Retrieves full details on the active timeline state
   */
  public getTimelineState(): ITimelineModel {
    const engine = TimelineEngine.getInstance();
    const activeSeq = engine.getActiveSequence();
    
    const playheadFrame = engine.getPlayhead().getCurrentFrame();
    const fps = activeSeq?.fps || 24;
    const durationFrames = activeSeq?.durationFrames || 14400; // default 10 minutes

    const markers = engine.getMarkers().map(m => ({
      frame: m.frame,
      label: m.label,
      color: m.color || "#ef4444"
    }));

    // Find any nested timelines inside clips
    const nestedTimelines = engine.getClipEngine().getClips()
      .filter(c => c.type === "nested_timeline")
      .map(c => c.sourceAssetId.replace("seq:", ""));

    return {
      playheadFrame,
      fps,
      markers,
      selectedClipIds: [], // default empty, integrated with selection systems
      trackCount: engine.getTrackSystem().getTracks().length,
      durationFrames,
      nestedTimelines
    };
  }

  /**
   * Translates the current playhead frame into a standard timecode (HH:MM:SS:FF)
   */
  public getCurrentTimecode(): string {
    const state = this.getTimelineState();
    const frame = state.playheadFrame;
    const fps = Math.round(state.fps);

    const hrs = Math.floor(frame / (fps * 3600));
    const mins = Math.floor((frame % (fps * 3600)) / (fps * 60));
    const secs = Math.floor((frame % (fps * 60)) / fps);
    const frms = frame % fps;

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frms)}`;
  }

  /**
   * Summarizes the track layout
   */
  public summarizeTimelineTracks(): string {
    const engine = TimelineEngine.getInstance();
    const tracks = engine.getTrackSystem().getTracks();
    const playheadTimecode = this.getCurrentTimecode();

    return `Playhead Position: Frame ${engine.getPlayhead().getCurrentFrame()} (${playheadTimecode})
Total Timeline Tracks: ${tracks.length}
Track Listing:
${tracks.map(t => `  - [Index ${t.index}] ${t.name} (Type: ${t.type}, Locked: ${t.isLocked}, Muted: ${t.isMuted})`).join("\n")}`;
  }
}
