import React, { useState } from "react";
import { 
  Image as ImageIcon, 
  Sparkles, 
  Eraser, 
  ChevronRight, 
  Download, 
  Maximize2,
  Sliders,
  Play
} from "lucide-react";
import { PageId } from "../types";

interface ImageStudioProps {
  onNavigate: (page: PageId) => void;
}

export default function ImageStudio({ onNavigate }: ImageStudioProps) {
  const [prompt, setPrompt] = useState("A futuristic neon cyberpunk cityscape in rain, cinematic, 8k");
  const [upscaleFactor, setUpscaleFactor] = useState(2); // 2x, 4x, 8x
  const [removeBg, setRemoveBg] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImg, setGeneratedImg] = useState("https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=400&q=80");

  const handleGenerateSim = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedImg("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=80");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="border-b border-border-light pb-4 shrink-0 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">STUDIO CORE MODULE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Image Studio & Generation</h1>
        </div>
        
        <button
          onClick={() => onNavigate("workspace")}
          className="px-3.5 py-1.5 bg-btn-bg border border-border-light text-text-dark text-xs font-semibold rounded-xl hover:border-gray-400 transition-all cursor-pointer"
        >
          Open Studio Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Canvas preview */}
        <div className="lg:col-span-2 bg-text-dark rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-inner border border-gray-800">
          <div className="flex-1 flex items-center justify-center p-8 bg-black/90 relative">
            <div className="aspect-square w-full max-w-sm bg-gray-950 rounded-xl overflow-hidden relative border border-gray-800 flex items-center justify-center shadow-2xl">
              <img 
                src={generatedImg} 
                alt="AI Output preview" 
                className={`w-full h-full object-cover transition-all duration-300 ${isGenerating ? "opacity-30 blur-xs" : "opacity-100"}`}
                referrerPolicy="no-referrer"
              />
              
              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10 text-white font-mono">
                  <span className="text-xs">Synthesizing Pixel Array Matrix...</span>
                  <div className="h-1.5 w-24 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-1/2 animate-[pulse_1.5s_infinite]"></div>
                  </div>
                </div>
              )}

              {removeBg && !isGenerating && (
                <div className="absolute inset-4 border-2 border-dashed border-purple-500 rounded flex items-center justify-center bg-black/50 backdrop-blur-xs text-white text-[10px] font-mono">
                  [BACKGROUND DISMANTLING MASK ACTIVE]
                </div>
              )}
            </div>
          </div>

          <div className="bg-black/85 p-3 text-gray-500 font-mono text-[9px] flex justify-between shrink-0 border-t border-gray-800">
            <span>CANVAS: RGB 8-Bit Color profile</span>
            <span>RATIO: 1:1 Square Scale</span>
            <span>UPSCALE STATUS: {upscaleFactor}x Ready</span>
          </div>
        </div>

        {/* AI Parameters Sidebar */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          {/* Text prompting box */}
          <form onSubmit={handleGenerateSim} className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center space-x-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generative AI Prompt</span>
            </span>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-20 p-2 text-xs text-text-dark bg-panel border border-border-light rounded-xl focus:outline-none focus:border-purple-300 resize-none font-sans leading-relaxed"
              placeholder="e.g. A gorgeous watercolor canvas..."
              required
            />

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2 bg-text-dark hover:bg-opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Generating..." : "Synthesize Image"}</span>
            </button>
          </form>

          {/* Upscaler and bg remover */}
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Smart Enhancement Modules</span>
            </span>

            {/* Background remover toggle */}
            <div className="flex items-center justify-between p-2 bg-panel/50 border border-border-light rounded-xl">
              <div>
                <span className="text-xs font-bold text-text-dark block">Background Removal</span>
                <span className="text-[9px] text-gray-500 block mt-1">AI isolates primary portrait subjects</span>
              </div>
              <button
                type="button"
                onClick={() => setRemoveBg(!removeBg)}
                className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                  removeBg ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  removeBg ? "translate-x-4" : ""
                }`}></div>
              </button>
            </div>

            {/* Upscale Factor */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-text-dark">Neural Upscale Factor</span>
              <div className="flex space-x-2">
                {[2, 4, 8].map((factor) => (
                  <button
                    type="button"
                    key={factor}
                    onClick={() => setUpscaleFactor(factor)}
                    className={`flex-1 py-1.5 border text-xs font-mono font-bold rounded-lg cursor-pointer transition-all ${
                      upscaleFactor === factor 
                        ? "bg-text-dark text-white border-transparent" 
                        : "bg-btn-bg border-border-light text-text-dark hover:border-gray-400"
                    }`}
                  >
                    {factor}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
