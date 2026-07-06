export interface HistoryAction {
  id: string;
  name: string; // Brief label e.g., "Split Clip", "Normalize Gain"
  description?: string;
  timestamp: number;
  undoFn: () => void;
  redoFn: () => void;
  groupName?: string; // Grouping transactions
}

export interface HistorySnapshot {
  id: string;
  name: string;
  timestamp: number;
  undoStackState: HistoryAction[];
  redoStackState: HistoryAction[];
}

export interface HistoryBranch {
  id: string;
  name: string;
  parentBranchId?: string;
  forkActionId?: string;
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
}

export class ActionHistory {
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];
  private snapshots: Map<string, HistorySnapshot> = new Map();
  private branches: Map<string, HistoryBranch> = new Map();
  private currentBranchId = "main";
  private static instance: ActionHistory | null = null;

  private constructor() {
    // Initialize main branch
    this.branches.set("main", {
      id: "main",
      name: "Main Branch",
      undoStack: [],
      redoStack: []
    });
  }

  public static getInstance(): ActionHistory {
    if (!ActionHistory.instance) {
      ActionHistory.instance = new ActionHistory();
    }
    return ActionHistory.instance;
  }

  /**
   * Record transaction (standard linear transaction tree)
   */
  public executeAction(action: Omit<HistoryAction, "id" | "timestamp">): void {
    const fullAction: HistoryAction = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      description: action.description || action.name
    };

    // Execute first run
    fullAction.redoFn();

    // Store in undo stack
    this.undoStack.push(fullAction);

    // Clear redo path
    this.redoStack = [];

    // Sync with active branch
    const activeBranch = this.branches.get(this.currentBranchId);
    if (activeBranch) {
      activeBranch.undoStack = [...this.undoStack];
      activeBranch.redoStack = [];
    }
  }

  /**
   * ActionHistory interface used by UI components (e.g. DeveloperMode)
   */
  public pushAction(item: {
    id: string;
    engine?: string;
    description: string;
    undo: () => void;
    redo: () => void;
  }): void {
    const fullAction: HistoryAction = {
      id: item.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: item.description || "Action",
      description: item.description || "Action",
      timestamp: Date.now(),
      undoFn: item.undo,
      redoFn: item.redo,
      groupName: item.engine
    };

    // Store in undo stack directly (UI triggers action execution and calls pushAction to log)
    this.undoStack.push(fullAction);

    // Clear redo path
    this.redoStack = [];

    // Sync with active branch
    const activeBranch = this.branches.get(this.currentBranchId);
    if (activeBranch) {
      activeBranch.undoStack = [...this.undoStack];
      activeBranch.redoStack = [];
    }
  }

  public undo(): HistoryAction | null {
    const action = this.undoStack.pop();
    if (!action) return null;

    action.undoFn();
    this.redoStack.push(action);

    // Sync with active branch
    const activeBranch = this.branches.get(this.currentBranchId);
    if (activeBranch) {
      activeBranch.undoStack = [...this.undoStack];
      activeBranch.redoStack = [...this.redoStack];
    }

    return action;
  }

  public redo(): HistoryAction | null {
    const action = this.redoStack.pop();
    if (!action) return null;

    action.redoFn();
    this.undoStack.push(action);

    // Sync with active branch
    const activeBranch = this.branches.get(this.currentBranchId);
    if (activeBranch) {
      activeBranch.undoStack = [...this.undoStack];
      activeBranch.redoStack = [...this.redoStack];
    }

    return action;
  }

  /**
   * Create named snapshot of current timeline and action history states
   */
  public createSnapshot(name: string): HistorySnapshot {
    const id = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const snapshot: HistorySnapshot = {
      id,
      name,
      timestamp: Date.now(),
      undoStackState: [...this.undoStack],
      redoStackState: [...this.redoStack]
    };
    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  /**
   * Restore history stacks from named snapshot
   */
  public restoreSnapshot(id: string): boolean {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return false;

    this.undoStack = [...snapshot.undoStackState];
    this.redoStack = [...snapshot.redoStackState];

    const activeBranch = this.branches.get(this.currentBranchId);
    if (activeBranch) {
      activeBranch.undoStack = [...this.undoStack];
      activeBranch.redoStack = [...this.redoStack];
    }
    return true;
  }

  public getSnapshots(): HistorySnapshot[] {
    return Array.from(this.snapshots.values());
  }

  /**
   * Create a new fork branch from the current action state
   */
  public forkBranch(branchName: string): string {
    const branchId = `branch_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const forkActionId = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].id : undefined;

    const newBranch: HistoryBranch = {
      id: branchId,
      name: branchName,
      parentBranchId: this.currentBranchId,
      forkActionId,
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack]
    };

    this.branches.set(branchId, newBranch);
    this.currentBranchId = branchId;
    return branchId;
  }

  /**
   * Switch between historical branches
   */
  public switchBranch(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) return false;

    this.currentBranchId = branchId;
    this.undoStack = [...branch.undoStack];
    this.redoStack = [...branch.redoStack];
    return true;
  }

  public getBranches(): HistoryBranch[] {
    return Array.from(this.branches.values());
  }

  public getCurrentBranchId(): string {
    return this.currentBranchId;
  }

  public getUndoStack(): HistoryAction[] {
    return this.undoStack;
  }

  public getRedoStack(): HistoryAction[] {
    return this.redoStack;
  }

  public getUndoStackSize(): number {
    return this.undoStack.length;
  }

  public getRedoStackSize(): number {
    return this.redoStack.length;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.snapshots.clear();
    this.branches.clear();
    this.currentBranchId = "main";
    this.branches.set("main", {
      id: "main",
      name: "Main Branch",
      undoStack: [],
      redoStack: []
    });
  }
}
