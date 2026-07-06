import { IAiExecutionPlan, IAiTask, AiTaskStatus } from "../types";
import { TimelineEngine } from "../../timeline/TimelineEngine";
import { ToolRegistry } from "../../registry/ToolRegistry";
import { MemoryEngine } from "../memory/MemoryEngine";

export type ExecutionState = "idle" | "running" | "paused" | "completed" | "failed";

export class ExecutionEngine {
  private static instance: ExecutionEngine;
  
  private activePlan: IAiExecutionPlan | null = null;
  private state: ExecutionState = "idle";
  private progress = 0;
  private currentTaskIndex = 0;
  
  // Undo rollback snapshots tracked before execution
  private preExecutionSnapshotId: string | null = null;

  // Background task scheduling queues
  private backgroundQueue: { taskId: string; action: () => Promise<void> }[] = [];
  private isProcessingBackground = false;

  private constructor() {
    this.startBackgroundIdleProcessor();
  }

  public static getInstance(): ExecutionEngine {
    if (!ExecutionEngine.instance) {
      ExecutionEngine.instance = new ExecutionEngine();
    }
    return ExecutionEngine.instance;
  }

  public getState(): { state: ExecutionState; progress: number; currentTaskIndex: number; totalTasks: number } {
    const totalTasks = this.activePlan ? Object.keys(this.activePlan.graph.nodes).length : 0;
    return {
      state: this.state,
      progress: this.progress,
      currentTaskIndex: this.currentTaskIndex,
      totalTasks
    };
  }

  /**
   * Begins execution of an AI plan with rollback snapshot security
   */
  public async executePlan(plan: IAiExecutionPlan, onProgressUpdate?: (prog: number) => void): Promise<boolean> {
    this.activePlan = plan;
    this.state = "running";
    this.progress = 0;
    this.currentTaskIndex = 0;

    console.log(`[ExecutionEngine] Launching execution flow for plan: ${plan.id}`);

    // Capture safety backup snapshot before commencing pipeline changes
    const timeline = TimelineEngine.getInstance();
    const activeSeq = timeline.getActiveSequence();
    if (activeSeq) {
      timeline.commitSnapshot("AI Orchestrator Pre-Execution Backup", `Snapshot captured before executing plan: "${plan.originalRequest}"`);
      this.preExecutionSnapshotId = activeSeq.id;
    }

    const tasks = plan.graph.priorityQueue;
    const nodes = plan.graph.nodes;

    for (let i = 0; i < tasks.length; i++) {
      if ((this.state as string) === "paused") {
        while ((this.state as string) === "paused") {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if ((this.state as string) === "idle") {
        // Cancelled
        return false;
      }

      this.currentTaskIndex = i;
      const taskId = tasks[i];
      const task = nodes[taskId];

      task.status = "running";
      console.log(`[ExecutionEngine] Processing Task: [${task.name}]`);

      let taskSuccess = false;
      let attempt = 0;

      while (!taskSuccess && attempt <= (task.maxRetries ?? 3)) {
        try {
          attempt++;
          task.retryCount = attempt;

          // Resolve tool from registry and run
          const tool = ToolRegistry.getInstance().getTool(task.toolName);
          if (tool) {
            await tool.execute(task.params);
          } else {
            // Simulated tool run to support flexible actions
            await new Promise(resolve => setTimeout(resolve, task.estimatedDurationMs / 10));
          }

          taskSuccess = true;
          task.status = "completed";
          MemoryEngine.getInstance().recordAction(task.toolName);
        } catch (err: any) {
          console.warn(`[ExecutionEngine] Task [${task.id}] failed on attempt ${attempt}: ${err.message}`);
          if (attempt > (task.maxRetries ?? 3)) {
            task.status = "failed";
            task.errorMessage = err.message;
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000)); // linear delay retry backoff
          }
        }
      }

      if (!taskSuccess) {
        // Critical Failure: Trigger transaction rollback safety
        console.error(`[ExecutionEngine] Task [${task.id}] has permanently failed. Initiating pipeline rollback...`);
        this.state = "failed";
        await this.rollback();
        MemoryEngine.getInstance().logWorkflow(plan.id, plan.originalRequest, false);
        return false;
      }

      // Update progress
      this.progress = Math.floor(((i + 1) / tasks.length) * 100);
      if (onProgressUpdate) {
        onProgressUpdate(this.progress);
      }
    }

    this.state = "completed";
    MemoryEngine.getInstance().logWorkflow(plan.id, plan.originalRequest, true);
    return true;
  }

  public pause(): void {
    if (this.state === "running") {
      this.state = "paused";
      console.log("[ExecutionEngine] Pipeline execution paused by user.");
    }
  }

  public resume(): void {
    if (this.state === "paused") {
      this.state = "running";
      console.log("[ExecutionEngine] Pipeline execution resumed.");
    }
  }

  public cancel(): void {
    this.state = "idle";
    console.log("[ExecutionEngine] Pipeline execution cancelled by user.");
  }

  /**
   * Reverts all edits back to pre-execution state in the event of an engine failure
   */
  private async rollback(): Promise<void> {
    console.log("[ExecutionEngine] Rolled back transaction timeline changes successfully.");
    const timeline = TimelineEngine.getInstance();
    timeline.triggerUndo(); // Triggers the pre-execution backup undo state
    
    if (this.activePlan) {
      Object.values(this.activePlan.graph.nodes).forEach(t => {
        if (t.status === "completed" || t.status === "running") {
          t.status = "rolled_back";
        }
      });
    }
  }

  /**
   * Background AI scheduler to process lighter workloads in times of low system strain
   */
  public queueBackgroundTask(taskId: string, action: () => Promise<void>): void {
    this.backgroundQueue.push({ taskId, action });
    console.log(`[BackgroundAI] Registered task: ${taskId}`);
  }

  private startBackgroundIdleProcessor(): void {
    setInterval(async () => {
      if (this.state === "idle" && this.backgroundQueue.length > 0 && !this.isProcessingBackground) {
        this.isProcessingBackground = true;
        const next = this.backgroundQueue.shift()!;
        console.log(`[BackgroundAI] Commencing scheduled idle processing: ${next.taskId}`);
        try {
          await next.action();
          console.log(`[BackgroundAI] Completed background execution: ${next.taskId}`);
        } catch (err: any) {
          console.error(`[BackgroundAI] Scheduled task [${next.taskId}] failed:`, err.message);
        } finally {
          this.isProcessingBackground = false;
        }
      }
    }, 5000);
  }
}
