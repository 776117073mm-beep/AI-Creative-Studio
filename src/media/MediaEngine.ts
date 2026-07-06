import { IModule, ModuleMetadata, ModuleState, ModuleSettings } from "../interfaces";
import { CodecManager } from "./codecs/CodecManager";
import { VideoEngine, VideoMetadata } from "./video/VideoEngine";
import { AudioEngine, AudioMetadata } from "./audio/AudioEngine";
import { ImageEngine, ImageMetadata } from "./image/ImageEngine";
import { SubtitleEngine, SubtitleMetadata } from "./subtitles/SubtitleEngine";
import { MediaCache } from "./cache/MediaCache";
import { ProxyManager } from "./proxy/ProxyManager";
import { PreviewGenerator } from "./preview/PreviewGenerator";
import { RenderEngine } from "./render/RenderEngine";
import { PlaybackController } from "./playback/PlaybackController";

export interface MediaAsset {
  id: string;
  name: string;
  type: "video" | "audio" | "image" | "subtitle";
  codecId: string;
  sizeBytes: number;
  metadata: VideoMetadata | AudioMetadata | ImageMetadata | SubtitleMetadata;
  hasProxy: boolean;
  isValid: boolean;
  validationLog?: string[];
}

export class MediaEngine implements IModule {
  private static instance: MediaEngine;
  
  // IModule requirements
  public metadata: ModuleMetadata;
  public state: ModuleState;
  public settings: ModuleSettings;

  private activeAssets: Map<string, MediaAsset> = new Map();

  private constructor() {
    this.metadata = {
      id: "mod_media_foundation",
      name: "media_foundation",
      displayName: "Professional Media Processing Engine",
      description: "Unified media processing, multi-codec decoding/encoding, proxy generation, and frame buffering.",
      version: "1.0.0",
      developer: "Media Systems Core Group",
      dependencies: [],
      permissions: ["storage_read", "storage_write", "gpu_access", "audio_io"],
      inputs: ["raw_binary_stream", "media_descriptor"],
      outputs: ["calibrated_grade_feed", "master_audio_stereo", "rendered_cues"],
      capabilities: ["multi_codec", "frame_buffering", "subtitles_sync", "proxy_rendering"],
      category: "Media Pipeline"
    };

    this.state = {
      status: "unloaded",
      health: "healthy"
    };

    this.settings = {
      enableAutoProxy: true,
      maxCacheSizeMb: 128,
      defaultProxyWidth: 1280,
      enableHardwareAcceleration: true
    };
  }

  public static getInstance(): MediaEngine {
    if (!MediaEngine.instance) {
      MediaEngine.instance = new MediaEngine();
    }
    return MediaEngine.instance;
  }

  // --- IModule LIFECYCLE ---

  public async initialize(): Promise<void> {
    console.log("[MediaEngine] Bootstrapping professional media subsystem...");
    this.state.status = "loading";
    
    // Warm up singletons
    CodecManager.getInstance();
    VideoEngine.getInstance();
    AudioEngine.getInstance();
    ImageEngine.getInstance();
    SubtitleEngine.getInstance();
    MediaCache.getInstance();
    ProxyManager.getInstance();
    PreviewGenerator.getInstance();
    RenderEngine.getInstance();
    PlaybackController.getInstance();

    this.state.status = "loaded";
  }

  public async start(): Promise<void> {
    console.log("[MediaEngine] Activating processing loops and listeners.");
    this.state.status = "active";
    this.state.uptime = Date.now();
  }

  public async stop(): Promise<void> {
    console.log("[MediaEngine] Suspending processing loops.");
    PlaybackController.getInstance().pause();
    this.state.status = "loaded";
    this.state.uptime = undefined;
  }

  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  public updateSettings(settings: Partial<ModuleSettings>): void {
    this.settings = { ...this.settings, ...settings };
    if (settings.maxCacheSizeMb) {
      MediaCache.getInstance().setMaxMemoryBytes(settings.maxCacheSizeMb * 1024 * 1024);
    }
  }

  public getApi() {
    return {
      importFile: (file: File) => this.importFile(file),
      getAsset: (id: string) => this.getAsset(id),
      listAssets: () => this.listAssets(),
      playback: PlaybackController.getInstance(),
      render: RenderEngine.getInstance(),
      proxy: ProxyManager.getInstance(),
      cache: MediaCache.getInstance(),
      codecs: CodecManager.getInstance(),
      preview: PreviewGenerator.getInstance()
    };
  }

  // --- BUSINESS LOGIC API ---

  /**
   * Discovers and registers sample assets in workspace to simulate local file storage imports
   */
  public discoverWorkspaceAssets(): MediaAsset[] {
    const samples: { name: string; size: number; type: "video" | "audio" | "image" | "subtitle" }[] = [
      { name: "epic_overwatch_highlights_4k.mp4", size: 382 * 1024 * 1024, type: "video" },
      { name: "calm_ambient_nature_loop.wav", size: 48 * 1024 * 1024, type: "audio" },
      { name: "cinematic_matte_overlay.png", size: 12 * 1024 * 1024, type: "image" },
      { name: "english_captions_closing_scene.vtt", size: 14 * 1024, type: "subtitle" }
    ];

    samples.forEach(sample => {
      if (!this.activeAssets.has(sample.name)) {
        // Trigger synchronized validation / mock imports
        const assetId = `asst_${Math.floor(Math.random() * 10000)}`;
        let codecId = "png";
        let metadata: any = {};

        if (sample.type === "video") {
          codecId = "h264_mp4";
          metadata = {
            id: `vid_${assetId}`,
            name: sample.name,
            durationSec: 45.5,
            fps: 23.976,
            totalFrames: 1090,
            width: 3840,
            height: 2160,
            aspectRatio: "16:9",
            codecId,
            colorSpace: "rec2020",
            isHDR: true,
            bitrateKbps: 45000,
            creationDate: new Date().toISOString(),
            fileSizeInBytes: sample.size
          };
        } else if (sample.type === "audio") {
          codecId = "wav";
          metadata = {
            id: `aud_${assetId}`,
            name: sample.name,
            durationSec: 120,
            sampleRate: 48000,
            channels: 2,
            codecId,
            bitrateKbps: 1536,
            peakAmplitude: 0.92,
            creationDate: new Date().toISOString(),
            fileSizeInBytes: sample.size
          };
        } else if (sample.type === "image") {
          codecId = "png";
          metadata = {
            id: `img_${assetId}`,
            name: sample.name,
            width: 1920,
            height: 1080,
            codecId,
            colorProfile: "sRGB",
            hasAlphaChannel: true,
            fileSizeInBytes: sample.size,
            creationDate: new Date().toISOString()
          };
        } else {
          codecId = "vtt";
          metadata = {
            format: "vtt",
            language: "en",
            cueCount: 42,
            totalDurationSec: 45.5
          };
        }

        const asset: MediaAsset = {
          id: assetId,
          name: sample.name,
          type: sample.type,
          codecId,
          sizeBytes: sample.size,
          metadata,
          hasProxy: false,
          isValid: true,
          validationLog: ["Pre-loaded discovery registration: Integrity verified successfully."]
        };

        this.activeAssets.set(assetId, asset);
        
        // Auto-generate proxy if configured
        if (sample.type === "video" && this.settings.enableAutoProxy) {
          ProxyManager.getInstance().generateProxy(assetId, 3840, 2160, sample.size).then(p => {
            asset.hasProxy = true;
          });
        }
      }
    });

    return this.listAssets();
  }

  /**
   * Import individual file and dispatch to respective engines
   */
  public async importFile(file: File): Promise<MediaAsset> {
    const filename = file.name;
    const size = file.size;
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    console.log(`[MediaEngine] Routing imported file for handling: "${filename}"`);

    // 1. Structural file format validation
    const validation = await this.validateFileIntegrity(file);
    
    let type: "video" | "audio" | "image" | "subtitle" = "video";
    let codecId = "h264_mp4";
    let metadata: any = null;

    const codecDef = await CodecManager.getInstance().getCodecByExtension(ext);
    if (codecDef) {
      codecId = codecDef.id;
      if (codecDef.category === "video") type = "video";
      else if (codecDef.category === "audio") type = "audio";
      else if (codecDef.category === "image") type = "image";
      else if (codecDef.category === "subtitle") type = "subtitle";
    } else {
      // Fallback heuristics
      if (["mp4", "mov", "avi", "mkv", "webm", "mxf"].includes(ext)) {
        type = "video";
        codecId = "h264_mp4";
      } else if (["mp3", "wav", "aac", "flac"].includes(ext)) {
        type = "audio";
        codecId = "wav";
      } else if (["png", "jpg", "jpeg", "tiff", "svg", "gif", "webp"].includes(ext)) {
        type = "image";
        codecId = "png";
      } else if (["vtt", "srt", "ass"].includes(ext)) {
        type = "subtitle";
        codecId = "vtt";
      } else {
        throw new Error(`[MediaEngine] Unsupported file format extension: .${ext}`);
      }
    }

    // 2. Dispatch to dedicated sub-engines
    try {
      if (type === "video") {
        metadata = await VideoEngine.getInstance().importVideo(file);
      } else if (type === "audio") {
        metadata = await AudioEngine.getInstance().importAudio(file);
      } else if (type === "image") {
        metadata = await ImageEngine.getInstance().importImage(file);
      } else if (type === "subtitle") {
        const textContent = await this.readAsText(file);
        const imported = await SubtitleEngine.getInstance().importSubtitles(textContent, ext);
        metadata = imported.metadata;
      }
    } catch (err: any) {
      validation.isValid = false;
      validation.logs.push(`Sub-engine parsing crashed: ${err.message}`);
    }

    const assetId = `asst_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const asset: MediaAsset = {
      id: assetId,
      name: filename,
      type,
      codecId,
      sizeBytes: size,
      metadata,
      hasProxy: false,
      isValid: validation.isValid,
      validationLog: validation.logs
    };

    this.activeAssets.set(assetId, asset);

    // 3. Trigger asynchronous proxy rendering pipeline for 4K video assets
    if (type === "video" && metadata && metadata.width >= 3840 && this.settings.enableAutoProxy) {
      ProxyManager.getInstance().generateProxy(assetId, metadata.width, metadata.height, size).then(() => {
        asset.hasProxy = true;
      });
    }

    return asset;
  }

  /**
   * Validate file binary structural sanity
   */
  public async validateFileIntegrity(file: File): Promise<{ isValid: boolean; logs: string[] }> {
    const logs: string[] = [];
    let isValid = true;

    logs.push(`Initiated validation checklist for target file: "${file.name}"`);
    logs.push(`Metadata: Bytes Size = ${file.size}, MIME = ${file.type || "unspecified"}`);

    if (file.size <= 0) {
      isValid = false;
      logs.push("ERROR: File contains zero bytes. Corrupt header detected.");
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      if (arrayBuffer.byteLength !== file.size) {
        isValid = false;
        logs.push("ERROR: Stream byte-length mismatch during allocation.");
      }

      // Check header bytes signature
      const codec = await CodecManager.getInstance().detectCodecFromBinary(arrayBuffer.slice(0, 512), file.name);
      if (!codec) {
        logs.push("WARNING: Codec signature magic-bytes unrecognized. Parsing with extension heuristics.");
      } else {
        logs.push(`SUCCESS: Recognized structure signature corresponding to codec: [${codec.id}]`);
      }
    } catch (err: any) {
      isValid = false;
      logs.push(`CRITICAL ERROR: Exception read stream crash: ${err.message}`);
    }

    return { isValid, logs };
  }

  public getAsset(id: string): MediaAsset | undefined {
    return this.activeAssets.get(id);
  }

  public listAssets(): MediaAsset[] {
    return Array.from(this.activeAssets.values());
  }

  public removeAsset(id: string): void {
    this.activeAssets.delete(id);
  }

  private readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
