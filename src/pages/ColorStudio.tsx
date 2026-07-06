import { useState, useEffect } from "react";
import { 
  Palette, 
  Sparkles, 
  Activity, 
  RotateCcw, 
  Sliders, 
  Layers,
  ChevronRight
} from "lucide-react";
import { PageId } from "../types";

interface ColorStudioProps {
  onNavigate: (page: PageId) => void;
}

export default function ColorStudio({ onNavigate }: ColorStudioProps) {
  // Draggable wheel coordinates
  const [liftX, setLiftX] = useState(50);
  const [liftY, setLiftY] = useState(50);
  const [gammaX, setGammaX] = useState(50);
  const [gammaY, setGammaY] = useState(50);
  const [gainX, setGainX] = useState(50);
  const [gainY, setGainY] = useState(50);

  const [selectedLut, setSelectedLut] = useState("rec709");
  const [saturation, setSaturation] = useState(100);

  // Animated scope nodes simulation
  const [scopeNodes, setScopeNodes] = useState<number[]>(new Array(15).fill(40));

  useEffect(() => {
    const interval = setInterval(() => {
      setScopeNodes(Array.from({ length: 15 }, () => Math.floor(Math.random() * 60) + 10));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleResetWheels = () => {
    setLiftX(50); setLiftY(50);
    setGammaX(50); setGammaY(50);
    setGainX(50); setGainY(50);
    setSaturation(100);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="border-b border-border-light pb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">STUDIO CORE MODULE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Color Studio & LUT Wheels</h1>
        </div>
        
        <button
          onClick={() => onNavigate("workspace")}
          className="px-3.5 py-1.5 bg-btn-bg border border-border-light text-text-dark text-xs font-semibold rounded-xl hover:border-gray-400 transition-all cursor-pointer"
        >
          Open Studio Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Color Wheels panel */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 flex justify-between items-center shrink-0">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Grading Deck</span>
              <h3 className="text-xs font-bold text-text-dark mt-0.5">Three-Way Color Wheels</h3>
            </div>
            <button 
              onClick={handleResetWheels}
              className="text-[10px] font-mono text-gray-400 hover:text-text-dark flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Wheels</span>
            </button>
          </div>

          {/* Lift, Gamma, Gain wheels */}
          <div className="flex-1 grid grid-cols-3 gap-4 py-6">
            {/* LIFT WHEEL */}
            <div className="flex flex-col items-center space-y-2.5">
              <span className="text-xs font-bold text-gray-500">Lift (Shadows)</span>
              <div className="w-32 h-32 rounded-full border border-border-light bg-panel relative flex items-center justify-center shadow-inner select-none">
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-100/40 via-red-100/40 to-green-100/40"></div>
                {/* Center marker */}
                <div 
                  className="w-3.5 h-3.5 rounded-full bg-text-dark border-2 border-white shadow-md absolute cursor-pointer"
                  style={{ left: `${liftX}%`, top: `${liftY}%`, transform: "translate(-50%, -50%)" }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    const handleMove = (ev: MouseEvent) => {
                      if (rect) {
                        const px = ((ev.clientX - rect.left) / rect.width) * 100;
                        const py = ((ev.clientY - rect.top) / rect.height) * 100;
                        setLiftX(Math.max(15, Math.min(85, px)));
                        setLiftY(Math.max(15, Math.min(85, py)));
                      }
                    };
                    const handleUp = () => {
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    };
                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-gray-400">X: {liftX.toFixed(0)} | Y: {liftY.toFixed(0)}</span>
            </div>

            {/* GAMMA WHEEL */}
            <div className="flex flex-col items-center space-y-2.5">
              <span className="text-xs font-bold text-gray-500">Gamma (Midtones)</span>
              <div className="w-32 h-32 rounded-full border border-border-light bg-panel relative flex items-center justify-center shadow-inner select-none">
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-100/40 via-red-100/40 to-green-100/40"></div>
                <div 
                  className="w-3.5 h-3.5 rounded-full bg-text-dark border-2 border-white shadow-md absolute cursor-pointer"
                  style={{ left: `${gammaX}%`, top: `${gammaY}%`, transform: "translate(-50%, -50%)" }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    const handleMove = (ev: MouseEvent) => {
                      if (rect) {
                        const px = ((ev.clientX - rect.left) / rect.width) * 100;
                        const py = ((ev.clientY - rect.top) / rect.height) * 100;
                        setGammaX(Math.max(15, Math.min(85, px)));
                        setGammaY(Math.max(15, Math.min(85, py)));
                      }
                    };
                    const handleUp = () => {
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    };
                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-gray-400">X: {gammaX.toFixed(0)} | Y: {gammaY.toFixed(0)}</span>
            </div>

            {/* GAIN WHEEL */}
            <div className="flex flex-col items-center space-y-2.5">
              <span className="text-xs font-bold text-gray-500">Gain (Highlights)</span>
              <div className="w-32 h-32 rounded-full border border-border-light bg-panel relative flex items-center justify-center shadow-inner select-none">
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-100/40 via-red-100/40 to-green-100/40"></div>
                <div 
                  className="w-3.5 h-3.5 rounded-full bg-text-dark border-2 border-white shadow-md absolute cursor-pointer"
                  style={{ left: `${gainX}%`, top: `${gainY}%`, transform: "translate(-50%, -50%)" }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    const handleMove = (ev: MouseEvent) => {
                      if (rect) {
                        const px = ((ev.clientX - rect.left) / rect.width) * 100;
                        const py = ((ev.clientY - rect.top) / rect.height) * 100;
                        setGainX(Math.max(15, Math.min(85, px)));
                        setGainY(Math.max(15, Math.min(85, py)));
                      }
                    };
                    const handleUp = () => {
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    };
                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-gray-400">X: {gainX.toFixed(0)} | Y: {gainY.toFixed(0)}</span>
            </div>
          </div>

          {/* Saturation adjustments */}
          <div className="bg-panel border border-border-light p-3 rounded-xl flex items-center justify-between text-xs font-mono text-gray-500">
            <span>Saturation Levels:</span>
            <div className="flex items-center space-x-3 flex-1 max-w-xs pl-4">
              <input 
                type="range" 
                min="0" 
                max="200" 
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-1 accent-text-dark cursor-pointer bg-gray-300 rounded-lg appearance-none"
              />
              <span className="font-bold text-text-dark w-10 text-right">{saturation}%</span>
            </div>
          </div>
        </div>

        {/* LUT presets and Live animated scopes */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Lookup Tables presets */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Lookup Tables LUTs</span>
            </span>

            <div className="space-y-2">
              {[
                { id: "rec709", label: "Rec.709 Linear Balance", desc: "Standard broadcasting spectrum color space." },
                { id: "kodak", label: "Retro Kodak Edge 500T", desc: "Eerie warm tones, high dynamic cinema contrast." },
                { id: "teal", label: "Teal and Orange Matrix", desc: "Modern cinematic cyberpunk shadow grading profile." }
              ].map((lut) => (
                <button
                  key={lut.id}
                  onClick={() => {
                    setSelectedLut(lut.id);
                    if (lut.id === "kodak") { setLiftX(65); setLiftY(40); }
                    else if (lut.id === "teal") { setLiftX(30); setLiftY(60); }
                    else { setLiftX(50); setLiftY(50); }
                  }}
                  className={`w-full p-2.5 text-left border rounded-xl transition-all cursor-pointer ${
                    selectedLut === lut.id 
                      ? "bg-purple-50/50 border-purple-300" 
                      : "bg-btn-bg border-border-light hover:border-gray-300"
                  }`}
                >
                  <span className="text-xs font-bold text-text-dark block leading-none">{lut.label}</span>
                  <span className="text-[9px] text-gray-500 block mt-1 leading-normal">{lut.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Waveform / Histogram scopes simulation */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Waveform Scopes</span>
            </span>

            <div className="h-28 bg-panel border border-border-light rounded-xl flex items-end justify-between p-3 relative overflow-hidden">
              {/* Dynamic waveform metrics */}
              {scopeNodes.map((h, idx) => (
                <div key={idx} className="bg-purple-500 w-1.5 rounded-full transition-all duration-150" style={{ height: `${h}%` }}></div>
              ))}
              
              <span className="text-[8px] font-mono text-gray-400 absolute top-2 left-2">Rec.2020 Tone scale</span>
              <span className="text-[8px] font-mono text-gray-400 absolute bottom-2 left-2">Shadows (0 IRE)</span>
              <span className="text-[8px] font-mono text-gray-400 absolute top-2 right-2">Highlights (100 IRE)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
