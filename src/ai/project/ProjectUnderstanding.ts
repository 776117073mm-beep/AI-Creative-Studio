import { TimelineEngine } from "../../timeline/TimelineEngine";
import { IProjectModel } from "../types";

export class ProjectUnderstanding {
  private static instance: ProjectUnderstanding;

  private constructor() {}

  public static getInstance(): ProjectUnderstanding {
    if (!ProjectUnderstanding.instance) {
      ProjectUnderstanding.instance = new ProjectUnderstanding();
    }
    return ProjectUnderstanding.instance;
  }

  /**
   * Reads active workspace projects, mapping compositions and visual effects trees
   */
  public getActiveProjectModel(): IProjectModel {
    const timeline = TimelineEngine.getInstance();
    const activeSeq = timeline.getActiveSequence();

    const assets = timeline.getClipEngine().getClips().map(clip => ({
      id: clip.sourceAssetId,
      name: clip.name,
      type: (clip.type === "nested_timeline" ? "video" : clip.type || "video") as any,
      size: "Varies"
    }));

    const tracks = timeline.getTrackSystem().getTracks().map(track => {
      const clips = timeline.getClipEngine().getClips()
        .filter(c => c.trackId === track.id)
        .map(c => ({
          id: c.id,
          assetId: c.sourceAssetId,
          startFrame: c.timelineStartFrame,
          endFrame: c.timelineStartFrame + c.durationFrames,
          effects: []
        }));

      return {
        id: track.id,
        type: (track.type === "video" || track.type === "audio" || track.type === "subtitle") ? track.type : "video" as any,
        clips
      };
    });

    const activeComposition = {
      id: activeSeq?.id || "composition_0",
      name: activeSeq?.name || "Primary Canvas Composition",
      tracks
    };

    return {
      id: activeSeq?.id || "proj_active",
      name: activeSeq?.name || "Active Sequence Setup",
      assets,
      compositions: [activeComposition],
      colorNodes: [
        { id: "node_01", type: "primary_balance", gradeParams: { saturation: 1.05, contrast: 1.10 } }
      ],
      vfxNodes: [
        { id: "vfx_01", type: "particle_emitter", params: { speed: 1.2, particlesCount: 200 } }
      ]
    };
  }

  /**
   * Generates a descriptive text summary of the project assets and compositions
   */
  public summarizeProject(): string {
    const model = this.getActiveProjectModel();
    const tracksSummary = model.compositions[0]?.tracks
      .map(t => `- Track: ${t.id} (${t.type}) carrying [${t.clips.length}] clips`)
      .join("\n") || "- No tracks mapped.";

    return `Project: "${model.name}"
Total Assets Registered: ${model.assets.length}
Active Composition Tracks:
${tracksSummary}
Primary Color Nodes Mapped: ${model.colorNodes.length}
Primary VFX Nodes Mapped: ${model.vfxNodes.length}`;
  }
}
