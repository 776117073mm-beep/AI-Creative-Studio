import { IMemoryState } from "../types";

export class MemoryEngine {
  private static instance: MemoryEngine;
  private state: IMemoryState;

  private constructor() {
    this.state = this.loadState();
  }

  public static getInstance(): MemoryEngine {
    if (!MemoryEngine.instance) {
      MemoryEngine.instance = new MemoryEngine();
    }
    return MemoryEngine.instance;
  }

  /**
   * Loads initial state from localStorage or defaults to clean mock values
   */
  private loadState(): IMemoryState {
    const defaultState: IMemoryState = {
      conversationHistory: [
        { sender: "ai", text: "Cognition System booting up. AI Creative brain connected to timeline pipelines.", timestamp: Date.now() - 3600000 }
      ],
      projectCheckpointHistory: [],
      workflowHistory: [],
      userPreferences: {
        favoriteColorLut: "kodak_gold",
        autoSubtitleLanguage: "English",
        defaultFps: 24,
        safetyConfirmationsEnabled: true
      },
      frequentlyUsedActions: {
        "color_lut_mapper": 8,
        "audio_noise_filter": 5,
        "subtitle_generator": 3
      }
    };

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem("ai_creative_studio_memory");
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (err) {
      console.warn("[MemoryEngine] Local storage load failed, using in-memory default", err);
    }
    return defaultState;
  }

  /**
   * Persists the current memory state to storage
   */
  private saveState(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("ai_creative_studio_memory", JSON.stringify(this.state));
      }
    } catch (err) {
      console.error("[MemoryEngine] Save state failed", err);
    }
  }

  public getState(): IMemoryState {
    return this.state;
  }

  /**
   * Adds a message to current conversation dialogue memory
   */
  public addMessage(sender: "user" | "ai", text: string): void {
    this.state.conversationHistory.push({
      sender,
      text,
      timestamp: Date.now()
    });
    // Keep a rolling window of 100 messages
    if (this.state.conversationHistory.length > 100) {
      this.state.conversationHistory.shift();
    }
    this.saveState();
  }

  /**
   * Logs a successful/failed workflow execution
   */
  public logWorkflow(planId: string, name: string, success: boolean): void {
    this.state.workflowHistory.push({
      id: `wf_hist_${Math.random().toString(36).substring(2, 9)}`,
      planId,
      name,
      timestamp: Date.now(),
      success
    });
    this.saveState();
  }

  /**
   * Records a project checkpoint state
   */
  public createProjectCheckpoint(description: string): void {
    this.state.projectCheckpointHistory.push({
      id: `chk_${Date.now()}`,
      description,
      timestamp: Date.now()
    });
    this.saveState();
  }

  /**
   * Updates user editor settings/preferences
   */
  public updatePreferences(prefs: Partial<IMemoryState["userPreferences"]>): void {
    this.state.userPreferences = {
      ...this.state.userPreferences,
      ...prefs
    };
    this.saveState();
  }

  /**
   * Increments action hit count for optimal tool selection priority ranking
   */
  public recordAction(toolName: string): void {
    if (!this.state.frequentlyUsedActions[toolName]) {
      this.state.frequentlyUsedActions[toolName] = 0;
    }
    this.state.frequentlyUsedActions[toolName]++;
    this.saveState();
  }

  public getFrequentlyUsedActions(): Record<string, number> {
    return this.state.frequentlyUsedActions;
  }

  /**
   * Wipes session history and resets memory structures
   */
  public clearMemory(): void {
    this.state.conversationHistory = [];
    this.state.projectCheckpointHistory = [];
    this.state.workflowHistory = [];
    this.saveState();
  }
}
