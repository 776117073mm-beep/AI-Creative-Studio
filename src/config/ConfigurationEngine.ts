export interface AppConfiguration {
  system: { maxProcessors: number; apiVersion: string };
  workspace: { defaultFolder: string; autoRestore: boolean };
  project: { name: string; frameRate: number; width: number; height: number };
  module: { activeCategories: string[] };
  plugin: { sandboxingEnabled: boolean };
  user: { email: string; preferredTheme: string };
  developer: { verboseTracing: boolean; hotReload: boolean };
  runtime: { maxExecutionTimeoutMs: number };
  environment: { nodeEnv: string; publicHost: string };
  cloud: { backupSyncEnabled: boolean; remoteBucket: string };
}

export class ConfigurationEngine {
  private static instance: ConfigurationEngine;

  private activeConfig: AppConfiguration;
  private backupProfiles: Map<string, AppConfiguration> = new Map();

  private constructor() {
    this.activeConfig = this.getDefaultConfig();
    this.backupProfiles.set("default_profile", this.getDefaultConfig());
  }

  public static getInstance(): ConfigurationEngine {
    if (!ConfigurationEngine.instance) {
      ConfigurationEngine.instance = new ConfigurationEngine();
    }
    return ConfigurationEngine.instance;
  }

  public get(): AppConfiguration {
    return { ...this.activeConfig };
  }

  public update(layer: keyof AppConfiguration, patch: Record<string, any>): void {
    if (!(layer in this.activeConfig)) {
      throw new Error(`[ConfigurationEngine] Invalid configuration layer name: ${layer}`);
    }

    const validatedPatch = this.validateLayer(layer, patch);
    this.activeConfig[layer] = { ...this.activeConfig[layer], ...validatedPatch } as any;
    console.log(`[ConfigurationEngine] Configuration layer updated: [${layer}]`, patch);
  }

  public importConfig(rawString: string, format: "json" | "yaml"): void {
    try {
      let parsed: any;
      if (format === "json") {
        parsed = JSON.parse(rawString);
      } else {
        // Minimal YAML-like parser mockup
        parsed = this.parseMockYaml(rawString);
      }

      // Merge and validate
      for (const key of Object.keys(parsed)) {
        if (key in this.activeConfig) {
          this.update(key as keyof AppConfiguration, parsed[key]);
        }
      }
      console.log(`[ConfigurationEngine] Successfully imported configuration profile via ${format.toUpperCase()}`);
    } catch (err: any) {
      throw new Error(`[ConfigurationEngine] Configuration import failed: ${err.message}`);
    }
  }

  public exportConfig(format: "json" | "yaml"): string {
    if (format === "json") {
      return JSON.stringify(this.activeConfig, null, 2);
    } else {
      return this.stringifyMockYaml(this.activeConfig);
    }
  }

  public createBackup(profileName: string): void {
    this.backupProfiles.set(profileName, JSON.parse(JSON.stringify(this.activeConfig)));
    console.log(`[ConfigurationEngine] Created configuration profile backup: ${profileName}`);
  }

  public restoreBackup(profileName: string): void {
    const backup = this.backupProfiles.get(profileName);
    if (!backup) {
      throw new Error(`[ConfigurationEngine] Configuration backup profile not found: ${profileName}`);
    }
    this.activeConfig = JSON.parse(JSON.stringify(backup));
    console.log(`[ConfigurationEngine] Restored configuration from backup profile: ${profileName}`);
  }

  private validateLayer(layer: keyof AppConfiguration, patch: Record<string, any>): Record<string, any> {
    // Dynamic schema validators
    if (layer === "project") {
      if (patch.frameRate && (patch.frameRate < 1 || patch.frameRate > 240)) {
        throw new Error("[ConfigurationEngine:Project] Frame rate must reside inside limits of [1, 240] fps.");
      }
    }
    if (layer === "system") {
      if (patch.maxProcessors && patch.maxProcessors < 1) {
        throw new Error("[ConfigurationEngine:System] maxProcessors must be >= 1.");
      }
    }
    return patch;
  }

  private parseMockYaml(yaml: string): Record<string, any> {
    const lines = yaml.split("\n");
    const result: Record<string, any> = {};
    let currentKey = "";

    for (const line of lines) {
      if (line.trim().startsWith("#") || !line.trim()) continue;
      if (line.startsWith("  ")) {
        // nested field
        const parts = line.split(":");
        if (parts.length >= 2 && currentKey) {
          const k = parts[0].trim();
          const v = parts.slice(1).join(":").trim();
          if (!result[currentKey]) result[currentKey] = {};
          result[currentKey][k] = this.castPrimitive(v);
        }
      } else {
        const parts = line.split(":");
        if (parts.length >= 2) {
          currentKey = parts[0].trim();
          const v = parts.slice(1).join(":").trim();
          if (v) {
            result[currentKey] = this.castPrimitive(v);
          } else {
            result[currentKey] = {};
          }
        }
      }
    }
    return result;
  }

  private stringifyMockYaml(obj: any, indent = 0): string {
    let yaml = "";
    const padding = " ".repeat(indent);
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        yaml += `${padding}${key}:\n${this.stringifyMockYaml(val, indent + 2)}`;
      } else if (Array.isArray(val)) {
        yaml += `${padding}${key}: [${val.join(", ")}]\n`;
      } else {
        yaml += `${padding}${key}: ${val}\n`;
      }
    }
    return yaml;
  }

  private castPrimitive(val: string): any {
    if (val === "true") return true;
    if (val === "false") return false;
    if (!isNaN(Number(val))) return Number(val);
    return val.replace(/^["']|["']$/g, ""); // Strip quotes
  }

  private getDefaultConfig(): AppConfiguration {
    return {
      system: { maxProcessors: 8, apiVersion: "2.5.0" },
      workspace: { defaultFolder: "/projects", autoRestore: true },
      project: { name: "Untitled Studio Project", frameRate: 60, width: 1920, height: 1080 },
      module: { activeCategories: ["video_processing", "audio_mixing"] },
      plugin: { sandboxingEnabled: true },
      user: { email: "superuser@agency.com", preferredTheme: "slate-dark" },
      developer: { verboseTracing: true, hotReload: false },
      runtime: { maxExecutionTimeoutMs: 5000 },
      environment: { nodeEnv: "production", publicHost: "localhost:3000" },
      cloud: { backupSyncEnabled: true, remoteBucket: "gs://agency-studio-workspace" },
    };
  }
}
