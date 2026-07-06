export type CodecCategory = "video" | "audio" | "image" | "subtitle" | "custom";

export interface CodecDefinition {
  id: string;
  name: string;
  category: CodecCategory;
  mimeType: string;
  extensions: string[];
  isHardwareAccelerated: boolean;
  capabilities: {
    canDecode: boolean;
    canEncode: boolean;
    maxResolutionWidth?: number; // for video/image
    maxResolutionHeight?: number; // for video/image
    supportedBitrates?: number[]; // in kbps
    supportedSampleRates?: number[]; // in Hz for audio
    supportedChannels?: number[]; // for audio
  };
  validateMetadata?(header: ArrayBuffer): boolean;
}

export class CodecManager {
  private static instance: CodecManager;
  private codecs: Map<string, CodecDefinition> = new Map();
  private formatMapping: Map<string, string> = new Map(); // extension -> codecId

  private constructor() {
    this.registerDefaultCodecs();
  }

  public static getInstance(): CodecManager {
    if (!CodecManager.instance) {
      CodecManager.instance = new CodecManager();
    }
    return CodecManager.instance;
  }

  /**
   * Register a new codec definition in the registry (plugin architecture)
   */
  public registerCodec(codec: CodecDefinition): void {
    if (this.codecs.has(codec.id)) {
      console.warn(`[CodecManager] Codec "${codec.id}" is already registered. Overwriting definition.`);
    }

    // Perform validation
    if (!codec.id || !codec.name || !codec.mimeType || !codec.extensions.length) {
      throw new Error(`[CodecManager] Invalid codec definition structural signature.`);
    }

    this.codecs.set(codec.id, codec);
    codec.extensions.forEach(ext => {
      this.formatMapping.set(ext.toLowerCase(), codec.id);
    });

    console.log(`[CodecManager] Successfully registered codec: ${codec.name} (${codec.id})`);
  }

  /**
   * Unregister an existing codec definition
   */
  public unregisterCodec(codecId: string): void {
    const codec = this.codecs.get(codecId);
    if (codec) {
      codec.extensions.forEach(ext => {
        this.formatMapping.delete(ext.toLowerCase());
      });
      this.codecs.delete(codecId);
      console.log(`[CodecManager] Unregistered codec: ${codecId}`);
    }
  }

  /**
   * Discover and retrieve a codec definition by ID
   */
  public getCodec(codecId: string): CodecDefinition | undefined {
    return this.codecs.get(codecId);
  }

  /**
   * Find codec by file extension
   */
  public getCodecByExtension(ext: string): CodecDefinition | undefined {
    const cleanExt = ext.replace(/^\./, "").toLowerCase();
    const codecId = this.formatMapping.get(cleanExt);
    if (!codecId) return undefined;
    return this.getCodec(codecId);
  }

  /**
   * Find codec by MIME type
   */
  public getCodecByMimeType(mimeType: string): CodecDefinition | undefined {
    return Array.from(this.codecs.values()).find(
      c => c.mimeType.toLowerCase() === mimeType.toLowerCase()
    );
  }

  /**
   * List all registered codecs, optionally filtered by category
   */
  public listCodecs(category?: CodecCategory): CodecDefinition[] {
    const all = Array.from(this.codecs.values());
    if (category) {
      return all.filter(c => c.category === category);
    }
    return all;
  }

  /**
   * Validates if a file extension is registered
   */
  public isFormatSupported(ext: string): boolean {
    const cleanExt = ext.replace(/^\./, "").toLowerCase();
    return this.formatMapping.has(cleanExt);
  }

  /**
   * Detects the codec and characteristics from raw file header binary signature
   */
  public async detectCodecFromBinary(header: ArrayBuffer, filename?: string): Promise<CodecDefinition | null> {
    const bytes = new Uint8Array(header);

    // 1. Signature checks (Magic Bytes)
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return this.getCodec("png") || null;
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return this.getCodec("jpeg") || null;
    }

    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return this.getCodec("gif") || null;
    }

    // WEBP: RIFF .... WEBP
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return this.getCodec("webp") || null;
    }

    // MP4/MOV: looking for 'ftyp' block at offset 4
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      // Could be MP4 or MOV. Let's inspect sub-type
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (brand === "qt  ") return this.getCodec("h264_mov") || this.getCodec("h264_mp4") || null;
      return this.getCodec("h264_mp4") || null;
    }

    // WAV/RIFF: RIFF .... WAVE
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
    ) {
      return this.getCodec("wav") || null;
    }

    // MP3 (ID3v2 starts with 'ID3' or raw frame begins with FF FB/F3)
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return this.getCodec("mp3") || null;
    }
    if (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2)) {
      return this.getCodec("mp3") || null;
    }

    // FLAC: 66 4C 61 43 (fLaC)
    if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) {
      return this.getCodec("flac") || null;
    }

    // Fallback to extension-based matching if binary is inconclusive
    if (filename) {
      const ext = filename.split(".").pop();
      if (ext) {
        return this.getCodecByExtension(ext) || null;
      }
    }

    return null;
  }

  /**
   * Validates if a specific codec can interoperate with another or meets profile limits
   */
  public checkCompatibility(codecId: string, requirements: { width?: number; height?: number; sampleRate?: number }): boolean {
    const codec = this.getCodec(codecId);
    if (!codec) return false;

    const cap = codec.capabilities;
    if (requirements.width && cap.maxResolutionWidth && requirements.width > cap.maxResolutionWidth) {
      return false;
    }
    if (requirements.height && cap.maxResolutionHeight && requirements.height > cap.maxResolutionHeight) {
      return false;
    }
    if (requirements.sampleRate && cap.supportedSampleRates && !cap.supportedSampleRates.includes(requirements.sampleRate)) {
      return false;
    }

    return true;
  }

  /**
   * System default codecs setup
   */
  private registerDefaultCodecs(): void {
    // 1. VIDEO CODECS
    this.registerCodec({
      id: "h264_mp4",
      name: "H.264 AVC (MPEG-4 Part 10)",
      category: "video",
      mimeType: "video/mp4",
      extensions: ["mp4", "m4v"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 7680,
        maxResolutionHeight: 4320,
        supportedBitrates: [2000, 5000, 10000, 25000, 50000, 100000]
      }
    });

    this.registerCodec({
      id: "h265_hevc",
      name: "H.265 HEVC (High Efficiency Video Coding)",
      category: "video",
      mimeType: "video/hevc",
      extensions: ["mp4", "hevc"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 8192,
        maxResolutionHeight: 8192,
        supportedBitrates: [1000, 3000, 8000, 15000, 30000, 60000]
      }
    });

    this.registerCodec({
      id: "prores_mov",
      name: "Apple ProRes (422 / 4444 HQ)",
      category: "video",
      mimeType: "video/quicktime",
      extensions: ["mov", "qt"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 15360,
        maxResolutionHeight: 8640,
        supportedBitrates: [45000, 110000, 220000, 440000, 880000]
      }
    });

    this.registerCodec({
      id: "webm_vp9",
      name: "VP9 WebM Video Stream",
      category: "video",
      mimeType: "video/webm",
      extensions: ["webm"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 7680,
        maxResolutionHeight: 4320,
        supportedBitrates: [1000, 2500, 5000, 12000, 24000]
      }
    });

    this.registerCodec({
      id: "avi_mpeg4",
      name: "DivX / MPEG-4 AVI Container",
      category: "video",
      mimeType: "video/x-msvideo",
      extensions: ["avi"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: false,
        maxResolutionWidth: 1920,
        maxResolutionHeight: 1080
      }
    });

    this.registerCodec({
      id: "mkv_container",
      name: "Matroska Media Container",
      category: "video",
      mimeType: "video/x-matroska",
      extensions: ["mkv"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: false,
        maxResolutionWidth: 8192,
        maxResolutionHeight: 4320
      }
    });

    this.registerCodec({
      id: "mxf_broadcast",
      name: "Material Exchange Format (MXF)",
      category: "video",
      mimeType: "application/mxf",
      extensions: ["mxf"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 4096,
        maxResolutionHeight: 2160
      }
    });

    // 2. AUDIO CODECS
    this.registerCodec({
      id: "mp3",
      name: "MPEG-1 Audio Layer III (MP3)",
      category: "audio",
      mimeType: "audio/mpeg",
      extensions: ["mp3"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true,
        supportedBitrates: [64, 128, 192, 256, 320],
        supportedSampleRates: [32000, 44100, 48000],
        supportedChannels: [1, 2]
      }
    });

    this.registerCodec({
      id: "aac",
      name: "Advanced Audio Coding (AAC-LC / HE)",
      category: "audio",
      mimeType: "audio/aac",
      extensions: ["aac", "m4a"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        supportedBitrates: [64, 96, 128, 192, 256, 320, 512],
        supportedSampleRates: [22050, 32000, 44100, 48000, 96000],
        supportedChannels: [1, 2, 6, 8]
      }
    });

    this.registerCodec({
      id: "wav",
      name: "Linear PCM Waveform (WAV)",
      category: "audio",
      mimeType: "audio/wav",
      extensions: ["wav"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true,
        supportedSampleRates: [8000, 11025, 22050, 32000, 44100, 48000, 96000, 192000],
        supportedChannels: [1, 2, 4, 6, 8, 16]
      }
    });

    this.registerCodec({
      id: "flac",
      name: "Free Lossless Audio Codec (FLAC)",
      category: "audio",
      mimeType: "audio/flac",
      extensions: ["flac"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true,
        supportedSampleRates: [44100, 48000, 88200, 96000, 192000],
        supportedChannels: [1, 2, 6, 8]
      }
    });

    // 3. IMAGE CODECS
    this.registerCodec({
      id: "png",
      name: "Portable Network Graphics (PNG)",
      category: "image",
      mimeType: "image/png",
      extensions: ["png"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 16384,
        maxResolutionHeight: 16384
      }
    });

    this.registerCodec({
      id: "jpeg",
      name: "Joint Photographic Experts Group (JPEG)",
      category: "image",
      mimeType: "image/jpeg",
      extensions: ["jpg", "jpeg", "jpe"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 32768,
        maxResolutionHeight: 32768
      }
    });

    this.registerCodec({
      id: "tiff",
      name: "Tagged Image File Format (TIFF)",
      category: "image",
      mimeType: "image/tiff",
      extensions: ["tif", "tiff"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 65536,
        maxResolutionHeight: 65536
      }
    });

    this.registerCodec({
      id: "svg",
      name: "Scalable Vector Graphics (SVG)",
      category: "image",
      mimeType: "image/svg+xml",
      extensions: ["svg"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 99999,
        maxResolutionHeight: 99999
      }
    });

    this.registerCodec({
      id: "gif",
      name: "Graphics Interchange Format (GIF)",
      category: "image",
      mimeType: "image/gif",
      extensions: ["gif"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 4096,
        maxResolutionHeight: 4096
      }
    });

    this.registerCodec({
      id: "webp",
      name: "Google WebP Image Format",
      category: "image",
      mimeType: "image/webp",
      extensions: ["webp"],
      isHardwareAccelerated: true,
      capabilities: {
        canDecode: true,
        canEncode: true,
        maxResolutionWidth: 16383,
        maxResolutionHeight: 16383
      }
    });

    // 4. SUBTITLE CODECS
    this.registerCodec({
      id: "srt",
      name: "SubRip Text Subtitles (SRT)",
      category: "subtitle",
      mimeType: "text/srt",
      extensions: ["srt"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true
      }
    });

    this.registerCodec({
      id: "vtt",
      name: "Web Video Text Tracks (WebVTT)",
      category: "subtitle",
      mimeType: "text/vtt",
      extensions: ["vtt"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true
      }
    });

    this.registerCodec({
      id: "ass_ssa",
      name: "Advanced SubStation Alpha (ASS / SSA)",
      category: "subtitle",
      mimeType: "text/x-ssa",
      extensions: ["ass", "ssa"],
      isHardwareAccelerated: false,
      capabilities: {
        canDecode: true,
        canEncode: true
      }
    });
  }
}
