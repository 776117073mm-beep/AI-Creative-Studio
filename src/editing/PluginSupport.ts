export interface PluginDescriptor {
  id: string;
  name: string;
  version: string;
  author: string;
  category: "effect" | "transition" | "mask" | "animation" | "color" | "audio" | "editing_tool";
  onInit: (api: any) => void;
  onDestroy?: () => void;
}

export class PluginSupport {
  private plugins: Map<string, PluginDescriptor> = new Map();
  private isLoaded: boolean = false;

  constructor() {}

  /**
   * Expose engine API hooks to custom plugins
   */
  public getSharedAPI(logCallback?: (msg: string) => void): Record<string, any> {
    return {
      version: "2.1.0",
      platform: "ai-creative-studio-nle",
      log: (msg: string) => {
        if (logCallback) logCallback(`[Plugin Context] ${msg}`);
        else console.log(`[Plugin Log] ${msg}`);
      },
    };
  }

  /**
   * Load and register custom developer extensions
   */
  public registerPlugin(plugin: PluginDescriptor, logCallback?: (msg: string) => void): boolean {
    if (this.plugins.has(plugin.id)) {
      return false;
    }

    try {
      const api = this.getSharedAPI(logCallback);
      plugin.onInit(api);
      this.plugins.set(plugin.id, plugin);
      return true;
    } catch (err: any) {
      console.error(`Failed loading plugin ${plugin.id}:`, err);
      return false;
    }
  }

  public getRegisteredPlugins(): PluginDescriptor[] {
    return Array.from(this.plugins.values());
  }

  public unloadPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      if (plugin.onDestroy) {
        try {
          plugin.onDestroy();
        } catch (e) {
          console.error(`Error during plugin destroy:`, e);
        }
      }
      return this.plugins.delete(pluginId);
    }
    return false;
  }
}
