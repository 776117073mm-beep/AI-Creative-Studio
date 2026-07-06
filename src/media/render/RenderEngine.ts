export interface RenderTask {
  id: string;
  projectName: string;
  targetWidth: number;
  targetHeight: number;
  fps: number;
  durationSec: number;
  targetCodec: string;
  status: "queued" | "rendering" | "completed" | "failed" | "cancelled";
  progressPercent: number;
  elapsedSec: number;
  remainingSec: number;
  outputPath?: string;
  error?: string;
}

export class RenderEngine {
  private static instance: RenderEngine;
  private activeJobs: Map<string, RenderTask> = new Map();
  private cancellationTokens: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): RenderEngine {
    if (!RenderEngine.instance) {
      RenderEngine.instance = new RenderEngine();
    }
    return RenderEngine.instance;
  }

  /**
   * Spawns an asynchronous compilation render job
   */
  public async renderComposition(
    projectName: string,
    durationSec: number,
    settings: { width: number; height: number; fps: number; codec: string },
    onProgress?: (task: RenderTask) => void
  ): Promise<RenderTask> {
    const taskId = `render_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const task: RenderTask = {
      id: taskId,
      projectName,
      targetWidth: settings.width,
      targetHeight: settings.height,
      fps: settings.fps,
      durationSec,
      targetCodec: settings.codec,
      status: "queued",
      progressPercent: 0,
      elapsedSec: 0,
      remainingSec: 0
    };

    this.activeJobs.set(taskId, task);
    this.cancellationTokens.set(taskId, false);

    console.log(`[RenderEngine] Starting compilation job [${taskId}] for project "${projectName}"...`);

    // Asynchronous render simulator thread
    this.processRenderJob(taskId, onProgress);

    return task;
  }

  /**
   * Cancel an active rendering task
   */
  public cancelRender(taskId: string): void {
    if (this.cancellationTokens.has(taskId)) {
      this.cancellationTokens.set(taskId, true);
      const task = this.activeJobs.get(taskId);
      if (task) {
        task.status = "cancelled";
        console.log(`[RenderEngine] Render job [${taskId}] was issued cancellation token.`);
      }
    }
  }

  /**
   * Get render details
   */
  public getTask(taskId: string): RenderTask | undefined {
    return this.activeJobs.get(taskId);
  }

  /**
   * List of all active/historical compilation jobs
   */
  public listTasks(): RenderTask[] {
    return Array.from(this.activeJobs.values());
  }

  private async processRenderJob(taskId: string, onProgress?: (task: RenderTask) => void): Promise<void> {
    const task = this.activeJobs.get(taskId);
    if (!task) return;

    task.status = "rendering";
    const totalFrames = Math.floor(task.durationSec * task.fps);
    const startRenderTime = Date.now();

    // Loop through individual frame baking pipelines
    for (let currentFrame = 1; currentFrame <= totalFrames; currentFrame++) {
      // Check for cancellation
      if (this.cancellationTokens.get(taskId)) {
        task.status = "cancelled";
        if (onProgress) onProgress(task);
        return;
      }

      // Simulate heavy GPU shader composition calculations
      const frameDelay = task.targetWidth > 1920 ? 8 : 3; // slower for 4K
      await new Promise(resolve => setTimeout(resolve, frameDelay));

      const elapsedMs = Date.now() - startRenderTime;
      const progress = (currentFrame / totalFrames);
      const estimatedTotalMs = elapsedMs / progress;
      const remainingMs = estimatedTotalMs - elapsedMs;

      task.progressPercent = Math.floor(progress * 100);
      task.elapsedSec = elapsedMs / 1000;
      task.remainingSec = remainingMs / 1000;

      if (currentFrame % 10 === 0 || currentFrame === totalFrames) {
        if (onProgress) onProgress(task);
      }
    }

    task.status = "completed";
    task.progressPercent = 100;
    task.remainingSec = 0;
    task.outputPath = `blob:https://studio.agency.com/renders/completed_${taskId}.mp4`;
    
    console.log(`[RenderEngine] Render compilation complete for job [${taskId}]. Output path: ${task.outputPath}`);
    if (onProgress) onProgress(task);
  }
}
