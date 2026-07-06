import React, { useState } from "react";
import { 
  Download, 
  Sparkles, 
  FileVideo, 
  Maximize2, 
  Layers, 
  HelpCircle,
  Play
} from "lucide-react";
import { PageId } from "../types";

interface ExportCenterProps {
  onNavigate: (page: PageId) => void;
  onAddRenderJob: (job: { name: string; format: string; resolution: string }) => void;
}

export default function ExportCenter({ onNavigate, onAddRenderJob }: ExportCenterProps) {
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [selectedRes, setSelectedRes] = useState("1080p");
  const [fps, setFps] = useState("24");
  const [exportName, setExportName] = useState("Nebula_Master_Cut");

  const formats = [
    { id: "mp4", label: "H.264/AAC Codec (MP4)", desc: "Highly compatible, ideal for web/social uploads." },
    { id: "mov", label: "Apple ProRes 422 (MOV)", desc: "Lossless professional master editing format." },
    { id: "wav", label: "Stereo LPCM Audio (WAV)", desc: "Raw isolated stereo soundtrack mix." }
  ];

  const resolutions = [
    { id: "4k", label: "4K UHD (3840 x 2160)", size: "4.5 GB" },
    { id: "1080p", label: "1080p Full HD (1920 x 1080)", size: "1.2 GB" },
    { id: "reels", label: "Vertical Reels (1080 x 1920)", size: "850 MB" }
  ];

  const handleTriggerExport = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dispatch render queue job
    onAddRenderJob({
      name: `${exportName}.${selectedFormat}`,
      format: selectedFormat.toUpperCase(),
      resolution: selectedRes === "4k" ? "3840x2160 (4K)" : selectedRes === "reels" ? "1080x1920 (Vertical)" : "1920x1080 (HD)"
    });

    onNavigate("render-center");
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="border-b border-border-light pb-4 shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">EXPORT SYSTEM MODULE</span>
        <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Master Output Export</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Main interactive form */}
        <form onSubmit={handleTriggerExport} className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Render Setup Deck</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Export Parameters</h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-5">
            {/* Project name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-dark block">File Output Name</label>
              <input 
                type="text" 
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                className="w-full h-9 px-3 bg-panel border border-border-light rounded-xl text-xs text-text-dark focus:outline-none"
                required
              />
            </div>

            {/* Formats list */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dark block">Codec Format Preset</label>
              <div className="space-y-1.5">
                {formats.map((fmt) => {
                  const isSel = selectedFormat === fmt.id;
                  return (
                    <button
                      type="button"
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`w-full p-3 text-left border rounded-xl transition-all cursor-pointer flex justify-between items-center ${
                        isSel ? "border-text-dark bg-panel" : "border-border-light bg-btn-bg hover:border-gray-400"
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-xs font-bold text-text-dark block leading-none">{fmt.label}</span>
                        <span className="text-[9px] text-gray-400 block mt-1">{fmt.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution grids */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dark block">Resolution Dimensions Preset</label>
              <div className="grid grid-cols-3 gap-2">
                {resolutions.map((res) => {
                  const isSel = selectedRes === res.id;
                  return (
                    <button
                      type="button"
                      key={res.id}
                      onClick={() => setSelectedRes(res.id)}
                      className={`p-3 text-center border rounded-xl transition-all cursor-pointer flex flex-col justify-between items-center ${
                        isSel ? "border-text-dark bg-panel" : "border-border-light bg-btn-bg hover:border-gray-400"
                      }`}
                    >
                      <span className="text-xs font-bold text-text-dark block leading-none">{res.label}</span>
                      <span className="text-[9px] text-gray-400 mt-2">Est: {res.size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-text-dark hover:bg-opacity-90 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Enqueue and Dispatch Job</span>
          </button>
        </form>

        {/* Informative Side block */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Estimated Output Parameters</span>
            
            <div className="space-y-3 text-xs font-mono text-gray-500">
              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span>Final dimensions:</span>
                <span className="text-text-dark font-bold">
                  {selectedRes === "4k" ? "3840 x 2160" : selectedRes === "reels" ? "1080 x 1920" : "1920 x 1080"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span>Estimated Size:</span>
                <span className="text-text-dark font-bold">
                  {selectedRes === "4k" ? "4.5 GB" : selectedRes === "reels" ? "850 MB" : "1.2 GB"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border-light/40 pb-1.5">
                <span>Target Framerate:</span>
                <span className="text-text-dark font-bold">24.000 fps (CFR)</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl text-left space-y-2">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Compression Vector</span>
            </span>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              We leverage intelligent h.265 neural encoding heuristics to automatically suppress redundant spatial blocks, reducing final filesize by up to 34% without sacrificing precision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
