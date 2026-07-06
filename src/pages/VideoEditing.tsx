import { useState } from "react";
import { 
  Scissors, 
  Crop, 
  RotateCw, 
  Gauge, 
  ChevronRight, 
  Play, 
  Sparkles, 
  Layers,
  ArrowRight
} from "lucide-react";
import { PageId } from "../types";

interface VideoEditingProps {
  onNavigate: (page: PageId) => void;
}

export default function VideoEditing({ onNavigate }: VideoEditingProps) {
  const [trimStart, setTrimStart] = useState(15); // percentage
  const [trimEnd, setTrimEnd] = useState(85); // percentage
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [isReversed, setIsReversed] = useState(false);

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="border-b border-border-light pb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">STUDIO CORE MODULE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Video Cutting Studio</h1>
        </div>
        
        <button
          onClick={() => onNavigate("workspace")}
          className="px-3.5 py-1.5 bg-btn-bg border border-border-light text-text-dark text-xs font-semibold rounded-xl hover:border-gray-400 transition-all cursor-pointer"
        >
          Open Studio Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        {/* Playback Preview monitor */}
        <div className="lg:col-span-2 bg-text-dark rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-inner border border-gray-800">
          <div className="flex-1 flex items-center justify-center p-8 bg-black/90">
            <div className="aspect-video w-full max-w-md bg-gray-950 rounded-xl overflow-hidden relative border border-gray-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-radial-gradient from-indigo-900/20 via-black to-black"></div>
              
              <div className="text-center z-10 space-y-2 p-4">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Active Workspace Viewport</span>
                <span className="text-white text-xs block">Drone_Nebula_Clips.mp4</span>
                <div className="h-1.5 w-32 bg-gray-700 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ marginLeft: `${trimStart}%`, width: `${trimEnd - trimStart}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Slices scrubbing controls */}
          <div className="bg-black/85 p-4 border-t border-gray-800 space-y-3 shrink-0">
            {/* Trim handles selector */}
            <div className="space-y-1.5 text-xs text-gray-400 font-mono">
              <div className="flex justify-between text-[11px]">
                <span>Trim Start: {trimStart}%</span>
                <span>Trim End: {trimEnd}%</span>
              </div>
              
              {/* Dual sliders container */}
              <div className="relative h-6 flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={trimStart}
                  onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 5))}
                  className="absolute w-full accent-blue-500 h-1 bg-gray-800 rounded-lg cursor-pointer"
                />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 5))}
                  className="absolute w-full accent-blue-600 h-1 bg-transparent rounded-lg cursor-pointer pointer-events-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Video Parameters Inspector */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          {/* Speed tools */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>Playback Rate & Speed</span>
            </span>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Speed multiplier</span>
                <span className="text-text-dark font-bold">{speedMultiplier}x</span>
              </div>
              <input 
                type="range" 
                min="0.25" 
                max="8.0" 
                step="0.25"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg cursor-pointer"
              />

              {/* Reverse playback switch */}
              <button
                onClick={() => setIsReversed(!isReversed)}
                className={`w-full py-2 border rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  isReversed 
                    ? "bg-text-dark text-white border-transparent" 
                    : "bg-btn-bg border-border-light text-text-dark hover:border-gray-400"
                }`}
              >
                {isReversed ? "Reverse Mode Active" : "Play in Standard Chronology"}
              </button>
            </div>
          </div>

          {/* Crop & Transform tools */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Crop className="w-3.5 h-3.5" />
              <span>Canvas Transformations</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Rotation buttons */}
              <button 
                onClick={() => setRotateAngle((rotateAngle + 90) % 360)}
                className="p-2 bg-btn-bg border border-border-light hover:border-gray-400 rounded-xl text-xs font-semibold flex flex-col items-center space-y-1.5 cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-gray-600" />
                <span>Rotate {rotateAngle}°</span>
              </button>

              <button 
                onClick={() => alert("Crop aspect box mapped on primary monitor.")}
                className="p-2 bg-btn-bg border border-border-light hover:border-gray-400 rounded-xl text-xs font-semibold flex flex-col items-center space-y-1.5 cursor-pointer"
              >
                <Crop className="w-4 h-4 text-gray-600" />
                <span>Aspect Crop</span>
              </button>
            </div>
          </div>

          {/* AI Cut Detection preview */}
          <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl text-left space-y-2">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart AI Scene Cutter</span>
            </span>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Analyzes raw footage and automatically places timeline markers on dramatic scene pans or visual flashes.
            </p>
            <button 
              onClick={() => alert("AI analyzed 45s of footage. Placed 3 cut points.")}
              className="flex items-center space-x-1 text-[10px] font-mono font-bold text-purple-700 hover:underline cursor-pointer"
            >
              <span>Initialize Scene Splitting</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
