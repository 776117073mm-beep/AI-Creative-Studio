import { TimelineEngine, TimelineSequence } from "./TimelineEngine";
import { ClipEngine, Clip } from "./ClipEngine";
import { TrackSystem, Track, TrackType } from "./TrackSystem";
import { PlaybackEngine } from "../playback/PlaybackEngine";

interface AICommand {
  intent: string;
  action: (params: string, timeline: TimelineEngine, playback: PlaybackEngine) => Promise<string>;
  requiresSelection?: boolean;
}

interface ParsedCommand {
  intent: string;
  params: Record<string, string | number | boolean>;
  rawText: string;
}

const KEYWORDS: Record<string, { intent: string; params: string[] }> = {
  cut: { intent: "split", params: [] },
  split: { intent: "split", params: [] },
  trim: { intent: "trim", params: ["direction", "amount"] },
  delete: { intent: "delete", params: [] },
  remove: { intent: "delete", params: [] },
  duplicate: { intent: "duplicate", params: [] },
  copy: { intent: "duplicate", params: [] },
  play: { intent: "playback_play", params: [] },
  pause: { intent: "playback_pause", params: [] },
  stop: { intent: "playback_stop", params: [] },
  seek: { intent: "seek", params: ["time"] },
  goto: { intent: "seek", params: ["time"] },
  jump: { intent: "seek", params: ["time"] },
  speed: { intent: "playback_speed", params: ["rate"] },
  add: { intent: "add_track", params: ["type"] },
  create: { intent: "add_track", params: ["type"] },
  new: { intent: "add_track", params: ["type"] },
  mute: { intent: "track_mute", params: [] },
  unmute: { intent: "track_unmute", params: [] },
  lock: { intent: "track_lock", params: [] },
  unlock: { intent: "track_unlock", params: [] },
  select: { intent: "select", params: ["target"] },
  deselect: { intent: "deselect", params: [] },
  clear: { intent: "deselect", params: [] },
  undo: { intent: "undo", params: [] },
  redo: { intent: "redo", params: [] },
};

const TRACK_TYPES: Record<string, TrackType> = {
  video: "video",
  audio: "audio",
  sound: "audio",
  music: "audio",
  subtitle: "subtitle",
  subtitles: "subtitle",
  text: "subtitle",
  motion: "motion",
  effect: "effect",
  effects: "effect",
  ai: "ai",
  adjustment: "adjustment",
  camera: "camera",
  "3d": "3d",
  custom: "custom",
};

const TIME_PATTERNS = [
  /^(\d{1,2}):(\d{2}):(\d{2}):(\d{2})$/,
  /^(\d{1,2}):(\d{2}):(\d{2})$/,
  /^(\d+):(\d{2})$/,
  /^(\d+)s$/,
  /^(\d+)f$/,
  /^(\d+) frames?$/i,
  /^(\d+) seconds?$/i,
  /^start$/i,
  /^end$/i,
  /^beginning$/i,
];

function parseTime(timeStr: string, fps: number, totalFrames: number): number {
  const lowerStr = timeStr.toLowerCase().trim();

  if (lowerStr === "start" || lowerStr === "beginning") return 0;
  if (lowerStr === "end") return totalFrames;

  const frameMatch = lowerStr.match(/^(\d+)f$/);
  if (frameMatch) return parseInt(frameMatch[1], 10);

  const secondsMatch = lowerStr.match(/^(\d+)s$/i);
  if (secondsMatch) return parseInt(secondsMatch[1], 10) * fps;

  const secondsWordMatch = lowerStr.match(/^(\d+)\s+seconds?$/i);
  if (secondsWordMatch) return parseInt(secondsWordMatch[1], 10) * fps;

  const framesWordMatch = lowerStr.match(/^(\d+)\s+frames?$/i);
  if (framesWordMatch) return parseInt(framesWordMatch[1], 10);

  const hmsfMatch = lowerStr.match(/^(\d{1,2}):(\d{2}):(\d{2}):(\d{2})$/);
  if (hmsfMatch) {
    const [, h, m, s, f] = hmsfMatch;
    return (
      (parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10)) * fps +
      parseInt(f, 10)
    );
  }

  const hmsMatch = lowerStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hmsMatch) {
    const [, h, m, s] = hmsMatch;
    return (parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10)) * fps;
  }

  const msMatch = lowerStr.match(/^(\d+):(\d{2})$/);
  if (msMatch) {
    const [, m, s] = msMatch;
    return (parseInt(m, 10) * 60 + parseInt(s, 10)) * fps;
  }

  const numericMatch = lowerStr.match(/^(\d+)$/);
  if (numericMatch) return parseInt(numericMatch[1], 10);

  return 0;
}

function parseNumber(str: string): number {
  const match = str.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 1;
}

function parseTrackType(str: string): TrackType | null {
  const lower = str.toLowerCase();
  for (const [keyword, type] of Object.entries(TRACK_TYPES)) {
    if (lower.includes(keyword)) {
      return type;
    }
  }
  return null;
}

export function parseCommand(input: string): ParsedCommand | null {
  const words = input.toLowerCase().split(/\s+/);

  for (const word of words) {
    const mapping = KEYWORDS[word];
    if (mapping) {
      const params: Record<string, string | number | boolean> = {};

      if (mapping.intent === "seek") {
        const timeStr = words.slice(words.indexOf(word) + 1).join(" ");
        params.time = timeStr;
      } else if (mapping.intent === "playback_speed") {
        const rateMatch = input.match(/(\d+\.?\d*)x/);
        params.rate = rateMatch ? parseFloat(rateMatch[1]) : parseNumber(input);
      } else if (mapping.intent === "add_track") {
        params.type = parseTrackType(input) || "video";
      } else if (mapping.intent === "trim") {
        if (input.includes("start") || input.includes("in")) {
          params.direction = "start";
        } else if (input.includes("end") || input.includes("out")) {
          params.direction = "end";
        }
        params.amount = parseNumber(input);
      } else if (mapping.intent === "select") {
        const remaining = words.slice(words.indexOf(word) + 1).join(" ");
        params.target = remaining;
      }

      return {
        intent: mapping.intent,
        params,
        rawText: input,
      };
    }
  }

  if (input.match(/faster|speed up/i)) {
    return {
      intent: "playback_speed",
      params: { rate: 1.5 },
      rawText: input,
    };
  }

  if (input.match(/slower|slow down/i)) {
    return {
      intent: "playback_speed",
      params: { rate: 0.5 },
      rawText: input,
    };
  }

  if (input.match(/forward|ahead/i)) {
    const frames = parseNumber(input) || 24;
    return {
      intent: "seek_forward",
      params: { frames },
      rawText: input,
    };
  }

  if (input.match(/back|backward|rewind/i)) {
    const frames = parseNumber(input) || 24;
    return {
      intent: "seek_backward",
      params: { frames },
      rawText: input,
    };
  }

  return null;
}

export async function executeCommand(
  parsed: ParsedCommand,
  timeline: TimelineEngine,
  playback: PlaybackEngine,
  selectedClipIds: Set<string> = new Set()
): Promise<string> {
  const clipEngine = timeline.getClipEngine();
  const trackSystem = timeline.getTrackSystem();
  const sequence = timeline.getActiveSequence();
  const fps = sequence?.fps || 24;
  const totalFrames = sequence?.durationFrames || 14400;

  switch (parsed.intent) {
    case "split": {
      const currentFrame = await new Promise<number>((resolve) => {
        let cleanup: () => void;
        cleanup = playback.addListener((f) => {
          cleanup();
          resolve(f);
        });
      });

      if (selectedClipIds.size === 0) {
        const clips = clipEngine.getClips();
        const clipAtFrame = clips.find(
          (c) =>
            currentFrame >= c.timelineStartFrame &&
            currentFrame < c.timelineStartFrame + c.durationFrames
        );

        if (!clipAtFrame) {
          return "No clip at playhead to split";
        }

        const newClipId = `clip_${Date.now()}`;
        clipEngine.splitClip(clipAtFrame.id, currentFrame, newClipId);
        trackSystem.addClipToTrack(clipAtFrame.trackId, newClipId);
        timeline.commitSnapshot("AI: Split clip");
        return `Split clip "${clipAtFrame.name}" at frame ${currentFrame}`;
      }

      const results: string[] = [];
      for (const clipId of selectedClipIds) {
        const clip = clipEngine.getClip(clipId);
        if (!clip) continue;

        const newClipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        clipEngine.splitClip(clipId, currentFrame, newClipId);
        trackSystem.addClipToTrack(clip.trackId, newClipId);
        results.push(`split "${clip.name}"`);
      }

      timeline.commitSnapshot("AI: Split clips");
      return `Split ${results.length} clip(s): ${results.join(", ")}`;
    }

    case "trim": {
      const direction = parsed.params.direction === "end" ? "end" : "start";
      const amount = typeof parsed.params.amount === "number" ? parsed.params.amount : 5;

      if (selectedClipIds.size === 0) {
        return "Select a clip to trim";
      }

      for (const clipId of selectedClipIds) {
        const clip = clipEngine.getClip(clipId);
        if (!clip || clip.isLocked) continue;

        if (direction === "start") {
          clip.startFrame = Math.max(0, clip.startFrame + amount);
          clip.durationFrames = Math.max(1, clip.durationFrames - amount);
        } else {
          clip.durationFrames = Math.max(1, clip.durationFrames + amount);
        }
      }

      timeline.commitSnapshot("AI: Trim clips");
      return `Trimmed ${selectedClipIds.size} clip(s) ${direction} by ${amount} frames`;
    }

    case "delete": {
      if (selectedClipIds.size === 0) {
        return "No clips selected to delete";
      }

      let deleted = 0;
      for (const clipId of selectedClipIds) {
        const clip = clipEngine.getClip(clipId);
        if (clip && !clip.isLocked) {
          clipEngine.deleteClip(clipId);
          trackSystem.removeClipFromTrack(clip.trackId, clipId);
          deleted++;
        }
      }

      timeline.commitSnapshot("AI: Delete clips");
      return `Deleted ${deleted} clip(s)`;
    }

    case "duplicate": {
      if (selectedClipIds.size === 0) {
        return "No clips selected to duplicate";
      }

      const newClipIds: string[] = [];
      for (const clipId of selectedClipIds) {
        const newId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newClip = clipEngine.duplicateClip(clipId, newId, 50);
        if (newClip) {
          trackSystem.addClipToTrack(newClip.trackId, newId);
          newClipIds.push(newId);
        }
      }

      timeline.commitSnapshot("AI: Duplicate clips");
      return `Duplicated ${newClipIds.length} clip(s)`;
    }

    case "playback_play":
      playback.play();
      return "Playing";

    case "playback_pause":
      playback.pause();
      return "Paused";

    case "playback_stop":
      playback.stop();
      return "Stopped";

    case "seek":
    case "goto": {
      const timeStr = String(parsed.params.time || "0");
      const frame = parseTime(timeStr, fps, totalFrames);
      playback.seek(frame);
      return `Seeked to frame ${frame}`;
    }

    case "seek_forward": {
      const currentFrame = await new Promise<number>((resolve) => {
        let cleanup: () => void;
        cleanup = playback.addListener((f) => {
          cleanup();
          resolve(f);
        });
      });
      const offset = typeof parsed.params.frames === "number" ? parsed.params.frames : 24;
      playback.seek(currentFrame + offset);
      return `Jumped forward ${offset} frames`;
    }

    case "seek_backward": {
      const currentFrame = await new Promise<number>((resolve) => {
        let cleanup: () => void;
        cleanup = playback.addListener((f) => {
          cleanup();
          resolve(f);
        });
      });
      const offset = typeof parsed.params.frames === "number" ? parsed.params.frames : 24;
      playback.seek(Math.max(0, currentFrame - offset));
      return `Jumped backward ${offset} frames`;
    }

    case "playback_speed": {
      const rate = typeof parsed.params.rate === "number" ? parsed.params.rate : 1.0;
      playback.setPlaybackRate(rate);
      return `Set playback speed to ${rate}x`;
    }

    case "add_track": {
      const type = (parsed.params.type as TrackType) || "video";
      const tracks = trackSystem.getTracks();
      const id = `track_${Date.now()}`;
      const name = `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${tracks.filter((t) => t.type === type).length + 1}`;

      const colors: Record<TrackType, string> = {
        video: "#3b82f6",
        audio: "#10b981",
        subtitle: "#f59e0b",
        motion: "#8b5cf6",
        effect: "#ec4899",
        adjustment: "#6366f1",
        camera: "#14b8a6",
        "3d": "#f97316",
        ai: "#a855f7",
        custom: "#64748b",
      };

      trackSystem.createTrack(id, name, type, tracks.length, colors[type]);
      timeline.commitSnapshot("AI: Add track");
      return `Created ${type} track "${name}"`;
    }

    case "track_mute": {
      const tracks = trackSystem.getTracks();
      if (tracks.length === 0) return "No tracks available";

      const selectedTrack = tracks.find((t) => t.clipIds.some((id) => selectedClipIds.has(id)));
      if (selectedTrack) {
        trackSystem.setTrackMute(selectedTrack.id, true);
        return `Muted track "${selectedTrack.name}"`;
      }

      trackSystem.setTrackMute(tracks[0].id, true);
      return "Muted first track";
    }

    case "track_unmute": {
      const tracks = trackSystem.getTracks();
      const mutedTrack = tracks.find((t) => t.isMuted);
      if (mutedTrack) {
        trackSystem.setTrackMute(mutedTrack.id, false);
        return `Unmuted track "${mutedTrack.name}"`;
      }
      return "No muted tracks";
    }

    case "track_lock": {
      const tracks = trackSystem.getTracks();
      const selectedTrack = tracks.find((t) => t.clipIds.some((id) => selectedClipIds.has(id)));
      if (selectedTrack) {
        trackSystem.setTrackLock(selectedTrack.id, true);
        return `Locked track "${selectedTrack.name}"`;
      }
      return "Select a clip on the track to lock";
    }

    case "track_unlock": {
      const tracks = trackSystem.getTracks();
      const lockedTrack = tracks.find((t) => t.isLocked);
      if (lockedTrack) {
        trackSystem.setTrackLock(lockedTrack.id, false);
        return `Unlocked track "${lockedTrack.name}"`;
      }
      return "No locked tracks";
    }

    case "select": {
      const target = String(parsed.params.target || "");
      if (!target) return "Specify what to select";

      const clips = clipEngine.getClips();
      const matching = clips.filter((c) =>
        c.name.toLowerCase().includes(target.toLowerCase())
      );

      if (matching.length === 0) {
        return `No clips found matching "${target}"`;
      }

      return `Found ${matching.length} clips matching "${target}": ${matching.map((c) => c.name).join(", ")}`;
    }

    case "deselect":
      return "Selection cleared";

    case "undo":
      if (timeline.triggerUndo()) {
        return "Undone";
      }
      return "Nothing to undo";

    case "redo":
      if (timeline.triggerRedo()) {
        return "Redone";
      }
      return "Nothing to redo";

    default:
      return `Unknown command: ${parsed.intent}`;
  }
}

export function suggestCommands(context: {
  hasSelection: boolean;
  isPlaying: boolean;
  currentFrame: number;
}): string[] {
  const suggestions: string[] = [];

  if (context.hasSelection) {
    suggestions.push("split", "delete", "duplicate");
  }

  if (context.isPlaying) {
    suggestions.push("pause");
  } else {
    suggestions.push("play");
  }

  suggestions.push("add video track", "add audio track", "seek to 00:01:00");

  return suggestions;
}

export function getTimelineStatus(timeline: TimelineEngine, playback: PlaybackEngine): string {
  const sequence = timeline.getActiveSequence();
  const clips = timeline.getClipEngine().getClips();
  const tracks = timeline.getTrackSystem().getTracks();
  const state = playback.getPlaybackState();

  return JSON.stringify({
    sequence: sequence?.name || "No sequence",
    tracks: tracks.length,
    clips: clips.length,
    playback: state,
    lockedTracks: tracks.filter((t) => t.isLocked).length,
    mutedTracks: tracks.filter((t) => t.isMuted).length,
  });
}
