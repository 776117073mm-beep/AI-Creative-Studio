import { useState, useEffect } from "react";
import { 
  Play, 
  Trash2, 
  Cpu, 
  Layers, 
  RefreshCw, 
  Check, 
  X, 
  Clock, 
  ExternalLink 
} from "lucide-react";
import { RenderJob } from "../types";

interface RenderCenterProps {
  renderQueue: RenderJob[];
  onCancelRender: (id: string) => void;
  onClearQueue: () => void;
}

export default function RenderCenter({
  renderQueue,
  onCancelRender,
  onClearQueue
}: RenderCenterProps) {
  // Mock CPU, GPU load levels
  const [gpuLoad, setGpuLoad] = useState(65);
  const [cpuLoad, setCpuLoad] = useState(42);
  const [ramLoad, setRamLoad] = useState(58);

  useEffect(() => {
    const interval = setInterval(() => {
      setGpuLoad(prev => Math.max(30, Math.min(98, prev + Math.floor(Math.random() * 11) - 5)));
      setCpuLoad(prev => Math.max(20, Math.min(85, prev + Math.floor(Math.random() * 9) - 4)));
      setRamLoad(prev => Math.max(40, Math.min(75, prev + Math.floor(Math.random() * 5) - 2)));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 text-left h-full flex flex-col min-h-0 animate-in fade-in-50 duration-200">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">SYSTEM BATCH CODES</span>
          <h1 className="text-xl font-bold text-text-dark tracking-tight mt-0.5">Render Core & GPU Queue</h1>
        </div>

        <button
          onClick={onClearQueue}
          className="px-3.5 py-1.5 border border-border-light hover:border-gray-400 text-xs font-semibold rounded-xl cursor-pointer text-gray-600 hover:text-text-dark"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0 flex-1">
        
        {/* Render Queue list column */}
        <div className="lg:col-span-2 bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border-light pb-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Job Dispatch Deck</span>
            <h3 className="text-xs font-bold text-text-dark mt-0.5">Active Render Pipelines</h3>
          </div>

          {/* Jobs scrollable container */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3">
            {renderQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <Layers className="w-8 h-8 text-gray-300 stroke-1" />
                <span className="text-xs font-semibold block mt-2">Active queue is completely empty</span>
                <span className="text-[10px] block text-gray-500 mt-1">Initiate renderings across Workspace to populate</span>
              </div>
            ) : (
              renderQueue.map((job) => {
                const isRendering = job.status === "rendering";
                const isCompleted = job.status === "completed";
                const isQueued = job.status === "idle";

                return (
                  <div key={job.id} className="p-4 bg-panel/40 border border-border-light rounded-xl hover:border-gray-400 transition-all text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-text-dark">{job.projectName}</span>
                        <div className="flex space-x-3 text-[10px] text-gray-400 font-mono mt-1">
                          <span>Format: {job.format}</span>
                          <span>Resolution: {job.resolution}</span>
                        </div>
                      </div>

                      {/* Job Status badges */}
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          isRendering ? "bg-blue-100 text-blue-700 animate-pulse" :
                          isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {job.status}
                        </span>

                        {!isCompleted && (
                          <button
                            onClick={() => onCancelRender(job.id)}
                            className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress tracking line */}
                    {(isRendering || isCompleted) && (
                      <div className="mt-4 space-y-1.5">
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-gray-400">
                          <span>{job.progress}% compiled</span>
                          <span>ETA: {job.eta}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time System Load stats */}
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          
          <div className="bg-card border border-border-light p-4 rounded-2xl text-left space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>GPU Cluster Hardware Utilization</span>
            </span>

            {/* GPU level dial indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">NVIDIA Tensor RTX GPU</span>
                <span className="text-text-dark font-bold">{gpuLoad}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${gpuLoad > 85 ? "bg-red-500 animate-pulse" : "bg-blue-600"}`} 
                  style={{ width: `${gpuLoad}%` }}
                ></div>
              </div>
            </div>

            {/* CPU level dial indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Dual Threadripper CPU</span>
                <span className="text-text-dark font-bold">{cpuLoad}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-700 transition-all duration-1000" 
                  style={{ width: `${cpuLoad}%` }}
                ></div>
              </div>
            </div>

            {/* RAM level dial indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">DDR5 System memory (64GB)</span>
                <span className="text-text-dark font-bold">{ramLoad}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-1000" 
                  style={{ width: `${ramLoad}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl text-left space-y-2">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Smart Queue Management</span>
            </span>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              We coordinate core CPU and GPU threads so rendering heavy effects doesn't bottleneck your live workspace timeline scrubbers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
