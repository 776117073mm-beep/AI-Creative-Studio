export interface PresetItem {
  id: string;
  name: string;
  type: "color" | "effect" | "transition" | "animation" | "plugin";
  category: string;
  tags: string[];
  isFavorite: boolean;
  data: Record<string, any>;
  origin: "user" | "system" | "plugin";
}

export class PresetEngine {
  private presets: Map<string, PresetItem> = new Map();

  constructor() {
    this.loadSystemPresets();
  }

  private loadSystemPresets(): void {
    const presets: PresetItem[] = [
      {
        id: "sys_preset_vintage_70s",
        name: "Vintage Technicolor 1970s",
        type: "color",
        category: "Creative Looks",
        tags: ["film", "warm", "vintage"],
        isFavorite: true,
        data: { saturation: 115, contrast: 15, temperature: 25 },
        origin: "system",
      },
      {
        id: "sys_preset_speed_zoom",
        name: "Speed Zoom Transition",
        type: "transition",
        category: "Transitions",
        tags: ["fast", "zoom"],
        isFavorite: false,
        data: { zoomCurve: "elastic", motionBlur: true },
        origin: "system",
      },
    ];

    presets.forEach((p) => this.presets.set(p.id, p));
  }

  public getPresets(): PresetItem[] {
    return Array.from(this.presets.values());
  }

  public saveUserPreset(preset: Omit<PresetItem, "origin">): PresetItem {
    const fullPreset: PresetItem = {
      ...preset,
      origin: "user",
    };

    this.presets.set(preset.id, fullPreset);
    return fullPreset;
  }

  public toggleFavorite(presetId: string): void {
    const item = this.presets.get(presetId);
    if (item) {
      item.isFavorite = !item.isFavorite;
    }
  }

  public deletePreset(presetId: string): boolean {
    const item = this.presets.get(presetId);
    if (item && item.origin === "user") {
      return this.presets.delete(presetId);
    }
    return false; // Prevent deleting system presets
  }

  /**
   * Export database presets to standard JSON string
   */
  public exportPresetsToString(): string {
    const userPresetsOnly = Array.from(this.presets.values()).filter((p) => p.origin === "user");
    return JSON.stringify(userPresetsOnly, null, 2);
  }

  /**
   * Import database presets
   */
  public importPresets(presetsJson: string): number {
    try {
      const parsed = JSON.parse(presetsJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item.id && item.name) {
            this.saveUserPreset({
              id: item.id,
              name: item.name,
              type: item.type || "effect",
              category: item.category || "Imported",
              tags: item.tags || [],
              isFavorite: !!item.isFavorite,
              data: item.data || {},
            });
          }
        });
        return parsed.length;
      }
    } catch (err) {
      console.error("Failed to parse preset import content", err);
    }
    return 0;
  }
}
