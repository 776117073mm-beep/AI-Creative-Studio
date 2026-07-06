import { useState } from "react";
import { 
  Cloud as CloudIcon, 
  Database, 
  Upload, 
  Check, 
  RefreshCw, 
  HardDrive, 
  Sliders 
} from "lucide-react";

export default function Cloud() {
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, done
  const [offlineSync, setOfflineSync] = useState(true);
  const [cacheSize, setCacheSize] = useState(12.4); // GB

  const handleSyncSim = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("done");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="border-b border-border-light pb-4 shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">WORKSPACE REMOTE VAULTS</span>
        <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Cloud Workspace Backup</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Cloud Status Panel */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Remote Vault Status</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Asset Replication</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-4 bg-purple-50 rounded-full border border-purple-100 relative">
              <CloudIcon className="w-10 h-10 text-purple-600 animate-pulse" />
              {syncStatus === "syncing" && (
                <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-text-dark block">
                {syncStatus === "syncing" ? "Syncing sequence with US-EAST-1 Bucket..." : 
                 syncStatus === "done" ? "All assets synchronized!" : "Local project matches Remote Backup"}
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">Last replicated: 4 minutes ago</span>
            </div>

            <button
              onClick={handleSyncSim}
              disabled={syncStatus === "syncing"}
              className="px-4 py-2 bg-text-dark hover:bg-opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              <span>{syncStatus === "syncing" ? "Syncing..." : "Sync Workspace Now"}</span>
            </button>
          </div>

          <div className="bg-panel border border-border-light p-3 rounded-xl text-[10px] font-mono text-gray-500 flex justify-between">
            <span>VAULT REGION: AWS AWS-US-EAST-1</span>
            <span>SECURE ENCRYPTION: AES-256 GCM</span>
          </div>
        </div>

        {/* Space limits and caching parameters */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Cloud Storage Volume</span>
            </span>

            {/* Storage capacity bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Personal Storage Capacity</span>
                <span className="text-text-dark font-bold">45.2 GB / 100 GB</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: "45.2%" }}></div>
              </div>
            </div>

            {/* Offline Sync toggles */}
            <div className="flex items-center justify-between p-2 bg-panel/50 border border-border-light rounded-xl">
              <div>
                <span className="text-xs font-bold text-text-dark block">Offline Sync Vault</span>
                <span className="text-[9px] text-gray-500 block leading-none mt-1">Preserve full cache on local SSD</span>
              </div>
              <button
                type="button"
                onClick={() => setOfflineSync(!offlineSync)}
                className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                  offlineSync ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  offlineSync ? "translate-x-4" : ""
                }`}></div>
              </button>
            </div>
          </div>

          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Smart Cache Parameters</span>
            </span>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Max Local Cache Allocation</span>
                <span className="text-text-dark font-bold">{cacheSize} GB</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="50" 
                value={cacheSize}
                onChange={(e) => setCacheSize(Number(e.target.value))}
                className="w-full accent-text-dark h-1 bg-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
