import { IService } from "../interfaces";

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, IService> = new Map();

  constructor() {
    this.registerDefaultServices();
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  public register(service: IService): void {
    if (this.services.has(service.serviceName)) {
      console.warn(`[ServiceRegistry] Service [${service.serviceName}] is already registered. Overwriting.`);
    }
    this.services.set(service.serviceName, service);
    console.log(`[ServiceRegistry] Registered Service: ${service.serviceName}`);
  }

  public unregister(serviceName: string): void {
    if (this.services.delete(serviceName)) {
      console.log(`[ServiceRegistry] Unregistered Service: ${serviceName}`);
    }
  }

  public getService<T extends IService>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`[ServiceRegistry] Requested service not found: ${serviceName}`);
    }
    return service as T;
  }

  public listServices(): IService[] {
    return Array.from(this.services.values());
  }

  public hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  private registerDefaultServices(): void {
    const createDefaultService = (name: string, description: string): IService => {
      let status: "idle" | "running" | "error" = "idle";
      return {
        serviceName: name,
        description,
        async initialize() {
          console.log(`[ServiceRegistry] Initializing ${name}...`);
          status = "running";
        },
        getStatus() {
          return status;
        }
      };
    };

    // Register all 15 mandated platform services
    this.register(createDefaultService("StorageService", "Handles local caching, directory structures, and persistent project state caching."));
    this.register(createDefaultService("RenderingService", "Schedules, queues, and compiles offline video, graphics, and visual effects frames."));
    this.register(createDefaultService("TimelineService", "Manages tracks, color grading layers, subtitle sync, and frame markers."));
    this.register(createDefaultService("AssetService", "Manages media asset lifecycle, replication hashes, and file extensions metadata."));
    this.register(createDefaultService("MediaService", "Decodes, transcodes, and plays back video/audio assets efficiently."));
    this.register(createDefaultService("AuthenticationService", "Authenticates collaborators, handles user profiles, and manages access roles."));
    this.register(createDefaultService("CloudService", "Manages remote replication sync processes, CDN caching, and secure S3 uploads."));
    this.register(createDefaultService("NotificationService", "Broadcasts events and pushes active alerts and timeline comments updates."));
    this.register(createDefaultService("HistoryService", "Tracks revision history logs, saving checkpoints, and performing secure rollbacks."));
    this.register(createDefaultService("WorkflowService", "Executes automated macros, batch operations, and cognitive process chains."));
    this.register(createDefaultService("AIService", "Wraps model API endpoints, handles prompt templates, and runs semantic routing."));
    this.register(createDefaultService("LoggingService", "Aggregates, filters, and formats system diagnostic logs and console warnings."));
    this.register(createDefaultService("MonitoringService", "Measures and calculates CPU usage, GPU memory allocations, and network ping rates."));
    this.register(createDefaultService("SecurityService", "Slashes cyber vulnerabilities, validates sandbox processes, and checks script permissions."));
    this.register(createDefaultService("ConfigurationService", "Stores and retrieves environment configurations, display parameters, and user preferences."));
  }
}
