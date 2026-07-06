export type AiTaskStatus = "pending" | "running" | "completed" | "failed" | "rolled_back";

export interface IAiTask {
  id: string;
  name: string;
  toolName: string;
  moduleName: string;
  params: Record<string, any>;
  dependencies: string[]; // Task IDs that must be completed before this task runs
  priority: "low" | "medium" | "high";
  status: AiTaskStatus;
  estimatedDurationMs: number;
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface IAiExecutionGraph {
  nodes: Record<string, IAiTask>;
  edges: { from: string; to: string }[];
  parallelGroups: string[][]; // Group of task IDs that can run in parallel
  priorityQueue: string[]; // Sequential order based on dependency resolution
}

export interface IAiExecutionPlan {
  id: string;
  originalRequest: string;
  graph: IAiExecutionGraph;
  estimatedTotalRuntimeMs: number;
  optimizationNotes: string[];
  requiresConfirmation: boolean;
  destructiveActions: string[];
}

export interface IProjectModel {
  id: string;
  name: string;
  assets: {
    id: string;
    name: string;
    type: "video" | "audio" | "image" | "3d" | "document";
    size: string;
    durationSec?: number;
    resolution?: string;
  }[];
  compositions: {
    id: string;
    name: string;
    tracks: {
      id: string;
      type: "video" | "audio" | "subtitle";
      clips: {
        id: string;
        assetId: string;
        startFrame: number;
        endFrame: number;
        effects: { type: string; params: Record<string, any> }[];
      }[];
    }[];
  }[];
  colorNodes: { id: string; type: string; gradeParams: Record<string, any> }[];
  vfxNodes: { id: string; type: string; params: Record<string, any> }[];
}

export interface ITimelineModel {
  playheadFrame: number;
  fps: number;
  markers: { frame: number; label: string; color: string }[];
  selectedClipIds: string[];
  trackCount: number;
  durationFrames: number;
  nestedTimelines: string[];
}

export interface IVisionAnalysis {
  scenesDetected: { startFrame: number; endFrame: number; confidence: number; description: string }[];
  objectsTracked: { objectId: string; label: string; keyframes: { frame: number; boundingBox: number[] }[] }[];
  facesRecognized: { faceId: string; gender?: string; ageRange?: string; boundingBox: number[] }[];
  textOcr: { frame: number; text: string; location: number[] }[];
  cameraMotion: "static" | "pan" | "zoom" | "tilt" | "handheld" | "dolly";
  lightingProfile: "natural" | "low_key" | "high_key" | "cinematic_hdr";
  compositionMetrics: { ruleOfThirdsScore: number; headroomScore: number };
}

export interface IAudioAnalysis {
  vocalSegments: { startFrame: number; endFrame: number; speakerId: string; transcript: string; emotion: string }[];
  silenceSegments: { startSec: number; endSec: number }[];
  musicTracks: { startSec: number; endSec: number; tempoBpm: number; genre: string; confidence: number }[];
  noiseProfile: { avgNoiseFloorDb: number; transientHumHz: number[] };
  emotionAverages: { excited: number; calm: number; tense: number };
}

export interface IMemoryState {
  conversationHistory: { sender: "user" | "ai"; text: string; timestamp: number }[];
  projectCheckpointHistory: { id: string; description: string; timestamp: number }[];
  workflowHistory: { id: string; planId: string; name: string; timestamp: number; success: boolean }[];
  userPreferences: {
    favoriteColorLut?: string;
    autoSubtitleLanguage?: string;
    defaultFps?: number;
    safetyConfirmationsEnabled: boolean;
  };
  frequentlyUsedActions: Record<string, number>;
}

export interface IAiPlugin {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  onExecutePlan?: (plan: IAiExecutionPlan) => Promise<IAiExecutionPlan>;
  onParsePrompt?: (prompt: string) => Promise<Partial<IAiExecutionPlan>>;
}
