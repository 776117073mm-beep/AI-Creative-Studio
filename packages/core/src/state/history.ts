import { produce } from 'immer';
import { z } from 'zod';

export interface IStateSnapshot<T> {
  id: string;
  timestamp: number;
  state: T;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface IUndoRedoAction<T> {
  type: string;
  label: string;
  timestamp: number;
  before: T;
  after: T;
  apply: (state: T) => T;
  reverse: (state: T) => T;
  metadata?: Record<string, unknown>;
}

export interface IStateManagerConfig<T> {
  maxHistorySize?: number;
  maxFutureSize?: number;
  enableAutoSnapshot?: boolean;
  snapshotInterval?: number;
  onStateChange?: (state: T, previousState: T) => void;
}

const StateManagerConfigSchema = z.object({
  maxHistorySize: z.number().min(1).max(1000).optional(),
  maxFutureSize: z.number().min(1).max(1000).optional(),
  enableAutoSnapshot: z.boolean().optional(),
  snapshotInterval: z.number().min(1).optional(),
  onStateChange: z.function().optional(),
});

export class StateManager<T extends object> {
  private state: T;
  private history: IUndoRedoAction<T>[] = [];
  private future: IUndoRedoAction<T>[] = [];
  private snapshots: IStateSnapshot<T>[] = [];
  private actionCounter = 0;
  private operationDepth = 0;

  private config: Required<IStateManagerConfig<T>>;

  constructor(
    initialState: T,
    config: IStateManagerConfig<T> = {}
  ) {
    this.state = initialState;
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 100,
      maxFutureSize: config.maxFutureSize ?? 100,
      enableAutoSnapshot: config.enableAutoSnapshot ?? false,
      snapshotInterval: config.snapshotInterval ?? 10,
      onStateChange: config.onStateChange ?? (() => {}),
    };
  }

  getState(): T {
    return this.state;
  }

  setState(
    updater: (draft: T) => void | T,
    action?: Partial<Pick<IUndoRedoAction<T>, 'type' | 'label' | 'metadata'>>
  ): void {
    const previousState = this.state;

    this.state = produce(this.state, (draft) => {
      updater(draft as T);
    }) as T;

    if (this.operationDepth === 0) {
      const undoAction: IUndoRedoAction<T> = {
        type: action?.type || 'state:change',
        label: action?.label || 'State change',
        timestamp: Date.now(),
        before: previousState,
        after: this.state,
        apply: () => this.state,
        reverse: () => previousState,
        metadata: action?.metadata,
      };

      this.history.push(undoAction);
      this.future = [];

      if (this.history.length > this.config.maxHistorySize) {
        this.history.shift();
      }

      if (
        this.config.enableAutoSnapshot &&
        this.history.length % this.config.snapshotInterval === 0
      ) {
        this.createSnapshot();
      }
    }

    this.config.onStateChange(this.state, previousState);
  }

  batch(updater: () => void): void {
    this.operationDepth++;
    try {
      updater();
    } finally {
      this.operationDepth--;
    }
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const action = this.history.pop()!;
    const previousState = this.state;

    this.state = action.before;

    const redoAction: IUndoRedoAction<T> = {
      ...action,
      before: this.state,
      after: previousState,
    };

    this.future.push(redoAction);

    if (this.future.length > this.config.maxFutureSize) {
      this.future.shift();
    }

    this.config.onStateChange(this.state, previousState);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    const action = this.future.pop()!;
    const previousState = this.state;

    this.state = action.after;

    const undoAction: IUndoRedoAction<T> = {
      ...action,
      before: previousState,
      after: this.state,
    };

    this.history.push(undoAction);

    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }

    this.config.onStateChange(this.state, previousState);
    return true;
  }

  getHistory(): IUndoRedoAction<T>[] {
    return [...this.history];
  }

  getFuture(): IUndoRedoAction<T>[] {
    return [...this.future];
  }

  clearHistory(): void {
    this.history = [];
    this.future = [];
  }

  createSnapshot(label?: string): IStateSnapshot<T> {
    const snapshot: IStateSnapshot<T> = {
      id: `snapshot-${++this.actionCounter}-${Date.now()}`,
      timestamp: Date.now(),
      state: this.deepClone(this.state),
      label,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    const previousState = this.state;

    this.history.push({
      type: 'state:snapshot-restore',
      label: `Restore snapshot: ${snapshot.label || 'unnamed'}`,
      timestamp: Date.now(),
      before: previousState,
      after: this.deepClone(snapshot.state),
      apply: () => this.deepClone(snapshot.state),
      reverse: () => previousState,
    });

    this.state = this.deepClone(snapshot.state);
    this.future = [];

    this.config.onStateChange(this.state, previousState);
    return true;
  }

  getSnapshots(): IStateSnapshot<T>[] {
    return [...this.snapshots];
  }

  deleteSnapshot(snapshotId: string): boolean {
    const index = this.snapshots.findIndex(s => s.id === snapshotId);
    if (index === -1) return false;

    this.snapshots.splice(index, 1);
    return true;
  }

  clearSnapshots(): void {
    this.snapshots = [];
  }

  private deepClone(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  jumpToHistoryIndex(index: number): boolean {
    if (index < 0 || index >= this.history.length) return false;

    const targetIndex = index;
    const currentIndex = this.history.length - 1;

    if (targetIndex === currentIndex) return true;

    const actionsToProcess = this.history.splice(targetIndex + 1);
    const previousState = this.state;

    const targetAction = this.history[targetIndex];
    this.state = this.deepClone(targetAction.after);

    for (const action of actionsToProcess.reverse()) {
      const reversedAction: IUndoRedoAction<T> = {
        ...action,
        before: action.after,
        after: action.before,
      };
      this.future.unshift(reversedAction);
    }

    if (this.future.length > this.config.maxFutureSize) {
      this.future = this.future.slice(-this.config.maxFutureSize);
    }

    this.config.onStateChange(this.state, previousState);
    return true;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  getFutureLength(): number {
    return this.future.length;
  }

  getCurrentAction(): IUndoRedoAction<T> | undefined {
    return this.history[this.history.length - 1];
  }

  getNextAction(): IUndoRedoAction<T> | undefined {
    return this.future[this.future.length - 1];
  }
}
