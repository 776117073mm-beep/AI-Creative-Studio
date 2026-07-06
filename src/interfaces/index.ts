export interface ModuleMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  developer: string;
  dependencies: string[];
  permissions: string[];
  inputs: string[];
  outputs: string[];
  capabilities: string[];
  category: string;
  documentationUrl?: string;
  icon?: string;
}

export type ModuleStatus = "unloaded" | "loading" | "loaded" | "active" | "error";
export type ModuleHealth = "healthy" | "degraded" | "failing";

export interface ModuleState {
  status: ModuleStatus;
  health: ModuleHealth;
  error?: string;
  uptime?: number;
}

export interface ModuleSettings {
  [key: string]: any;
}

export interface IModule {
  metadata: ModuleMetadata;
  state: ModuleState;
  settings: ModuleSettings;
  
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  updateSettings(settings: Partial<ModuleSettings>): void;
  getApi(): any;
}

export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  developer: string;
  author?: string;
  dependencies: string[];
  permissions: string[];
  compatibility: string; // semver range
  icon?: string;
}

export type PluginStatus = "discovered" | "installing" | "installed" | "active" | "disabled" | "error";

export interface PluginState {
  status: PluginStatus;
  error?: string;
}

export interface IPlugin {
  metadata: PluginMetadata;
  state: PluginState;
  
  install(): Promise<void>;
  uninstall(): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  update(): Promise<void>;
  sandboxRun<T>(code: string, context?: any): Promise<T>;
}

export interface ToolMetadata {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  requiredPermissions: string[];
  estimatedRuntime: string; // e.g., "fast", "30s", "varies"
  gpuRequired: boolean;
  cpuRequired: boolean;
  memoryUsage: string; // e.g., "low", "high", "8GB"
  supportedFileTypes: string[];
  category: string;
  examples?: string[];
  documentation?: string;
}

export interface ITool {
  metadata: ToolMetadata;
  execute(params: Record<string, any>): Promise<any>;
}

export interface IService {
  serviceName: string;
  description: string;
  initialize(): Promise<void>;
  getStatus(): "idle" | "running" | "error";
}

export interface AppEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  priority: "low" | "medium" | "high";
  sender: string;
  correlationId?: string;
}

export interface Subscription {
  id: string;
  eventType: string;
  callback: (event: AppEvent) => void;
  priority: number;
  filter?: (event: AppEvent) => boolean;
}

export interface IEventBus {
  publish(type: string, payload: any, sender: string, options?: { priority?: "low" | "medium" | "high", correlationId?: string, async?: boolean }): Promise<void>;
  subscribe(eventType: string, callback: (event: AppEvent) => void, options?: { priority?: number, filter?: (event: AppEvent) => boolean }): string;
  unsubscribe(subscriptionId: string): void;
  broadcast(type: string, payload: any, sender: string): Promise<void>;
  getHistory(): AppEvent[];
  replayHistory(startTime?: number): void;
  getDeadLetterQueue(): AppEvent[];
}

export interface Command {
  id: string;
  name: string;
  payload: any;
  timestamp: number;
  priority: number;
  metadata?: Record<string, any>;
}

export interface CommandResult {
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
  progress?: number;
}

export interface ICommandDispatcher {
  dispatch(command: Omit<Command, "id" | "timestamp">): Promise<CommandResult>;
  registerHandler(commandName: string, handler: (command: Command) => Promise<any>): void;
  unregisterHandler(commandName: string): void;
  undo(): Promise<boolean>;
  redo(): Promise<boolean>;
  cancel(commandId: string): Promise<boolean>;
  getHistory(): Command[];
  getActiveQueue(): Command[];
}
