import { IModule, IPlugin, IService, ITool } from "../interfaces";
import { ModuleEngine } from "../engine/ModuleEngine";
import { PluginEngine } from "../engine/PluginEngine";
import { ServiceRegistry } from "../registry/ServiceRegistry";
import { ToolRegistry } from "../registry/ToolRegistry";
import { CommandRegistry, CommandDefinition } from "../registry/CommandRegistry";
import { CapabilityRegistry, CapabilityDeclaration } from "../registry/CapabilityRegistry";
import { FileTypeRegistry, FileFormatDefinition } from "../registry/FileTypeRegistry";

/**
 * ====================================================================
 * AI CREATIVE STUDIO PLATFORM EXTENSION SDK
 * ====================================================================
 */

// Custom Timeline Tool interface
export interface ITimelineTool {
  id: string;
  name: string;
  iconName: string;
  onExecute(timelineState: any): void;
}

// Custom Workflow Node interface
export interface IWorkflowNode {
  id: string;
  type: string;
  inputSlots: Array<{ name: string; type: string }>;
  outputSlots: Array<{ name: string; type: string }>;
  execute(inputs: Record<string, any>): Promise<Record<string, any>>;
}

// Custom Video/Audio Effect
export interface IStudioEffect {
  id: string;
  name: string;
  category: "vfx" | "audio" | "color" | "utility";
  parameters: Record<string, { type: "number" | "string" | "color"; min?: number; max?: number; value: any }>;
  process(frameData: any): void;
}

// Custom Transition Effect
export interface IStudioTransition {
  id: string;
  name: string;
  durationMs: number;
  renderTransition(progress: number, canvasContext: any): void;
}

// Custom Footages Importer / Exporter
export interface IFileImporter {
  extension: string;
  importFile(fileBuffer: ArrayBuffer): Promise<any>;
}

export interface IFileExporter {
  extension: string;
  exportTimeline(timelineData: any): Promise<Blob>;
}

// Custom Inspector Panel
export interface ICustomInspector {
  id: string;
  title: string;
  supportedAssetTypes: string[];
  renderLayout(activeAsset: any): any; // react render callback reference
}

export class ExtensionSdk {
  private static registeredTimelineTools: Map<string, ITimelineTool> = new Map();
  private static registeredEffects: Map<string, IStudioEffect> = new Map();
  private static registeredTransitions: Map<string, IStudioTransition> = new Map();
  private static registeredImporters: Map<string, IFileImporter> = new Map();
  private static registeredExporters: Map<string, IFileExporter> = new Map();

  /**
   * Register a fully independent Module
   */
  public static registerModule(module: IModule): void {
    ModuleEngine.getInstance().registerModule(module);
    console.log(`[SDK] Registered Module: ${module.metadata.displayName}`);
  }

  /**
   * Register a fully sandboxed Plugin
   */
  public static registerPlugin(plugin: IPlugin): void {
    PluginEngine.getInstance().registerPlugin(plugin);
    console.log(`[SDK] Registered Plugin: ${plugin.metadata.name}`);
  }

  /**
   * Register an internal Service
   */
  public static registerService(service: IService): void {
    ServiceRegistry.getInstance().register(service);
    console.log(`[SDK] Registered Service: ${service.serviceName}`);
  }

  /**
   * Register an AI Tool callable by Gemini or internal AI engines
   */
  public static registerAiTool(tool: ITool): void {
    ToolRegistry.getInstance().register(tool.metadata, tool.execute);
    console.log(`[SDK] Registered AI Tool: ${tool.metadata.name}`);
  }

  /**
   * Register a new Command available in the command dispatcher
   */
  public static registerCommand(cmd: CommandDefinition): void {
    CommandRegistry.getInstance().registerCommand(cmd);
    console.log(`[SDK] Registered Command: ${cmd.id}`);
  }

  /**
   * Declare a set of module Capabilities
   */
  public static declareCapabilities(moduleId: string, decl: Omit<CapabilityDeclaration, "moduleId">): void {
    CapabilityRegistry.getInstance().registerCapability(moduleId, decl);
  }

  /**
   * Register custom File Extensions & Formats
   */
  public static registerFileFormat(format: FileFormatDefinition): void {
    FileTypeRegistry.getInstance().registerFormat(format);
  }

  /**
   * Register a Timeline Editing Tool
   */
  public static registerTimelineTool(tool: ITimelineTool): void {
    this.registeredTimelineTools.set(tool.id, tool);
    console.log(`[SDK] Registered Custom Timeline Tool: ${tool.name}`);
  }

  /**
   * Register a GPU Shader Effect
   */
  public static registerEffect(effect: IStudioEffect): void {
    this.registeredEffects.set(effect.id, effect);
    console.log(`[SDK] Registered Custom Effect: ${effect.name}`);
  }

  /**
   * Register a Dynamic Blend Transition
   */
  public static registerTransition(transition: IStudioTransition): void {
    this.registeredTransitions.set(transition.id, transition);
    console.log(`[SDK] Registered Custom Transition: ${transition.name}`);
  }

  /**
   * Register a File Importer
   */
  public static registerImporter(importer: IFileImporter): void {
    this.registeredImporters.set(importer.extension, importer);
    console.log(`[SDK] Registered Importer for: ${importer.extension}`);
  }

  /**
   * Register a File Exporter
   */
  public static registerExporter(exporter: IFileExporter): void {
    this.registeredExporters.set(exporter.extension, exporter);
    console.log(`[SDK] Registered Exporter for: ${exporter.extension}`);
  }

  // Listing methods for developer verification dashboards
  public static getTimelineTools(): ITimelineTool[] {
    return Array.from(this.registeredTimelineTools.values());
  }

  public static getEffects(): IStudioEffect[] {
    return Array.from(this.registeredEffects.values());
  }

  public static getTransitions(): IStudioTransition[] {
    return Array.from(this.registeredTransitions.values());
  }
}
export default ExtensionSdk;
