import React, { useState } from "react";
import { 
  Settings, 
  User, 
  Cpu, 
  Monitor, 
  Zap, 
  Database, 
  Check, 
  Sliders 
} from "lucide-react";

export default function SettingsPage() {
  const [profileName, setProfileName] = useState("Siddharth Roy");
  const [colorSpace, setColorSpace] = useState("rec709");
  const [defaultAspect, setDefaultAspect] = useState("16:9");
  const [threadLimit, setThreadLimit] = useState(8);
  const [apiCache, setApiCache] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="border-b border-border-light pb-4 shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE PREFERENCES</span>
        <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Studio Preferences</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Core preferences form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Preferences Deck</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">System & User Settings</h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-5">
            {/* User details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-dark flex items-center space-x-1.5">
                <User className="w-4 h-4 text-gray-500" />
                <span>Producer Profile Display Name</span>
              </label>
              <input 
                type="text" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full h-9 px-3 bg-panel border border-border-light rounded-xl text-xs text-text-dark focus:outline-none"
                required
              />
            </div>

            {/* Video Color profile selections */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-dark flex items-center space-x-1.5">
                <Monitor className="w-4 h-4 text-gray-500" />
                <span>Display Color Spaces Calibration</span>
              </label>
              <select
                value={colorSpace}
                onChange={(e) => setColorSpace(e.target.value)}
                className="w-full h-9 px-3 bg-panel border border-border-light rounded-xl text-xs text-text-dark focus:outline-none cursor-pointer"
              >
                <option value="rec709">Rec. 709 (Broadcasting Standard SDR)</option>
                <option value="rec2020">Rec. 2200 (Wide Gamut High HDR-10)</option>
                <option value="dcip3">DCI-P3 (Cinematic Digital Projection)</option>
              </select>
            </div>

            {/* Aspect resolutions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-dark flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-gray-500" />
                <span>Default Dynamic Aspect Ratio</span>
              </label>
              <select
                value={defaultAspect}
                onChange={(e) => setDefaultAspect(e.target.value)}
                className="w-full h-9 px-3 bg-panel border border-border-light rounded-xl text-xs text-text-dark focus:outline-none cursor-pointer"
              >
                <option value="16:9">Horizontal Standard (16:9 Landscape)</option>
                <option value="9:16">Vertical TikTok/Reel (9:16 Portrait)</option>
                <option value="1:1">Square Digital Feed (1:1 Aspect)</option>
              </select>
            </div>

            {/* GPU processing limits */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-text-dark">
                <span className="flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-gray-500" />
                  <span>Tensor Core Thread Limit</span>
                </span>
                <span className="font-mono text-purple-600">{threadLimit} threads</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="32" 
                step="2"
                value={threadLimit}
                onChange={(e) => setThreadLimit(Number(e.target.value))}
                className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* AI caching locks */}
            <div className="flex items-center justify-between p-3 bg-panel/50 border border-border-light rounded-xl">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-xs font-bold text-text-dark block">Cognitive Prompt Cache Locks</span>
                  <span className="text-[9px] text-gray-500 block leading-none mt-1">Preserves recurrent model responses locally</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApiCache(!apiCache)}
                className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                  apiCache ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  apiCache ? "translate-x-4" : ""
                }`}></div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaved}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer shrink-0 transition-all ${
              isSaved ? "bg-green-600 text-white" : "bg-text-dark hover:bg-opacity-90 text-white"
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            <span>{isSaved ? "Studio Preferences Saved!" : "Save Preferences"}</span>
          </button>
        </form>

        {/* Info sidebar */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Account License Level</span>
            <div className="p-3 bg-panel border border-border-light rounded-xl flex justify-between items-center text-left">
              <div>
                <span className="text-xs font-bold text-purple-600 block uppercase font-mono">ENTERPRISE PRO PLATINUM</span>
                <span className="text-[10px] text-gray-500 block mt-1">Access to all 27 core AI Studio modules</span>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
