export interface MetricRecord {
  timestamp: number;
  cpuUsage: number;
  gpuUsage: number;
  ramUsageBytes: number;
  diskUsageBytes: number;
  cacheUsageBytes: number;
  fps: number;
  renderSpeedMultiplier: number; // e.g. 2.4x real-time
  timelineLatencyMs: number;
  pluginLatencyMs: number;
  moduleLatencyMs: number;
  workflowLatencyMs: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private records: MetricRecord[] = [];
  private maxRecordsLimit = 100;

  private currentCpu = 14;
  private currentGpu = 8;
  private currentRamBytes = 1024 * 1024 * 1024 * 1.5; // 1.5 GB
  private currentDiskBytes = 1024 * 1024 * 1024 * 12; // 12 GB
  private currentCacheBytes = 1024 * 1024 * 320; // 320 MB
  private currentFps = 60;
  private currentRenderSpeed = 1.0;
  private currentTimelineLatency = 4;
  private currentPluginLatency = 12;
  private currentModuleLatency = 8;
  private currentWorkflowLatency = 45;

  private constructor() {
    this.startPerformancePulse();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public recordMetricPatch(patch: Partial<Omit<MetricRecord, "timestamp">>): void {
    if (patch.cpuUsage !== undefined) this.currentCpu = patch.cpuUsage;
    if (patch.gpuUsage !== undefined) this.currentGpu = patch.gpuUsage;
    if (patch.ramUsageBytes !== undefined) this.currentRamBytes = patch.ramUsageBytes;
    if (patch.diskUsageBytes !== undefined) this.currentDiskBytes = patch.diskUsageBytes;
    if (patch.cacheUsageBytes !== undefined) this.currentCacheBytes = patch.cacheUsageBytes;
    if (patch.fps !== undefined) this.currentFps = patch.fps;
    if (patch.renderSpeedMultiplier !== undefined) this.currentRenderSpeed = patch.renderSpeedMultiplier;
    if (patch.timelineLatencyMs !== undefined) this.currentTimelineLatency = patch.timelineLatencyMs;
    if (patch.pluginLatencyMs !== undefined) this.currentPluginLatency = patch.pluginLatencyMs;
    if (patch.moduleLatencyMs !== undefined) this.currentModuleLatency = patch.moduleLatencyMs;
    if (patch.workflowLatencyMs !== undefined) this.currentWorkflowLatency = patch.workflowLatencyMs;

    this.pulseRecord();
  }

  public getHistory(): MetricRecord[] {
    return [...this.records];
  }

  public getLatestRecord(): MetricRecord {
    if (this.records.length > 0) {
      return this.records[this.records.length - 1];
    }
    return this.createRecord();
  }

  public getAverages(): Omit<MetricRecord, "timestamp"> {
    if (this.records.length === 0) {
      return this.createRecord();
    }

    const len = this.records.length;
    const totals = this.records.reduce(
      (acc, rec) => {
        acc.cpuUsage += rec.cpuUsage;
        acc.gpuUsage += rec.gpuUsage;
        acc.ramUsageBytes += rec.ramUsageBytes;
        acc.diskUsageBytes += rec.diskUsageBytes;
        acc.cacheUsageBytes += rec.cacheUsageBytes;
        acc.fps += rec.fps;
        acc.renderSpeedMultiplier += rec.renderSpeedMultiplier;
        acc.timelineLatencyMs += rec.timelineLatencyMs;
        acc.pluginLatencyMs += rec.pluginLatencyMs;
        acc.moduleLatencyMs += rec.moduleLatencyMs;
        acc.workflowLatencyMs += rec.workflowLatencyMs;
        return acc;
      },
      {
        cpuUsage: 0,
        gpuUsage: 0,
        ramUsageBytes: 0,
        diskUsageBytes: 0,
        cacheUsageBytes: 0,
        fps: 0,
        renderSpeedMultiplier: 0,
        timelineLatencyMs: 0,
        pluginLatencyMs: 0,
        moduleLatencyMs: 0,
        workflowLatencyMs: 0,
      }
    );

    return {
      cpuUsage: Math.round(totals.cpuUsage / len),
      gpuUsage: Math.round(totals.gpuUsage / len),
      ramUsageBytes: Math.round(totals.ramUsageBytes / len),
      diskUsageBytes: Math.round(totals.diskUsageBytes / len),
      cacheUsageBytes: Math.round(totals.cacheUsageBytes / len),
      fps: Math.round(totals.fps / len),
      renderSpeedMultiplier: parseFloat((totals.renderSpeedMultiplier / len).toFixed(2)),
      timelineLatencyMs: Math.round(totals.timelineLatencyMs / len),
      pluginLatencyMs: Math.round(totals.pluginLatencyMs / len),
      moduleLatencyMs: Math.round(totals.moduleLatencyMs / len),
      workflowLatencyMs: Math.round(totals.workflowLatencyMs / len),
    };
  }

  private pulseRecord(): void {
    const rec = this.createRecord();
    this.records.push(rec);
    if (this.records.length > this.maxRecordsLimit) {
      this.records.shift();
    }
  }

  private createRecord(): MetricRecord {
    return {
      timestamp: Date.now(),
      cpuUsage: this.currentCpu,
      gpuUsage: this.currentGpu,
      ramUsageBytes: this.currentRamBytes,
      diskUsageBytes: this.currentDiskBytes,
      cacheUsageBytes: this.currentCacheBytes,
      fps: this.currentFps,
      renderSpeedMultiplier: this.currentRenderSpeed,
      timelineLatencyMs: this.currentTimelineLatency,
      pluginLatencyMs: this.currentPluginLatency,
      moduleLatencyMs: this.currentModuleLatency,
      workflowLatencyMs: this.currentWorkflowLatency,
    };
  }

  private startPerformancePulse(): void {
    // Generate base ticks to fill history
    for (let i = 0; i < 15; i++) {
      this.pulseRecord();
    }

    setInterval(() => {
      // Simulate subtle hardware state fluctuations
      const cpuDelta = Math.floor((Math.random() - 0.5) * 4);
      const gpuDelta = Math.floor((Math.random() - 0.5) * 2);
      const fpsDelta = Math.floor((Math.random() - 0.5) * 2);

      this.currentCpu = Math.max(5, Math.min(98, this.currentCpu + cpuDelta));
      this.currentGpu = Math.max(2, Math.min(100, this.currentGpu + gpuDelta));
      this.currentFps = Math.max(58, Math.min(60, this.currentFps + fpsDelta));

      this.pulseRecord();
    }, 3000);
  }
}
