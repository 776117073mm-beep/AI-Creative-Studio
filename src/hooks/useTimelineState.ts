import { useCallback, useState, useSyncExternalStore } from "react";
import { TimelineStateManager, MemoryTimelineAdapter } from "../../core/state/persistence";
import { Timeline, TimelineAction, TimelineClip, TimelineTrack } from "../../core/state/timeline";

const initialTimeline: Timeline = {
  id: "project_default",
  version: 1,
  fps: 24,
  width: 1920,
  height: 1080,
  sampleRate: 48000,
  duration: 15,
  updatedAt: new Date().toISOString(),
  tracks: [
    {
      id: "track_video_1",
      name: "Video Track 1",
      type: "video",
      muted: false,
      locked: false,
      visible: true,
      zIndex: 0,
      clips: [
        {
          id: "clip_v1",
          sourceUrl: "/assets/Cyberpunk_Streaks_A.mp4",
          startOffset: 0,
          timelineStart: 0,
          duration: 5.5,
          playbackRate: 1,
          effects: [],
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
        },
        {
          id: "clip_v2",
          sourceUrl: "/assets/Tokyo_Drone_Pan.mp4",
          startOffset: 0,
          timelineStart: 5.5,
          duration: 6.5,
          playbackRate: 1,
          effects: [],
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
        }
      ]
    },
    {
      id: "track_audio_1",
      name: "Audio Track 1",
      type: "audio",
      muted: false,
      locked: false,
      visible: true,
      zIndex: 1,
      clips: [
        {
          id: "clip_a1",
          sourceUrl: "/assets/Ambient_Synthwave_Beat.wav",
          startOffset: 0,
          timelineStart: 0,
          duration: 15,
          playbackRate: 1,
          effects: [],
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
        }
      ]
    },
    {
      id: "track_text_1",
      name: "Text Track 1",
      type: "text",
      muted: false,
      locked: false,
      visible: true,
      zIndex: 2,
      clips: [
        {
          id: "clip_t1",
          sourceUrl: "",
          startOffset: 0,
          timelineStart: 1,
          duration: 4.5,
          playbackRate: 1,
          effects: [],
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          text: { value: "NEBULA TOKYO 2026", fontFamily: "Inter", fontSize: 48, color: "#FFFFFF" }
        }
      ]
    }
  ]
};

const adapter = new MemoryTimelineAdapter();
const timelineManager = new TimelineStateManager("project_default", initialTimeline, adapter, 200);

function subscribe(listener: (timeline: Timeline) => void) {
  return timelineManager.subscribe(listener);
}

function getSnapshot() {
  return timelineManager.getSnapshot();
}

export function useTimelineState() {
  const timeline = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const dispatch = useCallback((action: TimelineAction) => {
    timelineManager.dispatch(action);
  }, []);

  const upsertClip = useCallback(
    (trackId: string, clip: TimelineClip) => {
      dispatch({ type: "clip/upsert", trackId, clip });
    },
    [dispatch]
  );

  const removeClip = useCallback(
    (trackId: string, clipId: string) => {
      dispatch({ type: "clip/remove", trackId, clipId });
    },
    [dispatch]
  );

  const addTrack = useCallback(
    (track: TimelineTrack) => {
      dispatch({ type: "track/add", track });
    },
    [dispatch]
  );

  const splitClip = useCallback(
    (trackId: string, clipId: string, splitAt: number) => {
      const snapshot = timelineManager.getSnapshot();
      const track = snapshot.tracks.find((t) => t.id === trackId);
      const clip = track?.clips.find((c) => c.id === clipId);
      if (!track || !clip) return;
      if (splitAt <= clip.timelineStart || splitAt >= clip.timelineStart + clip.duration) return;

      const leftClip: TimelineClip = {
        ...clip,
        id: `${clip.id}_L_${Date.now()}`,
        duration: splitAt - clip.timelineStart,
      };

      const rightClip: TimelineClip = {
        ...clip,
        id: `${clip.id}_R_${Date.now()}`,
        timelineStart: splitAt,
        duration: clip.timelineStart + clip.duration - splitAt,
      };

      dispatch({ type: "clip/remove", trackId, clipId });
      dispatch({ type: "clip/upsert", trackId, clip: leftClip });
      dispatch({ type: "clip/upsert", trackId, clip: rightClip });
    },
    [dispatch]
  );

  const trimClip = useCallback(
    (trackId: string, clipId: string, direction: "left" | "right", trimAt: number) => {
      const snapshot = timelineManager.getSnapshot();
      const track = snapshot.tracks.find((t) => t.id === trackId);
      const clip = track?.clips.find((c) => c.id === clipId);
      if (!track || !clip) return;
      if (trimAt <= clip.timelineStart || trimAt >= clip.timelineStart + clip.duration) return;

      const updatedClip: TimelineClip = { ...clip };
      if (direction === "left") {
        updatedClip.duration = clip.timelineStart + clip.duration - trimAt;
        updatedClip.timelineStart = trimAt;
      } else {
        updatedClip.duration = trimAt - clip.timelineStart;
      }

      dispatch({ type: "clip/upsert", trackId, clip: updatedClip });
    },
    [dispatch]
  );

  const setCursor = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, time));
      dispatch({ type: "cursor/refresh" });
    },
    [dispatch]
  );

  const refresh = useCallback(() => {
    return timelineManager.getSnapshot();
  }, []);

  return {
    timeline,
    currentTime,
    setCurrentTime: setCursor,
    refresh,
    upsertClip,
    removeClip,
    addTrack,
    splitClip,
    trimClip,
    dispatch,
    timelineManager
  };
}
