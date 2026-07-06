import { MemoryEngine } from "../memory/MemoryEngine";

export class AiHistoryManager {
  private static instance: AiHistoryManager;

  private constructor() {}

  public static getInstance(): AiHistoryManager {
    if (!AiHistoryManager.instance) {
      AiHistoryManager.instance = new AiHistoryManager();
    }
    return AiHistoryManager.instance;
  }

  /**
   * Retrieves log histories filtered by action type
   */
  public getHistory(type?: "convo" | "workflow" | "project"): any[] {
    const memory = MemoryEngine.getInstance().getState();
    if (type === "convo") return memory.conversationHistory;
    if (type === "workflow") return memory.workflowHistory;
    if (type === "project") return memory.projectCheckpointHistory;
    return [
      ...memory.conversationHistory,
      ...memory.workflowHistory,
      ...memory.projectCheckpointHistory
    ];
  }

  /**
   * Emits a new checkpoint save to support safe rollovers
   */
  public recordCheckpoint(description: string): void {
    MemoryEngine.getInstance().createProjectCheckpoint(description);
  }
}
