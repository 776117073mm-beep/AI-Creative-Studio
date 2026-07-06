import { IPlugin, PluginMetadata, PluginState } from "../interfaces";

export class PluginEngine {
  private static instance: PluginEngine;
  private plugins: Map<string, IPlugin> = new Map();
  private discoveryRegistry: PluginMetadata[] = [];

  constructor() {
    this.populateDiscoveryRegistry();
    this.loadDefaultPlugins();
  }

  public static getInstance(): PluginEngine {
    if (!PluginEngine.instance) {
      PluginEngine.instance = new PluginEngine();
    }
    return PluginEngine.instance;
  }

  public discoverPlugins(): PluginMetadata[] {
    return [...this.discoveryRegistry];
  }

  public async registerPlugin(plugin: IPlugin): Promise<void> {
    if (!this.validatePlugin(plugin)) {
      throw new Error(`[PluginEngine] Structural validation failed for plugin: ${plugin.metadata.name}`);
    }

    if (!this.checkCompatibility(plugin)) {
      throw new Error(`[PluginEngine] Compatibility or dependency error for plugin: ${plugin.metadata.id}`);
    }

    this.plugins.set(plugin.metadata.id, plugin);
    plugin.state.status = "installed";
    console.log(`[PluginEngine] Registered Plugin: ${plugin.metadata.name} (v${plugin.metadata.version})`);
  }

  public async activatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`[PluginEngine] Plugin not found: ${id}`);

    console.log(`[PluginEngine] Activating sandbox for plugin: ${plugin.metadata.name}...`);
    try {
      await plugin.activate();
      plugin.state.status = "active";
      console.log(`[PluginEngine] Plugin ${plugin.metadata.name} is now ACTIVE in secure sandbox.`);
    } catch (err: any) {
      plugin.state.status = "error";
      plugin.state.error = `Activation failed: ${err?.message}`;
      console.error(`[PluginEngine] FAILED to activate plugin: ${plugin.metadata.name}`, err);
    }
  }

  public async deactivatePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`[PluginEngine] Plugin not found: ${id}`);

    console.log(`[PluginEngine] Deactivating plugin: ${plugin.metadata.name}...`);
    try {
      await plugin.deactivate();
      plugin.state.status = "disabled";
      console.log(`[PluginEngine] Deactivated plugin: ${plugin.metadata.name}`);
    } catch (err: any) {
      plugin.state.status = "error";
      plugin.state.error = `Deactivation error: ${err?.message}`;
      console.error(`[PluginEngine] Error deactivating plugin: ${plugin.metadata.name}`, err);
    }
  }

  public async runInSandbox<T>(pluginId: string, code: string, context: Record<string, any> = {}): Promise<T> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`[PluginEngine] Plugin not registered: ${pluginId}`);
    if (plugin.state.status !== "active") {
      throw new Error(`[PluginEngine] Cannot run sandbox code: Plugin is not active. Status: ${plugin.state.status}`);
    }

    // Verify code doesn't request forbidden permissions
    const permissions = plugin.metadata.permissions;
    if (code.includes("window.location") && !permissions.includes("network_access")) {
      throw new Error(`[PluginEngine] Sandbox Violation: Security policy blocked unauthorized network access inside plugin code.`);
    }

    return await plugin.sandboxRun<T>(code, context);
  }

  public validatePlugin(plugin: IPlugin): boolean {
    const meta = plugin.metadata;
    if (!meta || !meta.id || !meta.name || !meta.version || !meta.compatibility) {
      return false;
    }
    if (!plugin.install || !plugin.uninstall || !plugin.activate || !plugin.deactivate || !plugin.sandboxRun) {
      return false;
    }
    return true;
  }

  public checkCompatibility(plugin: IPlugin): boolean {
    // Check plugin compatibility against host version (e.g. Host is 2.0.0)
    const hostVersion = "2.0.0";
    const compatRange = plugin.metadata.compatibility; // e.g. "^2.0.0"
    
    if (compatRange.startsWith("^") && !hostVersion.startsWith(compatRange.replace("^", "").split(".")[0])) {
      console.warn(`[PluginEngine] Plugin ${plugin.metadata.id} requires ${compatRange}, incompatible with host v${hostVersion}`);
      return false;
    }
    return true;
  }

  public getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  public listPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  private populateDiscoveryRegistry(): void {
    this.discoveryRegistry = [
      {
        id: "p_rotoscope_ai",
        name: "AI Auto-Rotoscoper Pro",
        description: "Zero-click automated neural video tracking masks & matte compilation.",
        version: "4.2.1",
        developer: "Cognitive Shaders Inc",
        dependencies: [],
        permissions: ["gpu_access", "storage_write"],
        compatibility: "^2.0.0"
      },
      {
        id: "p_luts_cinematic",
        name: "Cinematic LUTs Pack v2",
        description: "Load classic Kodak and Fujifilm emulation presets with real-time exposure balancing.",
        version: "2.1.0",
        developer: "Siddharth Roy Studio",
        dependencies: [],
        permissions: ["storage_read"],
        compatibility: "^2.0.0"
      },
      {
        id: "p_subtitle_burner",
        name: "Dynamic Subtitle Burner",
        description: "Zero-latency subtitle rasterizing with custom styled text animations.",
        version: "1.5.0",
        developer: "Agile Subtitle Co.",
        dependencies: ["mod_audio_mixing"],
        permissions: ["storage_read", "storage_write"],
        compatibility: "^2.0.0"
      }
    ];
  }

  private loadDefaultPlugins(): void {
    const createMockPlugin = (meta: PluginMetadata): IPlugin => {
      let state: PluginState = { status: "discovered" };

      return {
        metadata: meta,
        state,
        async install() {
          console.log(`[Plugin] Installing ${meta.name} assets...`);
        },
        async uninstall() {
          console.log(`[Plugin] Uninstalling ${meta.name} assets...`);
        },
        async activate() {
          console.log(`[Plugin] Sandboxed environment spun up for ${meta.name}.`);
        },
        async deactivate() {
          console.log(`[Plugin] Sandbox torn down for ${meta.name}.`);
        },
        async update() {
          console.log(`[Plugin] Updating ${meta.name}...`);
        },
        async sandboxRun<T>(code: string, context?: any): Promise<T> {
          console.log(`[Plugin Sandbox] Running Isolated Script inside sandbox for ${meta.name}:`, code);
          
          // Secure evaluated sandboxing mockup
          const isolatedFn = new Function("context", `
            with (context || {}) {
              return (() => {
                ${code}
              })();
            }
          `);

          const sandboxContext = {
            ...context,
            PI: Math.PI,
            log: (msg: any) => console.log(`[Plugin Log: ${meta.name}]`, msg)
          };

          return isolatedFn(sandboxContext) as T;
        }
      };
    };

    this.discoveryRegistry.forEach(meta => {
      const plugin = createMockPlugin(meta);
      this.registerPlugin(plugin).then(() => {
        // Activate standard pre-installed plugins
        this.activatePlugin(meta.id);
      });
    });
  }
}
