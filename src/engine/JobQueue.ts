export type JobStatus = 
  | "scheduled" 
  | "running" 
  | "paused" 
  | "completed" 
  | "failed" 
  | "cancelled";

export interface BackgroundJob {
  id: string;
  name: string;
  status: JobStatus;
  priority: number; // Higher is run sooner
  progress: number; // 0 to 100
  retryCount: number;
  maxRetries: number;
  scheduledTime?: number;
  errorMessage?: string;
  payload: any;
  run: (onProgress: (p: number) => void) => Promise<any>;
}

export class JobQueue {
  private static instance: JobQueue;

  private jobs: Map<string, BackgroundJob> = new Map();
  private maxConcurrentJobs = 3;
  private runningCount = 0;
  private queueInterval: any;

  private constructor() {
    this.startQueueWorker();
  }

  public static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  public addJob(job: Omit<BackgroundJob, "progress" | "retryCount" | "status"> & Partial<Pick<BackgroundJob, "status">>): string {
    const fullJob: BackgroundJob = {
      ...job,
      status: job.status || "scheduled",
      progress: 0,
      retryCount: 0,
    };

    this.jobs.set(fullJob.id, fullJob);
    console.log(`[JobQueue] Enqueued Job [${fullJob.name}] (Priority: ${fullJob.priority})`);
    return fullJob.id;
  }

  public pauseJob(id: string): void {
    const job = this.jobs.get(id);
    if (job && job.status === "running") {
      job.status = "paused";
      this.runningCount = Math.max(0, this.runningCount - 1);
      console.log(`[JobQueue] Paused Job: ${job.name}`);
    }
  }

  public resumeJob(id: string): void {
    const job = this.jobs.get(id);
    if (job && job.status === "paused") {
      job.status = "scheduled";
      console.log(`[JobQueue] Resumed Job: ${job.name}. Returned to scheduler queue.`);
    }
  }

  public stopJob(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      const wasRunning = job.status === "running";
      job.status = "cancelled";
      job.progress = 0;
      if (wasRunning) {
        this.runningCount = Math.max(0, this.runningCount - 1);
      }
      console.log(`[JobQueue] Stopped & Cancelled Job: ${job.name}`);
    }
  }

  public restartJob(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      this.stopJob(id);
      job.status = "scheduled";
      job.progress = 0;
      job.retryCount = 0;
      job.errorMessage = undefined;
      console.log(`[JobQueue] Restarted Job: ${job.name}`);
    }
  }

  public getJobsByStatus(status: JobStatus): BackgroundJob[] {
    return Array.from(this.jobs.values()).filter(j => j.status === status);
  }

  public listAllJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values());
  }

  public getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  private startQueueWorker(): void {
    this.queueInterval = setInterval(async () => {
      if (this.runningCount >= this.maxConcurrentJobs) return;

      // Select next jobs to run ordered by Priority descending, then scheduledTime ascending
      const candidateJobs = Array.from(this.jobs.values())
        .filter(j => {
          if (j.status !== "scheduled") return false;
          if (j.scheduledTime && j.scheduledTime > Date.now()) return false;
          return true;
        })
        .sort((a, b) => b.priority - a.priority || (a.scheduledTime || 0) - (b.scheduledTime || 0));

      if (candidateJobs.length === 0) return;

      const jobsToStart = candidateJobs.slice(0, this.maxConcurrentJobs - this.runningCount);

      for (const job of jobsToStart) {
        this.runJobAsync(job);
      }
    }, 1000);
  }

  private async runJobAsync(job: BackgroundJob): Promise<void> {
    this.runningCount++;
    job.status = "running";
    console.log(`[JobQueue] Worker running Job: ${job.name}`);

    try {
      await job.run((progress) => {
        // Guard if the job was paused or stopped while running
        if (job.status === "running") {
          job.progress = progress;
        }
      });

      if (job.status === "running") {
        job.status = "completed";
        job.progress = 100;
        console.log(`[JobQueue] Successfully Completed Job: ${job.name}`);
      }
    } catch (err: any) {
      if (job.status === "running") {
        if (job.retryCount < job.maxRetries) {
          job.retryCount++;
          job.status = "scheduled"; // Retry later
          console.warn(`[JobQueue] Job [${job.name}] failed. Retrying count: ${job.retryCount}/${job.maxRetries}`);
        } else {
          job.status = "failed";
          job.errorMessage = err?.message || "Unknown execution error";
          console.error(`[JobQueue] FAILED Job: ${job.name} after ${job.maxRetries} retries. Error: ${job.errorMessage}`);
        }
      }
    } finally {
      this.runningCount = Math.max(0, this.runningCount - 1);
    }
  }
}
