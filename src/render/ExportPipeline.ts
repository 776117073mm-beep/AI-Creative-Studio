export type ExportFormat = "mp4" | "webm" | "gif" | "png" | "jpg" | "webp" | "pdf" | "svg" | "mp3" | "wav" | "ogg" | "json";

export type VideoCodec = "h264" | "h265" | "vp9" | "av1" | "prores";
export type AudioCodec = "aac" | "mp3" | "opus" | "pcm" | "flac";
export type ImageCodec = "png" | "jpeg" | "webp";

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  videoCodec?: VideoCodec;
  audioCodec?: AudioCodec;
  imageCodec?: ImageCodec;
  resolution: { width: number; height: number };
  fps: number;
  bitrate?: number;
  quality: number; // 0-100
  pixelAspectRatio: number;
  colorSpace: "sRGB" | "Rec709" | "Rec2020" | "ACES";
}

export interface ExportJobConfig {
  presetId: string;
  format: ExportFormat;
  resolution: { width: number; height: number };
  fps: number;
  quality: number;
  range: { startFrame: number; endFrame: number };
  codec?: string;
  outputPath?: string;
  audioSettings?: {
    sampleRate: number;
    channels: number;
    bitrate: number;
  };
  customSettings?: Record<string, any>;
}

export interface RenderLayer {
  id: string;
  name: string;
  type: "video" | "image" | "audio" | "text" | "shape" | "effect";
  visible: boolean;
  locked: boolean;
  blendMode: string;
  opacity: number;
  transform: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
    rotation: number;
    anchor: { x: number; y: number };
  };
  trackId?: string;
  clipId?: string;
  effects: RenderEffect[];
}

export interface RenderEffect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
}

export interface RenderFrame {
  frameIndex: number;
  timestamp: number;
  layers: RenderLayer[];
  width: number;
  height: number;
  pixelFormat: string;
}

export const BUILTIN_PRESETS: ExportPreset[] = [
  {
    id: "youtube-1080p",
    name: "YouTube 1080p",
    description: "Optimized for YouTube uploads",
    format: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    bitrate: 8000,
    quality: 80,
    pixelAspectRatio: 1,
    colorSpace: "Rec709",
  },
  {
    id: "youtube-4k",
    name: "YouTube 4K",
    description: "4K resolution for YouTube",
    format: "mp4",
    videoCodec: "h265",
    audioCodec: "aac",
    resolution: { width: 3840, height: 2160 },
    fps: 30,
    bitrate: 35000,
    quality: 85,
    pixelAspectRatio: 1,
    colorSpace: "Rec2020",
  },
  {
    id: "instagram-square",
    name: "Instagram Square",
    description: "1:1 aspect ratio for Instagram feed",
    format: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    resolution: { width: 1080, height: 1080 },
    fps: 30,
    bitrate: 5000,
    quality: 80,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "instagram-story",
    name: "Instagram Story/Reels",
    description: "9:16 vertical format",
    format: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    bitrate: 5000,
    quality: 80,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Optimized for TikTok",
    format: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    bitrate: 6000,
    quality: 82,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "twitter",
    name: "Twitter/X",
    description: "Optimized for Twitter/X",
    format: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    resolution: { width: 1280, height: 720 },
    fps: 30,
    bitrate: 5000,
    quality: 75,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "prores-422",
    name: "ProRes 422",
    description: "Apple ProRes 422 for editing",
    format: "mp4",
    videoCodec: "prores",
    audioCodec: "pcm",
    resolution: { width: 1920, height: 1080 },
    fps: 24,
    bitrate: 147000,
    quality: 100,
    pixelAspectRatio: 1,
    colorSpace: "Rec709",
  },
  {
    id: "webm-vp9",
    name: "WebM VP9",
    description: "Web-optimized VP9 codec",
    format: "webm",
    videoCodec: "vp9",
    audioCodec: "opus",
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    bitrate: 6000,
    quality: 80,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "gif-animated",
    name: "Animated GIF",
    description: "Animated GIF for web",
    format: "gif",
    resolution: { width: 480, height: 270 },
    fps: 15,
    quality: 60,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "png-sequence",
    name: "PNG Sequence",
    description: "Lossless PNG image sequence",
    format: "png",
    imageCodec: "png",
    resolution: { width: 1920, height: 1080 },
    fps: 24,
    quality: 100,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "audio-mp3",
    name: "MP3 Audio",
    description: "Compressed audio only",
    format: "mp3",
    audioCodec: "mp3",
    resolution: { width: 0, height: 0 },
    fps: 0,
    quality: 90,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
  {
    id: "audio-wav",
    name: "WAV Audio",
    description: "Uncompressed audio",
    format: "wav",
    audioCodec: "pcm",
    resolution: { width: 0, height: 0 },
    fps: 0,
    quality: 100,
    pixelAspectRatio: 1,
    colorSpace: "sRGB",
  },
];

export class ExportManager {
  private static instance: ExportManager;
  private presets: Map<string, ExportPreset> = new Map();
  private customPresets: Map<string, ExportPreset> = new Map();

  private constructor() {
    BUILTIN_PRESETS.forEach(preset => {
      this.presets.set(preset.id, preset);
    });
  }

  public static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager();
    }
    return ExportManager.instance;
  }

  public getPresets(): ExportPreset[] {
    return [
      ...Array.from(this.presets.values()),
      ...Array.from(this.customPresets.values()),
    ];
  }

  public getBuiltinPresets(): ExportPreset[] {
    return Array.from(this.presets.values());
  }

  public getCustomPresets(): ExportPreset[] {
    return Array.from(this.customPresets.values());
  }

  public getPreset(id: string): ExportPreset | undefined {
    return this.presets.get(id) || this.customPresets.get(id);
  }

  public createCustomPreset(config: Omit<ExportPreset, "id">): ExportPreset {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const preset: ExportPreset = { ...config, id };
    this.customPresets.set(id, preset);
    return preset;
  }

  public updateCustomPreset(id: string, updates: Partial<ExportPreset>): boolean {
    const preset = this.customPresets.get(id);
    if (!preset) return false;

    Object.assign(preset, updates);
    return true;
  }

  public deleteCustomPreset(id: string): boolean {
    return this.customPresets.delete(id);
  }

  public calculateEstimatedFileSize(preset: ExportPreset, durationSeconds: number): number {
    const { resolution, fps, bitrate, quality, format } = preset;

    if (format === "mp3" || format === "wav" || format === "ogg") {
      const audioBitrate = bitrate || (format === "wav" ? 1411 : 320);
      return Math.ceil((audioBitrate * 1000 * durationSeconds) / 8);
    }

    if (format === "png" || format === "jpg" || format === "webp") {
      const frames = fps * durationSeconds;
      const bytesPerPixel = format === "png" ? 3 : 0.5;
      const pixels = resolution.width * resolution.height;
      return Math.ceil(pixels * bytesPerPixel * frames * (quality / 100));
    }

    if (format === "gif") {
      const frames = preset.fps * durationSeconds;
      const pixels = resolution.width * resolution.height;
      return Math.ceil(pixels * 0.1 * frames); // 10-bit color per pixel on average
    }

    const effectiveBitrate = bitrate || Math.ceil(resolution.width * resolution.height * fps * 0.01);
    const videoBytes = Math.ceil((effectiveBitrate * 1000 * durationSeconds) / 8);
    const audioBytes = Math.ceil((320 * 1000 * durationSeconds) / 8);

    return videoBytes + audioBytes;
  }

  public formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

export class CompositionPipeline {
  private layers: RenderLayer[] = [];
  private frameCache: Map<number, ImageData> = new Map();
  private maxCacheSize: number = 100;

  constructor() {}

  public addLayer(layer: RenderLayer): void {
    this.layers.push(layer);
    this.sortLayers();
  }

  public removeLayer(layerId: string): void {
    this.layers = this.layers.filter(l => l.id !== layerId);
  }

  public updateLayer(layerId: string, updates: Partial<RenderLayer>): void {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      Object.assign(layer, updates);
    }
  }

  public getLayers(): RenderLayer[] {
    return this.layers;
  }

  private sortLayers(): void {
    this.layers.sort((a, b) => {
      const aOrder = parseInt(a.id.split("_").pop() || "0");
      const bOrder = parseInt(b.id.split("_").pop() || "0");
      return bOrder - aOrder;
    });
  }

  public compositeFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    frameIndex: number,
    width: number,
    height: number
  ): void {
    ctx.clearRect(0, 0, width, height);

    for (const layer of this.layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as any;

      const { position, scale, rotation, anchor } = layer.transform;
      ctx.translate(position.x, position.y);
      ctx.scale(scale.x, scale.y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-anchor.x * width, -anchor.y * height);

      this.renderLayerContent(ctx, layer, frameIndex, width, height);

      ctx.restore();
    }
  }

  private renderLayerContent(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    layer: RenderLayer,
    frameIndex: number,
    width: number,
    height: number
  ): void {
    switch (layer.type) {
      case "shape":
        this.renderShape(ctx, layer, frameIndex, width, height);
        break;
      case "text":
        this.renderText(ctx, layer, frameIndex, width, height);
        break;
      case "effect":
        this.renderEffect(ctx, layer, frameIndex, width, height);
        break;
      case "video":
      case "image":
        // Would integrate with asset loading
        break;
      case "audio":
        // Audio doesn't render to canvas
        break;
    }
  }

  private renderShape(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    layer: RenderLayer,
    frameIndex: number,
    width: number,
    height: number
  ): void {
    const shape = layer.effects.find(e => e.type === "shape")?.parameters || {};
    const fill = shape.fill || "#3b82f6";
    const stroke = shape.stroke;
    const strokeWidth = shape.strokeWidth || 0;

    ctx.fillStyle = fill;
    if (stroke) ctx.strokeStyle = stroke;
    if (strokeWidth) ctx.lineWidth = strokeWidth;

    const shapeType = shape.type || "rectangle";
    const w = shape.width || 100;
    const h = shape.height || 100;

    switch (shapeType) {
      case "rectangle":
        if (shape.cornerRadius) {
          this.roundRect(ctx, -w/2, -h/2, w, h, shape.cornerRadius);
          ctx.fill();
          if (stroke) ctx.stroke();
        } else {
          ctx.fillRect(-w/2, -h/2, w, h);
          if (stroke) ctx.strokeRect(-w/2, -h/2, w, h);
        }
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (stroke) ctx.stroke();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(-w/2, h/2);
        ctx.closePath();
        ctx.fill();
        if (stroke) ctx.stroke();
        break;
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private renderText(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    layer: RenderLayer,
    frameIndex: number,
    width: number,
    height: number
  ): void {
    const text = layer.effects.find(e => e.type === "text")?.parameters || {};
    const content = text.content || "Text";
    const fontSize = text.fontSize || 48;
    const fontFamily = text.fontFamily || "sans-serif";
    const fill = text.fill || "#ffffff";
    const align = text.align || "center";

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fill;
    ctx.textAlign = align as any;
    ctx.textBaseline = "middle";

    if (text.stroke) {
      ctx.strokeStyle = text.stroke;
      ctx.lineWidth = text.strokeWidth || 2;
      ctx.strokeText(content, 0, 0);
    }

    ctx.fillText(content, 0, 0);
  }

  private renderEffect(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    layer: RenderLayer,
    frameIndex: number,
    width: number,
    height: number
  ): void {
    const effect = layer.effects[0];
    if (!effect) return;

    const params = effect.parameters;

    switch (effect.type) {
      case "gradient":
        this.renderGradient(ctx, params, width, height);
        break;
      case "noise":
        this.renderNoise(ctx, params, width, height);
        break;
      case "solid":
        ctx.fillStyle = params.color || "#000000";
        ctx.fillRect(-width/2, -height/2, width, height);
        break;
    }
  }

  private renderGradient(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: Record<string, any>,
    width: number,
    height: number
  ): void {
    const type = params.type || "linear";
    const colors = params.colors || ["#000000", "#ffffff"];
    const angle = params.angle || 0;

    let gradient: CanvasGradient;
    if (type === "radial") {
      gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) / 2);
    } else {
      const rad = (angle * Math.PI) / 180;
      const x1 = -Math.cos(rad) * width;
      const y1 = -Math.sin(rad) * height;
      const x2 = Math.cos(rad) * width;
      const y2 = Math.sin(rad) * height;
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    }

    colors.forEach((color: string, i: number) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(-width/2, -height/2, width, height);
  }

  private renderNoise(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: Record<string, any>,
    width: number,
    height: number
  ): void {
    const intensity = params.intensity || 0.5;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255 * intensity;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, -width/2, -height/2);
  }

  public getFrameFromCache(frameIndex: number): ImageData | undefined {
    return this.frameCache.get(frameIndex);
  }

  public cacheFrame(frameIndex: number, data: ImageData): void {
    if (this.frameCache.size >= this.maxCacheSize) {
      const oldestKey = this.frameCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.frameCache.delete(oldestKey);
      }
    }
    this.frameCache.set(frameIndex, data);
  }

  public clearCache(): void {
    this.frameCache.clear();
  }
}
