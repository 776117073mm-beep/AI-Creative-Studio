export interface CommandArgumentDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  arguments: CommandArgumentDefinition[];
  requiredPermissions: string[];
  estimatedDurationMs: number;
  hasUndoSupport: boolean;
  hasRedoSupport: boolean;
  isAiCallable: boolean;
  keyboardShortcut?: string;
}

export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, CommandDefinition> = new Map();

  private constructor() {
    this.registerDefaultCommands();
  }

  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  public registerCommand(definition: CommandDefinition): void {
    if (this.commands.has(definition.name)) {
      console.warn(`[CommandRegistry] Overwriting command definition for: ${definition.name}`);
    }
    this.commands.set(definition.name, definition);
    console.log(`[CommandRegistry] Registered Command definition: ${definition.name} (${definition.description})`);
  }

  public unregisterCommand(commandName: string): void {
    if (this.commands.delete(commandName)) {
      console.log(`[CommandRegistry] Unregistered command definition: ${commandName}`);
    }
  }

  public getCommand(commandName: string): CommandDefinition | undefined {
    return this.commands.get(commandName);
  }

  public listCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  public listAiCallableCommands(): CommandDefinition[] {
    return this.listCommands().filter(cmd => cmd.isAiCallable);
  }

  private registerDefaultCommands(): void {
    this.registerCommand({
      id: "cmd_apply_matte",
      name: "Apply VFX Rotoscoping Matte",
      description: "Applies a rotoscope vector overlay or alpha channel matte onto specified frame boundaries.",
      arguments: [
        { name: "matteId", type: "string", required: true, description: "Uniquely identifies the tracker matte clip reference." },
        { name: "opacity", type: "number", required: false, description: "Intensity transparency blending factor.", defaultValue: 1.0 },
        { name: "feather", type: "number", required: false, description: "Edge soft blur radius.", defaultValue: 5 }
      ],
      requiredPermissions: ["vfx_pipeline"],
      estimatedDurationMs: 800,
      hasUndoSupport: true,
      hasRedoSupport: true,
      isAiCallable: true,
      keyboardShortcut: "Ctrl+Shift+M"
    });

    this.registerCommand({
      id: "cmd_load_lut_preset",
      name: "Load Color LUT Profile",
      description: "Loads a cinematic color grading LUT (.cube) mapping table onto the active video track.",
      arguments: [
        { name: "lutName", type: "string", required: true, description: "Name profile: e.g., kodak_gold, fuji_velvia." },
        { name: "intensity", type: "number", required: false, description: "LUT profile blend coefficient.", defaultValue: 1.0 }
      ],
      requiredPermissions: ["gpu_access"],
      estimatedDurationMs: 250,
      hasUndoSupport: true,
      hasRedoSupport: true,
      isAiCallable: true,
      keyboardShortcut: "Ctrl+Alt+L"
    });

    this.registerCommand({
      id: "cmd_set_track_fader",
      name: "Set Track Audio Gain",
      description: "Modifies the decibel gain of a specific track lane inside the surround sound mixing mixer.",
      arguments: [
        { name: "trackIndex", type: "number", required: true, description: "0-indexed timeline track lane ID." },
        { name: "decibels", type: "number", required: true, description: "Gain target level in decibels (dB), e.g., -6, 0, 1.5." }
      ],
      requiredPermissions: ["basic"],
      estimatedDurationMs: 50,
      hasUndoSupport: true,
      hasRedoSupport: true,
      isAiCallable: true,
      keyboardShortcut: "Ctrl+Shift+F"
    });

    this.registerCommand({
      id: "cmd_create_workspace_preset",
      name: "Save Workspace Layout Preset",
      description: "Persists the current arrangement of dockable panel sizing states into a customized layout schema.",
      arguments: [
        { name: "presetName", type: "string", required: true, description: "Name of the customized layout save." }
      ],
      requiredPermissions: ["basic"],
      estimatedDurationMs: 150,
      hasUndoSupport: false,
      hasRedoSupport: false,
      isAiCallable: false,
      keyboardShortcut: "Ctrl+Alt+P"
    });
  }
}
