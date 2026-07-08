import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, Settings, Download, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Clock, HardDrive, Monitor,
  Zap, AlertCircle, CheckCircle, XCircle, Film, Image, Music
} from "lucide-react";
import { PageId, RenderJob } from "../types";
import { RenderEngine, RenderTask } from "../media/render/RenderEngine";
import {
  ExportManager,
  ExportPreset,
  ExportJobConfig,
  ExportFormat,
  CompositionPipeline,
  RenderLayer,
  BUILTIN_PRESETS
} from "../render/ExportPipeline";
import { PlaybackEngine } from "../playback/PlaybackEngine";

interface RenderCenterNewProps {
  onNavigate: (page: PageId) => void;
  renderQueue: RenderJob[];
  setRenderQueue: React.Dispatch<React.SetStateAction<RenderJob[]>>;
}

export default function RenderCenterNew({ onNavigate, renderQueue, setRenderQueue }: RenderCenterNewProps) {
  // Engines
  const renderEngine = useRef(RenderEngine.getInstance());
  const exportManager = useRef(ExportManager.getInstance());
  const playbackEngine = useRef(PlaybackEngine.getInstance());

  // State
  const [activeRenders, setActiveRenders] = useState<RenderTask[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [customConfig, setCustomConfig] = useState<Partial<ExportJobConfig>>({
    format: "mp4",
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    quality: 80,
    range: { startFrame: 0, endFrame: 720 },
  });

  // Preview composition
  const [previewFrame, setPreviewFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<CompositionPipeline>(new CompositionPipeline());

  // Estimate
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  // Initialize
  useEffect(() => {
    const presets = exportManager.current.getPresets();
    if (presets.length > 0) {
      setSelectedPreset(presets[0]);
    }
  }, []);

  // Update estimates
  useEffect(() => {
    if (!selectedPreset) return;

    const duration = Math.ceil((customConfig.range?.endFrame || 720) / (selectedPreset.fps || 30));
    const size = exportManager.current.calculateEstimatedFileSize(selectedPreset, duration);

    setEstimatedDuration(duration);
    setEstimatedSize(size);
  }, [selectedPreset, customConfig.range]);

  // Poll render tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRenders(renderEngine.current.listTasks());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Preview render
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    pipelineRef.current.clearCache();
    pipelineRef.current.compositeFrame(ctx, previewFrame, 640, 360);
  }, [previewFrame]);

  // Handlers
  const startRender = useCallback(() => {
    if (!selectedPreset) return;

    const task = renderEngine.current.renderComposition(
      "Current Project",
      estimatedDuration,
      {
        width: selectedPreset.resolution.width,
        height: selectedPreset.resolution.height,
        fps: selectedPreset.fps,
        codec: selectedPreset.videoCodec || "h264",
      },
      (task) => {
        setActiveRenders(renderEngine.current.listTasks());

        if (task.status === "completed") {
          // Add to render queue
          const job: RenderJob = {
            id: task.id,
            projectName: task.projectName,
            format: selectedPreset.format,
            resolution: `${selectedPreset.resolution.width}x${selectedPreset.resolution.height}`,
            fps: selectedPreset.fps,
            status: "completed",
            progress: 100,
            priority: "medium",
            elapsed: `${task.elapsedSec}s`,
            outputPath: task.outputPath,
            settings: selectedPreset,
          };
          setRenderQueue(prev => [...prev, job]);
        }
      }
    );

    setActiveRenders(renderEngine.current.listTasks());
  }, [selectedPreset, estimatedDuration, setRenderQueue]);

  const cancelRender = useCallback((taskId: string) => {
    renderEngine.current.cancelRender(taskId);
    setActiveRenders(renderEngine.current.listTasks());
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setRenderQueue(prev => prev.filter(j => j.id !== jobId));
  }, [setRenderQueue]);

  const retryJob = useCallback((jobId: string) => {
    setRenderQueue(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: "queued" as const, progress: 0 } : j))
    );
  }, [setRenderQueue]);

  const addTestLayer = useCallback(() => {
    const layer: RenderLayer = {
      id: `layer_${Date.now()}`,
      name: "Test Shape",
      type: "shape",
      visible: true,
      locked: false,
      blendMode: "source-over",
      opacity: 1,
      transform: {
        position: { x: 320, y: 180 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
      },
      effects: [
        {
          id: "effect_1",
          type: "shape",
          parameters: {
            type: "rectangle",
            width: 200,
            height: 100,
            fill: "#3b82f6",
            cornerRadius: 10,
          },
          enabled: true,
          order: 0,
        },
      ],
    };

    pipelineRef.current.addLayer(layer);
    setPreviewFrame(prev => prev);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "rendering":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    if (format === "mp3" || format === "wav" || format === "ogg") {
      return <Music className="w-4 h-4" />;
    }
    if (format === "png" || format === "jpg" || format === "webp" || format === "gif") {
      return <Image className="w-4 h-4" />;
    }
    return <Film className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="shrink-0 bg-panel border-b border-border-light px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
              PRODUCTION PIPELINE
            </span>
            <h1 className="text-xl font-bold tracking-tight">Render & Export Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {activeRenders.filter(r => r.status === "rendering").length} active render{activeRenders.filter(r => r.status === "rendering").length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left: Settings */}
        <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
          {/* Preset Selection */}
          <div className="bg-panel border border-border-light rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Export Preset
              </span>
              <button
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="text-xs text-blue-500 hover:underline"
              >
                View All
              </button>
            </div>

            {selectedPreset && (
              <button
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="w-full p-3 bg-btn-bg border border-border-light rounded-lg text-left hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getFormatIcon(selectedPreset.format)}
                  <div>
                    <div className="text-sm font-semibold">{selectedPreset.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {selectedPreset.resolution.width}x{selectedPreset.resolution.height} @ {selectedPreset.fps}fps
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                </div>
              </button>
            )}

            {showPresetPicker && (
              <div className="border border-border-light rounded-lg max-h-64 overflow-y-auto">
                {BUILTIN_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset);
                      setShowPresetPicker(false);
                    }}
                    className={`w-full p-2 border-b border-border-light/50 text-left hover:bg-btn-bg flex items-center gap-2 ${
                      selectedPreset?.id === preset.id ? "bg-accent-cyan/10" : ""
                    }`}
                  >
                    {getFormatIcon(preset.format)}
                    <div>
                      <div className="text-xs font-semibold">{preset.name}</div>
                      <div className="text-[10px] text-gray-500">{preset.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Settings */}
          {selectedPreset && (
            <div className="bg-panel border border-border-light rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Custom Settings</span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Width</label>
                  <input
                    type="number"
                    value={customConfig.resolution?.width || selectedPreset.resolution.width}
                    onChange={(e) =>
                      setCustomConfig(prev => ({
                        ...prev,
                        resolution: {
                          ...(prev.resolution || selectedPreset.resolution),
                          width: parseInt(e.target.value) || 1920,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-border-light rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Height</label>
                  <input
                    type="number"
                    value={customConfig.resolution?.height || selectedPreset.resolution.height}
                    onChange={(e) =>
                      setCustomConfig(prev => ({
                        ...prev,
                        resolution: {
                          ...(prev.resolution || selectedPreset.resolution),
                          height: parseInt(e.target.value) || 1080,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-border-light rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500">Quality: {customConfig.quality}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={customConfig.quality || 80}
                  onChange={(e) =>
                    setCustomConfig(prev => ({
                      ...prev,
                      quality: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Start Frame</label>
                  <input
                    type="number"
                    value={customConfig.range?.startFrame || 0}
                    onChange={(e) =>
                      setCustomConfig(prev => ({
                        ...prev,
                        range: {
                          ...(prev.range || { startFrame: 0, endFrame: 720 }),
                          startFrame: Math.max(0, parseInt(e.target.value) || 0),
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-border-light rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">End Frame</label>
                  <input
                    type="number"
                    value={customConfig.range?.endFrame || 720}
                    onChange={(e) =>
                      setCustomConfig(prev => ({
                        ...prev,
                        range: {
                          ...(prev.range || { startFrame: 0, endFrame: 720 }),
                          endFrame: Math.max(1, parseInt(e.target.value) || 720),
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-border-light rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Estimates */}
          <div className="bg-panel border border-border-light rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Estimated Output
            </span>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-2 bg-btn-bg rounded-lg">
                <div className="text-lg font-mono font-bold">{formatTime(estimatedDuration)}</div>
                <div className="text-[10px] text-gray-500">Duration</div>
              </div>
              <div className="p-2 bg-btn-bg rounded-lg">
                <div className="text-lg font-mono font-bold">
                  {exportManager.current.formatFileSize(estimatedSize)}
                </div>
                <div className="text-[10px] text-gray-500">File Size</div>
              </div>
            </div>
          </div>

          {/* Start Render */}
          <button
            onClick={startRender}
            disabled={!selectedPreset || activeRenders.filter(r => r.status === "rendering").length >= 3}
            className="w-full py-3 bg-text-dark text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Start Render
          </button>
        </div>

        {/* Center: Preview + Active Renders */}
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Preview */}
          <div className="shrink-0 bg-panel border border-border-light rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                Composition Preview
              </span>
              <button
                onClick={addTestLayer}
                className="px-2 py-1 text-xs border border-border-light rounded hover:bg-btn-bg"
              >
                + Test Layer
              </button>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="bg-black rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Frame:</span>
              <input
                type="range"
                min="0"
                max="720"
                value={previewFrame}
                onChange={(e) => setPreviewFrame(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-mono">{previewFrame}</span>
            </div>
          </div>

          {/* Active Renders */}
          <div className="flex-1 min-h-0 bg-panel border border-border-light rounded-xl p-4 overflow-hidden flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Active Renders</span>
            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
              {activeRenders.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">No active renders</div>
              ) : (
                activeRenders.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-card border border-border-light rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="text-sm font-semibold">{task.projectName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === "rendering" && (
                          <button
                            onClick={() => cancelRender(task.id)}
                            className="px-2 py-1 text-xs text-red-500 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                        <span className="text-xs text-gray-500">{task.id.slice(0, 12)}...</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{task.progressPercent}%</span>
                        <span>{task.targetWidth}x{task.targetHeight}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${task.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Elapsed: {formatTime(task.elapsedSec)}</span>
                        <span>Remaining: {task.remainingSec > 0 ? formatTime(task.remainingSec) : "-"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Render Queue */}
        <div className="w-72 shrink-0 bg-panel border border-border-light rounded-xl p-4 flex flex-col overflow-hidden">
          <span className="text-xs font-bold text-gray-500 uppercase shrink-0">
            Render History ({renderQueue.length})
          </span>
          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {renderQueue.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">
                No completed renders yet
              </div>
            ) : (
              renderQueue.map(job => (
                <div
                  key={job.id}
                  className="p-2 bg-card border border-border-light rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(job.status)}
                      <span className="text-xs font-semibold truncate max-w-[120px]">
                        {job.projectName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {job.status === "failed" && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="p-1 hover:bg-btn-bg rounded text-gray-400 hover:text-text-dark"
                          title="Retry"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="p-1 hover:bg-btn-bg rounded text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {(job.settings as any)?.name || "Custom settings"}
                  </div>
                  {job.outputPath && (
                    <button className="w-full py-1 text-[10px] text-blue-500 hover:underline flex items-center justify-center gap-1">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
