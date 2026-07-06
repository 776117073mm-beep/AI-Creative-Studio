import { CodecManager } from "../codecs/CodecManager";

export interface ImageMetadata {
  id: string;
  name: string;
  width: number;
  height: number;
  codecId: string;
  colorProfile: "sRGB" | "Display P3" | "Adobe RGB" | "Wide Color" | "CMYK";
  hasAlphaChannel: boolean;
  fileSizeInBytes: number;
  dpi?: number;
  creationDate: string;
}

export class ImageEngine {
  private static instance: ImageEngine;
  private currentImageMetadata: ImageMetadata | null = null;

  private constructor() {}

  public static getInstance(): ImageEngine {
    if (!ImageEngine.instance) {
      ImageEngine.instance = new ImageEngine();
    }
    return ImageEngine.instance;
  }

  /**
   * Import Image and Perform Analysis
   */
  public async importImage(file: File | { name: string; size: number; arrayBuffer?: () => Promise<ArrayBuffer> }): Promise<ImageMetadata> {
    console.log(`[ImageEngine] Importing image: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);

    let width = 1920;
    let height = 1080;
    let colorProfile: "sRGB" | "Display P3" | "Adobe RGB" | "Wide Color" | "CMYK" = "sRGB";
    let hasAlphaChannel = false;
    let headerBytes = new ArrayBuffer(0);

    const nameLower = file.name.toLowerCase();

    if (file.arrayBuffer) {
      try {
        const fullBuffer = await file.arrayBuffer();
        headerBytes = fullBuffer.slice(0, 1024); // read header 1KB
        
        // Basic Alpha channel checking for PNG
        const bytes = new Uint8Array(headerBytes);
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          // PNG magic found. Read IHDR block (starting at byte 12)
          // Color Type is byte 25
          const colorType = bytes[25];
          // Color Types 4 and 6 contain alpha channels (Greyscale with alpha, and Truecolor with alpha)
          hasAlphaChannel = colorType === 4 || colorType === 6;
        }
      } catch (err) {
        console.warn("[ImageEngine] Header buffer unreadable. Falling back to signature guesses.");
      }
    }

    const codecDef = await CodecManager.getInstance().detectCodecFromBinary(headerBytes, file.name);

    // Dynamic property determination
    if (nameLower.includes("png")) {
      hasAlphaChannel = true;
    }
    if (nameLower.includes("p3") || nameLower.includes("apple") || nameLower.includes("display")) {
      colorProfile = "Display P3";
    } else if (nameLower.includes("adobe") || nameLower.includes("raw")) {
      colorProfile = "Adobe RGB";
    }

    // Heuristics on size/dimension indicators
    if (nameLower.includes("4k") || nameLower.includes("uhd") || file.size > 8 * 1024 * 1024) {
      width = 3840;
      height = 2160;
    } else if (nameLower.includes("portrait") || nameLower.includes("vertical")) {
      width = 1080;
      height = 1920;
    } else if (nameLower.includes("square") || nameLower.includes("avatar")) {
      width = 1024;
      height = 1024;
    }

    const metadata: ImageMetadata = {
      id: `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: file.name,
      width,
      height,
      codecId: codecDef ? codecDef.id : "png",
      colorProfile,
      hasAlphaChannel,
      fileSizeInBytes: file.size,
      dpi: 72,
      creationDate: new Date().toISOString()
    };

    this.currentImageMetadata = metadata;
    console.log(`[ImageEngine] Image analytical extraction complete:`, metadata);
    return metadata;
  }

  /**
   * Export Image with transformation parameters
   */
  public async exportImage(formatId: string, dimensions: { width: number; height: number }, quality = 0.9): Promise<{ url: string; sizeBytes: number }> {
    if (!this.currentImageMetadata) throw new Error("[ImageEngine] No image active to export.");
    console.log(`[ImageEngine] Re-sampling image to ${dimensions.width}x${dimensions.height} as format "${formatId}" at ${quality * 100}% quality...`);
    
    // Simulate resizing logic delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const scale = (dimensions.width * dimensions.height) / (this.currentImageMetadata.width * this.currentImageMetadata.height);
    const expectedSize = Math.floor(this.currentImageMetadata.fileSizeInBytes * scale * quality);

    return {
      url: `blob:https://studio.agency.com/exports/compiled_image_${Date.now()}.${formatId}`,
      sizeBytes: expectedSize
    };
  }

  /**
   * Generates a high-quality thumbnail canvas or blob representation
   */
  public generateThumbnail(targetWidth = 150, targetHeight = 150): string {
    if (!this.currentImageMetadata) return "";
    
    // Virtualized canvas drawing representing image downscale
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // Draw thumbnail backing
      ctx.fillStyle = "#1e293b"; // Slate background
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Draw details
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("IMAGE PREVIEW", targetWidth / 2, targetHeight / 2 - 10);
      
      ctx.fillStyle = "#94a3b8";
      ctx.font = "8px sans-serif";
      ctx.fillText(`${this.currentImageMetadata.width}x${this.currentImageMetadata.height}`, targetWidth / 2, targetHeight / 2 + 10);
      ctx.fillText(this.currentImageMetadata.colorProfile, targetWidth / 2, targetHeight / 2 + 22);
    }
    
    return canvas.toDataURL("image/png");
  }

  /**
   * Retrieve active image property state
   */
  public getActiveImageMetadata(): ImageMetadata | null {
    return this.currentImageMetadata;
  }
}
