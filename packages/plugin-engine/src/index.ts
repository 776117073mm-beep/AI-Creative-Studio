import {
  BaseEngine,
  EngineConfigSchema,
  EventEmitter,
  globalEventBus,
} from '@ai-creative-studio/core';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const PluginEngineConfigSchema = EngineConfigSchema.extend({
  pluginDirectory: z.string().optional().default('/plugins'),
  allowRemotePlugins: z.boolean().optional().default(false),
  sandboxEnabled: z.boolean().optional().default(true),
});

type PluginEngineConfig = z.infer<typeof PluginEngineConfigSchema>;

export type PluginStatus =
  | 'uninstalled'
  | 'installing'
  | 'installed'
  | 'loading'
  | 'loaded'
  | 'active'
  | 'error'
  | 'disabled';

export interface IPluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];

  main: string;
  icon?: string;

  minAppVersion?: string;
  maxAppVersion?: string;

  engines: Record<string, string>;

  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;

  permissions: IPluginPermission[];

  extensionPoints: IExtensionPoint[];

  settings?: IPluginSetting[];
}

export interface IPluginPermission {
  type: 'filesystem' | 'network' | 'clipboard' | 'camera' | 'microphone' | 'notifications' | 'storage' | 'custom';
  access: 'read' | 'write' | 'full';
  description?: string;
}

export interface IExtensionPoint {
  id: string;
  name: string;
  description?: string;
  hooks?: IPluginHook<any>[];
  panels?: IPanelDefinition[];
  commands?: ICommandDefinition[];
  effects?: IEffectDefinition[];
}

export interface IPluginHook<TPayload = unknown> {
  event: string;
  priority?: number;
  handler: (payload: TPayload, context: IHookContext) => unknown | Promise<unknown>;
}

export interface IHookContext {
  pluginId: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface IPanelDefinition {
  id: string;
  type: string;
  name: string;
  position: 'left' | 'right' | 'top' | 'bottom' | 'floating';
  size?: number;
  resizable?: boolean;
}

export interface ICommandDefinition {
  id: string;
  name: string;
  category: string;
  hotkey?: string;
  execute: (context: unknown) => Promise<void>;
}

export interface IEffectDefinition {
  id: string;
  name: string;
  category: string;
  parameters?: Record<string, unknown>;
  apply: (context: unknown, params: unknown) => Promise<void>;
}

export interface IPluginSetting {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'font' | 'file';
  label: string;
  description?: string;
  default: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export interface IPlugin {
  id: string;
  manifest: IPluginManifest;
  status: PluginStatus;
  settings: Record<string, unknown>;
  instance?: IPluginInstance;
  error?: Error;
  enabled: boolean;
  installedAt?: number;
  loadedAt?: number;
}

export interface IPluginInstance {
  activate: (context: unknown) => Promise<void>;
  deactivate: () => Promise<void>;
  updateSettings: (settings: Record<string, unknown>) => Promise<void>;
}

export interface IPluginContext {
  pluginId: string;
  version: string;
  permissions: Set<string>;
  api: IPluginAPI;
}

export interface IPluginAPI {
  commands: {
    register: (command: ICommandDefinition) => void;
    unregister: (commandId: string) => void;
    execute: <T>(commandId: string, params?: T) => Promise<T>;
  };
  events: {
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
    emit: (event: string, ...args: unknown[]) => void;
  };
  storage: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T) => Promise<void>;
    remove: (key: string) => Promise<void>;
  };
  ui: {
    addPanel: (definition: IPanelDefinition) => void;
    removePanel: (panelId: string) => void;
    showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    showModal: (options: { title: string; content: string }) => Promise<void>;
  };
  timeline: {
    addTrack: (type: string, options?: unknown) => string;
    addClip: (trackId: string, options?: unknown) => string;
    seek: (time: number) => void;
    play: () => void;
    pause: () => void;
  };
  effects: {
    register: (effect: IEffectDefinition) => void;
    apply: (effectId: string, targetId: string, params?: unknown) => void;
  };
}

export interface IPluginEngineEvents {
  'plugin:installing': { pluginId: string; manifest: IPluginManifest };
  'plugin:installed': { plugin: IPlugin };
  'plugin:loading': { pluginId: string };
  'plugin:loaded': { plugin: IPlugin };
  'plugin:activated': { pluginId: string };
  'plugin:deactivated': { pluginId: string };
  'plugin:error': { pluginId: string; error: Error };
  'plugin:uninstalled': { pluginId: string };
}

export class PluginEngine extends BaseEngine {
  private plugins: Map<string, IPlugin> = new Map();
  private hooks: Map<string, Array<{ pluginId: string; handler: IPluginHook['handler']; priority: number }>> = new Map();
  private emitter = new EventEmitter<IPluginEngineEvents>();
  private sandboxEnabled: boolean;
  private pluginDirectory: string;

  constructor(config: PluginEngineConfig) {
    super(PluginEngineConfigSchema.parse(config));
    this.sandboxEnabled = config.sandboxEnabled!;
    this.pluginDirectory = config.pluginDirectory!;
  }

  protected async onInitialize(): Promise<void> {
  }

  protected override async onDestroy(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.status === 'active' && plugin.instance?.deactivate) {
        await plugin.instance.deactivate();
      }
    }
    this.plugins.clear();
    this.hooks.clear();
  }

  async installPlugin(manifest: IPluginManifest, source?: string): Promise<IPlugin> {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already installed`);
    }

    this.validateManifest(manifest);

    this.emitter.emit('plugin:installing', { pluginId: manifest.id, manifest });

    const plugin: IPlugin = {
      id: manifest.id,
      manifest,
      status: 'installing',
      settings: {},
      enabled: true,
    };

    for (const setting of manifest.settings ?? []) {
      plugin.settings[setting.key] = setting.default;
    }

    plugin.status = 'installed';
    plugin.installedAt = Date.now();
    this.plugins.set(manifest.id, plugin);

    this.emitter.emit('plugin:installed', { plugin });
    return plugin;
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status === 'active') {
      await this.deactivatePlugin(pluginId);
    }

    for (const hook of this.hooks.values()) {
      const filtered = hook.filter(h => h.pluginId !== pluginId);
      hook.length = 0;
      hook.push(...filtered);
    }

    this.plugins.delete(pluginId);
    this.emitter.emit('plugin:uninstalled', { pluginId });
  }

  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status === 'loaded' || plugin.status === 'active') {
      return;
    }

    this.emitter.emit('plugin:loading', { pluginId });
    plugin.status = 'loading';

    try {
      const context = this.createPluginContext(plugin);
      const instance = await this.loadPluginModule(plugin, context);

      plugin.instance = instance;
      plugin.status = 'loaded';
      plugin.loadedAt = Date.now();

      this.registerHooks(plugin);
      this.registerExtensionPoints(plugin);

      this.emitter.emit('plugin:loaded', { plugin });
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error instanceof Error ? error : new Error(String(error));
      this.emitter.emit('plugin:error', { pluginId, error: plugin.error });
      throw error;
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status !== 'loaded' && plugin.status !== 'active') {
      await this.loadPlugin(pluginId);
    }

    if (plugin.instance?.activate) {
      const context = this.createPluginContext(plugin);
      await plugin.instance.activate(context);
    }

    plugin.status = 'active';
    plugin.enabled = true;
    this.emitter.emit('plugin:activated', { pluginId });
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status !== 'active') {
      return;
    }

    if (plugin.instance?.deactivate) {
      await plugin.instance.deactivate();
    }

    plugin.status = 'loaded';
    plugin.enabled = false;
    this.emitter.emit('plugin:deactivated', { pluginId });
  }

  private async loadPluginModule(
    plugin: IPlugin,
    context: IPluginContext
  ): Promise<IPluginInstance> {
    const moduleExport = plugin.manifest.main;
    return {
      activate: async () => {},
      deactivate: async () => {},
      updateSettings: async () => {},
    };
  }

  private createPluginContext(plugin: IPlugin): IPluginContext {
    const permissions = new Set(
      plugin.manifest.permissions.map(p => p.type)
    );

    return {
      pluginId: plugin.id,
      version: plugin.manifest.version,
      permissions,
      api: this.createPluginAPI(plugin),
    };
  }

  private createPluginAPI(plugin: IPlugin): IPluginAPI {
    return {
      commands: {
        register: (command: ICommandDefinition) => {},
        unregister: (commandId: string) => {},
        execute: async <T>(commandId: string, params?: T) => params as T,
      },
      events: {
        on: (event: string, handler: (...args: unknown[]) => void) => {},
        off: (event: string, handler: (...args: unknown[]) => void) => {},
        emit: (event: string, ...args: unknown[]) => {},
      },
      storage: {
        get: async <T>(key: string) => null,
        set: async <T>(key: string, value: T) => {},
        remove: async (key: string) => {},
      },
      ui: {
        addPanel: (definition: IPanelDefinition) => {},
        removePanel: (panelId: string) => {},
        showNotification: (message: string, type) => {},
        showModal: async (options) => {},
      },
      timeline: {
        addTrack: (type: string, options?: unknown) => uuidv4(),
        addClip: (trackId: string, options?: unknown) => uuidv4(),
        seek: (time: number) => {},
        play: () => {},
        pause: () => {},
      },
      effects: {
        register: (effect: IEffectDefinition) => {},
        apply: (effectId: string, targetId: string, params?: unknown) => {},
      },
    };
  }

  private registerHooks(plugin: IPlugin): void {
    for (const extensionPoint of plugin.manifest.extensionPoints) {
      for (const hook of extensionPoint.hooks ?? []) {
        const handlers = this.hooks.get(hook.event) || [];
        handlers.push({
          pluginId: plugin.id,
          handler: hook.handler,
          priority: hook.priority ?? 10,
        });
        handlers.sort((a, b) => a.priority - b.priority);
        this.hooks.set(hook.event, handlers);
      }
    }
  }

  private registerExtensionPoints(plugin: IPlugin): void {
    for (const extensionPoint of plugin.manifest.extensionPoints) {
      for (const command of extensionPoint.commands ?? []) {
      }
      for (const panel of extensionPoint.panels ?? []) {
      }
      for (const effect of extensionPoint.effects ?? []) {
      }
    }
  }

  async executeHook<TPayload = unknown, TResult = unknown>(
    event: string,
    payload: TPayload
  ): Promise<TResult[]> {
    const handlers = this.hooks.get(event) || [];
    const results: TResult[] = [];
    const context: IHookContext = {
      pluginId: '',
      timestamp: Date.now(),
    };

    for (const { handler } of handlers) {
      try {
        const result = await handler(payload, context);
        if (result !== undefined) {
          results.push(result as TResult);
        }
      } catch (error) {
        console.error(`Hook handler error for event ${event}:`, error);
      }
    }

    return results;
  }

  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByStatus(status: PluginStatus): IPlugin[] {
    const result: IPlugin[] = [];
    this.plugins.forEach(plugin => {
      if (plugin.status === status) {
        result.push(plugin);
      }
    });
    return result;
  }

  validateManifest(manifest: IPluginManifest): void {
    if (!manifest.id) {
      throw new Error('Plugin manifest must have an id');
    }
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest must have a version');
    }
    if (!manifest.main) {
      throw new Error('Plugin manifest must have a main entry point');
    }
    if (!manifest.permissions || manifest.permissions.length === 0) {
      throw new Error('Plugin manifest must declare permissions');
    }
  }

  updatePluginSettings(pluginId: string, settings: Record<string, unknown>): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.settings = { ...plugin.settings, ...settings };
  }

  getPluginSettings(pluginId: string): Record<string, unknown> | undefined {
    return this.plugins.get(pluginId)?.settings;
  }

  enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.status !== 'error') {
      plugin.enabled = true;
    }
  }

  disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
    }
  }

  on<E extends keyof IPluginEngineEvents>(
    event: E,
    listener: (data: IPluginEngineEvents[E]) => void
  ): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  off<E extends keyof IPluginEngineEvents>(
    event: E,
    listener: (data: IPluginEngineEvents[E]) => void
  ): this {
    this.emitter.off(event, listener as any);
    return this;
  }

  getCapabilities(): string[] {
    return [
      'plugin:install',
      'plugin:uninstall',
      'plugin:load',
      'plugin:activate',
      'plugin:deactivate',
      'plugin:settings',
      'plugin:hooks',
      'plugin:extensions',
      'plugin:permissions',
    ];
  }
}
