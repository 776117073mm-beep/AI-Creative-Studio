import { useState } from "react";
import { 
  Sliders, 
  Sparkles, 
  History, 
  Info, 
  Play, 
  FileText, 
  Layers, 
  Database,
  ArrowRight
} from "lucide-react";
import { PageId } from "../../types";

interface RightPanelProps {
  activePage: PageId;
  projectName: string;
}

type TabId = "properties" | "ai-suggestions" | "quick-actions" | "metadata";

export default function RightPanel({ activePage, projectName }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("properties");
  
  // Transform & Slider values
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [scale, setScale] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [blendMode, setBlendMode] = useState("Normal");

  // Get current contextual suggestions based on the activePage
  const getContextualSuggestions = () => {
    switch (activePage) {
      case "color-studio":
        return [
          { title: "Warm Film Grade", desc: "Apply a 1970s Kodak warm hue to highlights." },
          { title: "Cool Shadows", desc: "Push shadows toward teal for a modern cinematic look." },
          { title: "Auto-Balance Exposure", desc: "Let AI adjust light curve peaks and midtones." }
        ];
      case "audio-editing":
        return [
          { title: "Voice De-Esser", desc: "Smooth out harsh sibilants (s-sounds) in vocal track." },
          { title: "Studio Reverb Injection", desc: "Simulate a premium wood-paneled recording room." },
          { title: "BGM Auto-Ducking", desc: "Automatically lower music tracks during speaking intervals." }
        ];
      case "subtitle-studio":
        return [
          { title: "Dynamic Text Animations", desc: "Apply trendy karaoke-style word-by-word highlights." },
          { title: "Profanity Filter Auto-Censor", desc: "Identify and automatically censor background curses." }
        ];
      default:
        return [
          { title: "Auto Scene Cut Detection", desc: "AI will slice raw videos into clean logical chapters." },
          { title: "Optimized HDR Upscale", desc: "Convert standard dynamic range (SDR) clips into Rec.2020." },
          { title: "Smart Aspect Re-framing", desc: "Keep subjects centered while outputting vertical content." }
        ];
    }
  };

  const suggestions = getContextualSuggestions();

  return (
    <aside className="w-80 bg-panel border-l border-border-light flex flex-col shrink-0 select-none h-full z-20">
      {/* Tabs list */}
      <div className="flex border-b border-border-light bg-panel shrink-0 p-1">
        {[
          { id: "properties", label: "Properties", icon: Sliders },
          { id: "ai-suggestions", label: "Smart AI", icon: Sparkles },
          { id: "quick-actions", label: "Actions", icon: Play },
          { id: "metadata", label: "Metadata", icon: Info }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              title={tab.label}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-md text-[10px] font-medium tracking-tight transition-all cursor-pointer ${
                isSelected 
                  ? "bg-btn-bg text-text-dark border border-border-light shadow-xs" 
                  : "text-gray-500 hover:text-text-dark hover:bg-btn-bg/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab body content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {activeTab === "properties" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Header context */}
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Context inspector</span>
              <h3 className="text-xs font-semibold text-text-dark mt-0.5 capitalize">{activePage.replace("-", " ")} Node</h3>
            </div>

            {/* Transform Controls */}
            <div className="p-3 bg-card border border-border-light rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wide">Transform (2D Space)</span>
              
              {/* Position sliders */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Position X</span>
                  <span className="font-mono text-gray-700">{positionX}px</span>
                </div>
                <input 
                  type="range" 
                  min="-500" 
                  max="500" 
                  value={positionX}
                  onChange={(e) => setPositionX(Number(e.target.value))}
                  className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Position Y</span>
                  <span className="font-mono text-gray-700">{positionY}px</span>
                </div>
                <input 
                  type="range" 
                  min="-500" 
                  max="500" 
                  value={positionY}
                  onChange={(e) => setPositionY(Number(e.target.value))}
                  className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Scale slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Scale Scale</span>
                  <span className="font-mono text-gray-700">{scale}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="400" 
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Appearance settings */}
            <div className="p-3 bg-card border border-border-light rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wide">Compositing & Layer</span>
              
              {/* Opacity slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Opacity</span>
                  <span className="font-mono text-gray-700">{opacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Angle Rotate</span>
                  <span className="font-mono text-gray-700">{rotation}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Blend Mode Dropdown */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500">Blending Mode</span>
                <select 
                  value={blendMode}
                  onChange={(e) => setBlendMode(e.target.value)}
                  className="w-full h-8 px-2 bg-btn-bg border border-border-light rounded-lg text-xs text-text-dark focus:outline-none"
                >
                  <option>Normal</option>
                  <option>Multiply</option>
                  <option>Screen</option>
                  <option>Overlay</option>
                  <option>Darken</option>
                  <option>Lighten</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai-suggestions" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider font-mono">Gemini Copilot</span>
              <h3 className="text-xs font-semibold text-text-dark mt-0.5">Automated Recommendations</h3>
            </div>

            <div className="space-y-2.5">
              {suggestions.map((sug, idx) => (
                <div key={idx} className="p-3 bg-card border border-purple-100 hover:border-purple-300 transition-colors rounded-xl space-y-1 text-left relative group">
                  <div className="absolute top-3 right-3 text-purple-500 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-text-dark">{sug.title}</span>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{sug.desc}</p>
                  <button className="flex items-center space-x-1 text-[10px] font-mono text-purple-600 mt-2 hover:underline cursor-pointer">
                    <span>Apply Recommendation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <span className="text-[10px] font-bold text-purple-600 block mb-1 font-mono uppercase tracking-wide">SMART MEMORY ENGINE</span>
              <p className="text-[10px] text-gray-600 leading-normal">
                AI remembers you preferred Cinematic high contrasts in your previous projects. Do you want to standardize color correction settings across all tracks?
              </p>
              <div className="flex space-x-2 mt-2">
                <button className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 text-[9px] rounded-lg hover:bg-purple-100 font-mono transition-colors cursor-pointer">
                  Standardize
                </button>
                <button className="px-2.5 py-1 bg-transparent text-gray-500 text-[9px] rounded-lg hover:underline font-mono cursor-pointer">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quick-actions" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Macro shortcuts</span>
              <h3 className="text-xs font-semibold text-text-dark mt-0.5">Quick Automation Presets</h3>
            </div>

            <div className="space-y-2">
              {[
                { label: "Add Audio Denoise Filter", desc: "Removes wind or fan white noises" },
                { label: "Inject Cinematic Markers", desc: "Slices tracks at scene transition peaks" },
                { label: "Convert to vertical 9:16 aspect", desc: "Auto-reframe coordinates for TikTok/Shorts" },
                { label: "Generate Smart Subtitle Track", desc: "Instant transcription pipeline" },
                { label: "Color Correction Auto-Saturate", desc: "Increases primary red/green channels" }
              ].map((act, idx) => (
                <button 
                  key={idx} 
                  className="w-full p-2.5 bg-card hover:bg-btn-bg border border-border-light hover:border-gray-400 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <span className="text-[11px] font-semibold text-text-dark block group-hover:underline">{act.label}</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">{act.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "metadata" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">File properties</span>
              <h3 className="text-xs font-semibold text-text-dark mt-0.5">Technical Metadata</h3>
            </div>

            <div className="p-3 bg-card border border-border-light rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-gray-400">PROJECT</span>
                <span className="text-text-dark font-medium truncate max-w-[140px]" title={projectName}>{projectName}</span>
              </div>
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-gray-400">RESOLUTION</span>
                <span className="text-text-dark font-medium">3840 x 2160 (4K)</span>
              </div>
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-gray-400">FRAME RATE</span>
                <span className="text-text-dark font-medium">23.976 fps</span>
              </div>
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-gray-400">COLOR SPACE</span>
                <span className="text-text-dark font-medium">Rec.709 (SDR)</span>
              </div>
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-gray-400">AUDIO FORMAT</span>
                <span className="text-text-dark font-medium">48kHz / 24-bit PCM</span>
              </div>
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-gray-400">VIDEO CODEC</span>
                <span className="text-text-dark font-medium">Apple ProRes 422HQ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DATABASE BACKUP</span>
                <span className="text-green-600 font-semibold flex items-center space-x-1">
                  <Database className="w-3 h-3" />
                  <span>Cloud Live</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
