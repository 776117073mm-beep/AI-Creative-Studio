import { useState } from "react";
import { 
  Grid, 
  Maximize2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  SlidersHorizontal, 
  MonitorPlay, 
  Download, 
  Plus,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { PageId } from "../types";

interface WorkspaceProps {
  onNavigate: (page: PageId) => void;
  projectName: string;
}

export default function Workspace({ onNavigate, projectName }: WorkspaceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLayout, setActiveLayout] = useState<"standard" | "color" | "audio">("standard");
  const [zoomLevel, setZoomLevel] = useState(50);
  const [currentTime, setCurrentTime] = useState("00:01:23:12");
  const [isDucked, setIsDucked] = useState(false);

  return (
    <div className="flex flex-col h-full bg-primary-bg p-4 space-y-4 text-left animate-in fade-in-50 duration-200">
      {/* Upper command rail */}
      <div className="flex justify-between items-center bg-panel px-4 py-2 rounded-xl border border-border-light shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE LAYOUT</span>
          <div className="h-4 border-l border-border-light"></div>
          <span className="text-xs font-bold text-text-dark">{projectName || "Active Project Workspace"}</span>
        </div>

        {/* Layout presets switches */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold">
          {[
            { id: "standard", label: "Default Edit" },
            { id: "color", label: "Color Grading" },
            { id: "audio", label: "Audio Mixer" }
          ].map((lay) => (
            <button
              key={lay.id}
              onClick={() => setActiveLayout(lay.id as any)}
              className={`px-3 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                activeLayout === lay.id 
                  ? "bg-btn-bg text-text-dark border-border-light shadow-xs font-bold" 
                  : "bg-transparent border-transparent text-gray-500 hover:text-text-dark"
              }`}
            >
              {lay.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main interactive grid editor zone */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden min-h-0">
        {/* Left Bins & Source Track Controls */}
        <div className="lg:col-span-1 bg-panel border border-border-light rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
            <div className="flex justify-between items-center border-b border-border-light pb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Assets Bin</span>
              <button 
                onClick={() => onNavigate("media")}
                className="text-[10px] text-gray-500 hover:underline flex items-center space-x-0.5"
              >
                <FolderOpen className="w-3 h-3" />
                <span>Open Library</span>
              </button>
            </div>

            {/* List mockup */}
            <div className="space-y-2">
              {[
                { name: "Nebula_Drone_4K.mp4", type: "video", time: "00:30" },
                { name: "Symphony_Soundtrack.wav", type: "audio", time: "03:45" },
                { name: "Title_Overlay_Text", type: "template", time: "Dynamic" }
              ].map((item, idx) => (
                <div key={idx} className="p-2 bg-card hover:bg-btn-bg border border-border-light rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors">
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="truncate text-text-dark font-medium">{item.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border-light/60 pt-3 mt-3">
            <button 
              onClick={() => onNavigate("media")}
              className="w-full py-1.5 bg-btn-bg hover:bg-panel border border-border-light rounded-lg text-xs font-semibold text-gray-700 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Raw Clips</span>
            </button>
          </div>
        </div>

        {/* Center Canvas Monitor View (Interactive player!) */}
        <div className="lg:col-span-2 bg-text-dark rounded-2xl flex flex-col justify-between overflow-hidden border border-gray-800 relative group shadow-inner">
          {/* Aspect mask background mockup */}
          <div className="flex-1 flex items-center justify-center relative bg-black/90 p-8">
            {/* The viewport card */}
            <div className="aspect-video w-full max-w-lg bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative shadow-2xl flex items-center justify-center">
              {/* Dynamic graphic visualization for video loop simulation */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/20 to-black animate-pulse"></div>
              
              <div className="text-center z-10 space-y-2 p-4">
                <span className="text-[10px] font-mono font-bold text-gray-500 tracking-wider block uppercase">Video Feed Monitor</span>
                <span className="text-white text-xs font-medium block">
                  {isPlaying ? "Rendering Live Output Preview..." : "Playback Paused"}
                </span>
                <div className="h-1 w-24 bg-gray-700 rounded-full mx-auto overflow-hidden">
                  {isPlaying && (
                    <div className="h-full bg-purple-500 w-1/2 animate-[pulse_1.5s_infinite]"></div>
                  )}
                </div>
              </div>

              {/* Viewport HUD overlays */}
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 text-[9px] font-mono text-gray-400 rounded">
                4K Cinema Scale
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 text-[9px] font-mono text-gray-400 rounded">
                23.976 FPS
              </div>
            </div>
          </div>

          {/* Player controls */}
          <div className="bg-black/80 backdrop-blur-md border-t border-gray-800 p-3 flex flex-col space-y-2 shrink-0 select-none z-10">
            {/* Playhead scrub slider */}
            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
              <span>00:00:00:00</span>
              <div className="flex-1 h-1 bg-gray-800 rounded-full relative cursor-pointer group">
                <div className="absolute left-0 top-0 bottom-0 bg-gray-500 w-1/3 rounded-full"></div>
                <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-gray-600 shadow-md"></div>
              </div>
              <span className="text-white font-semibold">{currentTime}</span>
            </div>

            <div className="flex justify-between items-center text-gray-400">
              <div className="flex items-center space-x-3">
                <button className="hover:text-white cursor-pointer"><SkipBack className="w-4 h-4" /></button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 bg-white text-black rounded-full hover:scale-105 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                </button>
                <button className="hover:text-white cursor-pointer"><SkipForward className="w-4 h-4" /></button>
              </div>

              {/* Center zoom select */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-gray-500">ZOOM:</span>
                <span className="text-[10px] text-white font-mono">{zoomLevel}%</span>
              </div>

              <div className="flex items-center space-x-3 text-gray-400">
                <Volume2 className="w-4 h-4" />
                <Maximize2 className="w-4 h-4 cursor-pointer hover:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Dock: Inspector Parameters (Redirect helper) */}
        <div className="lg:col-span-1 bg-panel border border-border-light rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <div className="border-b border-border-light pb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Workspace Dock</span>
              <h3 className="text-xs font-bold text-text-dark mt-0.5">Modular Plugins Rail</h3>
            </div>

            <p className="text-[11px] text-gray-500 leading-normal">
              This layout workspace supports dockable HTML panels. Switch to dedicated studios to modify color LUT wheels, keyframe vectors, voice compressors, or VFX compositing.
            </p>

            <div className="space-y-2 mt-2">
              {[
                { name: "Color Studio Wheels", page: "color-studio" },
                { name: "VFX Particle Setup", page: "vfx" },
                { name: "Subtitle Translation", page: "subtitle-studio" }
              ].map((dock, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(dock.page as PageId)}
                  className="w-full p-2 bg-card border border-border-light hover:border-gray-400 text-left rounded-xl text-xs font-semibold text-text-dark flex items-center justify-between cursor-pointer group"
                >
                  <span>{dock.name}</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500 group-hover:text-text-dark" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-card border border-border-light rounded-xl space-y-1">
            <span className="text-[9px] font-bold text-purple-600 font-mono uppercase tracking-wide block">ACTIVE WORKFLOW CAPABILITIES</span>
            <span className="text-[10px] text-gray-500 block leading-normal">AI Copilot remembers and standardizes formatting presets on double-click.</span>
          </div>
        </div>
      </div>

      {/* Docked timeline mock bar */}
      <div 
        onClick={() => onNavigate("timeline")}
        className="h-28 bg-panel hover:bg-card border border-border-light hover:border-gray-400 p-4 rounded-2xl flex items-center justify-center cursor-pointer transition-all shrink-0"
      >
        <div className="text-center space-y-1">
          <SlidersHorizontal className="w-5 h-5 text-gray-500 mx-auto" />
          <span className="text-xs font-bold text-text-dark block">Open Multi-Track Timeline Editor</span>
          <span className="text-[10px] text-gray-400 block">Manage complex audio clips, adjustment layers, text subtitles, and camera cutting markers.</span>
        </div>
      </div>
    </div>
  );
}
