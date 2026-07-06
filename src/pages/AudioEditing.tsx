import { useState, useEffect } from "react";
import { 
  Music, 
  Mic, 
  Volume2, 
  SlidersHorizontal, 
  Sparkles, 
  Activity, 
  RefreshCw, 
  Check, 
  RotateCcw,
  Zap
} from "lucide-react";
import { PageId } from "../types";

interface AudioEditingProps {
  onNavigate: (page: PageId) => void;
}

export default function AudioEditing({ onNavigate }: AudioEditingProps) {
  // Volume faders
  const [faderVoice, setFaderVoice] = useState(80);
  const [faderMusic, setFaderMusic] = useState(45);
  const [faderSFX, setFaderSFX] = useState(60);

  // Equalizer nodes
  const [eqLow, setEqLow] = useState(0); // dB
  const [eqMid, setEqMid] = useState(3); // dB
  const [eqHigh, setEqHigh] = useState(-2); // dB

  const [isVoiceIsolated, setIsVoiceIsolated] = useState(true);
  const [noiseRemoval, setNoiseRemoval] = useState(12); // dB reduction
  const [isRecording, setIsRecording] = useState(false);
  
  // Realtime waveform state simulation
  const [waveformNodes, setWaveformNodes] = useState<number[]>(new Array(16).fill(10));

  useEffect(() => {
    let interval: any;
    if (isRecording || isVoiceIsolated) {
      interval = setInterval(() => {
        setWaveformNodes(Array.from({ length: 20 }, () => Math.floor(Math.random() * 35) + 5));
      }, 150);
    } else {
      setWaveformNodes(new Array(20).fill(6));
    }
    return () => clearInterval(interval);
  }, [isRecording, isVoiceIsolated]);

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="border-b border-border-light pb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">STUDIO CORE MODULE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Audio Mastering Mixer</h1>
        </div>
        
        <button
          onClick={() => onNavigate("workspace")}
          className="px-3.5 py-1.5 bg-btn-bg border border-border-light text-text-dark text-xs font-semibold rounded-xl hover:border-gray-400 transition-all cursor-pointer"
        >
          Open Studio Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Left mixing faders console */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Mixing Deck Console</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Multi-channel Track Faders</h3>
          </div>

          {/* Interactive faders */}
          <div className="flex-1 grid grid-cols-3 gap-4 py-6 px-4">
            {[
              { id: "voice", label: "Dialogue", icon: Mic, value: faderVoice, setValue: setFaderVoice },
              { id: "music", label: "Soundtrack", icon: Music, value: faderMusic, setValue: setFaderMusic },
              { id: "sfx", label: "VFX SFX", icon: Volume2, value: faderSFX, setValue: setFaderSFX }
            ].map((fader) => {
              const Icon = fader.icon;
              return (
                <div key={fader.id} className="flex flex-col items-center justify-between bg-panel/40 p-4 border border-border-light rounded-xl">
                  <div className="flex items-center space-x-1">
                    <Icon className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs font-bold text-text-dark">{fader.label}</span>
                  </div>

                  {/* Vertical Fader tracks */}
                  <div className="relative h-44 flex items-center justify-center py-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={fader.value}
                      onChange={(e) => fader.setValue(Number(e.target.value))}
                      style={{ writingMode: "vertical-lr", direction: "rtl" }}
                      className="accent-text-dark w-12 h-36 cursor-pointer"
                    />
                  </div>

                  <span className="font-mono text-[10px] text-gray-500 bg-btn-bg px-2 py-0.5 rounded border border-border-light">
                    {fader.value === 0 ? "MUTE" : `-${100 - fader.value}dB`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-panel border border-border-light p-3 rounded-xl flex items-center justify-between text-[11px] font-mono text-gray-500">
            <span>DAC Output: 48kHz / 24-bit PCM Master</span>
            <button className="text-gray-400 hover:text-text-dark cursor-pointer flex items-center space-x-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Mix Deck</span>
            </button>
          </div>
        </div>

        {/* Dynamic Graphic EQ and AI Voice Isolators */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Voice Isolation and denoising parameters */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-4">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center space-x-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Dialogue Enhancement</span>
            </span>

            {/* Toggle switch */}
            <div className="flex items-center justify-between p-2 bg-panel/50 border border-border-light rounded-xl">
              <div>
                <span className="text-xs font-bold text-text-dark block">Deep Isolation Core</span>
                <span className="text-[9px] text-gray-500 block leading-none mt-1">Isolate and suppress ambient reflections</span>
              </div>
              <button
                onClick={() => setIsVoiceIsolated(!isVoiceIsolated)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  isVoiceIsolated ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isVoiceIsolated ? "translate-x-4" : ""
                }`}></div>
              </button>
            </div>

            {/* Noise removal level slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-gray-500">Denoise Threshold</span>
                <span className="text-text-dark font-bold">-{noiseRemoval} dB</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="24" 
                value={noiseRemoval}
                onChange={(e) => setNoiseRemoval(Number(e.target.value))}
                className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Graphical Equalizer curves */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Parametric Equalizer Curves</span>
            </span>

            {/* Equalizer graph SVG mockup */}
            <div className="h-20 bg-panel border border-border-light rounded-xl relative overflow-hidden flex items-center justify-center p-2">
              {/* Plot dynamic bezier curve based on eq state */}
              <svg className="w-full h-full absolute inset-0 text-gray-300" viewBox="0 0 200 80">
                <path 
                  d={`M 0 40 Q 50 ${40 - eqLow * 2}, 100 ${40 - eqMid * 2} T 200 ${40 - eqHigh * 2}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                />
              </svg>
              <span className="text-[9px] font-mono absolute bottom-1 right-2 text-gray-400">Rec.709 Core Equalized</span>
            </div>

            {/* Tuning sliders */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono">
              <div className="space-y-1 text-center bg-panel/30 p-1.5 rounded-lg border border-border-light">
                <span className="text-gray-400 block uppercase">LOWS</span>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  value={eqLow}
                  onChange={(e) => setEqLow(Number(e.target.value))}
                  className="w-full h-1 accent-text-dark cursor-pointer"
                />
                <span className="text-text-dark font-bold block">{eqLow > 0 ? `+${eqLow}` : eqLow}dB</span>
              </div>

              <div className="space-y-1 text-center bg-panel/30 p-1.5 rounded-lg border border-border-light">
                <span className="text-gray-400 block uppercase">MIDS</span>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  value={eqMid}
                  onChange={(e) => setEqMid(Number(e.target.value))}
                  className="w-full h-1 accent-text-dark cursor-pointer"
                />
                <span className="text-text-dark font-bold block">{eqMid > 0 ? `+${eqMid}` : eqMid}dB</span>
              </div>

              <div className="space-y-1 text-center bg-panel/30 p-1.5 rounded-lg border border-border-light">
                <span className="text-gray-400 block uppercase">HIGHS</span>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  value={eqHigh}
                  onChange={(e) => setEqHigh(Number(e.target.value))}
                  className="w-full h-1 accent-text-dark cursor-pointer"
                />
                <span className="text-text-dark font-bold block">{eqHigh > 0 ? `+${eqHigh}` : eqHigh}dB</span>
              </div>
            </div>
          </div>

          {/* Sound Recording simulator */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Mic Speech Recording Capture</span>
            <div className="flex items-center justify-between p-3.5 bg-panel border border-border-light rounded-xl">
              <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                  isRecording 
                    ? "bg-red-600 text-white animate-pulse" 
                    : "bg-btn-bg text-text-dark border-border-light hover:border-gray-400"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isRecording ? "Stop Recording" : "Record Dialogue"}</span>
              </button>

              {/* Graphical Waveform Simulation */}
              <div className="flex space-x-0.5 items-center justify-end h-7 flex-1 pl-4">
                {waveformNodes.map((val, idx) => (
                  <div 
                    key={idx} 
                    className={`w-0.5 rounded-full transition-all duration-150 ${isRecording ? "bg-red-500" : isVoiceIsolated ? "bg-purple-500" : "bg-gray-400"}`} 
                    style={{ height: `${val}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
