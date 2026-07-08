import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Plus, Layers,
  Settings, ChevronDown, Sparkles
} from "lucide-react";
import { PageId } from "../types";
import KeyframeGraphEditor from "../components/keyframes/KeyframeGraphEditor";
import { KeyframeEngine, KeyframePoint, InterpolationMode } from "../keyframes/runtime/KeyframeEngine";
import { PlaybackEngine } from "../playback/PlaybackEngine";

interface KeyframeStudioProps {
  onNavigate: (page: PageId) => void;
}

const DEFAULT_PROPERTIES = [
  { name: "opacity", label: "Opacity", min: 0, max: 1, default: 1 },
  { name: "scale", label: "Scale", min: 0, max: 10, default: 1 },
  { name: "rotation", label: "Rotation", min: -360, max: 360, default: 0 },
  { name: "position.x", label: "Position X", min: -1000, max: 1000, default: 0 },
  { name: "position.y", label: "Position Y", min: -1000, max: 1000, default: 0 },
  { name: "blur", label: "Blur", min: 0, max: 100, default: 0 },
  { name: "saturation", label: "Saturation", min: 0, max: 2, default: 1 },
  { name: "contrast", label: "Contrast", min: 0, max: 2, default: 1 },
];

export default function KeyframeStudio({ onNavigate }: KeyframeStudioProps) {
  const keyframeEngine = useRef(KeyframeEngine.getInstance());
  const playbackEngine = useRef(PlaybackEngine.getInstance());

  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackState, setPlaybackState] = useState<"playing" | "paused" | "stopped">("paused");
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [keyframeTracks, setKeyframeTracks] = useState<Record<string, KeyframePoint[]>>({});

  const fps = 24;

  // Setup
  useEffect(() => {
    setKeyframeTracks(keyframeEngine.current.getTracks());

    const unsubscribe = playbackEngine.current.addListener((frame, state) => {
      setCurrentFrame(frame);
      setPlaybackState(state);
    });

    return unsubscribe;
  }, []);

  // Playback handlers
  const handlePlay = useCallback(() => {
    if (playbackState === "playing") {
      playbackEngine.current.pause();
    } else {
      playbackEngine.current.play();
    }
  }, [playbackState]);

  const handleSkipBack = useCallback(() => {
    playbackEngine.current.seek(0);
  }, []);

  const handleSkipForward = useCallback(() => {
    playbackEngine.current.seek(1440);
  }, []);

  const handleAddProperty = useCallback((propName: string) => {
    const prop = DEFAULT_PROPERTIES.find(p => p.name === propName);
    if (!prop) return;

    keyframeEngine.current.addKeyframe(prop.name, 0, prop.default, "linear");
    setKeyframeTracks(keyframeEngine.current.getTracks());
    setActiveProperty(prop.name);
  }, []);

  const handleKeyframeChange = useCallback((propertyName: string, frame: number, value: any) => {
    setKeyframeTracks(keyframeEngine.current.getTracks());
  }, []);

  const formatTimecode = (frame: number) => {
    const totalSeconds = frame / fps;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const frames = Math.floor(frame % fps);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="shrink-0 bg-panel border-b border-border-light px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
            ANIMATION STUDIO
          </span>
          <h1 className="text-lg font-bold tracking-tight">Keyframe Graph Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Playback controls */}
          <button
            onClick={handleSkipBack}
            className="p-1.5 hover:bg-btn-bg rounded text-gray-500 hover:text-text-dark"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlay}
            className="p-2 bg-text-dark text-white rounded-full hover:scale-105 transition-transform"
          >
            {playbackState === "playing" ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
          <button
            onClick={handleSkipForward}
            className="p-1.5 hover:bg-btn-bg rounded text-gray-500 hover:text-text-dark"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-border-light mx-2" />

          <span className="font-mono text-sm font-bold px-3 py-1 bg-btn-bg border border-border-light rounded">
            {formatTimecode(currentFrame)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Property List */}
        <div className="w-56 shrink-0 bg-panel border-r border-border-light flex flex-col">
          <div className="shrink-0 p-3 border-b border-border-light flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Properties</span>
            <div className="relative group">
              <button className="p-1 hover:bg-btn-bg rounded text-gray-500 hover:text-text-dark">
                <Plus className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-border-light rounded-lg shadow-lg z-20 min-w-[160px] hidden group-hover:block">
                {DEFAULT_PROPERTIES.filter(p => !keyframeTracks[p.name] || keyframeTracks[p.name].length === 0).map(prop => (
                  <button
                    key={prop.name}
                    onClick={() => handleAddProperty(prop.name)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-btn-bg flex items-center justify-between"
                  >
                    <span>{prop.label}</span>
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {Object.entries(keyframeTracks).map(([name, keyframes]) => (
              <button
                key={name}
                onClick={() => setActiveProperty(name)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between border-b border-border-light/50 hover:bg-btn-bg/50 ${
                  activeProperty === name ? "bg-btn-bg" : ""
                }`}
              >
                <div>
                  <span className="text-xs font-semibold block">{name}</span>
                  <span className="text-[10px] text-gray-500">{keyframes.length} keyframes</span>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: keyframes.length > 0 ? "#3b82f6" : "#d1d5db"
                  }}
                />
              </button>
            ))}

            {Object.keys(keyframeTracks).length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400">
                Click + to add animated properties
              </div>
            )}
          </div>
        </div>

        {/* Graph Editor */}
        <div className="flex-1 min-h-0">
          <KeyframeGraphEditor
            propertyName={activeProperty || undefined}
            onKeyframeChange={handleKeyframeChange}
          />
        </div>

        {/* Property Inspector */}
        <div className="w-64 shrink-0 bg-panel border-l border-border-light flex flex-col">
          <div className="shrink-0 p-3 border-b border-border-light">
            <span className="text-xs font-bold text-gray-500 uppercase">Inspector</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeProperty && keyframeTracks[activeProperty] ? (
              <>
                <div className="text-sm font-semibold">{activeProperty}</div>

                {/* Current Value */}
                <div className="bg-card border border-border-light p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Value at Frame {currentFrame}</div>
                  {(() => {
                    const prop = DEFAULT_PROPERTIES.find(p => p.name === activeProperty);
                    const value = keyframeEngine.current.evaluateProperty(activeProperty, currentFrame, prop?.default ?? 0);
                    return (
                      <div className="text-lg font-mono font-bold">
                        {typeof value === 'number' ? value.toFixed(3) : JSON.stringify(value)}
                      </div>
                    );
                  })()}
                </div>

                {/* Keyframe List */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-500 uppercase">Keyframes</div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {keyframeTracks[activeProperty].map(kf => (
                      <div
                        key={kf.id}
                        className={`p-2 rounded border text-xs ${
                          kf.frameIndex === currentFrame
                            ? "bg-accent-cyan/10 border-accent-cyan"
                            : "bg-card border-border-light"
                        }`}
                        onClick={() => playbackEngine.current.seek(kf.frameIndex)}
                      >
                        <div className="flex justify-between">
                          <span className="font-mono">F{kf.frameIndex}</span>
                          <span className="font-semibold">{typeof kf.value === 'number' ? kf.value.toFixed(2) : '-'}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {kf.interpolation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Presets */}
                <div className="pt-3 border-t border-border-light">
                  <div className="text-xs font-bold text-purple-600 uppercase flex items-center gap-1 mb-2">
                    <Sparkles className="w-3 h-3" />
                    AI Presets
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        keyframeEngine.current.addKeyframe(activeProperty, 0, 0, "ease-out");
                        keyframeEngine.current.addKeyframe(activeProperty, 24, 1, "linear");
                        setKeyframeTracks(keyframeEngine.current.getTracks());
                      }}
                      className="w-full px-2 py-1 text-left text-xs bg-purple-50 border border-purple-100 rounded hover:bg-purple-100"
                    >
                      Fade In (1s)
                    </button>
                    <button
                      onClick={() => {
                        keyframeEngine.current.addKeyframe(activeProperty, 0, 1, "linear");
                        keyframeEngine.current.addKeyframe(activeProperty, 24, 1, "linear");
                        keyframeEngine.current.addKeyframe(activeProperty, 48, 0, "ease-in");
                        setKeyframeTracks(keyframeEngine.current.getTracks());
                      }}
                      className="w-full px-2 py-1 text-left text-xs bg-purple-50 border border-purple-100 rounded hover:bg-purple-100"
                    >
                      Fade Out (after 1s)
                    </button>
                    <button
                      onClick={() => {
                        const prop = DEFAULT_PROPERTIES.find(p => p.name === activeProperty);
                        if (prop) {
                          keyframeEngine.current.addKeyframe(activeProperty, 0, prop.default, "linear");
                          keyframeEngine.current.addKeyframe(activeProperty, 12, prop.default * 1.2, "ease-out");
                          keyframeEngine.current.addKeyframe(activeProperty, 24, prop.default, "ease-in");
                          setKeyframeTracks(keyframeEngine.current.getTracks());
                        }
                      }}
                      className="w-full px-2 py-1 text-left text-xs bg-purple-50 border border-purple-100 rounded hover:bg-purple-100"
                    >
                      Pulse Animation
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-gray-400 py-8">
                Select a property to inspect
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
