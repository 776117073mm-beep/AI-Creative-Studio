export type SubsystemStatus = "healthy" | "warning" | "critical" | "offline";

export interface SubsystemHealth {
  name: string;
  status: SubsystemStatus;
  lastHeartbeat: number;
  recoveryTriesCount: number;
  errorMessage?: string;
}

export class HealthMonitor {
  private static instance: HealthMonitor;

  private subsystems: Map<string, SubsystemHealth> = new Map();
  private checkIntervalId: any;

  private constructor() {
    this.registerSubsystems();
    this.startHeartbeatCheck();
  }

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  public reportHeartbeat(subsystemId: string, status: SubsystemStatus = "healthy", errorMessage?: string): void {
    const sub = this.subsystems.get(subsystemId);
    if (sub) {
      sub.status = status;
      sub.lastHeartbeat = Date.now();
      sub.errorMessage = errorMessage;
      if (status === "healthy") {
        sub.recoveryTriesCount = 0;
      }
    } else {
      this.subsystems.set(subsystemId, {
        name: subsystemId.toUpperCase().replace("_", " "),
        status,
        lastHeartbeat: Date.now(),
        recoveryTriesCount: 0,
        errorMessage,
      });
    }
  }

  public runDiagnosticsReport(): {
    overallStatus: SubsystemStatus;
    totalSubsystems: number;
    details: SubsystemHealth[];
  } {
    const list = Array.from(this.subsystems.values());
    let overall: SubsystemStatus = "healthy";

    for (const sub of list) {
      if (sub.status === "offline" || sub.status === "critical") {
        overall = "critical";
        break;
      } else if (sub.status === "warning") {
        overall = "warning";
      }
    }

    return {
      overallStatus: overall,
      totalSubsystems: list.length,
      details: list,
    };
  }

  public triggerRecoveryAction(subsystemId: string): void {
    const sub = this.subsystems.get(subsystemId);
    if (!sub) return;

    sub.recoveryTriesCount++;
    console.warn(`[HealthMonitor] Subsystem [${sub.name}] is unhealthy. Triggering Recovery Action attempt #${sub.recoveryTriesCount}...`);

    // Emulated subsystem hot-restart recovery process
    setTimeout(() => {
      sub.status = "healthy";
      sub.lastHeartbeat = Date.now();
      sub.errorMessage = undefined;
      console.log(`[HealthMonitor] Subsystem [${sub.name}] successfully RESTORED and marked healthy.`);
    }, 1500);
  }

  private registerSubsystems(): void {
    const now = Date.now();
    this.subsystems.set("di_container", { name: "Dependency Injection Container", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("state_engine", { name: "Global Application State Engine", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("resource_manager", { name: "Central Resource Manager", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("config_engine", { name: "Universal Configuration Engine", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("workflow_engine", { name: "Core Workflow Engine", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("job_queue", { name: "Job Queue Scheduler", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("task_execution_engine", { name: "Task Execution Engine", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("background_services", { name: "Background Services Orchestrator", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("file_watcher", { name: "File Watcher System", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("cache_engine", { name: "Multi-Tier Cache Engine", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("temp_file_manager", { name: "Temporary File Manager", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
    this.subsystems.set("performance_monitor", { name: "Live Performance Tracker", status: "healthy", lastHeartbeat: now, recoveryTriesCount: 0 });
  }

  private startHeartbeatCheck(): void {
    this.checkIntervalId = setInterval(() => {
      const now = Date.now();
      for (const [id, sub] of this.subsystems.entries()) {
        const timeSinceLastHeartbeat = now - sub.lastHeartbeat;

        // If no heartbeat reported for more than 12 seconds, flag warning/critical
        if (timeSinceLastHeartbeat > 12000 && sub.status === "healthy") {
          sub.status = "warning";
          sub.errorMessage = "Missing heartbeat signal.";
          console.warn(`[HealthMonitor] Subsystem heartbeat timeout: ${sub.name}`);
        }

        if (sub.status === "critical" || sub.status === "offline") {
          if (sub.recoveryTriesCount < 3) {
            this.triggerRecoveryAction(id);
          }
        }
      }
    }, 5000);
  }
}
