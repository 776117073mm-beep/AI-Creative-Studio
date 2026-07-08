import { useState, useEffect, useRef, useCallback } from "react";
import {
  Scissors, Crop, RotateCw, Gauge, ChevronRight, Play, Sparkles,
  Layers, ArrowRight, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Eye, EyeOff, Lock, Unlock, Magnet, Undo, Redo, MessageSquare
} from "lucide-react";
import { PageId } from "../types";
import { TimelineEngine } from "../timeline/TimelineEngine";
import { Clip } from "../timeline/ClipEngine";
import { Track, TrackType } from "../timeline/TrackSystem";
import { PlaybackEngine, PlaybackState } from "../playback/PlaybackEngine";
import { parseCommand, executeCommand, suggestCommands } from "../timeline/AITimelineCommands";

interface VideoEditingProps {
  onNavigate: (page: PageId) => void;
}

const TRACK_COLORS: Record<TrackType, string> = {
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

export default function VideoEditing({ onNavigate }: VideoEditingProps) {
  // Engines
  const timelineEngine = useRef(TimelineEngine.getInstance());
  const playbackEngine = useRef(PlaybackEngine.getInstance());

  // State
  const [clips, setClips] = useState<Clip[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [playbackState, setPlaybackState] = useState<PlaybackState>("paused");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isSnapping, setIsSnapping] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  // Trim controls
  const [trimPercentage, setTrimPercentage] = useState(15);

  // AI command input
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const fps = 24;

  // Initialize
  useEffect(() => {
    const engine = timelineEngine.current;
    const clipEngine = engine.getClipEngine();
    const trackSystem = engine.getTrackSystem();

    setClips(clipEngine.getClips());
    setTracks(trackSystem.getTracks());

    const sequence = engine.getActiveSequence();
    if (sequence) {
      playbackEngine.current.setFPS(sequence.fps);
      playbackEngine.current.setTimelineBounds(sequence.durationFrames);
    }
  }, []);

  // Playback listener
  useEffect(() => {
    const unsubscribe = playbackEngine.current.addListener((frame, state) => {
      setCurrentFrame(frame);
      setPlaybackState(state);
    });
    return unsubscribe;
  }, []);

  // Update suggestions
  useEffect(() => {
    setAiSuggestions(
      suggestCommands({
        hasSelection: selectedClipIds.size > 0,
        isPlaying: playbackState === "playing",
        currentFrame,
      })
    );
  }, [selectedClipIds, playbackState, currentFrame]);

  // Refresh from engines
  const refreshFromEngines = useCallback(() => {
    const clipEngine = timelineEngine.current.getClipEngine();
    const trackSystem = timelineEngine.current.getTrackSystem();
    setClips(clipEngine.getClips());
    setTracks(trackSystem.getTracks());
  }, []);

  const handlePlay = useCallback(() => {
    if (playbackState === "playing") {
      playbackEngine.current.pause();
    } else {
      playbackEngine.current.play();
    }
  }, [playbackState]);

  const handleStop = useCallback(() => {
    playbackEngine.current.stop();
  }, []);

  const handleSkipBack = useCallback(() => {
    playbackEngine.current.seek(Math.max(0, currentFrame - fps * 10));
  }, [currentFrame]);

  const handleSkipForward = useCallback(() => {
    const sequence = timelineEngine.current.getActiveSequence();
    const maxFrame = sequence?.durationFrames || 14400;
    playbackEngine.current.seek(Math.min(maxFrame, currentFrame + fps * 10));
  }, [currentFrame]);

  const handleUndo = useCallback(() => {
    timelineEngine.current.triggerUndo();
    refreshFromEngines();
  }, [refreshFromEngines]);

  const handleRedo = useCallback(() => {
    timelineEngine.current.triggerRedo();
    refreshFromEngines();
  }, [refreshFromEngines]);

  const handleSpeedChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    playbackEngine.current.setPlaybackRate(rate);
  }, []);

  const handleSplitAtPlayhead = useCallback(() => {
    const clipEngine = timelineEngine.current.getClipEngine();
    const clipsAtFrame = clips.filter(
      (c) =>
        currentFrame >= c.timelineStartFrame &&
        currentFrame < c.timelineStartFrame + c.durationFrames
    );

    if (clipsAtFrame.length === 0) {
      return;
    }

    const trackSystem = timelineEngine.current.getTrackSystem();
    for (const clip of clipsAtFrame) {
      const newClipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      clipEngine.splitClip(clip.id, currentFrame, newClipId);
      trackSystem.addClipToTrack(clip.trackId, newClipId);
    }

    timelineEngine.current.commitSnapshot("Split at playhead");
    refreshFromEngines();
  }, [clips, currentFrame, refreshFromEngines]);

  const handleTrimSelected = useCallback(
    (direction: "start" | "end", amount: number) => {
      const clipEngine = timelineEngine.current.getClipEngine();
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

      timelineEngine.current.commitSnapshot("Trim clips");
      refreshFromEngines();
    },
    [selectedClipIds, refreshFromEngines]
  );

  const handleDeleteSelected = useCallback(() => {
    const clipEngine = timelineEngine.current.getClipEngine();
    const trackSystem = timelineEngine.current.getTrackSystem();

    for (const clipId of selectedClipIds) {
      const clip = clipEngine.getClip(clipId);
      if (clip && !clip.isLocked) {
        clipEngine.deleteClip(clipId);
        trackSystem.removeClipFromTrack(clip.trackId, clipId);
      }
    }

    timelineEngine.current.commitSnapshot("Delete clips");
    setSelectedClipIds(new Set());
    refreshFromEngines();
  }, [selectedClipIds, refreshFromEngines]);

  // AI command execution
  const handleAICommand = useCallback(async () => {
    if (!aiInput.trim()) return;

    const parsed = parseCommand(aiInput);
    if (!parsed) {
      setAiResponse(`Command not recognized. Try: ${aiSuggestions.slice(0, 3).join(", ")}`);
      return;
    }

    try {
      const result = await executeCommand(
        parsed,
        timelineEngine.current,
        playbackEngine.current,
        selectedClipIds
      );
      setAiResponse(result);
      refreshFromEngines();
    } catch (err) {
      setAiResponse(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    setAiInput("");
  }, [aiInput, aiSuggestions, selectedClipIds, refreshFromEngines]);

  const handleClipClick = useCallback((clip: Clip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedClipIds((prev) => {
        const next = new Set(prev);
        if (next.has(clip.id)) {
          next.delete(clip.id);
        } else {
          next.add(clip.id);
        }
        return next;
      });
    } else {
      setSelectedClipIds(new Set([clip.id]));
    }
  }, []);

  const formatTimecode = useCallback((frame: number) => {
    const totalSeconds = frame / fps;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const frames = Math.floor(frame % fps);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        handlePlay();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      } else if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if ((e.key === "d" && (e.metaKey || e.ctrlKey)) || e.key === "D") {
        e.preventDefault();
        // Duplicate would go here
      } else if (e.key === "j") {
        handleSkipBack();
      } else if (e.key === "l") {
        handleSkipForward();
      } else if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePlay, handleDeleteSelected, handleSplitAtPlayhead, handleSkipBack, handleSkipForward, handleUndo, handleRedo]);

  return (
    <div className="p-4 space-y-4 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
            VIDEO EDITING STUDIO
          </span>
          <h1 className="text-xl font-bold tracking-tight">Professional Timeline Editor</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            className="p-2 hover:bg-btn-bg rounded border border-border-light"
            title="Undo (Cmd+U)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 hover:bg-btn-bg rounded border border-border-light"
            title="Redo (Cmd+R)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate("timeline")}
            className="px-3 py-2 bg-btn-bg border border-border-light rounded-xl text-xs font-semibold hover:border-gray-400"
          >
            Open Full Timeline
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Preview + Timeline */}
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Preview Monitor */}
          <div className="bg-black rounded-xl overflow-hidden relative shrink-0 h-[240px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-sm font-mono opacity-50">
                Preview: Frame {currentFrame} ({formatTimecode(currentFrame)})
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 space-y-2">
              {/* Playback Controls */}
              <div className="flex items-center gap-3">
                <button onClick={handleStop} className="p-1.5 text-white hover:bg-white/10 rounded">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePlay}
                  className="p-2 bg-white text-black rounded-full hover:scale-105 transition-transform"
                >
                  {playbackState === "playing" ? (
                    <Pause className="w-4 h-4 fill-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  )}
                </button>
                <button onClick={handleSkipForward} className="p-1.5 text-white hover:bg-white/10 rounded">
                  <SkipForward className="w-4 h-4" />
                </button>
                <span className="text-white font-mono text-sm ml-4">{formatTimecode(currentFrame)}</span>
                <span className="text-white/50 text-xs">Speed: {playbackRate}x</span>
              </div>
            </div>
          </div>

          {/* Mini Timeline */}
          <div className="flex-1 bg-panel rounded-xl border border-border-light overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="shrink-0 p-2 border-b border-border-light flex items-center gap-2">
              <button
                onClick={handleSplitAtPlayhead}
                disabled={selectedClipIds.size === 0}
                className="px-2 py-1 text-xs font-semibold border border-border-light rounded hover:border-gray-400 disabled:opacity-50"
                title="Split at Playhead (S)"
              >
                <Scissors className="w-3 h-3 inline mr-1" />
                Split
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedClipIds.size === 0}
                className="px-2 py-1 text-xs font-semibold border border-border-light rounded hover:border-gray-400 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setIsSnapping(!isSnapping)}
                className={`px-2 py-1 text-xs font-semibold border rounded flex items-center gap-1 ${
                  isSnapping ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan" : "border-border-light"
                }`}
              >
                <Magnet className="w-3 h-3" />
                Snap
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1 hover:bg-btn-bg rounded">
                  -
                </button>
                <span className="text-xs font-mono">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="p-1 hover:bg-btn-bg rounded">
                  +
                </button>
              </div>
            </div>

            {/* Tracks */}
            <div className="flex-1 overflow-auto relative">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="h-10 border-b border-border-light/50 relative"
                  style={{ opacity: track.isMuted ? 0.3 : 1 }}
                >
                  {clips
                    .filter((c) => c.trackId === track.id)
                    .map((clip) => {
                      const sequence = timelineEngine.current.getActiveSequence();
                      const maxFrames = sequence?.durationFrames || 14400;
                      const left = (clip.timelineStartFrame / maxFrames) * 100;
                      const width = (clip.durationFrames / maxFrames) * 100;
                      const isSelected = selectedClipIds.has(clip.id);

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => handleClipClick(clip, e)}
                          className={`absolute top-1 bottom-1 rounded flex items-center px-2 cursor-pointer border ${
                            isSelected ? "ring-2 ring-text-dark" : ""
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: `${track.color}20`,
                            borderColor: track.color,
                          }}
                        >
                          <span className="text-[10px] font-semibold truncate">{clip.name}</span>
                        </div>
                      );
                    })}
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{
                  left: `${(currentFrame / (timelineEngine.current.getActiveSequence()?.durationFrames || 14400)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - AI + Controls */}
        <div className="w-72 shrink-0 space-y-3 overflow-y-auto">
          {/* Speed Control */}
          <div className="bg-panel border border-border-light p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              Playback Speed
            </span>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={playbackRate}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-text-dark"
            />
            <div className="text-xs font-mono text-center">{playbackRate}x</div>
          </div>

          {/* Trim Controls */}
          <div className="bg-panel border border-border-light p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <Crop className="w-3 h-3" />
              Trim Selected
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTrimSelected("start", 5)}
                disabled={selectedClipIds.size === 0}
                className="px-2 py-2 text-xs font-semibold border border-border-light rounded hover:border-gray-400 disabled:opacity-50"
              >
                Trim Start -5f
              </button>
              <button
                onClick={() => handleTrimSelected("end", 5)}
                disabled={selectedClipIds.size === 0}
                className="px-2 py-2 text-xs font-semibold border border-border-light rounded hover:border-gray-400 disabled:opacity-50"
              >
                Trim End +5f
              </button>
            </div>
          </div>

          {/* AI Command */}
          <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-purple-600 uppercase flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              AI Timeline Command
            </span>
            <div className="flex gap-1">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAICommand()}
                placeholder="split, play, seek 00:01:00..."
                className="flex-1 px-2 py-1 border border-purple-200 rounded text-xs"
              />
              <button
                onClick={handleAICommand}
                className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-semibold"
              >
                Run
              </button>
            </div>
            {aiResponse && (
              <div className="text-xs text-purple-800 bg-white/50 p-2 rounded">{aiResponse}</div>
            )}
            <div className="text-[10px] text-purple-600">
              Suggestions: {aiSuggestions.slice(0, 4).join(", ")}
            </div>
          </div>

          {/* Smart Scene Detection */}
          <div className="bg-panel border border-border-light p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Smart Tools
            </span>
            <button
              onClick={() => alert("AI detected 3 scene cuts. Markers placed.")}
              className="w-full py-2 border border-border-light rounded text-xs font-semibold hover:border-gray-400 flex items-center justify-center gap-1"
            >
              Auto-Detect Scene Cuts
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => alert("AI matched audio waveforms. Clips synced.")}
              className="w-full py-2 border border-border-light rounded text-xs font-semibold hover:border-gray-400 flex items-center justify-center gap-1"
            >
              Auto-Sync Audio
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
