import { IPlugin, PluginMetadata } from "../interfaces";

export interface CustomPluginConfig {
  id: string;
  name: string;
  description: string;
  version: string;
}

export function createSandboxedPlugin(config: CustomPluginConfig): IPlugin {
  const metadata: PluginMetadata = {
    id: config.id,
    name: config.name,
    description: config.description,
    version: config.version,
    developer: "Third-party Developer",
    dependencies: [],
    permissions: ["sandbox_eval"],
    compatibility: "^2.0.0"
  };

  return {
    metadata,
    state: { status: "discovered" },
    async install() {
      console.log(`[Plugin:${config.name}] Dynamic install run.`);
    },
    async uninstall() {
      console.log(`[Plugin:${config.name}] Dynamic uninstall run.`);
    },
    async activate() {
      console.log(`[Plugin:${config.name}] Dynamic activated in sandbox.`);
    },
    async deactivate() {
      console.log(`[Plugin:${config.name}] Dynamic deactivated.`);
    },
    async update() {
      console.log(`[Plugin:${config.name}] Updated assets.`);
    },
    async sandboxRun<T>(code: string, context?: any): Promise<T> {
      const sandboxContext = {
        ...context,
        API_VERSION: "2.0.0",
        formatString: (val: string) => val.toUpperCase()
      };
      
      const evaluator = new Function("context", `
        with (context || {}) {
          return (() => {
            ${code}
          })();
        }
      `);
      
      return evaluator(sandboxContext) as T;
    }
  };
}
