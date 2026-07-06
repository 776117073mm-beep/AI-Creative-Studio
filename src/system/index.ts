import { SystemStats } from "../types";

export class SystemHealthCheck {
  public static assessHealth(stats: SystemStats): {
    status: "healthy" | "warning" | "critical";
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let status: "healthy" | "warning" | "critical" = "healthy";

    if (stats.gpuUsage > 90 || stats.cpuUsage > 90) {
      status = "warning";
      recommendations.push("High computational load detected. Consider scaling rendering sub-threads.");
    }

    if (stats.gpuTemp > 80 || stats.cpuTemp > 75) {
      status = "warning";
      recommendations.push("Hardware thermal throttle warning. Enable cooling loops or slow down frame rendering rate.");
    }

    if (stats.ramUsage / stats.ramMax > 0.85) {
      status = "critical";
      recommendations.push("RAM threshold exceeded. Freeing unused assets from memory cache immediately.");
    }

    return {
      status,
      recommendations: recommendations.length > 0 ? recommendations : ["All hardware registers are operating within healthy metrics."]
    };
  }
}
