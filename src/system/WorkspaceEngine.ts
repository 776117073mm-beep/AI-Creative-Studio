export interface PanelConfig {
  id: string;
  name: string;
  visible: boolean;
  dockPosition: "left" | "right" | "top" | "bottom" | "center" | "floating";
  width: number; // percentage or px
  height: number;
  floatingCoords?: { x: number; y: number; width: number; height: number };
}

export interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  panels: PanelConfig[];
}

export class WorkspaceEngine {
  private static instance: WorkspaceEngine;
  private presets: Map<string, WorkspacePreset> = new Map();
  private activePresetId = "edit_default";
  private panelLayout: Map<string, PanelConfig> = new Map();

  private constructor() {
    this.registerDefaultPresets();
    this.applyPreset(this.activePresetId);
  }

  public static getInstance(): WorkspaceEngine {
    if (!WorkspaceEngine.instance) {
      WorkspaceEngine.instance = new WorkspaceEngine();
    }
    return WorkspaceEngine.instance;
  }

  public getActivePresetId(): string {
    return this.activePresetId;
  }

  public getActivePresetName(): string {
    return this.presets.get(this.activePresetId)?.name || "Custom Layout";
  }

  public listPresets(): WorkspacePreset[] {
    return Array.from(this.presets.values());
  }

  public getPanelLayout(): PanelConfig[] {
    return Array.from(this.panelLayout.values());
  }

  public updatePanelConfig(panelId: string, patch: Partial<PanelConfig>): void {
    const existing = this.panelLayout.get(panelId);
    if (existing) {
      this.panelLayout.set(panelId, { ...existing, ...patch });
      console.log(`[WorkspaceEngine] Updated panel layout definition for: ${panelId}`, patch);
    }
  }

  public applyPreset(presetId: string): void {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`[WorkspaceEngine] Workspace layout preset not registered: ${presetId}`);
    }

    this.activePresetId = presetId;
    this.panelLayout.clear();
    preset.panels.forEach(p => {
      this.panelLayout.set(p.id, JSON.parse(JSON.stringify(p)));
    });

    console.log(`[WorkspaceEngine] Applied layout preset: ${preset.name}`);
  }

  public saveAsPreset(id: string, name: string, description: string): void {
    const preset: WorkspacePreset = {
      id,
      name,
      description,
      panels: this.getPanelLayout()
    };
    this.presets.set(id, preset);
    this.activePresetId = id;
    console.log(`[WorkspaceEngine] Saved current panel configurations as custom layout preset: ${name}`);
  }

  public restoreDefaultLayout(): void {
    this.applyPreset("edit_default");
  }

  private registerDefaultPresets(): void {
    // 1. Default Editing preset
    this.presets.set("edit_default", {
      id: "edit_default",
      name: "Standard Post-Production",
      description: "Optimized for dual monitor storytelling with central visual viewer and long tracks timeline.",
      panels: [
        { id: "media_library", name: "Footage BIN", visible: true, dockPosition: "left", width: 25, height: 40 },
        { id: "viewer_panel", name: "Visual Program Monitor", visible: true, dockPosition: "center", width: 50, height: 60 },
        { id: "metadata_inspector", name: "Luma/Alpha Inspector", visible: true, dockPosition: "right", width: 25, height: 100 },
        { id: "tracks_timeline", name: "Multi-Track Timeline", visible: true, dockPosition: "bottom", width: 75, height: 40 },
        { id: "audio_faders", name: "Audio VU Sub-Mixer", visible: false, dockPosition: "floating", width: 15, height: 35, floatingCoords: { x: 100, y: 150, width: 300, height: 400 } }
      ]
    });

    // 2. Color grading preset
    this.presets.set("color_default", {
      id: "color_default",
      name: "Cinematic Color Calibration",
      description: "Dedicated luma waveform scopes, lift-gamma-gain wheels, and LUT calibration grids.",
      panels: [
        { id: "media_library", name: "Footage BIN", visible: false, dockPosition: "left", width: 20, height: 30 },
        { id: "viewer_panel", name: "HDR Graded Display Monitor", visible: true, dockPosition: "center", width: 60, height: 50 },
        { id: "color_scopes", name: "RGB Waveform Vectorscope", visible: true, dockPosition: "right", width: 40, height: 50 },
        { id: "color_wheels_deck", name: "Lift-Gamma-Gain Wheels Deck", visible: true, dockPosition: "bottom", width: 100, height: 50 }
      ]
    });

    // 3. Audio Mixing preset
    this.presets.set("audio_default", {
      id: "audio_default",
      name: "Dynamic Sound Design Deck",
      description: "Multi-channel audio mixing board, spectral analyzers, and equalizer frequency faders.",
      panels: [
        { id: "media_library", name: "Audio Clips Deck", visible: true, dockPosition: "left", width: 20, height: 50 },
        { id: "audio_mixer_board", name: "16-Lane Mixing Console", visible: true, dockPosition: "center", width: 80, height: 65 },
        { id: "spectral_analyzer", name: "Fast Fourier Transform (FFT) Scope", visible: true, dockPosition: "right", width: 30, height: 50 },
        { id: "audio_effect_racks", name: "VST Compressor Effect Rails", visible: true, dockPosition: "bottom", width: 100, height: 35 }
      ]
    });
  }
}
