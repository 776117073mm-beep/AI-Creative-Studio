import { ModuleEngine } from "../engine/ModuleEngine";
import { PluginEngine } from "../engine/PluginEngine";
import { HealthMonitor } from "../diagnostics/HealthMonitor";
import { PerformanceMonitor } from "../diagnostics/PerformanceMonitor";
import { EventBus } from "../events/EventBus";
import { CommandDispatcher } from "../commands/CommandDispatcher";
import { PlatformLogger } from "../logging";
import { SessionManager } from "../system/SessionManager";

export interface RuntimeConfig {
  maxExecutionTimeMs: number;
  memoryLimitMb: number;
  allowEval: boolean;
  hotReloadEnabled: boolean;
}

export type PlatformState = "uninitialized" | "starting" | "running" | "restarting" | "stopped" | "crashed";

export class PlatformRuntime {
  private static instance: PlatformRuntime;
  private config: RuntimeConfig;
  private state: PlatformState = "uninitialized";
  private uptimeStart = 0;

  private constructor() {
    this.config = {
      maxExecutionTimeMs: 5000,
      memoryLimitMb: 256,
      allowEval: false,
      hotReloadEnabled: true
    };
  }

  public static getInstance(): PlatformRuntime {
    if (!PlatformRuntime.instance) {
      PlatformRuntime.instance = new PlatformRuntime();
    }
    return PlatformRuntime.instance;
  }

  public getStatus(): { state: PlatformState; uptimeSec: number; config: RuntimeConfig } {
    const uptimeSec = this.uptimeStart > 0 ? Math.floor((Date.now() - this.uptimeStart) / 1000) : 0;
    return {
      state: this.state,
      uptimeSec,
      config: { ...this.config }
    };
  }

  /**
   * Safe execution wrapper with timeout
   */
  public async runSafely<T>(fn: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("[Runtime] Execution timed out under isolation policy.")), this.config.maxExecutionTimeMs)
    );

    return Promise.race([fn(), timeoutPromise]);
  }

  /**
   * Application Startup Pipeline
   */
  public async startup(): Promise<void> {
    if (this.state === "running") {
      PlatformLogger.warn("Runtime", "Platform is already running.");
      return;
    }

    this.state = "starting";
    this.uptimeStart = Date.now();
    PlatformLogger.info("Runtime", "Beginning core platform initialization pipeline...");

    try {
      // 1. Initialize EventBus & CommandDispatcher
      EventBus.getInstance();
      CommandDispatcher.getInstance();
      PlatformLogger.debug("Runtime", "Event & Command messaging channels established.");

      // 2. Start Module Engine
      PlatformLogger.info("Runtime", "Booting core modules...");
      const modEngine = ModuleEngine.getInstance();
      const modules = modEngine.listModules();
      for (const m of modules) {
        await modEngine.startModule(m.metadata.id);
      }

      // 3. Start Plugin Engine
      PlatformLogger.info("Runtime", "Booting system extension plugins...");
      const pluginEngine = PluginEngine.getInstance();
      const plugins = pluginEngine.listPlugins();
      for (const p of plugins) {
        await pluginEngine.activatePlugin(p.metadata.id);
      }

      // 4. Fire Startup event
      await EventBus.getInstance().publish("system_startup_complete", { timestamp: Date.now() }, "runtime");

      this.state = "running";
      PlatformLogger.info("Runtime", "Application startup completed successfully. Systems are live.");
    } catch (err: any) {
      this.state = "crashed";
      PlatformLogger.error("Runtime", `Fatal crash during startup sequence: ${err.message}`);
      throw err;
    }
  }

  /**
   * Application Shutdown Pipeline
   */
  public async shutdown(): Promise<void> {
    if (this.state === "stopped") {
      PlatformLogger.warn("Runtime", "Platform already stopped.");
      return;
    }

    PlatformLogger.info("Runtime", "Initiating shutdown sequence...");
    
    try {
      // 1. Shutdown plugin engines
      const pluginEngine = PluginEngine.getInstance();
      const plugins = pluginEngine.listPlugins();
      for (const p of plugins) {
        if (p.state.status === "active") {
          await pluginEngine.deactivatePlugin(p.metadata.id);
        }
      }

      // 2. Stop modules
      const modEngine = ModuleEngine.getInstance();
      const modules = modEngine.listModules();
      for (const m of modules) {
        if (m.state.status === "active") {
          await modEngine.stopModule(m.metadata.id);
        }
      }

      // 3. Clear buses
      CommandDispatcher.getInstance().clearAll();
      EventBus.getInstance().clearHistory();

      this.state = "stopped";
      this.uptimeStart = 0;
      PlatformLogger.info("Runtime", "Platform shutdown sequence completed gracefully.");
    } catch (err: any) {
      PlatformLogger.error("Runtime", `Error during shutdown sequence: ${err.message}`);
      this.state = "stopped";
    }
  }

  /**
   * Safe Restart Pipeline
   */
  public async safeRestart(): Promise<void> {
    PlatformLogger.info("Runtime", "Triggering safe restart sequence...");
    this.state = "restarting";

    // 1. Snapshot Session checkpoint
    SessionManager.getInstance().createCrashCheckpoint();

    // 2. Run Shutdown
    await this.shutdown();

    // 3. Run Startup
    await this.startup();

    // 4. Restore Session from checkpoint
    SessionManager.getInstance().restoreSessionFromCrash();

    PlatformLogger.info("Runtime", "Platform safe-restart completed successfully. State and layouts restored.");
  }

  /**
   * Simulation of runtime crash and hot-restart recovery
   */
  public async triggerCrashAndRecovery(): Promise<void> {
    PlatformLogger.error("Runtime", "CRITICAL COMPONENT FAULT SIMULATED: Triggering emergency crash protocols.");
    this.state = "crashed";

    // Simulate crash reporting
    await EventBus.getInstance().publish("system_crashed_fault", { faultId: "MEM_HEAPS_BOUND_ERR", timestamp: Date.now() }, "runtime");

    // Hold state shortly
    await new Promise(resolve => setTimeout(resolve, 1500));

    PlatformLogger.info("Runtime", "Crash Recovery Engine activated. Initiating automatic safe warm-restart...");
    await this.safeRestart();
  }

  /**
   * Hot-Reload registered module files and controllers
   */
  public async hotReloadModule(moduleId: string): Promise<void> {
    if (!this.config.hotReloadEnabled) {
      throw new Error("[Runtime:HotReload] Hot reloading is currently disabled in system configuration profiles.");
    }

    PlatformLogger.info("Runtime", `Initiating Hot-Reload on module: ${moduleId}...`);
    
    try {
      // Stop active module
      const modEngine = ModuleEngine.getInstance();
      await modEngine.restartModule(moduleId);
      
      // Notify
      await EventBus.getInstance().publish("module_hot_reloaded", { moduleId, timestamp: Date.now() }, "runtime");
      PlatformLogger.info("Runtime", `Hot-Reload success for module: ${moduleId}`);
    } catch (err: any) {
      PlatformLogger.error("Runtime", `Hot-Reload failed for module ${moduleId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update Configuration
   */
  public updateRuntimeConfig(patch: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...patch };
    PlatformLogger.info("Runtime", "Runtime configuration updated.", patch);
  }

  /**
   * Get Diagnostic Report
   */
  public runDiagnosticsReport(): any {
    const health = HealthMonitor.getInstance().runDiagnosticsReport();
    const perfHistory = PerformanceMonitor.getInstance().getHistory();
    const latestPerf = perfHistory.length > 0 ? perfHistory[perfHistory.length - 1] : null;
    const ramUsageGB = latestPerf ? (latestPerf.ramUsageBytes / (1024 * 1024 * 1024)).toFixed(1) : "0";

    return {
      runtimeState: this.state,
      uptimeSec: this.uptimeStart > 0 ? Math.floor((Date.now() - this.uptimeStart) / 1000) : 0,
      config: this.config,
      healthReport: health,
      performanceLatest: latestPerf,
      memoryStatus: latestPerf ? `${ramUsageGB} GB / 64.0 GB` : "Unknown"
    };
  }
}
