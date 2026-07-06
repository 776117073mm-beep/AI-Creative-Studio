import { EnvironmentConfig, EnvironmentPreset, ColorRGB } from "../core/types";

export class EnvironmentEngine {
  private static instance: EnvironmentEngine | null = null;

  // Active Environmental setup config
  private config: EnvironmentConfig = {
    skyPreset: "sunset",
    fogEnabled: true,
    fogColor: { r: 55, g: 30, b: 65 }, // Moody sunset atmospheric purple fog
    fogDensity: 0.08,
    groundVisible: true,
    groundReflection: 0.65, // Highly reflective mirror floor grid
    hdriIntensity: 1.5
  };

  private constructor() {}

  public static getInstance(): EnvironmentEngine {
    if (!EnvironmentEngine.instance) {
      EnvironmentEngine.instance = new EnvironmentEngine();
    }
    return EnvironmentEngine.instance;
  }

  // --- Active Configuration accessor ---

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };

    // Auto adjust contextual Fog Colors based on sky environment selections for cohesion
    if (updates.skyPreset) {
      this.syncFogColorToSkyPreset(updates.skyPreset);
    }
  }

  private syncFogColorToSkyPreset(sky: EnvironmentPreset): void {
    if (sky === "sunset") {
      this.config.fogColor = { r: 55, g: 30, b: 65 }; // sunset purple
      this.config.fogDensity = 0.08;
    } else if (sky === "studio") {
      this.config.fogColor = { r: 15, g: 15, b: 20 }; // dark studio gray
      this.config.fogDensity = 0.02;
    } else if (sky === "cyberpunk_street") {
      this.config.fogColor = { r: 12, g: 25, b: 40 }; // neon night blue
      this.config.fogDensity = 0.12; // rainy mist
    } else if (sky === "nebula") {
      this.config.fogColor = { r: 10, g: 0, b: 25 }; // deep cosmic violet
      this.config.fogDensity = 0.04;
    } else { // daylight
      this.config.fogColor = { r: 180, g: 210, b: 240 }; // daylight blue sky glow
      this.config.fogDensity = 0.015;
    }
  }

  // --- Environmental lighting presets helper ---

  public static getSkyColorGradient(sky: EnvironmentPreset): { top: string; bottom: string } {
    if (sky === "sunset") {
      return { top: "#ff4e50", bottom: "#f9d423" }; // Warm firey orange to yellow
    }
    if (sky === "studio") {
      return { top: "#1e1e24", bottom: "#0c0c0e" }; // Studio monochromatic soft gray
    }
    if (sky === "cyberpunk_street") {
      return { top: "#ec4899", bottom: "#0f172a" }; // Magenta pink neon glow to deep charcoal
    }
    if (sky === "nebula") {
      return { top: "#3b0764", bottom: "#03001e" }; // Interstellar cosmic violet to black
    }
    return { top: "#38bdf8", bottom: "#e0f2fe" }; // Clean daylight sky blue
  }
}
