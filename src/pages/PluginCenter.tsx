import { useState } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Sparkles, 
  Check, 
  Settings, 
  Trash2,
  Workflow
} from "lucide-react";
import { PluginItem } from "../types";

interface PluginCenterProps {
  pluginsList: PluginItem[];
  onTogglePlugin: (id: string) => void;
}

export default function PluginCenter({ pluginsList, onTogglePlugin }: PluginCenterProps) {
  const [search, setSearch] = useState("");

  const filtered = pluginsList.filter(plug => 
    plug.name.toLowerCase().includes(search.toLowerCase()) || 
    plug.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">EXTENSION SYSTEM CORE</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Plugin Center Ecosystem</h1>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2 bg-panel border border-border-light h-9 px-3 rounded-xl w-full max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search external plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs text-text-dark bg-transparent focus:outline-none w-full"
          />
        </div>
        
        <span className="text-[10px] font-mono text-gray-400 font-semibold">
          API Hookups Synchronized
        </span>
      </div>

      {/* Main list */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <Settings className="w-10 h-10 text-gray-300 stroke-1 animate-pulse" />
            <span className="text-xs font-semibold block mt-3">No extension plugins match search parameters</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plug) => {
              const isEnabled = plug.isEnabled;
              return (
                <div 
                  key={plug.id}
                  className="bg-card border border-border-light p-4 rounded-2xl text-left hover:border-gray-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-panel rounded-xl border border-border-light/40">
                          <Workflow className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-text-dark block">{plug.name}</span>
                          <span className="text-[9px] font-mono text-gray-400">v{plug.version} by {plug.author}</span>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        {plug.rating}★
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
                      {plug.description}
                    </p>
                  </div>

                  {/* Active switches and setups */}
                  <div className="flex justify-between items-center mt-5 border-t border-border-light/40 pt-3">
                    <span className="text-[9px] font-mono text-gray-400">Active memory footprint: Negligible</span>
                    
                    <button
                      onClick={() => onTogglePlugin(plug.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                        isEnabled 
                          ? "bg-green-100 text-green-700 font-bold" 
                          : "bg-text-dark text-white hover:bg-opacity-90"
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Enable Extension</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
