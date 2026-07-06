export type StateSubscriber<T> = (state: T) => void;

export class Store<T> {
  private state: T;
  private subscribers: Set<StateSubscriber<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  public get(): T {
    return this.state;
  }

  public set(newState: Partial<T> | ((current: T) => Partial<T>)): void {
    const patch = typeof newState === "function" ? newState(this.state) : newState;
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  public subscribe(sub: StateSubscriber<T>): () => void {
    this.subscribers.add(sub);
    sub(this.state); // Initial emission
    return () => this.subscribers.delete(sub);
  }

  private notify(): void {
    this.subscribers.forEach((sub) => sub(this.state));
  }
}

export class GlobalStateEngine {
  private static instance: GlobalStateEngine;

  // Fully independent stores
  public readonly appStore = new Store({ status: "idle", version: "2.5.0-alpha", activePage: "dashboard" });
  public readonly workspaceStore = new Store({ currentDir: "/projects", openedFiles: [] as string[], zoom: 100 });
  public readonly projectsStore = new Store({ list: [] as any[], activeId: null as string | null });
  public readonly timelineStore = new Store({ playheadMs: 0, tracks: [] as any[], durationMs: 30000, isPlaying: false });
  public readonly mediaStore = new Store({ videoTrackCount: 0, audioTrackCount: 0, streams: [] as any[] });
  public readonly assetsStore = new Store({ totalSize: 0, items: [] as any[] });
  public readonly renderingStore = new Store({ activeJobs: 0, percentComplete: 0, targetFps: 60 });
  public readonly exportStore = new Store({ destination: "local", activeFormat: "MP4 (H.264)", exportInProgress: false });
  public readonly pluginsStore = new Store({ loadedCount: 0, list: [] as any[] });
  public readonly modulesStore = new Store({ runningCount: 0, list: [] as any[] });
  public readonly userStore = new Store({ id: null as string | null, name: "Siddharth Roy", role: "Superuser" });
  public readonly authStore = new Store({ isAuthenticated: true, token: "jwt_tok_platform", permissions: ["root"] });
  public readonly aiStore = new Store({ totalQueries: 0, pendingModelCall: false, activeModel: "gemini-2.5-pro" });
  public readonly notificationsStore = new Store({ unreadCount: 0, items: [] as any[] });
  public readonly cloudStore = new Store({ synced: true, lastSyncTime: Date.now(), cloudProvider: "Google Cloud Platform" });
  public readonly historyStore = new Store({ past: [] as any[], future: [] as any[] });
  public readonly performanceStore = new Store({ renderLatencyMs: 8, fps: 60 });
  public readonly gpuStore = new Store({ vramAllocatedBytes: 1024 * 1024 * 512, utilization: 25, temperatureCelsius: 64 });
  public readonly memoryStore = new Store({ ramAllocatedBytes: 1024 * 1024 * 1024 * 2, maxLimitBytes: 1024 * 1024 * 1024 * 8 });
  public readonly settingsStore = new Store({ theme: "slate-dark", autoSaveIntervalMs: 5000, gpuAccelerated: true });
  public readonly developerModeStore = new Store({ enabled: true, debugLevel: "verbose", verboseLogs: [] as string[] });

  private constructor() {}

  public static getInstance(): GlobalStateEngine {
    if (!GlobalStateEngine.instance) {
      GlobalStateEngine.instance = new GlobalStateEngine();
    }
    return GlobalStateEngine.instance;
  }
}
