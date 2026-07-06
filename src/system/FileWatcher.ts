export type FileWatcherEvent = "created" | "modified" | "deleted";

export interface FileChange {
  path: string;
  category: 
    | "project_folder"
    | "assets"
    | "imports"
    | "exports"
    | "plugin_folder"
    | "config_files"
    | "cache"
    | "logs";
  eventType: FileWatcherEvent;
  timestamp: number;
  sizeBytes?: number;
}

export type FileWatcherListener = (change: FileChange) => void;

export class FileWatcher {
  private static instance: FileWatcher;
  
  private listeners: Set<FileWatcherListener> = new Set();
  private scanIntervalId: any;
  private watchedPaths: Set<string> = new Set();

  private constructor() {
    this.startScanningLoop();
  }

  public static getInstance(): FileWatcher {
    if (!FileWatcher.instance) {
      FileWatcher.instance = new FileWatcher();
    }
    return FileWatcher.instance;
  }

  public watchPath(path: string): void {
    this.watchedPaths.add(path);
    console.log(`[FileWatcher] Added path to active watch list: ${path}`);
  }

  public unwatchPath(path: string): void {
    this.watchedPaths.delete(path);
    console.log(`[FileWatcher] Removed path from active watch list: ${path}`);
  }

  public subscribe(listener: FileWatcherListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public triggerMockChange(change: Omit<FileChange, "timestamp">): void {
    const fullChange: FileChange = {
      ...change,
      timestamp: Date.now()
    };
    console.log(`[FileWatcher] Detected File Action [${fullChange.eventType.toUpperCase()}] on [${fullChange.path}] in category ${fullChange.category}`);
    this.listeners.forEach(l => l(fullChange));
  }

  public getWatchedPaths(): string[] {
    return Array.from(this.watchedPaths);
  }

  private startScanningLoop(): void {
    // Watch default structural workspace components
    this.watchedPaths.add("/projects/untitled_project_v1");
    this.watchedPaths.add("/assets/footage");
    this.watchedPaths.add("/plugins/active_plugins");
    this.watchedPaths.add("/configs/platform.json");

    this.scanIntervalId = setInterval(() => {
      // Occasional file change generator for preview interactivity
      if (Math.random() > 0.85) {
        const categories: FileChange["category"][] = [
          "assets", "imports", "config_files", "cache", "logs"
        ];
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        const types: FileWatcherEvent[] = ["modified", "created"];
        const selectedType = types[Math.floor(Math.random() * types.length)];

        let mockPath = "";
        switch (selectedCategory) {
          case "assets":
            mockPath = `/assets/footage/shot_${Math.floor(Math.random() * 20 + 1)}.mp4`;
            break;
          case "config_files":
            mockPath = `/configs/platform.json`;
            break;
          case "cache":
            mockPath = `/cache/thumbnail_index_v2.bin`;
            break;
          case "logs":
            mockPath = `/logs/platform_session_current.log`;
            break;
          default:
            mockPath = `/imports/raw_audio_mix.wav`;
        }

        this.triggerMockChange({
          path: mockPath,
          category: selectedCategory,
          eventType: selectedType,
          sizeBytes: Math.floor(Math.random() * 1024 * 512 + 1024),
        });
      }
    }, 7000);
  }
}
