import { ModuleEngine } from "../engine/ModuleEngine";
import { PluginEngine } from "../engine/PluginEngine";
import { ServiceRegistry } from "../registry/ServiceRegistry";
import { CommandRegistry } from "../registry/CommandRegistry";

export interface DocMetadata {
  id: string;
  name: string;
  category: "Module" | "Plugin" | "Service" | "API" | "Command" | "Workflow";
  description: string;
  details: Record<string, any>;
}

export class DocumentationSystem {
  private static instance: DocumentationSystem;

  private constructor() {}

  public static getInstance(): DocumentationSystem {
    if (!DocumentationSystem.instance) {
      DocumentationSystem.instance = new DocumentationSystem();
    }
    return DocumentationSystem.instance;
  }

  public generateAllDocMetadata(): DocMetadata[] {
    const docs: DocMetadata[] = [];

    // 1. Gather Modules
    try {
      const modEngine = ModuleEngine.getInstance();
      const modules = modEngine.listModules();
      modules.forEach(mod => {
        docs.push({
          id: mod.metadata.id,
          name: mod.metadata.displayName,
          category: "Module",
          description: `Core structural functional module running at state: ${mod.state.status}.`,
          details: {
            state: mod.state.status,
            category: mod.metadata.category,
            version: mod.metadata.version,
            author: "Agency Creative Ltd."
          }
        });
      });
    } catch (e) {
      console.error("[DocSystem] Failed to index modules", e);
    }

    // 2. Gather Plugins
    try {
      const pluginEngine = PluginEngine.getInstance();
      const plugins = pluginEngine.listPlugins();
      plugins.forEach(plug => {
        docs.push({
          id: plug.metadata.id,
          name: plug.metadata.name,
          category: "Plugin",
          description: plug.metadata.description,
          details: {
            version: plug.metadata.version,
            author: plug.metadata.author || plug.metadata.developer || "Third Party Provider",
            active: plug.state.status === "active",
            permissions: plug.metadata.permissions || ["basic"]
          }
        });
      });
    } catch (e) {
      console.error("[DocSystem] Failed to index plugins", e);
    }

    // 3. Gather Services
    try {
      const servRegistry = ServiceRegistry.getInstance();
      const services = servRegistry.listServices();
      services.forEach(serv => {
        docs.push({
          id: serv.serviceName,
          name: serv.serviceName,
          category: "Service",
          description: serv.description,
          details: {
            state: serv.getStatus(),
            version: "1.0.0",
            hasBackgroundInterval: serv.serviceName === "bg_service_daemon"
          }
        });
      });
    } catch (e) {
      console.error("[DocSystem] Failed to index services", e);
    }

    // 4. Gather Commands
    try {
      const cmdRegistry = CommandRegistry.getInstance();
      const commands = cmdRegistry.listCommands();
      commands.forEach(cmd => {
        docs.push({
          id: cmd.id,
          name: cmd.name,
          category: "Command",
          description: cmd.description,
          details: {
            keyboardShortcut: cmd.keyboardShortcut || "None",
            hasUndoSupport: cmd.hasUndoSupport,
            hasRedoSupport: cmd.hasRedoSupport,
            isAiCallable: cmd.isAiCallable,
            estimatedDurationMs: cmd.estimatedDurationMs,
            arguments: cmd.arguments
          }
        });
      });
    } catch (e) {
      console.error("[DocSystem] Failed to index commands", e);
    }

    // 5. Hardcoded API Endpoints and Workflows for completeness
    this.getApiDocMetadata().forEach(doc => docs.push(doc));
    this.getWorkflowDocMetadata().forEach(doc => docs.push(doc));

    return docs;
  }

  public exportMarkdownManual(): string {
    const all = this.generateAllDocMetadata();
    let md = `# AI Creative Studio Software Development Kit (SDK) Manual\n`;
    md += `*Generated dynamically on ${new Date().toUTCString()}*\n\n`;

    const categories: Array<DocMetadata["category"]> = ["Module", "Plugin", "Service", "Command", "API", "Workflow"];

    categories.forEach(cat => {
      const items = all.filter(item => item.category === cat);
      md += `## ${cat} Reference Registry (${items.length} items)\n\n`;
      
      items.forEach(item => {
        md += `### \`${item.id}\` - ${item.name}\n`;
        md += `**Description:** ${item.description}\n\n`;
        md += `**Registry Details:**\n`;
        for (const [key, value] of Object.entries(item.details)) {
          if (typeof value === "object") {
            md += `- \`${key}\`: \`${JSON.stringify(value)}\`\n`;
          } else {
            md += `- \`${key}\`: \`${value}\`\n`;
          }
        }
        md += `\n---\n\n`;
      });
    });

    return md;
  }

  private getApiDocMetadata(): DocMetadata[] {
    return [
      {
        id: "api_v2_assets",
        name: "GET /api/v2/assets",
        category: "API",
        description: "Lists all media footage items and assets currently loaded in the active project directory.",
        details: { method: "GET", path: "/api/v2/assets", authenticated: true, rateLimited: true, maxRequestsPerMin: 120 }
      },
      {
        id: "api_v2_render_job",
        name: "POST /api/v2/render",
        category: "API",
        description: "Creates and queues a hardware-accelerated timeline compile job onto the active rendering thread pool.",
        details: { method: "POST", path: "/api/v2/render", authenticated: true, rateLimited: true, maxRequestsPerMin: 20 }
      },
      {
        id: "api_v2_health",
        name: "GET /api/v2/system/health",
        category: "API",
        description: "Returns instant liveness health assessments of all 24 subsystem processors.",
        details: { method: "GET", path: "/api/v2/system/health", authenticated: false, rateLimited: false }
      }
    ];
  }

  private getWorkflowDocMetadata(): DocMetadata[] {
    return [
      {
        id: "flow_cinematic_auto",
        name: "Cinematic Auto-Director Workflow",
        category: "Workflow",
        description: "Orchestrates speech transcribing, subtitle overlay, and automatic jump-cut editing loops.",
        details: { nodesCount: 12, category: "Automation", trigger: "On Video Upload" }
      },
      {
        id: "flow_podcast_noise",
        name: "Podcast Studio Spectral De-Noise Workflow",
        category: "Workflow",
        description: "Applies spectral FFT-gated subtraction to silence hums and room echoes.",
        details: { nodesCount: 5, category: "Audio Restoration", trigger: "On Audio Added" }
      }
    ];
  }
}
