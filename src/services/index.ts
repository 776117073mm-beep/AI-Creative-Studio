import { ServiceRegistry } from "../registry/ServiceRegistry";
import { IService } from "../interfaces";

export class ServiceLocator {
  public static getStorageService(): IService {
    return ServiceRegistry.getInstance().getService("StorageService");
  }

  public static getRenderingService(): IService {
    return ServiceRegistry.getInstance().getService("RenderingService");
  }

  public static getTimelineService(): IService {
    return ServiceRegistry.getInstance().getService("TimelineService");
  }

  public static getAIService(): IService {
    return ServiceRegistry.getInstance().getService("AIService");
  }

  public static getCloudService(): IService {
    return ServiceRegistry.getInstance().getService("CloudService");
  }

  public static getLoggingService(): IService {
    return ServiceRegistry.getInstance().getService("LoggingService");
  }
}
