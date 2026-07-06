import { TrackSystem, Track, TrackType } from "./TrackSystem";
import { ClipEngine, Clip } from "./ClipEngine";
import { PlayheadEngine } from "./PlayheadEngine";
import { UndoRedoEngine } from "./UndoRedoEngine";
import { Timecode, TimecodeMarker, TimecodeRegion } from "./Timecode";

export interface TimelineSequence {
  id: string;
  name: string;
  fps: number;
  durationFrames: number;
  tracks: Track[];
  clips: Clip[];
  markers: TimecodeMarker[];
  regions: TimecodeRegion[];
  comments: string[];
  notes?: string;
  version: number;
  locked: boolean;
  visible: boolean;
}

export class TimelineEngine {
  private static instance: TimelineEngine | null = null;

  private sequences: Map<string, TimelineSequence> = new Map();
  private activeSequenceId: string | null = null;
  private trackSystem: TrackSystem = new TrackSystem();
  private clipEngine: ClipEngine = new ClipEngine();
  private playhead: PlayheadEngine;
  private undoRedo: UndoRedoEngine<TimelineSequence>;

  // Subtitle cues timeline syncing
  private activeMarkers: TimecodeMarker[] = [];
  private activeRegions: TimecodeRegion[] = [];
  private timelineVersionHistory: Map<string, TimelineSequence[]> = new Map();

  private constructor() {
    this.playhead = new PlayheadEngine();
    this.undoRedo = new UndoRedoEngine();
    
    // Create a default initial timeline sequence
    this.createSequence("seq_default", "Main Sequence", 23.976);
  }

  public static getInstance(): TimelineEngine {
    if (!TimelineEngine.instance) {
      TimelineEngine.instance = new TimelineEngine();
    }
    return TimelineEngine.instance;
  }

  /**
   * Sequence Management
   */
  public createSequence(id: string, name: string, fps: number = 23.976): TimelineSequence {
    const sequence: TimelineSequence = {
      id,
      name,
      fps,
      durationFrames: 24 * 60 * 10, // Default 10 minutes at 24fps
      tracks: [],
      clips: [],
      markers: [],
      regions: [],
      comments: [],
      notes: "",
      version: 1,
      locked: false,
      visible: true,
    };

    this.sequences.set(id, sequence);
    if (!this.activeSequenceId) {
      this.activeSequenceId = id;
    }

    // Set up default tracks for sequence
    this.trackSystem = new TrackSystem();
    this.clipEngine = new ClipEngine();
    
    // Default track allocations
    this.trackSystem.createTrack("track_v1", "Video Track 1", "video", 0, "#3b82f6");
    this.trackSystem.createTrack("track_a1", "Audio Track 1", "audio", 1, "#10b981");
    this.trackSystem.createTrack("track_s1", "Subtitle Track 1", "subtitle", 2, "#f59e0b");

    this.saveSequenceState(sequence);
    return sequence;
  }

  public getSequences(): TimelineSequence[] {
    return Array.from(this.sequences.values());
  }

  public getActiveSequence(): TimelineSequence | null {
    if (!this.activeSequenceId) return null;
    return this.sequences.get(this.activeSequenceId) || null;
  }

  public setActiveSequence(sequenceId: string): void {
    if (this.sequences.has(sequenceId)) {
      this.activeSequenceId = sequenceId;
      const seq = this.sequences.get(sequenceId)!;

      // Re-hydrate systems
      this.trackSystem = new TrackSystem();
      seq.tracks.forEach((t) => {
        const trk = this.trackSystem.createTrack(t.id, t.name, t.type, t.index, t.color);
        trk.isLocked = t.isLocked;
        trk.isMuted = t.isMuted;
        trk.isSolo = t.isSolo;
        trk.metadata = t.metadata;
        trk.clipIds = [...t.clipIds];
      });

      this.clipEngine = new ClipEngine();
      seq.clips.forEach((c) => {
        this.clipEngine.createClip(c);
      });

      this.activeMarkers = [...seq.markers];
      this.activeRegions = [...seq.regions];
      this.playhead = new PlayheadEngine(seq.fps);
    }
  }

  /**
   * Nested Timelines and Compound Clips support
   * Allows a clip to target a child sequence as its media asset source
   */
  public createCompoundClip(
    childSequenceId: string,
    targetTrackId: string,
    clipId: string,
    name: string,
    timelineStartFrame: number
  ): Clip | null {
    const childSeq = this.sequences.get(childSequenceId);
    if (!childSeq) return null;

    // Create container clip pointing to sequence as source
    const clip = this.clipEngine.createClip({
      id: clipId,
      name,
      sourceAssetId: `seq:${childSequenceId}`, // Namespace points to nested sequence
      startFrame: 0,
      durationFrames: childSeq.durationFrames,
      timelineStartFrame,
      trackId: targetTrackId,
      type: "nested_timeline",
      isLocked: false,
      isVisible: true,
      labelColor: "#a855f7", // Purple label color for nested timelines
    });

    this.trackSystem.addClipToTrack(targetTrackId, clipId);
    this.commitSnapshot("Create Compound Clip");
    return clip;
  }

  /**
   * Markers Management
   */
  public addMarker(marker: Omit<TimecodeMarker, "id">): TimecodeMarker {
    const id = `marker_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const fullMarker = { ...marker, id };
    this.activeMarkers.push(fullMarker);
    this.commitSnapshot("Add Marker");
    return fullMarker;
  }

  public getMarkers(): TimecodeMarker[] {
    return this.activeMarkers;
  }

  /**
   * Regions Management
   */
  public addRegion(region: Omit<TimecodeRegion, "id">): TimecodeRegion {
    const id = `region_${Date.now()}`;
    const fullRegion = { ...region, id };
    this.activeRegions.push(fullRegion);
    this.commitSnapshot("Add Region");
    return fullRegion;
  }

  public getRegions(): TimecodeRegion[] {
    return this.activeRegions;
  }

  /**
   * Versioning
   */
  public createNewVersion(seqId: string): number {
    const seq = this.sequences.get(seqId);
    if (!seq) return 0;

    const currentHistory = this.timelineVersionHistory.get(seqId) || [];
    const copy = JSON.parse(JSON.stringify(seq));
    currentHistory.push(copy);
    this.timelineVersionHistory.set(seqId, currentHistory);

    seq.version += 1;
    this.sequences.set(seqId, seq);
    return seq.version;
  }

  public getVersionHistory(seqId: string): TimelineSequence[] {
    return this.timelineVersionHistory.get(seqId) || [];
  }

  /**
   * Undo/Redo & State Commits
   */
  public commitSnapshot(actionName: string, description?: string): void {
    const active = this.getActiveSequence();
    if (!active) return;

    // Package current memory representation into standard sequence state
    const currentSnapshot: TimelineSequence = {
      ...active,
      tracks: this.trackSystem.getTracks(),
      clips: this.clipEngine.getClips(),
      markers: [...this.activeMarkers],
      regions: [...this.activeRegions],
    };

    this.undoRedo.commit(actionName, currentSnapshot, description);
    this.sequences.set(active.id, currentSnapshot);
  }

  public triggerUndo(): boolean {
    const active = this.getActiveSequence();
    if (!active) return false;

    const currentSnapshot: TimelineSequence = {
      ...active,
      tracks: this.trackSystem.getTracks(),
      clips: this.clipEngine.getClips(),
      markers: [...this.activeMarkers],
      regions: [...this.activeRegions],
    };

    const rolledState = this.undoRedo.undo(currentSnapshot);
    if (rolledState) {
      this.rehydrateFromState(rolledState);
      return true;
    }
    return false;
  }

  public triggerRedo(): boolean {
    const active = this.getActiveSequence();
    if (!active) return false;

    const currentSnapshot: TimelineSequence = {
      ...active,
      tracks: this.trackSystem.getTracks(),
      clips: this.clipEngine.getClips(),
      markers: [...this.activeMarkers],
      regions: [...this.activeRegions],
    };

    const rolledState = this.undoRedo.redo(currentSnapshot);
    if (rolledState) {
      this.rehydrateFromState(rolledState);
      return true;
    }
    return false;
  }

  private rehydrateFromState(state: TimelineSequence): void {
    this.sequences.set(state.id, state);
    this.activeSequenceId = state.id;

    this.trackSystem = new TrackSystem();
    state.tracks.forEach((t) => {
      const trk = this.trackSystem.createTrack(t.id, t.name, t.type, t.index, t.color);
      trk.isLocked = t.isLocked;
      trk.isMuted = t.isMuted;
      trk.isSolo = t.isSolo;
      trk.metadata = t.metadata;
      trk.clipIds = [...t.clipIds];
    });

    this.clipEngine = new ClipEngine();
    state.clips.forEach((c) => {
      this.clipEngine.createClip(c);
    });

    this.activeMarkers = [...state.markers];
    this.activeRegions = [...state.regions];
  }

  private saveSequenceState(seq: TimelineSequence): void {
    const completeSeq = {
      ...seq,
      tracks: this.trackSystem.getTracks(),
      clips: this.clipEngine.getClips(),
      markers: [...this.activeMarkers],
      regions: [...this.activeRegions],
    };
    this.sequences.set(seq.id, completeSeq);
  }

  // Delegators to underlying engines for unified timeline facade
  public getTrackSystem(): TrackSystem {
    return this.trackSystem;
  }

  public getClipEngine(): ClipEngine {
    return this.clipEngine;
  }

  public getPlayhead(): PlayheadEngine {
    return this.playhead;
  }
}
