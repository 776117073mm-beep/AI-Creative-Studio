import { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  SlidersHorizontal, 
  Plus, 
  Scissors, 
  Magnet, 
  ZoomIn, 
  Eye, 
  Volume2, 
  VolumeX, 
  EyeOff, 
  Pin,
  Maximize2
} from "lucide-react";
import { PageId } from "../types";

interface TimelineProps {
  onNavigate: (page: PageId) => void;
  projectName: string;
}

export default function Timeline({ onNavigate, projectName }: TimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSnapping, setIsSnapping] = useState(true);
  const [zoom, setZoom] = useState(40);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [playheadPos, setPlayheadPos] = useState(30); // percentage

  // Layer toggles
  const [v1Visible, setV1Visible] = useState(true);
  const [v2Visible, setV2Visible] = useState(true);
  const [a1Muted, setA1Muted] = useState(false);
  const [a2Muted, setA2Muted] = useState(false);

  // Timeline track content configuration
  const videoTracks = [
    { id: "v2", label: "Video 2 (Overlay)", visible: v2Visible, setVisible: setV2Visible, color: "bg-blue-100 hover:bg-blue-200 border-blue-300", items: [
      { id: "vb-ov1", label: "Lower_Third_Subtitle.png", start: 10, length: 25 },
      { id: "vb-ov2", label: "SciFi_Explosion_VFX.mp4", start: 50, length: 18 }
    ]},
    { id: "v1", label: "Video 1 (Primary)", visible: v1Visible, setVisible: setV1Visible, color: "bg-blue-50 hover:bg-blue-100 border-blue-200", items: [
      { id: "vb-pr1", label: "Nebula_Drone_Scenery.mp4", start: 0, length: 45 },
      { id: "vb-pr2", label: "A001_C012_Portraits.mp4", start: 45, length: 35 },
      { id: "vb-pr3", label: "City_Scenery_Pan.mp4", start: 80, length: 20 }
    ]}
  ];

  const audioTracks = [
    { id: "a1", label: "Audio 1 (Dialogue)", muted: a1Muted, setMuted: setA1Muted, color: "bg-purple-50 hover:bg-purple-100 border-purple-200", items: [
      { id: "ab-di1", label: "Vocal_Dialogue_Isolate.wav", start: 2, length: 40 },
      { id: "ab-di2", label: "Interview_Vocal_Track.wav", start: 45, length: 35 }
    ]},
    { id: "a2", label: "Audio 2 (Ambient BGM)", muted: a2Muted, setMuted: setA2Muted, color: "bg-purple-100 hover:bg-purple-200 border-purple-300", items: [
      { id: "ab-bg1", label: "Ambient_Space_Music.wav", start: 0, length: 100 }
    ]}
  ];

  // Calculated width multiplier based on zoom level
  const timelineWidthStyle = { width: `${100 + zoom * 2}%` };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header controls rail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE SEQUENCER</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Multi-Track Timeline Sequence</h1>
        </div>

        {/* Wizard and layout quick redirection */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate("workspace")}
            className="px-3.5 py-1.5 bg-btn-bg border border-border-light rounded-xl text-xs font-semibold hover:border-gray-400 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
            <span>Open Studio Canvas</span>
          </button>
        </div>
      </div>

      {/* Sequencer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel p-3 rounded-xl border border-border-light shrink-0">
        <div className="flex items-center space-x-3 text-gray-600">
          <button className="hover:text-text-dark cursor-pointer"><SkipBack className="w-4 h-4" /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-text-dark text-white rounded-full hover:scale-105 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>
          <button className="hover:text-text-dark cursor-pointer"><SkipForward className="w-4 h-4" /></button>
          
          <div className="h-4 border-l border-border-light"></div>
          <span className="font-mono text-xs font-bold text-text-dark">00:01:23:12</span>
        </div>

        {/* Track features triggers */}
        <div className="flex items-center space-x-4">
          {/* Snapping toggle */}
          <button
            onClick={() => setIsSnapping(!isSnapping)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
              isSnapping 
                ? "bg-btn-bg text-text-dark border-border-light shadow-xs" 
                : "bg-transparent border-transparent text-gray-400 hover:text-text-dark"
            }`}
            title="Toggle Magnet Snapping"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snapping</span>
          </button>

          {/* Cuts Tool */}
          <button className="px-2.5 py-1 rounded-lg border border-transparent hover:border-border-light text-xs font-semibold text-gray-500 hover:text-text-dark flex items-center space-x-1 cursor-pointer">
            <Scissors className="w-3.5 h-3.5" />
            <span>Slice Cut</span>
          </button>

          {/* Zoom Level */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <ZoomIn className="w-3.5 h-3.5" />
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="accent-text-dark h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer w-20 sm:w-32"
            />
            <span className="font-mono">{zoom}%</span>
          </div>
        </div>
      </div>

      {/* Professional Multi-track viewports */}
      <div className="flex-1 overflow-y-auto no-scrollbar border border-border-light/60 bg-panel/25 rounded-2xl flex flex-col min-h-0">
        
        {/* Timeline Horizontal Ruler Headers (Time indicators) */}
        <div className="bg-panel border-b border-border-light h-7 flex shrink-0 relative overflow-hidden">
          {/* Track spacer */}
          <div className="w-40 border-r border-border-light shrink-0 bg-panel/80 z-10 flex items-center px-3">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tracks Inspector</span>
          </div>
          
          {/* Sliding Ruler markers */}
          <div className="flex-1 overflow-x-auto no-scrollbar relative min-w-0" style={timelineWidthStyle}>
            {/* The ruler seconds notches */}
            <div className="absolute inset-0 flex select-none text-[9px] font-mono text-gray-400">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((sec) => (
                <div 
                  key={sec} 
                  className="absolute border-l border-gray-300 h-full pt-1 pl-1"
                  style={{ left: `${sec}%` }}
                >
                  00:00:{sec < 10 ? `0${sec}` : sec}:00
                </div>
              ))}
            </div>

            {/* Playhead interactive vertical red line indicator */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize"
              style={{ left: `${playheadPos}%` }}
              title="Drag playhead to scrub frame"
            >
              <div className="absolute -top-1 -left-1.5 w-3.5 h-3 bg-red-500 rounded flex items-center justify-center text-white text-[7px] font-bold font-mono">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Sequencer Track Rows Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 flex flex-col divide-y divide-border-light/40">
          
          {/* Subtitles track mockup */}
          <div className="h-10 bg-panel/30 flex items-center shrink-0 relative overflow-hidden">
            <div className="w-40 border-r border-border-light shrink-0 h-full bg-panel/90 z-10 flex items-center justify-between px-3 text-[10px] font-semibold text-gray-500">
              <span>Subtitles Layer</span>
              <span className="px-1 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-bold rounded-md uppercase">AI</span>
            </div>
            <div className="flex-1 relative h-full" style={timelineWidthStyle}>
              {/* Text Blocks */}
              <div className="absolute inset-y-1 left-[15%] w-[20%] bg-purple-50/70 border border-purple-200 rounded-lg flex items-center px-2.5 text-[10px] text-purple-800 font-medium truncate">
                "Hello world! This is Nebula..."
              </div>
              <div className="absolute inset-y-1 left-[45%] w-[35%] bg-purple-50/70 border border-purple-200 rounded-lg flex items-center px-2.5 text-[10px] text-purple-800 font-medium truncate">
                "...launching universal generative studio."
              </div>
            </div>
          </div>

          {/* Render Video Tracks */}
          {videoTracks.map((track) => (
            <div key={track.id} className="h-14 flex items-center shrink-0 relative overflow-hidden">
              {/* Header block with mute, lock toggles */}
              <div className="w-40 border-r border-border-light shrink-0 h-full bg-panel/90 z-10 flex items-center justify-between px-3 text-[10px] text-text-dark font-bold">
                <span className="truncate">{track.label}</span>
                <button 
                  onClick={() => track.setVisible(!track.visible)}
                  className="p-1 hover:bg-btn-bg rounded text-gray-500 hover:text-text-dark cursor-pointer"
                >
                  {track.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>

              {/* Slider grid blocks */}
              <div className={`flex-1 relative h-full bg-panel/10 ${!track.visible ? "opacity-30" : ""}`} style={timelineWidthStyle}>
                {track.items.map((item) => {
                  const isSelected = selectedBlock === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBlock(item.id)}
                      style={{ left: `${item.start}%`, width: `${item.length}%` }}
                      className={`absolute inset-y-2 border rounded-xl flex items-center px-3 text-xs text-text-dark font-semibold justify-between truncate cursor-pointer transition-all ${track.color} ${
                        isSelected ? "ring-2 ring-text-dark ring-offset-1 border-transparent shadow-md scale-[1.01]" : ""
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Render Audio Tracks */}
          {audioTracks.map((track) => (
            <div key={track.id} className="h-14 flex items-center shrink-0 relative overflow-hidden">
              <div className="w-40 border-r border-border-light shrink-0 h-full bg-panel/90 z-10 flex items-center justify-between px-3 text-[10px] text-text-dark font-bold">
                <span className="truncate">{track.label}</span>
                <button 
                  onClick={() => track.setMuted(!track.muted)}
                  className="p-1 hover:bg-btn-bg rounded text-gray-500 hover:text-text-dark cursor-pointer"
                >
                  {track.muted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className={`flex-1 relative h-full bg-panel/10 ${track.muted ? "opacity-30" : ""}`} style={timelineWidthStyle}>
                {track.items.map((item) => {
                  const isSelected = selectedBlock === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBlock(item.id)}
                      style={{ left: `${item.start}%`, width: `${item.length}%` }}
                      className={`absolute inset-y-2 border rounded-xl flex items-center px-3 text-xs text-text-dark font-semibold justify-between truncate cursor-pointer transition-all ${track.color} ${
                        isSelected ? "ring-2 ring-text-dark ring-offset-1 border-transparent shadow-md scale-[1.01]" : ""
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Context help tooltip */}
      <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-left text-xs text-purple-800">
        <span className="font-bold flex items-center space-x-1.5 font-sans">
          <Pin className="w-3.5 h-3.5" />
          <span>Active timeline track selected: {selectedBlock ? `"${selectedBlock}"` : "None"}</span>
        </span>
        {selectedBlock && (
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
            Modify this block's transforms, keyframes, or opacity coordinates in the Right Context Inspector Panel.
          </p>
        )}
      </div>
    </div>
  );
}
