import { PageId, SystemStats, RenderJob } from "../../types";
import { 
  Cpu, 
  Settings, 
  Database, 
  BellRing, 
  Loader2 
} from "lucide-react";

interface StatusBarProps {
  stats: SystemStats;
  currentProjectName: string;
  onNavigate: (page: PageId) => void;
  renderQueue: RenderJob[];
}

export default function StatusBar({
  stats,
  currentProjectName,
  onNavigate,
  renderQueue
}: StatusBarProps) {
  // Find active background rendering tasks
  const renderingJob = renderQueue.find(job => job.status === "rendering");

  return (
    <div className="h-6 bg-panel border-t border-border-light px-4 flex items-center justify-between text-[10px] font-mono text-gray-600 select-none shrink-0 z-30">
      {/* Left section: System Telemetry diagnostics */}
      <div className="flex items-center space-x-4">
        {/* GPU info */}
        <button 
          onClick={() => onNavigate("settings")}
          className="flex items-center space-x-1 hover:text-text-dark transition-colors cursor-pointer"
          title="GPU Telemetry Metrics"
        >
          <Cpu className="w-3 h-3" />
          <span>GPU:</span>
          <span className="font-semibold text-text-dark">{stats.gpuUsage}%</span>
          <span className="text-gray-400">({stats.gpuTemp}°C)</span>
        </button>

        {/* CPU info */}
        <button 
          onClick={() => onNavigate("settings")}
          className="flex items-center space-x-1 hover:text-text-dark transition-colors cursor-pointer"
          title="CPU Telemetry Metrics"
        >
          <span>CPU:</span>
          <span className="font-semibold text-text-dark">{stats.cpuUsage}%</span>
          <span className="text-gray-400">({stats.cpuTemp}°C)</span>
        </button>

        {/* RAM usage */}
        <button 
          onClick={() => onNavigate("settings")}
          className="flex items-center space-x-1 hover:text-text-dark transition-colors cursor-pointer"
          title="RAM Memory Usage"
        >
          <span>RAM:</span>
          <span className="font-semibold text-text-dark">{stats.ramUsage.toFixed(1)} GB</span>
          <span className="text-gray-400">/ {stats.ramMax} GB</span>
        </button>
      </div>

      {/* Middle section: Active Background Tasks & Renderers */}
      <div className="flex-1 flex justify-center px-4">
        {renderingJob ? (
          <button
            onClick={() => onNavigate("render-center")}
            className="flex items-center space-x-2 text-purple-700 font-semibold hover:underline animate-pulse cursor-pointer"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Rendering: {renderingJob.projectName} ({renderingJob.progress}%)</span>
            <span className="text-gray-400 font-normal">ETA: {renderingJob.eta}</span>
          </button>
        ) : (
          <span className="text-gray-400 font-sans">All render pipelines idle</span>
        )}
      </div>

      {/* Right section: Project metadata, cloud sync, version */}
      <div className="flex items-center space-x-4">
        {/* Project Name Link */}
        <button 
          onClick={() => onNavigate("projects")}
          className="hover:text-text-dark transition-colors cursor-pointer truncate max-w-[150px]"
          title="Show projects list"
        >
          Project: <span className="font-semibold text-text-dark">{currentProjectName || "None"}</span>
        </button>

        {/* Cloud sync */}
        <button 
          onClick={() => onNavigate("cloud")}
          className="flex items-center space-x-1 hover:text-text-dark transition-colors cursor-pointer"
        >
          <Database className="w-3 h-3 text-green-600" />
          <span className="text-green-600 font-semibold">Cloud Live</span>
        </button>

        {/* Engine Version */}
        <span className="text-gray-400 border-l border-border-light pl-3">
          Ver 1.0.0 Stable
        </span>
      </div>
    </div>
  );
}
