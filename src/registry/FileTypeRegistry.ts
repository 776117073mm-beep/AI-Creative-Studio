export type PrimaryMediaCategory = 
  | "video" 
  | "audio" 
  | "image" 
  | "3d" 
  | "subtitle" 
  | "project" 
  | "custom";

export interface FileFormatDefinition {
  extension: string; // e.g., ".mp4"
  name: string;      // e.g., "MPEG-4 Part 14"
  mimeType: string;  // e.g., "video/mp4"
  category: PrimaryMediaCategory;
  registeredByModuleId: string;
  isCustom: boolean;
}

export class FileTypeRegistry {
  private static instance: FileTypeRegistry;
  private formats: Map<string, FileFormatDefinition> = new Map();

  private constructor() {
    this.registerDefaultFormats();
  }

  public static getInstance(): FileTypeRegistry {
    if (!FileTypeRegistry.instance) {
      FileTypeRegistry.instance = new FileTypeRegistry();
    }
    return FileTypeRegistry.instance;
  }

  public registerFormat(definition: FileFormatDefinition): void {
    const ext = definition.extension.toLowerCase();
    if (this.formats.has(ext)) {
      console.warn(`[FileTypeRegistry] Overwriting format registration for: ${ext}`);
    }
    this.formats.set(ext, definition);
    console.log(`[FileTypeRegistry] Registered format [${definition.name}] with extension [${ext}] under category [${definition.category}]`);
  }

  public unregisterFormat(extension: string): void {
    const ext = extension.toLowerCase();
    if (this.formats.delete(ext)) {
      console.log(`[FileTypeRegistry] Unregistered extension: ${ext}`);
    }
  }

  public getFormatDefinition(extension: string): FileFormatDefinition | undefined {
    return this.formats.get(extension.toLowerCase());
  }

  public listFormats(category?: PrimaryMediaCategory): FileFormatDefinition[] {
    const all = Array.from(this.formats.values());
    if (category) {
      return all.filter(fmt => fmt.category === category);
    }
    return all;
  }

  public getSupportedExtensionsByModule(moduleId: string): string[] {
    return this.listFormats()
      .filter(fmt => fmt.registeredByModuleId === moduleId)
      .map(fmt => fmt.extension);
  }

  private registerDefaultFormats(): void {
    // Video
    this.registerFormat({ extension: ".mp4", name: "H.264 MP4 Container", mimeType: "video/mp4", category: "video", registeredByModuleId: "mod_vfx_composer", isCustom: false });
    this.registerFormat({ extension: ".mov", name: "Apple QuickTime Video", mimeType: "video/quicktime", category: "video", registeredByModuleId: "mod_vfx_composer", isCustom: false });
    this.registerFormat({ extension: ".exr", name: "OpenEXR Image Sequence Frame", mimeType: "image/x-exr", category: "video", registeredByModuleId: "mod_vfx_composer", isCustom: false });

    // Audio
    this.registerFormat({ extension: ".wav", name: "Waveform Audio File Format", mimeType: "audio/wav", category: "audio", registeredByModuleId: "mod_audio_mixing", isCustom: false });
    this.registerFormat({ extension: ".mp3", name: "MPEG Layer 3 Audio", mimeType: "audio/mpeg", category: "audio", registeredByModuleId: "mod_audio_mixing", isCustom: false });
    this.registerFormat({ extension: ".aac", name: "Advanced Audio Coding", mimeType: "audio/aac", category: "audio", registeredByModuleId: "mod_audio_mixing", isCustom: false });

    // Image
    this.registerFormat({ extension: ".png", name: "Portable Network Graphics", mimeType: "image/png", category: "image", registeredByModuleId: "mod_color_grading", isCustom: false });
    this.registerFormat({ extension: ".tiff", name: "Tagged Image File Format", mimeType: "image/tiff", category: "image", registeredByModuleId: "mod_color_grading", isCustom: false });

    // 3D
    this.registerFormat({ extension: ".gltf", name: "GL Transmission Format", mimeType: "model/gltf+json", category: "3d", registeredByModuleId: "mod_vfx_composer", isCustom: false });
    this.registerFormat({ extension: ".usd", name: "Pixar Universal Scene Description", mimeType: "model/usd", category: "3d", registeredByModuleId: "mod_vfx_composer", isCustom: false });

    // Subtitle
    this.registerFormat({ extension: ".srt", name: "SubRip Subtitle Format", mimeType: "text/plain", category: "subtitle", registeredByModuleId: "mod_audio_mixing", isCustom: false });
    this.registerFormat({ extension: ".vtt", name: "Web Video Text Tracks", mimeType: "text/vtt", category: "subtitle", registeredByModuleId: "mod_audio_mixing", isCustom: false });

    // Project
    this.registerFormat({ extension: ".studio", name: "AI Studio Saved Workspace Project", mimeType: "application/json", category: "project", registeredByModuleId: "system", isCustom: false });
  }
}
