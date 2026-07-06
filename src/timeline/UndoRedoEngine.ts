export interface HistoryAction<T = any> {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  snapshot: T; // The complete state snapshot at this transaction point
}

export class UndoRedoEngine<T = any> {
  private undoStack: HistoryAction<T>[] = [];
  private redoStack: HistoryAction<T>[] = [];
  private checkpoints: Map<string, HistoryAction<T>> = new Map();
  private maxHistoryLimit: number = 200;

  constructor(maxLimit: number = 200) {
    this.maxHistoryLimit = maxLimit;
  }

  /**
   * Commit a state snapshot to undo stack, wiping redo stack (standard behavior)
   */
  public commit(name: string, snapshot: T, description?: string): void {
    const action: HistoryAction<T> = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      name,
      description,
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(snapshot)), // Immutable deep-copy snapshot
    };

    this.undoStack.push(action);
    this.redoStack = []; // Clear forward actions on a new branch

    if (this.undoStack.length > this.maxHistoryLimit) {
      this.undoStack.shift(); // Evict earliest record to stay bounded
    }
  }

  /**
   * Pop from undo stack and return target snapshot for restoration
   */
  public undo(currentState: T): T | null {
    if (this.undoStack.length === 0) return null;

    const previousAction = this.undoStack.pop()!;
    
    // Package current state into redo stack to allow stepping forward again
    const redoAction: HistoryAction<T> = {
      id: previousAction.id,
      name: previousAction.name,
      description: previousAction.description,
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(currentState)),
    };
    this.redoStack.push(redoAction);

    return previousAction.snapshot;
  }

  /**
   * Pop from redo stack and return target snapshot for restoration
   */
  public redo(currentState: T): T | null {
    if (this.redoStack.length === 0) return null;

    const nextAction = this.redoStack.pop()!;
    
    // Commit current state to undo stack to allow stepping backward again
    const undoAction: HistoryAction<T> = {
      id: nextAction.id,
      name: nextAction.name,
      description: nextAction.description,
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(currentState)),
    };
    this.undoStack.push(undoAction);

    return nextAction.snapshot;
  }

  /**
   * Create a permanent checkpoint that does not get shifted out during edits
   */
  public createNamedCheckpoint(name: string, snapshot: T, checkpointId?: string): string {
    const id = checkpointId || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    const checkpoint: HistoryAction<T> = {
      id,
      name,
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    };
    this.checkpoints.set(id, checkpoint);
    return id;
  }

  /**
   * Retrieve a named checkpoint
   */
  public restoreFromCheckpoint(checkpointId: string): T | null {
    const cp = this.checkpoints.get(checkpointId);
    if (!cp) return null;
    return JSON.parse(JSON.stringify(cp.snapshot));
  }

  public getUndoStack(): Omit<HistoryAction<T>, "snapshot">[] {
    return this.undoStack.map(({ id, name, description, timestamp }) => ({ id, name, description, timestamp }));
  }

  public getRedoStack(): Omit<HistoryAction<T>, "snapshot">[] {
    return this.redoStack.map(({ id, name, description, timestamp }) => ({ id, name, description, timestamp }));
  }

  public getCheckpoints(): Omit<HistoryAction<T>, "snapshot">[] {
    return Array.from(this.checkpoints.values()).map(({ id, name, description, timestamp }) => ({ id, name, description, timestamp }));
  }

  public clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
