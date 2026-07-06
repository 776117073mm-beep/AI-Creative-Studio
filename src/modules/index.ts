import { IModule, ModuleMetadata } from "../interfaces";

export interface CustomModuleConfig {
  id: string;
  name: string;
  displayName: string;
  category: string;
  dependencies?: string[];
}

export function createDynamicModule(config: CustomModuleConfig): IModule {
  const metadata: ModuleMetadata = {
    id: config.id,
    name: config.name,
    displayName: config.displayName,
    description: `Dynamic runtime module for handling ${config.displayName} tasks.`,
    version: "1.0.0",
    developer: "Custom Module Creator",
    dependencies: config.dependencies || [],
    permissions: ["basic_api"],
    inputs: ["generic_data"],
    outputs: ["processed_stream"],
    capabilities: ["data_processing"],
    category: config.category
  };

  return {
    metadata,
    state: { status: "unloaded", health: "healthy" },
    settings: {},
    async initialize() {
      console.log(`[Module:${config.name}] Initializing...`);
    },
    async start() {
      console.log(`[Module:${config.name}] Started.`);
    },
    async stop() {
      console.log(`[Module:${config.name}] Stopped.`);
    },
    async restart() {
      console.log(`[Module:${config.name}] Restarted.`);
    },
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
    },
    getApi() {
      return {
        runTask: (data: any) => `processed:${JSON.stringify(data)}`
      };
    }
  };
}
