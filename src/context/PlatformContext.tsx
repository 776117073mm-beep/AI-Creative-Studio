import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { EventBus } from "../events/EventBus";
import { CommandDispatcher } from "../commands/CommandDispatcher";
import { ModuleEngine } from "../engine/ModuleEngine";
import { PluginEngine } from "../engine/PluginEngine";
import { ToolRegistry } from "../registry/ToolRegistry";
import { ServiceRegistry } from "../registry/ServiceRegistry";

// Import new core engines and diagnostics
import { ResourceManager } from "../system/ResourceManager";
import { ConfigurationEngine } from "../config/ConfigurationEngine";
import { JobQueue, BackgroundJob } from "../engine/JobQueue";
import { BackgroundServices, ServiceRunner } from "../system/BackgroundServices";
import { FileWatcher, FileChange } from "../system/FileWatcher";
import { CacheEngine } from "../system/CacheEngine";
import { TempFileManager } from "../system/TempFileManager";
import { PerformanceMonitor, MetricRecord } from "../diagnostics/PerformanceMonitor";
import { HealthMonitor, SubsystemHealth } from "../diagnostics/HealthMonitor";

// New platform engines
import { SessionManager } from "../system/SessionManager";
import { WorkspaceEngine } from "../system/WorkspaceEngine";
import { PermissionEngine } from "../security/PermissionEngine";
import { CapabilityRegistry } from "../registry/CapabilityRegistry";
import { CommandRegistry } from "../registry/CommandRegistry";
import { FileTypeRegistry } from "../registry/FileTypeRegistry";
import { PlatformRuntime } from "../runtime";
import { DocumentationSystem } from "../system/DocumentationSystem";

interface PlatformContextProps {
  eventBus: EventBus;
  commandDispatcher: CommandDispatcher;
  moduleEngine: ModuleEngine;
  pluginEngine: PluginEngine;
  toolRegistry: ToolRegistry;
  serviceRegistry: ServiceRegistry;
  
  // Core singletons
  sessionManager: SessionManager;
  workspaceEngine: WorkspaceEngine;
  permissionEngine: PermissionEngine;
  capabilityRegistry: CapabilityRegistry;
  commandRegistry: CommandRegistry;
  fileTypeRegistry: FileTypeRegistry;
  platformRuntime: PlatformRuntime;
  documentationSystem: DocumentationSystem;

  // Expose triggers or reactive states for re-renders when states change
  modulesList: any[];
  pluginsList: any[];
  toolsList: any[];
  servicesList: any[];
  eventHistory: any[];
  commandHistory: any[];
  
  // New systems exposure
  resourceStats: any;
  jobQueueList: BackgroundJob[];
  backgroundServicesList: ServiceRunner[];
  lastFileChange: FileChange | null;
  performanceLatest: MetricRecord;
  healthReport: { overallStatus: string; totalSubsystems: number; details: SubsystemHealth[] };
  tempFileStats: any;
  configuration: any;

  refreshPlatformState: () => void;
  triggerJobAction: (id: string, action: "pause" | "resume" | "stop" | "restart") => void;
  triggerGC: () => void;
  triggerBackup: (profileName: string) => void;
}

const PlatformContext = createContext<PlatformContextProps | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const eventBus = EventBus.getInstance();
  const commandDispatcher = CommandDispatcher.getInstance();
  const moduleEngine = ModuleEngine.getInstance();
  const pluginEngine = PluginEngine.getInstance();
  const toolRegistry = ToolRegistry.getInstance();
  const serviceRegistry = ServiceRegistry.getInstance();

  const sessionManager = SessionManager.getInstance();
  const workspaceEngine = WorkspaceEngine.getInstance();
  const permissionEngine = PermissionEngine.getInstance();
  const capabilityRegistry = CapabilityRegistry.getInstance();
  const commandRegistry = CommandRegistry.getInstance();
  const fileTypeRegistry = FileTypeRegistry.getInstance();
  const platformRuntime = PlatformRuntime.getInstance();
  const documentationSystem = DocumentationSystem.getInstance();

  const resourceManager = ResourceManager.getInstance();
  const configurationEngine = ConfigurationEngine.getInstance();
  const jobQueue = JobQueue.getInstance();
  const backgroundServices = BackgroundServices.getInstance();
  const fileWatcher = FileWatcher.getInstance();
  const tempFileManager = TempFileManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  const healthMonitor = HealthMonitor.getInstance();

  // Active state representations in React
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [pluginsList, setPluginsList] = useState<any[]>([]);
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [eventHistory, setEventHistory] = useState<any[]>([]);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);

  // New states for system services
  const [resourceStats, setResourceStats] = useState<any>({});
  const [jobQueueList, setJobQueueList] = useState<BackgroundJob[]>([]);
  const [backgroundServicesList, setBackgroundServicesList] = useState<ServiceRunner[]>([]);
  const [lastFileChange, setLastFileChange] = useState<FileChange | null>(null);
  const [performanceLatest, setPerformanceLatest] = useState<MetricRecord>(performanceMonitor.getLatestRecord());
  const [healthReport, setHealthReport] = useState<any>({ overallStatus: "healthy", totalSubsystems: 0, details: [] });
  const [tempFileStats, setTempFileStats] = useState<any>({});
  const [configuration, setConfiguration] = useState<any>({});

  const refreshPlatformState = () => {
    setModulesList(moduleEngine.listModules().map(m => ({
      id: m.metadata.id,
      name: m.metadata.name,
      displayName: m.metadata.displayName,
      version: m.metadata.version,
      category: m.metadata.category,
      status: m.state.status,
      health: m.state.health,
      error: m.state.error,
      metadata: m.metadata
    })));

    setPluginsList(pluginEngine.listPlugins().map(p => ({
      id: p.metadata.id,
      name: p.metadata.name,
      version: p.metadata.version,
      status: p.state.status,
      error: p.state.error,
      metadata: p.metadata
    })));

    setToolsList(toolRegistry.listTools().map(t => t.metadata));
    setServicesList(serviceRegistry.listServices().map(s => ({
      serviceName: s.serviceName,
      description: s.description,
      status: s.getStatus()
    })));

    setEventHistory(eventBus.getHistory());
    setCommandHistory(commandDispatcher.getHistory());

    // Pull statuses from managers
    setResourceStats(resourceManager.getStatus());
    setJobQueueList(jobQueue.listAllJobs());
    setBackgroundServicesList(backgroundServices.getServiceList());
    setPerformanceLatest(performanceMonitor.getLatestRecord());
    setHealthReport(healthMonitor.runDiagnosticsReport());
    setTempFileStats(tempFileManager.getStats());
    setConfiguration(configurationEngine.get());
  };

  const triggerJobAction = (id: string, action: "pause" | "resume" | "stop" | "restart") => {
    if (action === "pause") jobQueue.pauseJob(id);
    else if (action === "resume") jobQueue.resumeJob(id);
    else if (action === "stop") jobQueue.stopJob(id);
    else if (action === "restart") jobQueue.restartJob(id);
    refreshPlatformState();
  };

  const triggerGC = () => {
    resourceManager.garbageCollect();
    refreshPlatformState();
  };

  const triggerBackup = (profileName: string) => {
    configurationEngine.createBackup(profileName);
    refreshPlatformState();
  };

  useEffect(() => {
    // Add default background rendering jobs so the user sees real background scheduling telemetry out-of-the-box!
    const testJob1 = jobQueue.addJob({
      id: "job_vfx_matte_render",
      name: "Neural VFX Matte Pre-Render",
      priority: 80,
      maxRetries: 2,
      payload: { mode: "4k_cinematic" },
      run: async (onProgress) => {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(r => setTimeout(r, 600));
          onProgress(i);
        }
      }
    });

    const testJob2 = jobQueue.addJob({
      id: "job_lut_correction",
      name: "Cinematic LUT Color Equalizer",
      priority: 50,
      maxRetries: 1,
      payload: { lut: "kodak_gold" },
      run: async (onProgress) => {
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(r => setTimeout(r, 400));
          onProgress(i);
        }
      }
    });

    // Initial fetch
    refreshPlatformState();

    // Listen to FileWatcher changes
    const unsubFileWatcher = fileWatcher.subscribe((change) => {
      setLastFileChange(change);
      eventBus.publish("file_change_detected", { change }, "FileWatcher");
    });

    // Listen to all events to trigger auto-refresh of local state
    const subId = eventBus.subscribe("*", () => {
      refreshPlatformState();
    }, { priority: 1 });

    // Periodically update to catch background changes
    const interval = setInterval(() => {
      refreshPlatformState();
    }, 2000);

    return () => {
      eventBus.unsubscribe(subId);
      unsubFileWatcher();
      clearInterval(interval);
    };
  }, []);

  return (
    <PlatformContext.Provider value={{
      eventBus,
      commandDispatcher,
      moduleEngine,
      pluginEngine,
      toolRegistry,
      serviceRegistry,
      sessionManager,
      workspaceEngine,
      permissionEngine,
      capabilityRegistry,
      commandRegistry,
      fileTypeRegistry,
      platformRuntime,
      documentationSystem,
      modulesList,
      pluginsList,
      toolsList,
      servicesList,
      eventHistory,
      commandHistory,
      resourceStats,
      jobQueueList,
      backgroundServicesList,
      lastFileChange,
      performanceLatest,
      healthReport,
      tempFileStats,
      configuration,
      refreshPlatformState,
      triggerJobAction,
      triggerGC,
      triggerBackup
    }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}

