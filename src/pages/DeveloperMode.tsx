import React, { useState, useEffect, useRef } from "react";
import { usePlatform } from "../context/PlatformContext";
import { 
  Cpu, 
  Terminal, 
  RefreshCw, 
  Zap, 
  Trash2, 
  Layers, 
  FileCode, 
  Activity, 
  Play, 
  BookOpen, 
  ShieldAlert, 
  Settings, 
  Copy, 
  Check, 
  Clock, 
  Flame, 
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  Lock,
  Globe,
  BarChart3,
  Film,
  Music,
  Image as ImageIcon,
  FileText,
  Info,
  Sliders,
  Pause,
  Tv,
  Upload,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Move,
  Link,
  History
} from "lucide-react";

// Media Engine Subsystems
import { MediaEngine, MediaAsset } from "../media/MediaEngine";
import { PlaybackController, PlaybackState } from "../media/playback/PlaybackController";
import { VideoEngine } from "../media/video/VideoEngine";
import { AudioEngine } from "../media/audio/AudioEngine";
import { SubtitleEngine } from "../media/subtitles/SubtitleEngine";
import { RenderEngine, RenderTask } from "../media/render/RenderEngine";
import { MediaCache } from "../media/cache/MediaCache";
import { ProxyManager } from "../media/proxy/ProxyManager";
import { PreviewGenerator } from "../media/preview/PreviewGenerator";

// Professional NLE Engines (Phase 2B Part 2)
import { TimelineEngine } from "../timeline/TimelineEngine";
import { GPUEngine } from "../gpu/GPUEngine";
import { CacheEngine } from "../cache/CacheEngine";
import { ProxyEngine } from "../proxy/ProxyEngine";
import { PlaybackEngine } from "../playback/PlaybackEngine";
import { PreviewEngine } from "../preview/PreviewEngine";
import { RenderPipeline } from "../render/RenderPipeline";
import { MulticamFoundation } from "../timeline/MulticamFoundation";
import { Timecode } from "../timeline/Timecode";

// Professional Editing Engines (Phase 2B Part 3)
import { KeyframeEngine, KeyframePoint } from "../editing/keyframes/KeyframeEngine";
import { MaskEngine, Mask } from "../editing/masks/MaskEngine";
import { ColorEngine } from "../editing/color/ColorEngine";
import { TransitionEngine, TransitionPreset } from "../editing/transitions/TransitionEngine";
import { EffectEngine, Effect } from "../editing/effects/EffectEngine";
import { CompositingEngine } from "../editing/composite/CompositingEngine";
import { MotionEngine } from "../editing/motion/MotionEngine";
import { AnimationEngine } from "../editing/animation/AnimationEngine";
import { VideoEditingEngine, EditingClip, EditingTrack } from "../editing/video/VideoEditingEngine";
import { AudioEditingEngine } from "../editing/audio/AudioEditingEngine";
import { MediaLinkEngine, AssetReference } from "../editing/MediaLinkEngine";
import { PresetEngine, PresetItem } from "../editing/PresetEngine";
import { ActionHistory, HistoryAction } from "../editing/ActionHistory";
import { PluginSupport, PluginDescriptor } from "../editing/PluginSupport";

export default function DeveloperMode() {
  const platform = usePlatform();
  const [activeTab, setActiveTab] = useState<"runtime" | "modules" | "plugins" | "events" | "commands" | "api" | "registries" | "docs" | "media_engine">("runtime");
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);

  // Media Engine Dashboard interactive states
  const [discoveredAssets, setDiscoveredAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("paused");
  const [autoProxy, setAutoProxy] = useState(true);
  const [cacheMemoryLimit, setCacheMemoryLimit] = useState(128);
  const [mediaCacheStats, setMediaCacheStats] = useState<any>(null);
  const [activeRenderJob, setActiveRenderJob] = useState<RenderTask | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationChecklist, setValidationChecklist] = useState<{ isValid: boolean; logs: string[] } | null>(null);
  const [currentSubtitleCue, setCurrentSubtitleCue] = useState<string>("");

  // Professional NLE Interactive States (Phase 2B Part 2)
  const [gpuCaps, setGpuCaps] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [activeCamAngle, setActiveCamAngle] = useState<string>("cam_a");
  const [multicamLogs, setMulticamLogs] = useState<string[]>([]);
  const [timelineMarkers, setTimelineMarkers] = useState<any[]>([]);
  const [timelineTracks, setTimelineTracks] = useState<any[]>([]);
  const [timelineClips, setTimelineClips] = useState<any[]>([]);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [isRenderingPipeline, setIsRenderingPipeline] = useState(false);
  const [activeTimecodeVal, setActiveTimecodeVal] = useState("00:00:00:00");

  // Professional Editing Suite Engine Refs (Phase 2B Part 3)
  const keyframeEngineRef = useRef(new KeyframeEngine());
  const maskEngineRef = useRef(new MaskEngine());
  const colorEngineRef = useRef(new ColorEngine());
  const transitionEngineRef = useRef(new TransitionEngine());
  const effectEngineRef = useRef(new EffectEngine());
  const compositingEngineRef = useRef(new CompositingEngine());
  const motionEngineRef = useRef(new MotionEngine());
  const animationEngineRef = useRef(new AnimationEngine());
  const videoEditingEngineRef = useRef(new VideoEditingEngine());
  const audioEditingEngineRef = useRef(new AudioEditingEngine());
  const mediaLinkEngineRef = useRef(new MediaLinkEngine());
  const presetEngineRef = useRef(new PresetEngine());
  const actionHistoryRef = useRef(ActionHistory.getInstance());
  const pluginSupportRef = useRef(new PluginSupport());

  // Interactive UI States for Phase 2B Part 3 Engines
  const [kfProperty, setKfProperty] = useState<string>("scale");
  const [kfFrame, setKfFrame] = useState<number>(0);
  const [kfValue, setKfValue] = useState<string>("100");
  const [kfInterpolation, setKfInterpolation] = useState<"linear" | "bezier" | "ease-in" | "ease-out">("linear");
  const [kfTracksState, setKfTracksState] = useState<Record<string, any[]>>({});
  
  const [maskName, setMaskName] = useState<string>("VFX Mask A");
  const [maskType, setMaskType] = useState<"rectangle" | "ellipse" | "polygon" | "bezier" | "free_draw">("rectangle");
  const [maskBlend, setMaskBlend] = useState<"add" | "subtract" | "intersect" | "difference">("add");
  const [maskList, setMaskList] = useState<Mask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string>("");
  const [maskFeather, setMaskFeather] = useState<number>(10);
  const [maskExpansion, setMaskExpansion] = useState<number>(0);

  const [colorExposure, setColorExposure] = useState<number>(0);
  const [colorContrast, setColorContrast] = useState<number>(0);
  const [colorSaturation, setColorSaturation] = useState<number>(100);
  const [colorBrightness, setColorBrightness] = useState<number>(0);
  const [hdrActive, setHdrActive] = useState<boolean>(false);
  const [scopesGenerated, setScopesGenerated] = useState<boolean>(false);

  const [selectedTransitionPreset, setSelectedTransitionPreset] = useState<string>("v_dissolve");
  const [selectedEffectPreset, setSelectedEffectPreset] = useState<string>("fx_gaussian_blur");
  const [clipEffectsList, setClipEffectsList] = useState<Effect[]>([]);
  const [appliedStartTransition, setAppliedStartTransition] = useState<string>("");

  const [blendModeSel, setBlendModeSel] = useState<"normal" | "multiply" | "screen" | "overlay">("normal");
  const [parentingChildId, setParentingChildId] = useState<string>("clip_v1_0");
  const [parentingParentId, setParentingParentId] = useState<string>("");
  const [absolutePositionOutput, setAbsolutePositionOutput] = useState<{x: number; y: number}>({ x: 0, y: 0 });

  const [mediaAssetsList, setMediaAssetsList] = useState<AssetReference[]>([]);
  const [presetsList, setPresetsList] = useState<PresetItem[]>([]);
  const [presetsImportJson, setPresetsImportJson] = useState<string>("");
  const [undoCount, setUndoCount] = useState<number>(0);
  const [redoCount, setRedoCount] = useState<number>(0);

  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize and load NLE engine states
  useEffect(() => {
    // 1. GPU Abstraction Detect
    const gpu = GPUEngine.getInstance();
    setGpuCaps(gpu.getCapabilities());

    // 2. Cache Engine Stats
    const cache = CacheEngine.getInstance();
    cache.put("preview_0", "preview", new Uint8ClampedArray(1024), 1024, 5);
    cache.put("waveform_pcm", "waveform", new Float32Array(512), 2048, 8);
    setCacheStats(cache.getStats());

    // 3. Setup Timeline defaults and markers
    const timeline = TimelineEngine.getInstance();
    const tracks = timeline.getTrackSystem();
    const clips = timeline.getClipEngine();

    // Add dummy clips if empty
    if (clips.getClips().length === 0) {
      clips.createClip({
        id: "clip_v1_0",
        name: "A001_C002_0705.mp4",
        sourceAssetId: "asset_vid1",
        startFrame: 0,
        durationFrames: 240, // 10s
        timelineStartFrame: 0,
        trackId: "track_v1",
        type: "video",
        isLocked: false,
        isVisible: true,
        labelColor: "#3b82f6",
      });
      clips.createClip({
        id: "clip_a1_0",
        name: "A001_C002_0705_Audio.wav",
        sourceAssetId: "asset_aud1",
        startFrame: 0,
        durationFrames: 240,
        timelineStartFrame: 0,
        trackId: "track_a1",
        type: "audio",
        isLocked: false,
        isVisible: true,
        labelColor: "#10b981",
      });
      
      // Link audio-video clips
      clips.linkClips(["clip_v1_0", "clip_a1_0"]);
      
      tracks.addClipToTrack("track_v1", "clip_v1_0");
      tracks.addClipToTrack("track_a1", "clip_a1_0");
    }

    if (timeline.getMarkers().length === 0) {
      timeline.addMarker({
        name: "VFX Shot Start",
        comment: "Requires green screen keying pipeline",
        frame: 48, // 2s
        color: "#f59e0b",
        label: "Marker A"
      });
      timeline.addMarker({
        name: "Audio Crossfade Out",
        comment: "Transition sound curve to background ambient sync",
        frame: 120, // 5s
        color: "#10b981",
        label: "Marker B"
      });
    }

    setTimelineMarkers(timeline.getMarkers());
    setTimelineTracks(timeline.getTrackSystem().getTracks());
    setTimelineClips(timeline.getClipEngine().getClips());

    // 4. Register Multicam Log Baseline
    setMulticamLogs([
      "Registered 3 Multicam angles: Cam A, Cam B, and Cam C.",
      "Timecode synchronization baseline established via Master ARRI source."
    ]);

    // 5. Initialize Professional Editing Suite (Phase 2B Part 3)
    const kf = keyframeEngineRef.current;
    kf.addKeyframe("scale", 0, 100, "linear");
    kf.addKeyframe("scale", 240, 125, "bezier");
    kf.addKeyframe("opacity", 0, 100, "linear");
    kf.addKeyframe("opacity", 120, 50, "ease-out");
    setKfTracksState(kf.getTracks());

    const me = maskEngineRef.current;
    me.createMask("mask_0", "Actor Backdrop Keyer", "ellipse", "add");
    me.createMask("mask_1", "Green Screen Garbage Matte", "polygon", "subtract");
    setMaskList(me.getMasks());
    setSelectedMaskId("mask_0");

    const mle = mediaLinkEngineRef.current;
    setMediaAssetsList(mle.getAssetReferences());

    const pe = presetEngineRef.current;
    setPresetsList(pe.getPresets());

    const ee = effectEngineRef.current;
    // Pre-populate some dummy clip effects
    ee.addEffectToClip("clip_v1_0", "fx_gaussian_blur");
    setClipEffectsList(ee.getClipEffects("clip_v1_0"));
  }, []);

  // Sync clock ticker playhead adjustments
  useEffect(() => {
    const unsub = PlaybackController.getInstance().addListener((timeSec, state) => {
      setPlayheadTime(timeSec);
      setPlaybackState(state);

      // Extract matching subtitles if any are active
      const activeCues = SubtitleEngine.getInstance().getCueAtTime(timeSec);
      if (activeCues.length > 0) {
        setCurrentSubtitleCue(activeCues.map(c => c.text).join("\n"));
      } else {
        setCurrentSubtitleCue("");
      }
    });

    // Initial load sync
    const mediaEngine = MediaEngine.getInstance();
    const assets = mediaEngine.listAssets();
    setDiscoveredAssets(assets);
    if (assets.length > 0 && !selectedAsset) {
      setSelectedAsset(assets[0]);
    }
    setAutoProxy(mediaEngine.settings.enableAutoProxy as boolean);
    setCacheMemoryLimit((mediaEngine.settings.maxCacheSizeMb as number) || 128);
    setMediaCacheStats(MediaCache.getInstance().getStats());

    return () => {
      unsub();
    };
  }, []);

  // Update dynamic waveform representation
  useEffect(() => {
    if (selectedAsset && selectedAsset.type === "audio" && waveformCanvasRef.current) {
      PreviewGenerator.getInstance().drawWaveformToCanvas(
        waveformCanvasRef.current,
        selectedAsset.id,
        "#38bdf8",
        "#0f172a"
      );
    }
  }, [selectedAsset]);
  
  // Custom test events form state
  const [testEventType, setTestEventType] = useState("user_interaction");
  const [testPayload, setTestPayload] = useState('{"clickCount": 1, "context": "developer_mode"}');
  const [testDelayMs, setTestDelayMs] = useState(0);

  // Custom test commands form state
  const [testCmdName, setTestCmdName] = useState("adjust_timeline_zoom");
  const [testCmdPayload, setTestCmdPayload] = useState('{"zoomLevel": 1.5}');

  // Custom SDK registration simulations
  const [newCmdId, setNewCmdId] = useState("custom_user_command");
  const [newCmdShortcut, setNewCmdShortcut] = useState("Ctrl+Shift+U");

  // Fetch report dynamically
  const diagnostics = platform.platformRuntime.runDiagnosticsReport();
  const status = platform.platformRuntime.getStatus();

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    addLog("Developer Mode panel mounted. Handshaking with core platform service systems...");
    addLog(`Current Runtime State: ${status.state.toUpperCase()}. Uptime: ${status.uptimeSec}s.`);
    
    // Subscribe to system faults/restart events
    const unsubEvent = platform.eventBus.subscribe("*", (evt) => {
      addLog(`[BUS EVENT] Type: "${evt.type}" dispatched by "${evt.sender}"`);
    });

    return () => {
      platform.eventBus.unsubscribe(unsubEvent);
    };
  }, []);

  const handleSafeRestart = async () => {
    addLog("Requesting Safe Restart...");
    try {
      await platform.platformRuntime.safeRestart();
      addLog("Safe Restart completed successfully. Workspace, layout, and sessions preserved.");
    } catch (err: any) {
      addLog(`ERROR: Safe Restart failed: ${err.message}`);
    }
  };

  const handleSimulateCrash = async () => {
    addLog("Requesting Simulated Component Crash Fault...");
    try {
      await platform.platformRuntime.triggerCrashAndRecovery();
      addLog("Simulated Crash sequence completed. Platform warm-rebooted successfully.");
    } catch (err: any) {
      addLog(`ERROR: Crash simulation failed: ${err.message}`);
    }
  };

  const handleGarbageCollector = () => {
    addLog("Requesting manual Garbage Collection...");
    platform.triggerGC();
    addLog("Garbage Collection executed. Temporary file caches flushed, unused asset descriptors released.");
  };

  const handleHotReload = async (moduleId: string) => {
    addLog(`Initiating Hot-Reload of module [${moduleId}]...`);
    try {
      await platform.platformRuntime.hotReloadModule(moduleId);
      addLog(`SUCCESS: Hot-Reload of module [${moduleId}] complete.`);
      if (selectedModule && selectedModule.id === moduleId) {
        const updated = platform.modulesList.find(m => m.id === moduleId);
        if (updated) setSelectedModule(updated);
      }
    } catch (err: any) {
      addLog(`ERROR: Hot-Reload of module [${moduleId}] failed: ${err.message}`);
    }
  };

  const handlePluginToggle = async (pluginId: string, currentStatus: string) => {
    addLog(`Requesting status change for plugin [${pluginId}]...`);
    try {
      if (currentStatus === "active") {
        await platform.pluginEngine.deactivatePlugin(pluginId);
        addLog(`Plugin [${pluginId}] deactivated.`);
      } else {
        await platform.pluginEngine.activatePlugin(pluginId);
        addLog(`Plugin [${pluginId}] activated.`);
      }
      platform.refreshPlatformState();
      // Update local state copy
      const updated = platform.pluginsList.find(p => p.id === pluginId);
      if (updated) setSelectedPlugin(updated);
    } catch (err: any) {
      addLog(`ERROR: Plugin toggle failed: ${err.message}`);
    }
  };

  const handleTriggerTestEvent = async () => {
    try {
      const parsedPayload = JSON.parse(testPayload);
      if (testDelayMs > 0) {
        addLog(`Queuing delayed event of type "${testEventType}" to trigger in ${testDelayMs}ms...`);
        platform.eventBus.publishDelayed(testEventType, parsedPayload, "DeveloperMode", testDelayMs);
      } else {
        addLog(`Publishing instant event of type "${testEventType}"...`);
        platform.eventBus.publish(testEventType, parsedPayload, "DeveloperMode", { priority: "high" });
      }
    } catch (err: any) {
      addLog(`ERROR: Event parsing failed: ${err.message}`);
    }
  };

  const handleDispatchCommand = async () => {
    try {
      const parsedPayload = JSON.parse(testCmdPayload);
      addLog(`Dispatching command: "${testCmdName}"...`);
      const result = await platform.commandDispatcher.dispatch({
        name: testCmdName,
        payload: parsedPayload,
        priority: 1
      });
      if (result.success) {
        addLog(`SUCCESS: Command "${testCmdName}" executed. Payload: ${testCmdPayload}`);
      } else {
        addLog(`FAILED: Command "${testCmdName}" error: ${result.error}`);
      }
    } catch (err: any) {
      addLog(`ERROR: Command dispatch failed: ${err.message}`);
    }
  };

  const handleRegisterCustomCommand = () => {
    if (!newCmdId.trim()) return;
    try {
      platform.commandRegistry.registerCommand({
        id: newCmdId,
        name: newCmdId.replace(/_/g, " ").toUpperCase(),
        description: "Dynamically registered developer CLI utility command.",
        keyboardShortcut: newCmdShortcut,
        hasUndoSupport: true,
        hasRedoSupport: true,
        isAiCallable: true,
        estimatedDurationMs: 150,
        arguments: [{ name: "force", type: "boolean", required: false }]
      });

      // Also register handler in command dispatcher
      platform.commandDispatcher.registerHandler(newCmdId, async (cmd) => {
        addLog(`[DISPATCHED CUSTOM] dynamically generated handler caught: ${cmd.id}`);
        return { success: true };
      });

      addLog(`SUCCESS: Command "${newCmdId}" registered in CommandRegistry & CommandDispatcher with shortcut ${newCmdShortcut}.`);
      setNewCmdId("");
    } catch (err: any) {
      addLog(`ERROR: Custom command registration failed: ${err.message}`);
    }
  };

  const handleCopyMarkdownManual = () => {
    const markdown = platform.documentationSystem.exportMarkdownManual();
    navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    addLog("Dynamic SDK Documentation Manual copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-6 text-gray-800 flex flex-col h-full bg-background relative" id="dev_mode_workspace">
      {/* Page Title & Status Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-border-light">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-text-dark text-white rounded-lg">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
              Developer System Console 
              <span className="text-[10px] bg-red-100 text-red-800 font-mono font-bold px-1.5 py-0.5 rounded border border-red-200">
                SANDBOX ACCESS
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-sans">
              Hardware-accelerated live telemetry, container system configuration, and micro-service injection controls.
            </p>
          </div>
        </div>

        {/* Global Control Toolbar */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button 
            onClick={handleSafeRestart}
            id="btn_dev_safe_restart"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-border-light rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Safe Restart</span>
          </button>
          <button 
            onClick={handleSimulateCrash}
            id="btn_dev_simulate_crash"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold text-red-700 cursor-pointer shadow-xs"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Crash Platform</span>
          </button>
          <button 
            onClick={handleGarbageCollector}
            id="btn_dev_trigger_gc"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-border-light rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush Cache</span>
          </button>
        </div>
      </div>

      {/* Real-time System Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-3.5 rounded-xl border border-border-light flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase">Runtime Core</span>
            <Terminal className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono uppercase block text-green-600">
              ● {status.state}
            </span>
            <span className="text-[10px] text-gray-400 font-mono block">Uptime: {status.uptimeSec}s</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-border-light flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase">RAM Footprint</span>
            <Cpu className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono block text-gray-950">
              {diagnostics.memoryStatus}
            </span>
            <span className="text-[10px] text-gray-400 font-mono block">Isolation Max: {status.config.memoryLimitMb}MB</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-border-light flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase">VFX GPU Usage</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono block text-gray-950">
              {diagnostics.performanceLatest ? diagnostics.performanceLatest.gpuUsage : 12}%
            </span>
            <span className="text-[10px] text-gray-400 font-mono block">Shader Latency: {diagnostics.performanceLatest ? diagnostics.performanceLatest.pluginLatencyMs : 4}ms</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-border-light flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase">Temp File Store</span>
            <FileCode className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono block text-gray-950">
              {platform.tempFileStats.totalFiles} files
            </span>
            <span className="text-[10px] text-gray-400 font-mono block">Disk Cache: {(platform.tempFileStats.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-border-light flex flex-col justify-between col-span-2 md:col-span-1 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase">Workspace Presets</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono block text-gray-950">
              {platform.workspaceEngine.listPresets().length} Loaded
            </span>
            <span className="text-[10px] text-gray-400 font-mono block">Active layout: Default</span>
          </div>
        </div>
      </div>

      {/* Main Panel Division */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left Hand: Category tabs */}
        <div className="lg:col-span-1 flex flex-col space-y-1.5 border-r border-border-light pr-4 h-full overflow-y-auto no-scrollbar">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2 px-2 block">ARCHITECTURE DOMAINS</span>
          
          <button 
            onClick={() => setActiveTab("runtime")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "runtime" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <Terminal className="w-4 h-4" />
            <span>Runtime Engine</span>
          </button>

          <button 
            onClick={() => setActiveTab("modules")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "modules" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <Layers className="w-4 h-4" />
            <span>Module Engine ({platform.modulesList.length})</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab("media_engine");
              // Sync assets list on tab activation
              setDiscoveredAssets(MediaEngine.getInstance().listAssets());
            }}
            id="tab_btn_media_engine"
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "media_engine" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <Film className="w-4 h-4 animate-pulse" />
            <span className="font-bold">Media Engine (Foundation)</span>
          </button>

          <button 
            onClick={() => setActiveTab("plugins")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "plugins" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <Zap className="w-4 h-4" />
            <span>Plugin Sandbox ({platform.pluginsList.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab("events")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "events" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <Activity className="w-4 h-4" />
            <span>Message Bus Events</span>
          </button>

          <button 
            onClick={() => setActiveTab("commands")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "commands" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Command Registry</span>
          </button>

          <button 
            onClick={() => setActiveTab("api")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "api" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <Globe className="w-4 h-4" />
            <span>Internal API Gateway</span>
          </button>

          <button 
            onClick={() => setActiveTab("registries")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "registries" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Capabilities & Formats</span>
          </button>

          <button 
            onClick={() => setActiveTab("docs")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${activeTab === "docs" ? "bg-text-dark text-white shadow-xs" : "text-gray-600 hover:bg-btn-bg hover:text-gray-900"}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>SDK System Docs</span>
          </button>
        </div>

        {/* Right Hand: Focused Workspace Area */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-y-auto no-scrollbar bg-white rounded-xl border border-border-light p-5 shadow-xs">
          
          {/* TAB 1: RUNTIME DIAGNOSTICS */}
          {activeTab === "runtime" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-950 mb-1">Runtime Configuration & Health Logs</h3>
                <p className="text-xs text-gray-500">Live feed of diagnostic status indicators, system resource limits, and environment setups.</p>
              </div>

              {/* Subsystems Health Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/30">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    Subsystem Health Check reports
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                    {diagnostics.healthReport.details.map((sub: any) => (
                      <div key={sub.subsystemName} className="flex items-center justify-between text-xs p-1.5 bg-white rounded border border-border-light/60">
                        <span className="font-semibold text-gray-700">{sub.subsystemName}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-[9px] text-gray-400">Latency: {sub.metrics.latencyMs}ms</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            sub.status === "healthy" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>{sub.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/30">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-purple-500" />
                    Runtime Limits Sandbox Policy
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-gray-500 block mb-1 font-semibold">Max Execution Frame Delay (ms)</label>
                      <input 
                        type="number" 
                        value={status.config.maxExecutionTimeMs} 
                        onChange={(e) => platform.platformRuntime.updateRuntimeConfig({ maxExecutionTimeMs: parseInt(e.target.value) })}
                        className="w-full bg-white border border-border-light p-2 rounded text-xs focus:outline-none focus:border-gray-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 block mb-1 font-semibold">Max Memory Bounds (MB)</label>
                      <input 
                        type="number" 
                        value={status.config.memoryLimitMb} 
                        onChange={(e) => platform.platformRuntime.updateRuntimeConfig({ memoryLimitMb: parseInt(e.target.value) })}
                        className="w-full bg-white border border-border-light p-2 rounded text-xs focus:outline-none focus:border-gray-500 font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border-light/60">
                      <span className="text-gray-500 font-semibold">Safe Script eval() Block</span>
                      <span className="font-mono text-[10px] text-red-600 font-bold uppercase">Disabled (Enforced)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Console Logs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 block">Subsystem Console Stream</span>
                <div className="bg-text-dark text-green-400 font-mono text-[11px] p-4 rounded-lg h-44 overflow-y-auto flex flex-col-reverse shadow-inner select-text border border-gray-800">
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed border-b border-gray-800/20 py-1">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODULE ENGINE */}
          {activeTab === "modules" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-950 mb-1">Module Engine Registry</h3>
                <p className="text-xs text-gray-500">Inspect registered high-performance native core modules, check loaded APIs, and run secure Hot-Reload injection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Modules Grid list */}
                <div className="md:col-span-1 border-r border-border-light pr-4 space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {platform.modulesList.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModule(m)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        selectedModule?.id === m.id 
                          ? "bg-text-dark text-white border-text-dark" 
                          : "bg-panel/30 border-border-light hover:bg-panel/60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block truncate">{m.displayName}</span>
                        <span className="text-[10px] opacity-75 font-mono">{m.id}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        m.status === "active" ? "bg-green-500" : "bg-yellow-500"
                      }`} />
                    </button>
                  ))}
                </div>

                {/* Module Details pane */}
                <div className="md:col-span-2 space-y-4">
                  {selectedModule ? (
                    <div className="space-y-4 border border-border-light p-4 rounded-xl bg-panel/10">
                      <div className="flex items-start justify-between border-b border-border-light/60 pb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{selectedModule.displayName}</h4>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {selectedModule.id} | Class Reference</p>
                        </div>
                        <button
                          onClick={() => handleHotReload(selectedModule.id)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 bg-text-dark text-white hover:bg-opacity-90 rounded text-[10px] font-semibold cursor-pointer shadow-xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Hot Reload Module</span>
                        </button>
                      </div>

                      <div className="space-y-3 text-xs text-gray-700">
                        <p>{selectedModule.metadata.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="bg-white p-2 rounded border border-border-light/60">
                            <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold">Category</span>
                            <span className="font-semibold">{selectedModule.category}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-border-light/60">
                            <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold">Status / Health</span>
                            <span className="font-mono flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              {selectedModule.status.toUpperCase()} ({selectedModule.health})
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold mb-1">Declared Pipeline Inputs</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedModule.metadata.inputs?.map((inp: string) => (
                              <span key={inp} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-mono text-[9px] rounded border border-gray-200">{inp}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold mb-1">Declared Pipeline Outputs</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedModule.metadata.outputs?.map((out: string) => (
                              <span key={out} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 font-mono text-[9px] rounded border border-gray-200">{out}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold mb-1">Required Permissions</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedModule.metadata.permissions?.map((perm: string) => (
                              <span key={perm} className="px-1.5 py-0.5 bg-red-50 text-red-700 font-mono text-[9px] rounded border border-red-200">{perm}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 border border-dashed border-border-light rounded-xl flex items-center justify-center text-xs text-gray-400">
                      Select a module from the registry list to inspect its schema.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLUGINS SANDBOX */}
          {activeTab === "plugins" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-950 mb-1">Sandboxed Plugin Environment</h3>
                <p className="text-xs text-gray-500">Activate or deactivate discovered extensions, and observe live sandboxed evaluation loops.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Plugins list */}
                <div className="md:col-span-1 border-r border-border-light pr-4 space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {platform.pluginsList.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlugin(p)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        selectedPlugin?.id === p.id 
                          ? "bg-text-dark text-white border-text-dark" 
                          : "bg-panel/30 border-border-light hover:bg-panel/60"
                      }`}
                    >
                      <div>
                        <span className="font-bold block truncate">{p.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">{p.id}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        p.status === "active" ? "bg-green-500" : "bg-gray-400"
                      }`} />
                    </button>
                  ))}
                </div>

                {/* Plugin detail page */}
                <div className="md:col-span-2 space-y-4">
                  {selectedPlugin ? (
                    <div className="space-y-4 border border-border-light p-4 rounded-xl bg-panel/10">
                      <div className="flex items-start justify-between border-b border-border-light/60 pb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{selectedPlugin.name}</h4>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {selectedPlugin.id} | Sandboxed JavaScript Class</p>
                        </div>
                        <button
                          onClick={() => handlePluginToggle(selectedPlugin.id, selectedPlugin.status)}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer shadow-xs ${
                            selectedPlugin.status === "active" 
                              ? "bg-red-50 text-red-700 border border-red-200" 
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          <Play className="w-3 h-3" />
                          <span>{selectedPlugin.status === "active" ? "Deactivate Sandbox" : "Activate Sandbox"}</span>
                        </button>
                      </div>

                      <div className="space-y-3 text-xs text-gray-700">
                        <p>{selectedPlugin.metadata.description}</p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-2 rounded border border-border-light/60">
                            <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold">Host Compatibility</span>
                            <span className="font-mono">{selectedPlugin.metadata.compatibility || "^2.0.0"}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-border-light/60">
                            <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold">Developer</span>
                            <span>{selectedPlugin.metadata.developer || "Studio Marketplace"}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold mb-1">Assigned Security Permissions</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedPlugin.metadata.permissions?.map((perm: string) => (
                              <span key={perm} className="px-1.5 py-0.5 bg-red-50 text-red-700 font-mono text-[9px] rounded border border-red-200">{perm}</span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-text-dark text-white p-3 rounded-lg font-mono text-[10px] space-y-1">
                          <span className="text-gray-400 text-[9px] uppercase tracking-wider block font-sans font-bold">Simulated Sandbox Test Evaluation</span>
                          <code className="block text-green-400">{`await pluginEngine.runInSandbox("${selectedPlugin.id}", "eval('1+1')");`}</code>
                          <span className="text-gray-500 block">Output Result: 2 (Securely scoped under context state)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 border border-dashed border-border-light rounded-xl flex items-center justify-center text-xs text-gray-400">
                      Select a plugin from the registry list to toggle sandbox isolation statuses.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MESSAGE BUS EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 mb-1">Message Bus Event stream</h3>
                  <p className="text-xs text-gray-500">Live feed of global events. Inject delayed or instant events onto the asynchronous bus below.</p>
                </div>
                <button
                  onClick={() => {
                    platform.eventBus.clearHistory();
                    platform.refreshPlatformState();
                    addLog("Cleared Event Bus history logs.");
                  }}
                  className="flex items-center space-x-1 px-2 py-1 border border-border-light rounded text-[10px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>

              {/* Event Injector Form */}
              <div className="bg-panel/30 border border-border-light p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                  Custom Event Injector CLI
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-500 mb-1 font-semibold">Event Type (Topic)</label>
                    <input 
                      type="text" 
                      value={testEventType}
                      onChange={(e) => setTestEventType(e.target.value)}
                      className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 mb-1 font-semibold">Payload (JSON Object)</label>
                    <input 
                      type="text" 
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-semibold">Delay / Scheduled (ms)</label>
                    <div className="flex space-x-1">
                      <input 
                        type="number" 
                        value={testDelayMs}
                        onChange={(e) => setTestDelayMs(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                      />
                      <button 
                        onClick={handleTriggerTestEvent}
                        className="bg-text-dark hover:bg-opacity-90 text-white px-3.5 py-1.5 rounded font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        PUBLISH
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Events feed */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 block">Live Event Dispatch Ledger (Latest 15)</span>
                <div className="border border-border-light rounded-xl overflow-hidden text-xs max-h-[300px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead className="bg-panel font-bold text-gray-700 border-b border-border-light">
                      <tr>
                        <th className="p-2 font-mono text-[10px]">TIMESTAMP</th>
                        <th className="p-2 font-mono text-[10px]">EVENT TOPIC</th>
                        <th className="p-2 font-mono text-[10px]">SENDER</th>
                        <th className="p-2 font-mono text-[10px]">PAYLOAD DATA SUMMARY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light/60">
                      {platform.eventHistory.slice(-15).reverse().map((evt, idx) => (
                        <tr key={idx} className="hover:bg-panel/20 font-mono text-[11px]">
                          <td className="p-2 text-gray-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                          <td className="p-2 font-semibold text-gray-900">{evt.type}</td>
                          <td className="p-2 text-blue-600">{evt.sender}</td>
                          <td className="p-2 text-gray-500 truncate max-w-xs">{JSON.stringify(evt.payload)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMMANDS REGISTRY */}
          {activeTab === "commands" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 mb-1">Command Registry Dispatcher</h3>
                  <p className="text-xs text-gray-500">Exposes registered executable actions with Undo / Redo capabilities and AI-cognitive hooks.</p>
                </div>
                
                {/* Undo Redo Toolbar */}
                <div className="flex items-center gap-1 bg-panel/30 border border-border-light p-1 rounded-lg">
                  <button
                    onClick={async () => {
                      addLog("Triggering undo action command...");
                      const undone = await platform.commandDispatcher.undo();
                      if (undone) addLog("SUCCESS: Last action undone.");
                      else addLog("WARNING: Undo stack empty or blocked.");
                      platform.refreshPlatformState();
                    }}
                    className="p-1 hover:bg-white rounded text-gray-600 transition-colors cursor-pointer"
                    title="Undo Action"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      addLog("Triggering redo action command...");
                      const redone = await platform.commandDispatcher.redo();
                      if (redone) addLog("SUCCESS: Last action redone.");
                      else addLog("WARNING: Redo stack empty or blocked.");
                      platform.refreshPlatformState();
                    }}
                    className="p-1 hover:bg-white rounded text-gray-600 transition-colors cursor-pointer"
                    title="Redo Action"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Action dispatcher form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-panel/30 border border-border-light p-4 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-gray-900 block">Command Dispatcher Executor</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1 font-semibold">Select Command</label>
                      <select 
                        value={testCmdName}
                        onChange={(e) => setTestCmdName(e.target.value)}
                        className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                      >
                        {platform.commandRegistry.listCommands().map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-semibold">Arguments Payload (JSON)</label>
                      <input 
                        type="text" 
                        value={testCmdPayload}
                        onChange={(e) => setTestCmdPayload(e.target.value)}
                        className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                      />
                    </div>
                    <button 
                      onClick={handleDispatchCommand}
                      className="w-full py-1.5 bg-text-dark text-white rounded text-xs font-bold hover:bg-opacity-90 transition-colors cursor-pointer shadow-xs"
                    >
                      DISPATCH COMMAND
                    </button>
                  </div>
                </div>

                {/* Command CLI injection builder */}
                <div className="bg-panel/30 border border-border-light p-4 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-gray-900 block">SDK command definition Injector</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-gray-500 mb-1 font-semibold">Command ID</label>
                      <input 
                        type="text" 
                        value={newCmdId}
                        onChange={(e) => setNewCmdId(e.target.value)}
                        placeholder="e.g., compile_neural_layers"
                        className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-semibold">Keyboard Shortcut Trigger</label>
                      <input 
                        type="text" 
                        value={newCmdShortcut}
                        onChange={(e) => setNewCmdShortcut(e.target.value)}
                        placeholder="e.g., Ctrl+Shift+Alt+R"
                        className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono"
                      />
                    </div>
                    <button 
                      onClick={handleRegisterCustomCommand}
                      className="w-full py-1.5 bg-text-dark text-white rounded text-xs font-bold hover:bg-opacity-90 transition-colors cursor-pointer shadow-xs"
                    >
                      REGISTER SDK COMMAND
                    </button>
                  </div>
                </div>
              </div>

              {/* Command history registry */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 block">Command History Logs</span>
                <div className="border border-border-light rounded-xl overflow-hidden text-xs max-h-[160px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead className="bg-panel font-bold text-gray-700 border-b border-border-light">
                      <tr>
                        <th className="p-2 font-mono text-[10px]">TIME</th>
                        <th className="p-2 font-mono text-[10px]">COMMAND ID</th>
                        <th className="p-2 font-mono text-[10px]">PAYLOAD ARGUMENTS</th>
                        <th className="p-2 font-mono text-[10px]">AI-CALLABLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light/60">
                      {platform.commandHistory.length > 0 ? (
                        platform.commandHistory.slice().reverse().map((cmd, idx) => {
                          const definition = platform.commandRegistry.getCommand(cmd.name);
                          return (
                            <tr key={idx} className="hover:bg-panel/20 font-mono text-[11px]">
                              <td className="p-2 text-gray-400">{new Date(cmd.timestamp).toLocaleTimeString()}</td>
                              <td className="p-2 font-semibold text-gray-950">{cmd.name}</td>
                              <td className="p-2 text-gray-500 truncate max-w-xs">{JSON.stringify(cmd.payload)}</td>
                              <td className="p-2">
                                <span className={`px-1 rounded text-[9px] font-bold ${
                                  definition?.isAiCallable ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-500"
                                }`}>{definition?.isAiCallable ? "YES" : "NO"}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-400">No commands have been dispatched on the bus yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: API GATEWAY */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-950 mb-1">Internal REST / RPC API Gateway</h3>
                <p className="text-xs text-gray-500">Inspect server-side route definitions, active authentication policies, rate limiting metrics, and proxy headers.</p>
              </div>

              {/* Endpoint proxy logs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <span className="text-xs font-bold text-gray-900 block">Active Micro-service Routes Ledger</span>
                  <div className="border border-border-light rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead className="bg-panel font-bold text-gray-700 border-b border-border-light">
                        <tr>
                          <th className="p-2.5 font-mono text-[10px]">ROUTE</th>
                          <th className="p-2.5 font-mono text-[10px]">AUTH</th>
                          <th className="p-2.5 font-mono text-[10px]">RATE LIMIT (req/m)</th>
                          <th className="p-2.5 font-mono text-[10px]">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light/60 font-mono text-[11px]">
                        <tr className="hover:bg-panel/20">
                          <td className="p-2.5 font-bold"><span className="text-green-600 mr-1.5">GET</span>/api/v2/assets</td>
                          <td className="p-2.5 text-red-600 flex items-center gap-1"><Lock className="w-3 h-3" />JWT Bearer</td>
                          <td className="p-2.5 text-gray-600">120</td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-bold text-[9px] uppercase">Proxy active</span></td>
                        </tr>
                        <tr className="hover:bg-panel/20">
                          <td className="p-2.5 font-bold"><span className="text-blue-600 mr-1.5">POST</span>/api/v2/render</td>
                          <td className="p-2.5 text-red-600 flex items-center gap-1"><Lock className="w-3 h-3" />JWT Bearer</td>
                          <td className="p-2.5 text-gray-600">20</td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-bold text-[9px] uppercase">Proxy active</span></td>
                        </tr>
                        <tr className="hover:bg-panel/20">
                          <td className="p-2.5 font-bold"><span className="text-green-600 mr-1.5">GET</span>/api/v2/system/health</td>
                          <td className="p-2.5 text-gray-400">None</td>
                          <td className="p-2.5 text-gray-600">Unlimited</td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-bold text-[9px] uppercase">Proxy active</span></td>
                        </tr>
                        <tr className="hover:bg-panel/20">
                          <td className="p-2.5 font-bold"><span className="text-green-600 mr-1.5">GET</span>/api/graphql</td>
                          <td className="p-2.5 text-red-600 flex items-center gap-1"><Lock className="w-3 h-3" />JWT Bearer</td>
                          <td className="p-2.5 text-gray-600">60</td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px] uppercase">Apollo Resolver</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-border-light p-4 rounded-xl space-y-4 bg-panel/30 text-xs">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    Gateway Traffic Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-border-light/60 pb-1.5">
                      <span className="text-gray-500">Active Handlers</span>
                      <span className="font-mono font-bold text-gray-900">4 Registered</span>
                    </div>
                    <div className="flex justify-between border-b border-border-light/60 pb-1.5">
                      <span className="text-gray-500">Total API Calls logged</span>
                      <span className="font-mono font-bold text-gray-900">12,408 Requests</span>
                    </div>
                    <div className="flex justify-between border-b border-border-light/60 pb-1.5">
                      <span className="text-gray-500">Authorization Pass-Rate</span>
                      <span className="font-mono font-bold text-green-600">99.8% Passed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Gateway Latency</span>
                      <span className="font-mono font-bold text-gray-900">1.2ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CAPABILITIES & FILE FORMATS REGISTRIES */}
          {activeTab === "registries" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-950 mb-1">Architecture Registries</h3>
                <p className="text-xs text-gray-500">Inspect declared capabilities requested by individual modules, and registered file extension types.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Capabilities declared */}
                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/10">
                  <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-500" />
                    CapabilityRegistry Declarations
                  </span>
                  <div className="space-y-3 text-xs">
                    {platform.modulesList.map(mod => {
                      const decl = platform.capabilityRegistry.getModuleCapabilities(mod.id);
                      return (
                        <div key={mod.id} className="p-2 bg-white rounded border border-border-light/60 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800">{mod.displayName}</span>
                            <span className="text-[9px] font-mono text-gray-400">id: {mod.id}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-sans font-bold">Capabilities declared:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {decl?.capabilities.map(cap => (
                                <span key={cap} className="px-1 py-0.5 bg-blue-50 text-blue-700 font-mono text-[9px] rounded border border-blue-200">{cap}</span>
                              )) || <span className="text-[10px] text-gray-400 italic">None</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* File format extensions */}
                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/10">
                  <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-green-500" />
                    FileTypeRegistry extensions
                  </span>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar text-xs">
                    {platform.fileTypeRegistry.listFormats().map(fmt => (
                      <div key={fmt.id} className="p-2 bg-white rounded border border-border-light/60 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-800 block">{fmt.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Mime: {fmt.mimeType}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {fmt.extensions.map(ext => (
                            <span key={ext} className="px-1.5 py-0.5 bg-green-50 text-green-700 font-mono font-bold text-[9px] rounded border border-green-200">{ext}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8.5: MEDIA ENGINE INTERACTIVE DASHBOARD */}
          {activeTab === "media_engine" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border-light pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 mb-1">Professional Media Engine Foundation Console</h3>
                  <p className="text-xs text-gray-500 font-sans">Multi-codec decoding, frame-accurate buffering, subtitle timeline clocks, offline baking loops, and RAM bounds telemetry.</p>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <button
                    onClick={() => {
                      const list = MediaEngine.getInstance().discoverWorkspaceAssets();
                      setDiscoveredAssets(list);
                      if (list.length > 0) setSelectedAsset(list[0]);
                      addLog("Triggered workspace media discovery scan. Found 4 high-fidelity assets.");
                    }}
                    id="btn_media_discover"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Workspace Assets</span>
                  </button>
                  <button
                    onClick={() => {
                      MediaCache.getInstance().clear();
                      setMediaCacheStats(MediaCache.getInstance().getStats());
                      addLog("Manual media cache flush completed. Evicted cached frame buffers and waveform points.");
                    }}
                    id="btn_media_cache_flush"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-border-light text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Media Cache</span>
                  </button>
                </div>
              </div>

              {/* Top Panel: Settings, Telemetry & Upload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Settings */}
                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/20 text-xs">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                    Engine Configuration
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-semibold">Enable Auto-Proxy Rendering</span>
                      <input
                        type="checkbox"
                        checked={autoProxy}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setAutoProxy(val);
                          MediaEngine.getInstance().updateSettings({ enableAutoProxy: val });
                          addLog(`Engine auto-proxy pipeline: ${val ? "ENABLED" : "DISABLED"}`);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 block mb-1 font-semibold">Max RAM Cache Alloc (MB)</label>
                      <input
                        type="number"
                        value={cacheMemoryLimit}
                        onChange={(e) => {
                          const val = Math.max(16, parseInt(e.target.value) || 128);
                          setCacheMemoryLimit(val);
                          MediaEngine.getInstance().updateSettings({ maxCacheSizeMb: val });
                          addLog(`Set RAM Cache limit boundary to: ${val} MB.`);
                        }}
                        className="w-full bg-white border border-border-light p-1.5 rounded focus:outline-none focus:border-gray-500 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block leading-normal">
                        * Videos above 4K resolution (3840x2160) automatically compile proxy files to optimize playback frame rates.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Upload Files */}
                <div 
                  className={`border-2 border-dashed p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                    isDragOver ? "border-blue-500 bg-blue-50/50" : "border-border-light bg-panel/5"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      addLog(`Dropped file: ${file.name}. Commencing header validation...`);
                      try {
                        const asset = await MediaEngine.getInstance().importFile(file);
                        setDiscoveredAssets(MediaEngine.getInstance().listAssets());
                        setSelectedAsset(asset);
                        setValidationChecklist({ isValid: asset.isValid, logs: asset.validationLog || [] });
                        addLog(`SUCCESS: Imported file "${file.name}" as [${asset.type.toUpperCase()}] asset.`);
                      } catch (err: any) {
                        addLog(`ERROR: Dropped file import failure: ${err.message}`);
                      }
                    }
                  }}
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs font-semibold text-gray-700 block">Drag & Drop Media File</span>
                  <span className="text-[10px] text-gray-400 block mt-1">Supports MP4, WAV, PNG, WebVTT formats</span>
                  <label className="mt-3 cursor-pointer bg-white hover:bg-gray-50 border border-border-light text-gray-700 font-semibold text-[10px] px-2.5 py-1.5 rounded-md shadow-xs transition-all">
                    <span>Select File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          addLog(`Selected file: ${file.name}. Commencing header validation...`);
                          try {
                            const asset = await MediaEngine.getInstance().importFile(file);
                            setDiscoveredAssets(MediaEngine.getInstance().listAssets());
                            setSelectedAsset(asset);
                            setValidationChecklist({ isValid: asset.isValid, logs: asset.validationLog || [] });
                            addLog(`SUCCESS: Imported file "${file.name}" as [${asset.type.toUpperCase()}] asset.`);
                          } catch (err: any) {
                            addLog(`ERROR: File import failure: ${err.message}`);
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Column 3: RAM Cache Telemetry */}
                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/20 text-xs">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-green-500" />
                    Cache Diagnostics Telemetry
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border-light/60 pb-1.5">
                      <span className="text-gray-500 font-semibold">Active Cache Size</span>
                      <span className="font-mono font-bold text-gray-900">
                        {mediaCacheStats ? (mediaCacheStats.totalSizeInBytes / (1024 * 1024)).toFixed(2) : "0.00"} MB
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border-light/60 pb-1.5">
                      <span className="text-gray-500 font-semibold">Cached Items Count</span>
                      <span className="font-mono font-bold text-gray-900">
                        {mediaCacheStats ? mediaCacheStats.itemCount : 0} elements
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border-light/60 pb-1.5">
                      <span className="text-gray-500 font-semibold">Cache Hits (Read Snappy)</span>
                      <span className="font-mono font-bold text-green-600">
                        {mediaCacheStats ? mediaCacheStats.hits : 0} Hits
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">Cache Misses (Decoded)</span>
                      <span className="font-mono font-bold text-yellow-600">
                        {mediaCacheStats ? mediaCacheStats.misses : 0} Misses
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Section: Assets List & Live Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: Assets selector list */}
                <div className="lg:col-span-1 border border-border-light rounded-xl overflow-hidden flex flex-col max-h-[450px]">
                  <div className="bg-panel/10 p-3 border-b border-border-light flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900 uppercase">Active Asset Catalog</span>
                    <span className="text-[10px] font-mono text-gray-400 bg-white border border-border-light rounded px-1">{discoveredAssets.length} total</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {discoveredAssets.length === 0 ? (
                      <div className="text-center p-6 text-gray-400 text-xs italic">
                        No active assets parsed yet. Click "Scan Workspace Assets" to explore defaults!
                      </div>
                    ) : (
                      discoveredAssets.map((asset) => {
                        const isSelected = selectedAsset && selectedAsset.id === asset.id;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setValidationChecklist({ isValid: asset.isValid, logs: asset.validationLog || [] });
                              // If subtitle file, warm subtitle engine
                              if (asset.type === "subtitle" && asset.metadata) {
                                SubtitleEngine.getInstance().setActiveCues([]);
                                // Simulate loading subtitle cues to engine
                                const mockCues = [
                                  { id: "1", startTimeSec: 1, endTimeSec: 4, text: "Welcome to the AI Creative Studio demonstration!" },
                                  { id: "2", startTimeSec: 5, endTimeSec: 9, text: "Our newly engineered Media Engine parses streams with frame-accuracy." },
                                  { id: "3", startTimeSec: 10, endTimeSec: 15, text: "Explore hardware-accelerated proxy transcoding live below." }
                                ];
                                SubtitleEngine.getInstance().setActiveCues(mockCues);
                                addLog("Warm-loaded interactive subtitle timeline with 3 cues.");
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              isSelected ? "bg-text-dark text-white border-text-dark" : "bg-white hover:bg-gray-50 border-border-light"
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              {asset.type === "video" && <Film className="w-3.5 h-3.5 shrink-0" />}
                              {asset.type === "audio" && <Music className="w-3.5 h-3.5 shrink-0" />}
                              {asset.type === "image" && <ImageIcon className="w-3.5 h-3.5 shrink-0" />}
                              {asset.type === "subtitle" && <FileText className="w-3.5 h-3.5 shrink-0" />}
                              <span className="font-semibold truncate block">{asset.name}</span>
                            </div>
                            <div className="flex items-center space-x-1 font-mono text-[9px] shrink-0 ml-1.5">
                              <span>{(asset.sizeBytes / 1024 / 1024).toFixed(1)}M</span>
                              {asset.hasProxy && (
                                <span className={`px-1 rounded font-bold uppercase ${isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"}`}>PRX</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right side: Detailed inspector & virtual preview player */}
                <div className="lg:col-span-2 border border-border-light rounded-xl p-4 space-y-4 bg-white shadow-xs">
                  {selectedAsset ? (
                    <div className="space-y-4">
                      {/* Title Bar */}
                      <div className="flex items-center justify-between border-b border-border-light pb-2">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase font-mono block">Active Inspector asset</span>
                          <span className="text-xs font-bold text-gray-900">{selectedAsset.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          selectedAsset.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {selectedAsset.isValid ? "Valid stream" : "Corrupt header"}
                        </span>
                      </div>

                      {/* Decoded properties list */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-panel/10 p-3 rounded-lg border border-border-light/60">
                        <div>
                          <span className="text-gray-400 text-[10px] block font-semibold">Codec identifier</span>
                          <span className="font-mono font-semibold text-gray-900">{selectedAsset.codecId}</span>
                        </div>
                        {selectedAsset.type === "video" && (
                          <>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Resolution bounds</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.width} x {selectedAsset.metadata?.height}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Frames scalar rate</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.fps} FPS</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Color gamut (HDR)</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.colorSpace} ({selectedAsset.metadata?.isHDR ? "HDR" : "SDR"})</span>
                            </div>
                          </>
                        )}
                        {selectedAsset.type === "audio" && (
                          <>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Sampling rate</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.sampleRate} Hz</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Audio channels</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.channels} Ch</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Peak Amplitude</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.peakAmplitude?.toFixed(2) || "0.00"} dB</span>
                            </div>
                          </>
                        )}
                        {selectedAsset.type === "image" && (
                          <>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Dimensions bounds</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.width} x {selectedAsset.metadata?.height}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Color space profile</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.colorProfile}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Alpha transparency</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.hasAlphaChannel ? "True" : "False"}</span>
                            </div>
                          </>
                        )}
                        {selectedAsset.type === "subtitle" && (
                          <>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Cue elements parsed</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.cueCount} lines</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Total Duration</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.totalDurationSec}s</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] block font-semibold">Language locale</span>
                              <span className="font-mono font-semibold text-gray-900">{selectedAsset.metadata?.language || "en"}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Interactive Visual Preview Stage */}
                      <div className="border border-border-light rounded-xl overflow-hidden bg-[#0a0f1d] p-5 flex flex-col items-center justify-center min-h-[180px] relative">
                        {selectedAsset.type === "video" && (
                          <div className="text-center space-y-2">
                            <Tv className="w-8 h-8 text-blue-400 mx-auto animate-pulse" />
                            <div className="font-mono text-xs text-white">
                              DECODED FRAME: #{Math.floor(playheadTime * (selectedAsset.metadata?.fps || 23.976))} / {selectedAsset.metadata?.totalFrames}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Time Address: {playheadTime.toFixed(3)}s / {selectedAsset.metadata?.durationSec?.toFixed(2)}s
                            </div>
                            {currentSubtitleCue && (
                              <div className="mt-4 px-4 py-1.5 bg-black/80 rounded border border-gray-800 text-yellow-400 font-bold text-xs max-w-sm">
                                {currentSubtitleCue}
                              </div>
                            )}
                          </div>
                        )}

                        {selectedAsset.type === "audio" && (
                          <div className="w-full space-y-3 text-center">
                            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Waveform Peaks Vector Output</span>
                            <canvas
                              ref={waveformCanvasRef}
                              width={360}
                              height={80}
                              className="mx-auto bg-[#090d16] rounded border border-gray-800"
                            />
                            <div className="text-[10px] text-gray-400 font-mono">
                              Playhead Location: {playheadTime.toFixed(3)}s / {selectedAsset.metadata?.durationSec?.toFixed(2)}s
                            </div>
                          </div>
                        )}

                        {selectedAsset.type === "image" && (
                          <div className="text-center space-y-2">
                            <div className="w-24 h-24 bg-panel/30 rounded border border-gray-800 flex items-center justify-center mx-auto shadow-inner">
                              <ImageIcon className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="text-xs text-white font-mono font-semibold">
                              {selectedAsset.metadata?.width} x {selectedAsset.metadata?.height} Pixels
                            </div>
                            <div className="text-[10px] text-gray-400 font-sans">
                              Color Profiles: {selectedAsset.metadata?.colorProfile} | Alpha Channel: {selectedAsset.metadata?.hasAlphaChannel ? "YES" : "NO"}
                            </div>
                          </div>
                        )}

                        {selectedAsset.type === "subtitle" && (
                          <div className="text-center space-y-3 w-full">
                            <FileText className="w-8 h-8 text-green-400 mx-auto animate-pulse" />
                            <div className="text-xs text-white font-mono uppercase tracking-wider font-bold">Subtitle Cues Timeline Reader</div>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar text-left max-w-md mx-auto">
                              {[
                                { stamp: "00:01.00 - 00:04.00", text: "Welcome to the AI Creative Studio demonstration!" },
                                { stamp: "00:05.00 - 00:09.00", text: "Our newly engineered Media Engine parses streams with frame-accuracy." },
                                { stamp: "00:10.00 - 00:15.00", text: "Explore hardware-accelerated proxy transcoding live below." }
                              ].map((item, idx) => (
                                <div key={idx} className="p-1.5 rounded bg-black/60 border border-gray-800/60 text-[10px] flex justify-between gap-4">
                                  <span className="text-green-400 font-mono font-bold">{item.stamp}</span>
                                  <span className="text-gray-300 truncate font-semibold">{item.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Synced playback control toolbar */}
                      {(selectedAsset.type === "video" || selectedAsset.type === "audio") && (
                        <div className="space-y-3">
                          {/* Playhead slider control */}
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-mono text-gray-500 font-bold">0.00s</span>
                            <input
                              type="range"
                              min="0"
                              max={selectedAsset.metadata?.durationSec || 30}
                              step="0.05"
                              value={playheadTime}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setPlayheadTime(val);
                                PlaybackController.getInstance().seek(val);
                              }}
                              className="flex-1 accent-text-dark bg-border-light h-1 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-gray-500 font-bold">
                              {(selectedAsset.metadata?.durationSec || 30).toFixed(2)}s
                            </span>
                          </div>

                          {/* Control buttons list */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center space-x-1.5">
                              {playbackState === "playing" ? (
                                <button
                                  onClick={() => {
                                    PlaybackController.getInstance().pause();
                                    setPlaybackState("paused");
                                  }}
                                  className="p-1.5 bg-text-dark text-white rounded hover:bg-opacity-90 cursor-pointer"
                                  title="Pause playback clock"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    // Set play head boundaries based on current asset duration
                                    const dur = selectedAsset.metadata?.durationSec || 30;
                                    PlaybackController.getInstance().setTimelineBounds(dur);
                                    PlaybackController.getInstance().play();
                                    setPlaybackState("playing");
                                  }}
                                  className="p-1.5 bg-text-dark text-white rounded hover:bg-opacity-90 cursor-pointer"
                                  title="Play synchronized clocks"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const pc = PlaybackController.getInstance();
                                  pc.setTimelineBounds(selectedAsset.metadata?.durationSec || 30);
                                  pc.stepFrames(-1);
                                  addLog("Stepped backward by 1 frame.");
                                }}
                                className="px-2 py-1 bg-white border border-border-light rounded text-[10px] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
                                title="Step backward 1 frame"
                              >
                                -1 Frame
                              </button>
                              <button
                                onClick={() => {
                                  const pc = PlaybackController.getInstance();
                                  pc.setTimelineBounds(selectedAsset.metadata?.durationSec || 30);
                                  pc.stepFrames(1);
                                  addLog("Stepped forward by 1 frame.");
                                }}
                                className="px-2 py-1 bg-white border border-border-light rounded text-[10px] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
                                title="Step forward 1 frame"
                              >
                                +1 Frame
                              </button>
                            </div>

                            <div className="flex items-center space-x-1.5 text-[10px]">
                              <span className="text-gray-500 font-semibold">Speed:</span>
                              {[0.5, 1.0, 2.0].map((rate) => {
                                const isCurrent = PlaybackController.getInstance().getPlaybackRate() === rate;
                                return (
                                  <button
                                    key={rate}
                                    onClick={() => {
                                      PlaybackController.getInstance().setPlaybackRate(rate);
                                      // Force component refresh state
                                      setPlayheadTime(PlaybackController.getInstance().getTime());
                                    }}
                                    className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                                      isCurrent ? "bg-text-dark text-white" : "bg-panel hover:bg-btn-bg text-gray-600 cursor-pointer"
                                    }`}
                                  >
                                    {rate}x
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-12 text-gray-400 text-xs italic flex flex-col items-center justify-center space-y-2">
                      <Tv className="w-8 h-8 text-gray-300" />
                      <span>Select or import an asset above to inspect stream integrity validation and synchronized controls.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section: Validation Checks & Offline Exporter Baking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 1: Integrity Checker logs */}
                <div className="border border-border-light p-4 rounded-xl space-y-3 bg-panel/30 flex flex-col max-h-[300px]">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    Stream Validation Checklist logs
                  </h4>
                  <div className="flex-1 overflow-y-auto font-mono text-[10px] bg-white border border-border-light/60 p-3 rounded-lg space-y-1.5 leading-relaxed text-gray-700 shadow-inner">
                    {validationChecklist ? (
                      <>
                        <div className={`font-bold pb-1.5 border-b mb-2 ${validationChecklist.isValid ? "text-green-600" : "text-red-600"}`}>
                          STATUS: {validationChecklist.isValid ? "PASS" : "FAIL (STRUCTURE FAULT)"}
                        </div>
                        {validationChecklist.logs.map((logStr, lIdx) => (
                          <div key={lIdx} className="border-l border-gray-300 pl-2 py-0.5">{logStr}</div>
                        ))}
                      </>
                    ) : (
                      <div className="text-gray-400 italic text-center pt-8">
                        Ready. Click an asset in catalog to fetch detailed file structure header logs.
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2: Offline Codec Baker & Exporter */}
                <div className="border border-border-light p-4 rounded-xl space-y-4 bg-panel/30 text-xs">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Offline Codec Baking & Exporter
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-500 block mb-1 font-semibold">Target Output Codec</label>
                        <select
                          id="export_codec_select"
                          className="w-full bg-white border border-border-light p-2 rounded text-xs focus:outline-none focus:border-gray-500 font-sans"
                        >
                          <option value="h264_mp4">H.264 AVC (MP4 Container)</option>
                          <option value="prores_mov">Apple ProRes 422 (MOV Container)</option>
                          <option value="h265_hevc">H.265 HEVC (MP4 Container)</option>
                          <option value="webm_vp9">Google VP9 (WebM Container)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500 block mb-1 font-semibold">Resolution Bounds</label>
                        <select
                          id="export_resolution_select"
                          className="w-full bg-white border border-border-light p-2 rounded text-xs focus:outline-none focus:border-gray-500 font-sans"
                        >
                          <option value="1920x1080">1080p FHD (1920x1080)</option>
                          <option value="3840x2160">4K UltraHD (3840x2160)</option>
                          <option value="1280x720">720p HD (1280x720)</option>
                        </select>
                      </div>
                    </div>

                    {/* Progress representation */}
                    {activeRenderJob ? (
                      <div className="border border-border-light p-3 rounded bg-white space-y-2">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-blue-600 flex items-center gap-1">
                            <span className="animate-spin text-xs">&#9696;</span>
                            Status: {activeRenderJob.status.toUpperCase()}
                          </span>
                          <span className="font-mono">{activeRenderJob.progressPercent}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 h-1.5 rounded overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all"
                            style={{ width: `${activeRenderJob.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>Elapsed: {activeRenderJob.elapsedSec?.toFixed(1)}s</span>
                          <span>Remaining: {activeRenderJob.remainingSec?.toFixed(1)}s</span>
                        </div>
                        {activeRenderJob.status === "completed" && (
                          <div className="text-green-600 font-semibold text-[10px] bg-green-50 p-1.5 rounded border border-green-200 text-center">
                            SUCCESS: Render completed. Final file baked!
                          </div>
                        )}
                        {activeRenderJob.status === "rendering" && (
                          <button
                            onClick={() => {
                              RenderEngine.getInstance().cancelRender(activeRenderJob.id);
                              setActiveRenderJob(null);
                              addLog("Render task compilation cancelled by user.");
                            }}
                            className="w-full py-1 text-center bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded border border-red-200 cursor-pointer mt-1"
                          >
                            Cancel Render
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          const codecSel = (document.getElementById("export_codec_select") as HTMLSelectElement)?.value || "h264_mp4";
                          const resSel = (document.getElementById("export_resolution_select") as HTMLSelectElement)?.value || "1920x1080";
                          const [width, height] = resSel.split("x").map(Number);

                          addLog(`Requesting compilation render job for layout compilation...`);
                          try {
                            const task = await RenderEngine.getInstance().renderComposition(
                              "Cinema Project 1",
                              selectedAsset ? selectedAsset.metadata?.durationSec || 20 : 20,
                              { width, height, fps: 24, codec: codecSel },
                              (updatedTask) => {
                                setActiveRenderJob({ ...updatedTask });
                                if (updatedTask.status === "completed") {
                                  addLog(`SUCCESS: Output baked format to folder path: ${updatedTask.outputPath}`);
                                }
                              }
                            );
                            setActiveRenderJob(task);
                          } catch (err: any) {
                            addLog(`ERROR: Baking composition task failure: ${err.message}`);
                          }
                        }}
                        className="w-full py-2 bg-text-dark text-white hover:bg-opacity-90 font-bold rounded shadow-xs transition-all cursor-pointer text-center"
                      >
                        Start Compilation Bake
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PROFESSIONAL NLE ARCHITECTURE INTEGRATIONS (PHASE 2B PART 2) */}
              <div className="border-t border-border-light pt-6 mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Layers className="w-4 h-4 text-blue-600 animate-pulse" />
                  <h3 className="text-sm font-bold text-gray-950">Next-Gen Editing Architecture & Hardware HAL</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* PANEL A: GPU ENGINE ABSTRACTION (HAL) */}
                  <div className="border border-border-light p-4 rounded-xl bg-panel/10 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-500" />
                        GPU Abstraction Layer (HAL)
                      </h4>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold uppercase font-mono">
                        {gpuCaps?.supportsWebGPU ? "WebGPU Active" : "WebGL2 Cores"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Active Renderer:</span>
                        <span className="font-mono text-gray-900 truncate max-w-[150px]" title={gpuCaps?.name}>{gpuCaps?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Co-Processor Vendor:</span>
                        <span className="text-gray-900 font-semibold">{gpuCaps?.vendor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Compute Core Engines:</span>
                        <span className="font-mono text-gray-900 font-bold">{gpuCaps?.computeUnitsCount} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-semibold">Hardware Acceleration:</span>
                        <span className="text-green-600 font-bold">Enabled (GPU Core)</span>
                      </div>

                      {/* VRAM Utilization Slider / Meter */}
                      <div className="pt-1.5 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Virtual VRAM Utilized</span>
                          <span className="font-mono font-bold text-blue-600">320 MB / 8192 MB (3.9%)</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[3.9%]" />
                        </div>
                      </div>

                      {/* Secondary adapters */}
                      <div className="pt-2 border-t border-border-light/60">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Discrete Adapters Discovered</span>
                        <div className="p-1.5 rounded bg-white border border-border-light/40 text-[10px] space-y-1">
                          <div className="flex justify-between font-bold text-gray-700">
                            <span>AMD Radeon Pro W6800X</span>
                            <span className="text-blue-600">32GB VRAM</span>
                          </div>
                          <span className="text-[9px] text-gray-400 block font-sans">Multi-GPU thread scheduler synchronized</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PANEL B: TIMELINE TRACKS, CLIPS & SNAPSHOTS */}
                  <div className="border border-border-light p-4 rounded-xl bg-panel/10 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                        NLE Multi-Track Layout
                      </h4>
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[9px] font-bold uppercase font-mono">
                        {timelineTracks.length} tracks
                      </span>
                    </div>

                    {/* Simple tracks visual rows */}
                    <div className="space-y-2">
                      {timelineTracks.map((track) => (
                        <div key={track.id} className="p-1.5 bg-white rounded border border-border-light/60 flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }} />
                            <span className="font-bold truncate text-[11px] text-gray-800">{track.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">{track.type}</span>
                            <button className="p-0.5 bg-gray-50 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 border border-border-light">
                              <Lock className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] font-mono text-gray-400">Solo</span>
                          </div>
                        </div>
                      ))}

                      {/* Snapshots / History controls */}
                      <div className="pt-2 border-t border-border-light/60 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Timeline Snapshot Version</span>
                          <span className="text-[11px] font-bold text-gray-800">Version 1.4 (Synced)</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const timeline = TimelineEngine.getInstance();
                              const success = timeline.triggerUndo();
                              if (success) {
                                setTimelineTracks(timeline.getTrackSystem().getTracks());
                                setTimelineClips(timeline.getClipEngine().getClips());
                                setTimelineMarkers(timeline.getMarkers());
                                addLog("Rollback timeline state: Triggered selective undo restore.");
                              } else {
                                addLog("LATEST snapshot reached. Nothing to undo.");
                              }
                            }}
                            className="p-1 bg-white hover:bg-gray-50 border border-border-light rounded text-gray-600 shadow-xs cursor-pointer"
                            title="Undo timeline transaction"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const timeline = TimelineEngine.getInstance();
                              const success = timeline.triggerRedo();
                              if (success) {
                                setTimelineTracks(timeline.getTrackSystem().getTracks());
                                setTimelineClips(timeline.getClipEngine().getClips());
                                setTimelineMarkers(timeline.getMarkers());
                                addLog("Fast-forward timeline state: Triggered selective redo restore.");
                              } else {
                                addLog("No newer timeline state recorded in redo stack.");
                              }
                            }}
                            className="p-1 bg-white hover:bg-gray-50 border border-border-light rounded text-gray-600 shadow-xs cursor-pointer"
                            title="Redo timeline transaction"
                          >
                            <Redo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PANEL C: MULTICAM SYNCHRONIZER */}
                  <div className="border border-border-light p-4 rounded-xl bg-panel/10 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-red-500" />
                        Multicam Synchronizer
                      </h4>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[9px] font-bold uppercase font-mono">
                        3 Angles Active
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "cam_a", label: "CAM A (ARRI)", offset: "0 frames", col: "border-blue-500 bg-blue-50/40 text-blue-700" },
                          { id: "cam_b", label: "CAM B (RED)", offset: "+12 frames", col: "border-purple-500 bg-purple-50/40 text-purple-700" },
                          { id: "cam_c", label: "CAM C (DJI)", offset: "-24 frames", col: "border-green-500 bg-green-50/40 text-green-700" },
                        ].map((cam) => {
                          const isActive = activeCamAngle === cam.id;
                          return (
                            <button
                              key={cam.id}
                              onClick={() => {
                                setActiveCamAngle(cam.id);
                                setMulticamLogs((prev) => [
                                  `Live switched monitor to: ${cam.label.toUpperCase()}`,
                                  ...prev
                                ]);
                                addLog(`Multicam switch: Monitoring camera perspective [${cam.id.toUpperCase()}]`);
                              }}
                              className={`p-1.5 border rounded text-[10px] text-center font-bold transition-all cursor-pointer ${
                                isActive ? "bg-text-dark text-white border-text-dark" : "bg-white hover:bg-gray-50 border-border-light"
                              }`}
                            >
                              <div>{cam.id.toUpperCase()}</div>
                              <div className="text-[8px] font-normal font-mono text-gray-400 mt-0.5">{cam.offset}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Multicam Console Logs */}
                      <div className="bg-white border border-border-light/60 p-2 rounded text-[10px] h-[80px] overflow-y-auto font-mono text-gray-600 space-y-1">
                        {multicamLogs.map((ml, idx) => (
                          <div key={idx} className="border-l-2 border-red-400 pl-1">{ml}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PANEL D: CACHE ENGINE & LRU TELEMETRY */}
                  <div className="border border-border-light p-4 rounded-xl bg-panel/10 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-green-500" />
                        RAM Cache Allocator
                      </h4>
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[9px] font-bold uppercase font-mono">
                        8 partitions active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {[
                        { label: "Frame Buffer", bytes: "14.2 MB", priority: "High (10)" },
                        { label: "Preview Frames", bytes: "3.1 MB", priority: "High (8)" },
                        { label: "Waveform PCM", bytes: "1.8 MB", priority: "Medium (5)" },
                        { label: "Timeline Cache", bytes: "0.4 MB", priority: "Medium (5)" },
                      ].map((partition, idx) => (
                        <div key={idx} className="p-1.5 bg-white rounded border border-border-light/40">
                          <span className="font-bold text-gray-800 block">{partition.label}</span>
                          <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                            <span>{partition.bytes}</span>
                            <span className="font-mono text-green-600 font-bold">{partition.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border-light/60 flex justify-between items-center">
                      <div className="text-[9px] text-gray-400 font-bold uppercase leading-tight">
                        LRU eviction threshold: <span className="text-gray-600">85%</span>
                      </div>
                      <button
                        onClick={() => {
                          CacheEngine.getInstance().clearAll();
                          setCacheStats(CacheEngine.getInstance().getStats());
                          addLog("CacheEngine partition purges completed. Cleaned preview & PCM vectors.");
                        }}
                        className="px-2 py-1 bg-white hover:bg-gray-50 text-gray-700 hover:text-red-700 border border-border-light rounded text-[9px] font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Purge Partitions
                      </button>
                    </div>
                  </div>

                  {/* PANEL E: TIMECODE CALCULATOR & MARKERS */}
                  <div className="border border-border-light p-4 rounded-xl bg-panel/10 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-yellow-500" />
                        SMPTE Frame Calculator
                      </h4>
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[9px] font-bold uppercase font-mono">
                        23.976 fps
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeTimecodeVal}
                          onChange={(e) => setActiveTimecodeVal(e.target.value)}
                          placeholder="00:01:02:12"
                          className="flex-1 bg-white border border-border-light p-1.5 rounded text-xs font-mono focus:outline-none text-center focus:border-gray-500"
                        />
                        <button
                          onClick={() => {
                            try {
                              const tc = new Timecode(23.976);
                              const frames = tc.timecodeToFrames(activeTimecodeVal);
                              const seconds = tc.framesToSeconds(frames);
                              addLog(`SMPTE translation SUCCESS: "${activeTimecodeVal}" equals ${frames} frames (~${seconds.toFixed(2)}s).`);
                            } catch (err: any) {
                              addLog(`SMPTE error: ${err.message}`);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-text-dark text-white hover:bg-opacity-90 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Resolve
                        </button>
                      </div>

                      {/* Display markers list */}
                      <div className="space-y-1 max-h-[85px] overflow-y-auto no-scrollbar">
                        {timelineMarkers.map((m, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-white border border-border-light/40 text-[9px] flex justify-between items-center">
                            <span className="font-bold text-gray-700 truncate max-w-[120px]">{m.name}</span>
                            <span className="font-mono text-gray-400">Frame {m.frame}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PANEL F: REPLACEABLE RENDER PIPELINE STAGES */}
                  <div className="border border-border-light p-4 rounded-xl bg-panel/10 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        Replaceable Render Pipeline
                      </h4>
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[9px] font-bold uppercase font-mono">
                        10 Stages Connected
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Stage 1-10 Pipeline flow</span>
                        <button
                          disabled={isRenderingPipeline}
                          onClick={async () => {
                            setIsRenderingPipeline(true);
                            setPipelineLogs(["Compiling 10 modular pipeline stages...", "Linking decoder hardware pipelines..."]);
                            addLog("RenderPipeline: Starting sequential 10-stage execution...");

                            try {
                              const pipeline = new RenderPipeline();
                              const context = await pipeline.executePipeline(["asset_vid1"], 120, "/export/final_cut.mp4");
                              setPipelineLogs(context.logs);
                              addLog("RenderPipeline cycle execution completed successfully!");
                            } catch (err: any) {
                              addLog(`RenderPipeline execution failed: ${err.message}`);
                            } finally {
                              setIsRenderingPipeline(false);
                            }
                          }}
                          className={`px-2 py-1 bg-white hover:bg-gray-50 border border-border-light rounded text-[9px] font-bold cursor-pointer shadow-xs text-purple-700 ${
                            isRenderingPipeline ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {isRenderingPipeline ? "Processing..." : "Run Pipeline"}
                        </button>
                      </div>

                      {/* Display active pipeline simulation logs */}
                      <div className="bg-white border border-border-light/60 p-2 rounded text-[9px] h-[80px] overflow-y-auto font-mono text-gray-500 leading-normal space-y-0.5">
                        {pipelineLogs.length === 0 ? (
                          <div className="text-gray-400 italic text-center pt-6">Click "Run Pipeline" to test the 10 render stages.</div>
                        ) : (
                          pipelineLogs.map((logLine, idx) => (
                            <div key={idx} className="truncate">{logLine}</div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHASE 2B PART 3: ADVANCED CREATIVE EDITING ENGINES SUITE */}
              <div className="border-t border-border-light pt-6 mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                  <h3 className="text-sm font-bold text-gray-950">Next-Gen Professional Creative Editing Suite</h3>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* ENGINE PANEL 1: INTERACTIVE KEYFRAME & TRANSFORM ENGINE */}
                  <div className="border border-border-light p-4 rounded-xl bg-white space-y-4 shadow-xs text-xs">
                    <div className="flex justify-between items-center border-b border-border-light pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span>Non-Destructive Keyframe & Interpolation Engine</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">KeyframeEngine.ts</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 bg-panel/30 p-3 rounded-lg">
                        <div className="font-bold text-gray-800">Add Keyframe Point</div>
                        
                        <div>
                          <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Target Property</label>
                          <select
                            value={kfProperty}
                            onChange={(e) => setKfProperty(e.target.value)}
                            className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-blue-500"
                          >
                            <option value="scale">Scale (%)</option>
                            <option value="opacity">Opacity (%)</option>
                            <option value="rotation">Rotation (deg)</option>
                            <option value="volume">Audio Volume (dB)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Timeline Frame</label>
                            <input
                              type="number"
                              min={0}
                              value={kfFrame}
                              onChange={(e) => setKfFrame(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-white border border-border-light p-1 rounded font-mono text-xs focus:outline-none focus:border-blue-500 text-center"
                            />
                          </div>
                          <div>
                            <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Value</label>
                            <input
                              type="text"
                              value={kfValue}
                              onChange={(e) => setKfValue(e.target.value)}
                              className="w-full bg-white border border-border-light p-1 rounded font-mono text-xs focus:outline-none focus:border-blue-500 text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Interpolation Curve</label>
                          <select
                            value={kfInterpolation}
                            onChange={(e) => setKfInterpolation(e.target.value as any)}
                            className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-blue-500"
                          >
                            <option value="linear">Linear Curve</option>
                            <option value="bezier">Bezier Spline (Smooth)</option>
                            <option value="ease-in">Ease-In (Slow Start)</option>
                            <option value="ease-out">Ease-Out (Deceleration)</option>
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            const valNum = parseFloat(kfValue) || 0;
                            const kf = keyframeEngineRef.current;
                            kf.addKeyframe(kfProperty, kfFrame, valNum, kfInterpolation);
                            setKfTracksState({ ...kf.getTracks() });
                            actionHistoryRef.current.pushAction({
                              id: `kf_add_${Date.now()}`,
                              engine: "KeyframeEngine",
                              description: `Added keyframe on "${kfProperty}" at frame ${kfFrame} with value ${valNum} (${kfInterpolation})`,
                              undo: () => {
                                kf.removeKeyframe(kfProperty, kfFrame);
                                setKfTracksState({ ...kf.getTracks() });
                              },
                              redo: () => {
                                kf.addKeyframe(kfProperty, kfFrame, valNum, kfInterpolation);
                                setKfTracksState({ ...kf.getTracks() });
                              }
                            });
                            setUndoCount(actionHistoryRef.current.getUndoStackSize());
                            setRedoCount(actionHistoryRef.current.getRedoStackSize());
                            addLog(`KeyframeEngine: Added non-destructive point on [${kfProperty}] frame ${kfFrame}.`);
                          }}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs cursor-pointer text-center text-[11px]"
                        >
                          Push Keyframe Point
                        </button>
                      </div>

                      <div className="flex flex-col h-full space-y-2">
                        <div className="font-bold text-gray-800">Evaluated Curves & Keyframes Track</div>
                        <div className="flex-1 bg-panel/20 border border-border-light rounded-lg p-2 overflow-y-auto max-h-[160px] font-mono text-[10px] space-y-1.5">
                          {Object.keys(kfTracksState).length === 0 ? (
                            <div className="text-gray-400 italic text-center pt-8">No active keyframe channels defined.</div>
                          ) : (
                            Object.entries(kfTracksState).map(([property, points]) => (
                              <div key={property} className="border-b border-border-light/40 pb-1.5 last:border-0 last:pb-0">
                                <div className="font-bold text-blue-700 uppercase flex justify-between">
                                  <span>{property}</span>
                                  <span className="text-gray-400 text-[9px] lowercase">
                                    eval current frame: {keyframeEngineRef.current.evaluate(property, Math.round(playheadTime * 24)).toFixed(1)}
                                  </span>
                                </div>
                                <div className="space-y-0.5 mt-1 pl-1">
                                  {(points as any[]).map((pt: any, pIdx: number) => (
                                    <div key={pIdx} className="flex justify-between text-gray-600 text-[9px]">
                                      <span>f:{pt.frame} ➜ <span className="font-bold text-gray-900">{pt.value}</span></span>
                                      <span className="text-gray-400 font-sans italic">{pt.interpolation}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2 text-[10px]">
                          <button
                            onClick={() => {
                              keyframeEngineRef.current.copyKeyframes(kfProperty);
                              addLog(`KeyframeEngine: Copied "${kfProperty}" keyframes channel to cache clipboard.`);
                            }}
                            className="flex-1 py-1 bg-white hover:bg-gray-50 border border-border-light font-semibold text-gray-700 rounded text-center cursor-pointer shadow-xs"
                          >
                            Copy Track
                          </button>
                          <button
                            onClick={() => {
                              const pasted = keyframeEngineRef.current.pasteKeyframes(kfProperty);
                              if (pasted) {
                                setKfTracksState({ ...keyframeEngineRef.current.getTracks() });
                                addLog(`KeyframeEngine: Pasted clip clipboard to active channel "${kfProperty}".`);
                              } else {
                                addLog(`KeyframeEngine Clipboard Warning: No valid track keyframes to paste.`);
                              }
                            }}
                            className="flex-1 py-1 bg-white hover:bg-gray-50 border border-border-light font-semibold text-gray-700 rounded text-center cursor-pointer shadow-xs"
                          >
                            Paste Track
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ENGINE PANEL 2: INTERACTIVE MASK ENGINE */}
                  <div className="border border-border-light p-4 rounded-xl bg-white space-y-4 shadow-xs text-xs">
                    <div className="flex justify-between items-center border-b border-border-light pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <span>Interactive Masking & Optical Track Engine</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">MaskEngine.ts</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 bg-panel/30 p-3 rounded-lg">
                        <div className="font-bold text-gray-800">Create Vector Mask</div>
                        
                        <div>
                          <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Mask Identifier</label>
                          <input
                            type="text"
                            value={maskName}
                            onChange={(e) => setMaskName(e.target.value)}
                            className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Vector Shape</label>
                            <select
                              value={maskType}
                              onChange={(e) => setMaskType(e.target.value as any)}
                              className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-purple-500"
                            >
                              <option value="rectangle">Rectangle</option>
                              <option value="ellipse">Ellipse</option>
                              <option value="polygon">Polygon (4pt)</option>
                              <option value="bezier">Bezier Spline</option>
                              <option value="free_draw">Free Draw</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Blend Operator</label>
                            <select
                              value={maskBlend}
                              onChange={(e) => setMaskBlend(e.target.value as any)}
                              className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-purple-500"
                            >
                              <option value="add">Add</option>
                              <option value="subtract">Subtract</option>
                              <option value="intersect">Intersect</option>
                              <option value="difference">Difference</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const newId = `mask_${Date.now()}`;
                            const me = maskEngineRef.current;
                            me.createMask(newId, maskName, maskType, maskBlend);
                            setMaskList(me.getMasks());
                            setSelectedMaskId(newId);
                            actionHistoryRef.current.pushAction({
                              id: `mask_add_${newId}`,
                              engine: "MaskEngine",
                              description: `Created vector mask "${maskName}" (${maskType})`,
                              undo: () => {
                                me.deleteMask(newId);
                                setMaskList(me.getMasks());
                              },
                              redo: () => {
                                me.createMask(newId, maskName, maskType, maskBlend);
                                setMaskList(me.getMasks());
                                setSelectedMaskId(newId);
                              }
                            });
                            setUndoCount(actionHistoryRef.current.getUndoStackSize());
                            setRedoCount(actionHistoryRef.current.getRedoStackSize());
                            addLog(`MaskEngine: Spawned vector mask "${maskName}" successfully.`);
                          }}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow-xs cursor-pointer text-center text-[11px]"
                        >
                          Generate Mask
                        </button>
                      </div>

                      <div className="flex flex-col h-full space-y-2">
                        <div className="font-bold text-gray-800">Active Masks Stack ({maskList.length})</div>
                        <div className="flex-1 bg-panel/20 border border-border-light rounded-lg p-2 overflow-y-auto max-h-[110px] font-mono text-[10px] space-y-1.5">
                          {maskList.map((mk) => {
                            const isSelected = mk.id === selectedMaskId;
                            return (
                              <div
                                key={mk.id}
                                onClick={() => {
                                  setSelectedMaskId(mk.id);
                                  setMaskFeather(mk.feather);
                                  setMaskExpansion(mk.expansion);
                                }}
                                className={`p-1.5 rounded border transition-all cursor-pointer flex justify-between items-center ${
                                  isSelected
                                    ? "bg-purple-50 border-purple-300 text-purple-900"
                                    : "bg-white border-border-light/60 hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="font-bold">{mk.name}</div>
                                  <div className="text-[8px] text-gray-400 font-mono">
                                    {mk.type} • feather: {mk.feather}px
                                  </div>
                                </div>
                                <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded font-bold uppercase">{mk.blendMode}</span>
                              </div>
                            );
                          })}
                        </div>

                        {selectedMaskId && (
                          <div className="bg-panel/10 p-2 rounded-lg border border-border-light/40 space-y-2">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-bold text-gray-600">Mask Parameter Controls:</span>
                              <button
                                onClick={() => {
                                  addLog(`MaskEngine: Triggering optical tracking simulation for mask "${selectedMaskId}"...`);
                                  const me = maskEngineRef.current;
                                  me.simulateOpticalTrackMask(selectedMaskId);
                                  setMaskList(me.getMasks());
                                  addLog(`MaskEngine: Optical tracking completed. Recalculated spline coordinates.`);
                                }}
                                className="text-purple-700 font-bold hover:underline cursor-pointer font-sans"
                              >
                                Simulate Optical Track
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[9px]">
                              <div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400 font-semibold">Feather</span>
                                  <span className="font-bold text-gray-950">{maskFeather}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={maskFeather}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setMaskFeather(val);
                                    const me = maskEngineRef.current;
                                    me.updateMask(selectedMaskId, { feather: val });
                                    setMaskList(me.getMasks());
                                  }}
                                  className="w-full accent-purple-600 cursor-ew-resize h-1"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400 font-semibold">Expansion</span>
                                  <span className="font-bold text-gray-950">{maskExpansion}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={-50}
                                  max={50}
                                  value={maskExpansion}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setMaskExpansion(val);
                                    const me = maskEngineRef.current;
                                    me.updateMask(selectedMaskId, { expansion: val });
                                    setMaskList(me.getMasks());
                                  }}
                                  className="w-full accent-purple-600 cursor-ew-resize h-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ENGINE PANEL 3: INTERACTIVE COLOR GRADING & HDR ENGINE */}
                  <div className="border border-border-light p-4 rounded-xl bg-white space-y-4 shadow-xs text-xs">
                    <div className="flex justify-between items-center border-b border-border-light pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                        <Sliders className="w-4 h-4 text-orange-500 animate-pulse" />
                        <span>HDR Color Grading Engine & Real-time Scopes</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">ColorEngine.ts</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 bg-panel/30 p-3 rounded-lg">
                        <div className="font-bold text-gray-800">Primary Correction Sliders</div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500 font-semibold">Exposure (stops)</span>
                              <span className="font-mono font-bold text-gray-900">{colorExposure > 0 ? `+${colorExposure}` : colorExposure}</span>
                            </div>
                            <input
                              type="range"
                              min={-4}
                              max={4}
                              step={0.1}
                              value={colorExposure}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setColorExposure(val);
                                colorEngineRef.current.setColorParameters({ exposure: val });
                              }}
                              className="w-full accent-orange-500 cursor-ew-resize h-1"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500 font-semibold">Contrast (%)</span>
                              <span className="font-mono font-bold text-gray-900">{colorContrast > 0 ? `+${colorContrast}` : colorContrast}%</span>
                            </div>
                            <input
                              type="range"
                              min={-100}
                              max={100}
                              value={colorContrast}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setColorContrast(val);
                                colorEngineRef.current.setColorParameters({ contrast: val });
                              }}
                              className="w-full accent-orange-500 cursor-ew-resize h-1"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500 font-semibold">Saturation (%)</span>
                              <span className="font-mono font-bold text-gray-900">{colorSaturation}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={200}
                              value={colorSaturation}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setColorSaturation(val);
                                colorEngineRef.current.setColorParameters({ saturation: val });
                              }}
                              className="w-full accent-orange-500 cursor-ew-resize h-1"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border-light pt-2">
                          <span className="text-[10px] font-bold text-gray-700">HDR 10-Bit Wide-Gamut Rec.2020</span>
                          <button
                            onClick={() => {
                              const newHdr = !hdrActive;
                              setHdrActive(newHdr);
                              colorEngineRef.current.toggleHDR(newHdr);
                              addLog(`ColorEngine: HDR Pipeline set to [${newHdr ? "WIDE RE.2020 10-BIT" : "SDR REC.709 8-BIT"}].`);
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                              hdrActive ? "bg-orange-600 text-white" : "bg-panel hover:bg-gray-200 text-gray-600 border border-border-light"
                            }`}
                          >
                            {hdrActive ? "HDR On" : "HDR Off"}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col h-full space-y-2 justify-between">
                        <div className="space-y-1.5">
                          <div className="font-bold text-gray-800">Simulated Scope Telemetry</div>
                          <div className="text-[10px] text-gray-500 leading-normal">
                            Generate interactive waveforms, vector scopes, and histogram luminance values directly from the web worker processing thread.
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setScopesGenerated(true);
                            const scopeData = colorEngineRef.current.getScopeSimulationData();
                            addLog(`ColorEngine: Refreshed RGB Parade & Vectorscope telemetry. Peak luma: ${scopeData.peakLuminance} Nits.`);
                          }}
                          className="w-full py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold border border-orange-200 rounded text-center text-[10px] cursor-pointer"
                        >
                          {scopesGenerated ? "Update Scope Signals" : "Launch Waveform Scopes"}
                        </button>

                        {scopesGenerated && (
                          <div className="bg-panel/20 border border-border-light p-2 rounded-lg font-mono text-[9px] space-y-1 text-gray-600">
                            <div className="flex justify-between font-bold text-gray-900 border-b border-border-light/60 pb-1">
                              <span>RGB PARADE</span>
                              <span>WAVEFORM SIGNAL</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Red Channel Peak:</span>
                              <span className="font-bold text-red-600">{colorEngineRef.current.getScopeSimulationData().redPeak}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Green Channel Peak:</span>
                              <span className="font-bold text-green-600">{colorEngineRef.current.getScopeSimulationData().greenPeak}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Blue Channel Peak:</span>
                              <span className="font-bold text-blue-600">{colorEngineRef.current.getScopeSimulationData().bluePeak}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ENGINE PANEL 4: TRANSITION & EFFECT PRESET STACKS */}
                  <div className="border border-border-light p-4 rounded-xl bg-white space-y-4 shadow-xs text-xs">
                    <div className="flex justify-between items-center border-b border-border-light pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                        <Tv className="w-4 h-4 text-emerald-500" />
                        <span>NLE Transition & Filter Effects Engine</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">EffectEngine & TransitionEngine</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Transition Engine */}
                      <div className="space-y-3 bg-panel/30 p-3 rounded-lg">
                        <div className="font-bold text-gray-800">Apply Non-Destructive Transition</div>
                        
                        <div>
                          <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Select Transition Type</label>
                          <select
                            value={selectedTransitionPreset}
                            onChange={(e) => setSelectedTransitionPreset(e.target.value)}
                            className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-emerald-500"
                          >
                            <option value="v_dissolve">Cross Dissolve (Video)</option>
                            <option value="v_dip_black">Dip to Black (Video)</option>
                            <option value="v_wipe">Linear Slide Wipe (Video)</option>
                            <option value="a_crossfade">Exponential Fade (Audio)</option>
                          </select>
                        </div>

                        <button
                          onClick={() => {
                            const te = transitionEngineRef.current;
                            te.applyTransition("clip_v1_0", selectedTransitionPreset, "start");
                            setAppliedStartTransition(selectedTransitionPreset);
                            actionHistoryRef.current.pushAction({
                              id: `trans_${Date.now()}`,
                              engine: "TransitionEngine",
                              description: `Applied transition "${selectedTransitionPreset}" to clip_v1_0`,
                              undo: () => {
                                te.removeTransition("clip_v1_0");
                                setAppliedStartTransition("");
                              },
                              redo: () => {
                                te.applyTransition("clip_v1_0", selectedTransitionPreset, "start");
                                setAppliedStartTransition(selectedTransitionPreset);
                              }
                            });
                            setUndoCount(actionHistoryRef.current.getUndoStackSize());
                            setRedoCount(actionHistoryRef.current.getRedoStackSize());
                            addLog(`TransitionEngine: Hooked transition [${selectedTransitionPreset}] into Clip A.`);
                          }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs cursor-pointer text-center text-[11px]"
                        >
                          Bind Transition
                        </button>

                        {appliedStartTransition && (
                          <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-mono text-[9px] text-center">
                            Bound: [ {appliedStartTransition} ] on Start Edge
                          </div>
                        )}
                      </div>

                      {/* Effect Engine */}
                      <div className="flex flex-col h-full space-y-2 justify-between">
                        <div>
                          <div className="font-bold text-gray-800 font-sans">Filter Effect Stack (Clip A)</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-1">
                            Applied: {clipEffectsList.length} filter plugins
                          </div>
                        </div>

                        <div className="flex-1 bg-panel/20 border border-border-light rounded-lg p-2 overflow-y-auto max-h-[100px] font-mono text-[9px] space-y-1">
                          {clipEffectsList.map((fx) => (
                            <div key={fx.id} className="p-1 rounded bg-white border border-border-light/40 flex justify-between items-center">
                              <span className="font-bold text-gray-700">{fx.name}</span>
                              <button
                                onClick={() => {
                                  const ee = effectEngineRef.current;
                                  ee.removeEffectFromClip("clip_v1_0", fx.id);
                                  setClipEffectsList(ee.getClipEffects("clip_v1_0"));
                                  addLog(`EffectEngine: Unlinked effect "${fx.name}".`);
                                }}
                                className="text-red-500 hover:text-red-700 font-semibold cursor-pointer text-[9px]"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 text-[10px]">
                          <select
                            value={selectedEffectPreset}
                            onChange={(e) => setSelectedEffectPreset(e.target.value)}
                            className="flex-1 bg-white border border-border-light p-1 rounded font-sans text-[11px] focus:outline-none"
                          >
                            <option value="fx_gaussian_blur">Gaussian Blur</option>
                            <option value="fx_chroma_key">Ultra Chroma Keyer</option>
                            <option value="fx_denoise">Audio Spectral Noise Gate</option>
                          </select>
                          <button
                            onClick={() => {
                              const ee = effectEngineRef.current;
                              ee.addEffectToClip("clip_v1_0", selectedEffectPreset);
                              setClipEffectsList(ee.getClipEffects("clip_v1_0"));
                              addLog(`EffectEngine: Appended active filter ${selectedEffectPreset} onto stack.`);
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded text-center cursor-pointer"
                          >
                            Add FX
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ENGINE PANEL 5: COMPOSITING & MOTION PARENTING */}
                  <div className="border border-border-light p-4 rounded-xl bg-white space-y-4 shadow-xs text-xs">
                    <div className="flex justify-between items-center border-b border-border-light pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                        <Move className="w-4 h-4 text-cyan-500" />
                        <span>Compositing Blendmodes & Motion Parenting Engine</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">CompositingEngine & MotionEngine</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 bg-panel/30 p-3 rounded-lg">
                        <div className="font-bold text-gray-800 font-sans">Layer Compositing Settings</div>
                        
                        <div>
                          <label className="text-gray-500 block mb-0.5 text-[10px] font-semibold">Track Blend Mode</label>
                          <select
                            value={blendModeSel}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setBlendModeSel(val);
                              compositingEngineRef.current.setCompositionParams({ defaultBlendMode: val });
                              addLog(`CompositingEngine: Core layer blend operator updated to [${val.toUpperCase()}].`);
                            }}
                            className="w-full bg-white border border-border-light p-1.5 rounded font-sans text-xs focus:outline-none focus:border-cyan-500"
                          >
                            <option value="normal">Normal Blend</option>
                            <option value="multiply">Multiply (Shadows)</option>
                            <option value="screen">Screen (Highlights/Glow)</option>
                            <option value="overlay">Overlay (Contrast)</option>
                          </select>
                        </div>

                        <div className="p-2 bg-white border border-border-light rounded font-mono text-[9px] text-gray-500 leading-normal">
                          Active render order: <span className="font-bold text-gray-800">Bottom Track ➜ Top Track ➜ Adjustment Layer</span>
                        </div>
                      </div>

                      <div className="flex flex-col h-full space-y-2 justify-between">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-800 font-sans">Motion Transform Parenting</div>
                          <div className="text-[10px] text-gray-500 leading-normal">
                            Define transform hierarchies. When parenting is set, the child asset's transform calculations automatically cascade.
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-400 block font-semibold">Child Object ID</span>
                            <span className="font-bold text-gray-800">clip_v1_0</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-semibold">Parent Anchor</span>
                            <select
                              value={parentingParentId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParentingParentId(val);
                                const me = motionEngineRef.current;
                                me.setParent("clip_v1_0", val || null);
                                const absPos = me.getAbsolutePosition2D("clip_v1_0");
                                setAbsolutePositionOutput(absPos);
                                addLog(`MotionEngine: Set parent of [clip_v1_0] to [${val || "Null (None)"}].`);
                              }}
                              className="w-full bg-white border border-border-light p-1 rounded font-sans text-[10px] focus:outline-none"
                            >
                              <option value="">None (Root)</option>
                              <option value="cam_null">Null Anchor A (x:100, y:150)</option>
                              <option value="vfx_tracker_0">Tracker Node 1 (x:450, y:200)</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-panel/20 border border-border-light p-1.5 rounded text-center font-mono text-[9px] text-gray-600">
                          Resolved Absolute Position: <span className="font-bold text-cyan-700">X: {absolutePositionOutput.x}px, Y: {absolutePositionOutput.y}px</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ENGINE PANEL 6: ASSET RELINKING & SYSTEM PRESETS */}
                  <div className="border border-border-light p-4 rounded-xl bg-white space-y-4 shadow-xs text-xs">
                    <div className="flex justify-between items-center border-b border-border-light pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-900">
                        <Link className="w-4 h-4 text-pink-500" />
                        <span>Media Linker & Preset Serialization</span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">MediaLinkEngine & PresetEngine</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Media Linker */}
                      <div className="space-y-3 bg-panel/30 p-3 rounded-lg">
                        <div className="font-bold text-gray-800">Relink Engine Asset References</div>
                        
                        <div className="space-y-1">
                          {mediaAssetsList.map((asset) => (
                            <div key={asset.id} className="p-1 rounded bg-white border border-border-light/40 flex justify-between items-center text-[9px]">
                              <span className="truncate max-w-[100px] font-bold text-gray-700" title={asset.fileName}>{asset.fileName}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono ${
                                asset.isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800 animate-pulse"
                              }`}>
                                {asset.isOnline ? "Online" : "Offline"}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const mle = mediaLinkEngineRef.current;
                              mle.setOffline("asset_ref_0");
                              setMediaAssetsList(mle.getAssetReferences());
                              addLog(`MediaLinkEngine: Simulating hardware offline warning on "asset_ref_0".`);
                            }}
                            className="flex-1 py-1 bg-white hover:bg-gray-50 border border-border-light font-semibold text-gray-700 rounded text-center cursor-pointer shadow-xs text-[10px]"
                          >
                            Force Offline
                          </button>
                          <button
                            onClick={() => {
                              const mle = mediaLinkEngineRef.current;
                              mle.relinkMedia("asset_ref_0", "/volumes/nas2/A001_C002_0705_v2.mp4");
                              setMediaAssetsList(mle.getAssetReferences());
                              addLog(`MediaLinkEngine: Successfully relinked "asset_ref_0" to NAS storage.`);
                            }}
                            className="flex-1 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold border border-pink-200 rounded text-center cursor-pointer text-[10px]"
                          >
                            Relink File
                          </button>
                        </div>
                      </div>

                      {/* Preset Engine */}
                      <div className="flex flex-col h-full space-y-2 justify-between">
                        <div>
                          <div className="font-bold text-gray-800 font-sans">System & User Presets Library</div>
                          <div className="text-[10px] text-gray-500 leading-normal mt-1 font-sans">
                            Save, load, import, and export reusable editing setups and keyframe animations.
                          </div>
                        </div>

                        <div className="flex-1 bg-panel/20 border border-border-light rounded-lg p-2 overflow-y-auto max-h-[80px] font-mono text-[9px] space-y-1">
                          {presetsList.map((pr) => (
                            <div key={pr.id} className="flex justify-between items-center text-gray-700">
                              <span>{pr.name}</span>
                              <span className="text-[8px] px-1 py-0.5 bg-gray-100 rounded text-gray-400 font-sans uppercase font-bold">{pr.category}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const pe = presetEngineRef.current;
                              const exported = pe.exportPresets();
                              setPresetsImportJson(exported);
                              addLog(`PresetEngine: Exported all system and user presets to memory stack.`);
                            }}
                            className="flex-1 py-1 bg-white hover:bg-gray-50 border border-border-light font-semibold text-gray-700 rounded text-center cursor-pointer shadow-xs text-[10px]"
                          >
                            Export Presets
                          </button>
                          <button
                            onClick={() => {
                              if (!presetsImportJson) {
                                addLog("PresetEngine Warning: No exported data to import. Click Export Presets first.");
                                return;
                              }
                              const pe = presetEngineRef.current;
                              const ok = pe.importPresets(presetsImportJson);
                              if (ok) {
                                setPresetsList(pe.getPresets());
                                addLog("PresetEngine: Successfully imported serialized library array!");
                              }
                            }}
                            className="flex-1 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold border border-pink-200 rounded text-center cursor-pointer text-[10px]"
                          >
                            Import Presets
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* THE UNIFIED ACTION HISTORY LOG & TRANSACTION CONTROLS */}
                <div className="border border-border-light p-4 rounded-xl bg-panel/20 mt-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-border-light/60 pb-2">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-purple-600" />
                      Unified Action History Transaction Manager
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-500 font-bold">
                        Undo stack: <span className="font-mono text-gray-900">{undoCount}</span> | Redo stack: <span className="font-mono text-gray-900">{redoCount}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-500 leading-normal">
                        Every single editing operation across any of the professional domain engines is fully transactional. Click Undo/Redo below to roll back the state non-destructively.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const action = actionHistoryRef.current.undo();
                          if (action) {
                            setUndoCount(actionHistoryRef.current.getUndoStackSize());
                            setRedoCount(actionHistoryRef.current.getRedoStackSize());
                            addLog(`ActionHistory UNDO: Rolled back [${action.description}].`);
                          } else {
                            addLog(`ActionHistory Warning: Undo stack is completely empty.`);
                          }
                        }}
                        className="px-3 py-1 bg-white hover:bg-gray-50 border border-border-light text-gray-700 font-bold rounded text-xs cursor-pointer shadow-xs"
                      >
                        Undo Operation
                      </button>
                      <button
                        onClick={() => {
                          const action = actionHistoryRef.current.redo();
                          if (action) {
                            setUndoCount(actionHistoryRef.current.getUndoStackSize());
                            setRedoCount(actionHistoryRef.current.getRedoStackSize());
                            addLog(`ActionHistory REDO: Re-applied [${action.description}].`);
                          } else {
                            addLog(`ActionHistory Warning: Redo stack is completely empty.`);
                          }
                        }}
                        className="px-3 py-1 bg-white hover:bg-gray-50 border border-border-light text-gray-700 font-bold rounded text-xs cursor-pointer shadow-xs"
                      >
                        Redo Operation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "docs" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 mb-1">Dynamic Developer Manual & SDK documentation</h3>
                  <p className="text-xs text-gray-500">Auto-generated dynamic catalog documentation of every module, plugin, service, and command in active memory.</p>
                </div>
                <button
                  onClick={handleCopyMarkdownManual}
                  id="btn_copy_sdk_docs"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-text-dark text-white hover:bg-opacity-90 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy Markdown"}</span>
                </button>
              </div>

              {/* Live preview markdown manual container */}
              <div className="bg-panel/30 border border-border-light p-5 rounded-xl h-[420px] overflow-y-auto font-mono text-xs select-text whitespace-pre-wrap leading-relaxed shadow-inner">
                {platform.documentationSystem.exportMarkdownManual()}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
