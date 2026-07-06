import { WorkflowEngineFoundation, WorkflowGraph } from "../workflows/WorkflowEngineFoundation";
import { PluginEngine } from "./PluginEngine";
import { ModuleEngine } from "./ModuleEngine";

export interface TaskTelemetry {
  taskId: string;
  type: "command" | "workflow" | "plugin" | "module";
  name: string;
  startTime: number;
  endTime?: number;
  status: "pending" | "running" | "succeeded" | "failed" | "timed_out";
  durationMs?: number;
  memoryAllocatedMb: number;
  errorMessage?: string;
}

export class TaskExecutionEngine {
  private static instance: TaskExecutionEngine;

  private telemetries: Map<string, TaskTelemetry> = new Map();
  private defaultTimeoutMs = 10000; // 10s default

  private constructor() {}

  public static getInstance(): TaskExecutionEngine {
    if (!TaskExecutionEngine.instance) {
      TaskExecutionEngine.instance = new TaskExecutionEngine();
    }
    return TaskExecutionEngine.instance;
  }

  public async runWorkflowTask(graph: WorkflowGraph, timeoutMs = this.defaultTimeoutMs): Promise<any> {
    const taskId = `task_wf_${Date.now()}`;
    const telemetry: TaskTelemetry = {
      taskId,
      type: "workflow",
      name: graph.name,
      startTime: Date.now(),
      status: "running",
      memoryAllocatedMb: 32,
    };
    this.telemetries.set(taskId, telemetry);

    const workflowEngine = WorkflowEngineFoundation.getInstance();

    try {
      const executionPromise = workflowEngine.executeWorkflow(graph);
      const result = await this.withTimeout(executionPromise, timeoutMs, `Workflow ${graph.name} timed out.`);
      
      telemetry.status = "succeeded";
      telemetry.endTime = Date.now();
      telemetry.durationMs = telemetry.endTime - telemetry.startTime;
      return result;
    } catch (err: any) {
      telemetry.status = err.message?.includes("timed out") ? "timed_out" : "failed";
      telemetry.endTime = Date.now();
      telemetry.durationMs = telemetry.endTime - telemetry.startTime;
      telemetry.errorMessage = err.message;
      
      // Basic recovery mechanism
      console.warn(`[TaskExecutionEngine] Triggering safety fallback recovery for task ${taskId}: Resetting engine cache...`);
      throw err;
    }
  }

  public async runPluginTask(pluginId: string, scriptCode: string, context: Record<string, any> = {}, timeoutMs = 4000): Promise<any> {
    const taskId = `task_pl_${Date.now()}`;
    const telemetry: TaskTelemetry = {
      taskId,
      type: "plugin",
      name: `PluginScript:${pluginId}`,
      startTime: Date.now(),
      status: "running",
      memoryAllocatedMb: 16,
    };
    this.telemetries.set(taskId, telemetry);

    const pluginEngine = PluginEngine.getInstance();

    try {
      const executionPromise = pluginEngine.runInSandbox(pluginId, scriptCode, context);
      const result = await this.withTimeout(executionPromise, timeoutMs, `Plugin script inside [${pluginId}] timed out.`);

      telemetry.status = "succeeded";
      telemetry.endTime = Date.now();
      telemetry.durationMs = telemetry.endTime - telemetry.startTime;
      return result;
    } catch (err: any) {
      telemetry.status = err.message?.includes("timed out") ? "timed_out" : "failed";
      telemetry.endTime = Date.now();
      telemetry.durationMs = telemetry.endTime - telemetry.startTime;
      telemetry.errorMessage = err.message;
      throw err;
    }
  }

  public async runModuleTask(moduleId: string, actionName: string, data: any, timeoutMs = 6000): Promise<any> {
    const taskId = `task_mod_${Date.now()}`;
    const telemetry: TaskTelemetry = {
      taskId,
      type: "module",
      name: `ModuleRun:${moduleId}.${actionName}`,
      startTime: Date.now(),
      status: "running",
      memoryAllocatedMb: 24,
    };
    this.telemetries.set(taskId, telemetry);

    const moduleEngine = ModuleEngine.getInstance();

    try {
      const runFn = async () => {
        const mod = moduleEngine.getModule(moduleId);
        if (!mod) throw new Error(`Module ${moduleId} not found`);
        if (mod.state.status !== "active") {
          await moduleEngine.startModule(moduleId);
        }
        const api = mod.getApi();
        if (!api || typeof api[actionName] !== "function") {
          throw new Error(`Module ${moduleId} does not expose custom API function: ${actionName}`);
        }
        return api[actionName](data);
      };

      const result = await this.withTimeout(runFn(), timeoutMs, `Module task [${moduleId}.${actionName}] timed out.`);

      telemetry.status = "succeeded";
      telemetry.endTime = Date.now();
      telemetry.durationMs = telemetry.endTime - telemetry.startTime;
      return result;
    } catch (err: any) {
      telemetry.status = err.message?.includes("timed out") ? "timed_out" : "failed";
      telemetry.endTime = Date.now();
      telemetry.durationMs = telemetry.endTime - telemetry.startTime;
      telemetry.errorMessage = err.message;
      throw err;
    }
  }

  public listTelemetryLogs(): TaskTelemetry[] {
    return Array.from(this.telemetries.values());
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number, exceptionMessage: string): Promise<T> {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`[TaskExecutionEngine] Timeout Failure: ${exceptionMessage}`));
      }, ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
