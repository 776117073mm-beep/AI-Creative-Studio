import { EventBus } from "../events/EventBus";
import { CommandDispatcher } from "../commands/CommandDispatcher";
import { ModuleEngine } from "../engine/ModuleEngine";
import { PluginEngine } from "../engine/PluginEngine";
import { ToolRegistry } from "../registry/ToolRegistry";
import { ServiceRegistry } from "../registry/ServiceRegistry";

export class PlatformOrchestrator {
  private static instance: PlatformOrchestrator;
  private initialized = false;

  private constructor() {}

  public static getInstance(): PlatformOrchestrator {
    if (!PlatformOrchestrator.instance) {
      PlatformOrchestrator.instance = new PlatformOrchestrator();
    }
    return PlatformOrchestrator.instance;
  }

  public async bootstrap(): Promise<void> {
    if (this.initialized) {
      console.warn("[PlatformOrchestrator] Platform already bootstrapped.");
      return;
    }

    console.log("%c [Platform] Bootstrapping Core Platform Engines...", "color: #3b82f6; font-weight: bold;");

    // Initialize Event Bus and Dispatcher
    const eventBus = EventBus.getInstance();
    const commandDispatcher = CommandDispatcher.getInstance();
    
    // Register basic commands
    commandDispatcher.registerHandler("system_ping", async () => {
      await eventBus.publish("system_pong", { message: "pong" }, "PlatformCore");
      return "pong";
    });

    // Boot services
    const services = ServiceRegistry.getInstance().listServices();
    for (const service of services) {
      await service.initialize();
    }

    // Load and warm modules
    const modules = ModuleEngine.getInstance().listModules();
    for (const mod of modules) {
      if (mod.state.status === "loaded") {
        await ModuleEngine.getInstance().startModule(mod.metadata.id);
      }
    }

    // Warm plugins
    const plugins = PluginEngine.getInstance().listPlugins();
    for (const plug of plugins) {
      if (plug.state.status === "installed") {
        await PluginEngine.getInstance().activatePlugin(plug.metadata.id);
      }
    }

    this.initialized = true;
    console.log("%c [Platform] Bootstrap Complete. All systems operational.", "color: #10b981; font-weight: bold;");
    
    await eventBus.publish("platform_ready", { timestamp: Date.now() }, "PlatformCore");
  }

  public isReady(): boolean {
    return this.initialized;
  }
}
