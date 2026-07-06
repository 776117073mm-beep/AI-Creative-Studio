import { KeyerSettings } from "../types";

export class VFXKeyer {
  private static instance: VFXKeyer | null = null;

  public static getInstance(): VFXKeyer {
    if (!VFXKeyer.instance) {
      VFXKeyer.instance = new VFXKeyer();
    }
    return VFXKeyer.instance;
  }

  /**
   * Evaluates pixel-level chroma key distance using euclidean color metrics
   * Returns a matte value between 0.0 (fully keyed out background) and 1.0 (retained foreground)
   */
  public calculateChromaKey(
    r: number, g: number, b: number,
    settings: KeyerSettings
  ): number {
    const key = settings.keyColor;
    let distance = 0;

    if (settings.colorSpace === "RGB") {
      // Euclidean distance in RGB color cube
      const dr = r - key.r;
      const dg = g - key.g;
      const db = b - key.b;
      // Max possible distance is sqrt(3) * 255 = 441.67
      distance = Math.sqrt(dr * dr + dg * dg + db * db) / 441.67;
    } else if (settings.colorSpace === "HSV") {
      const hsvPixel = this.rgbToHsv(r, g, b);
      const hsvKey = this.rgbToHsv(key.r, key.g, key.b);

      const dh = Math.min(
        Math.abs(hsvPixel.h - hsvKey.h),
        360 - Math.abs(hsvPixel.h - hsvKey.h)
      ) / 180.0;
      const ds = Math.abs(hsvPixel.s - hsvKey.s);
      const dv = Math.abs(hsvPixel.v - hsvKey.v);

      distance = Math.sqrt(dh * dh * 0.6 + ds * ds * 0.2 + dv * dv * 0.2);
    } else { // YUV
      const yuvPixel = this.rgbToYuv(r, g, b);
      const yuvKey = this.rgbToYuv(key.r, key.g, key.b);

      const dy = yuvPixel.y - yuvKey.y;
      const du = yuvPixel.u - yuvKey.u;
      const dv = yuvPixel.v - yuvKey.v;

      // Weight chroma channels more heavily for green screen chroma keys
      distance = Math.sqrt(dy * dy * 0.1 + du * du * 0.45 + dv * dv * 0.45) / 255.0;
    }

    // Apply tolerance and softness clipping
    // tolerance defines the background threshold, softness defines the feather width
    const tolNorm = settings.tolerance / 100.0;
    const softNorm = Math.max(0.001, settings.softness / 100.0);

    let matte = 0;
    if (distance > tolNorm + softNorm) {
      matte = 1.0; // Foreground
    } else if (distance < tolNorm) {
      matte = 0.0; // Background
    } else {
      // Linear transition region
      matte = (distance - tolNorm) / softNorm;
    }

    // Clip levels: black and white point compression
    const blackNorm = settings.clipBlack / 100.0;
    const whiteNorm = settings.clipWhite / 100.0;

    if (matte <= blackNorm) {
      matte = 0.0;
    } else if (matte >= whiteNorm) {
      matte = 1.0;
    } else if (whiteNorm > blackNorm) {
      matte = (matte - blackNorm) / (whiteNorm - blackNorm);
    }

    return Math.max(0.0, Math.min(1.0, matte));
  }

  /**
   * Applies chroma spill suppression (removes green bounce on hair/shoulders)
   * Prevents green leakage without altering non-green pixel values
   */
  public applySpillSuppression(
    r: number, g: number, b: number,
    settings: KeyerSettings
  ): { r: number; g: number; b: number } {
    const key = settings.keyColor;
    const suppressionRatio = settings.spillSuppression;

    if (suppressionRatio <= 0) {
      return { r, g, b };
    }

    // Identify if target is primarily green or blue
    const isGreenKey = key.g > key.r && key.g > key.b;
    const isBlueKey = key.b > key.r && key.b > key.g;

    let outR = r;
    let outG = g;
    let outB = b;

    if (isGreenKey) {
      // Green spill suppression: limit green channel to average of Red and Blue
      const maxGreenAllowed = ((r + b) / 2.0);
      if (g > maxGreenAllowed) {
        // Blends between original green and suppressed green
        outG = Math.round(g * (1 - suppressionRatio) + maxGreenAllowed * suppressionRatio);
      }
    } else if (isBlueKey) {
      // Blue spill suppression: limit blue channel to average of Red and Green
      const maxBlueAllowed = ((r + g) / 2.0);
      if (b > maxBlueAllowed) {
        outB = Math.round(b * (1 - suppressionRatio) + maxBlueAllowed * suppressionRatio);
      }
    }

    return { r: outR, g: outG, b: outB };
  }

  /**
   * Refines a full alpha matte buffer with erosion and soft gaussian blurs
   */
  public refineMatteBuffer(
    width: number,
    height: number,
    matteBuffer: Float32Array,
    settings: KeyerSettings
  ): Float32Array {
    let result = new Float32Array(matteBuffer);

    // 1. Erode border (mimicked via morphological minimum filter)
    const erodeRadius = Math.round(settings.erode);
    if (erodeRadius > 0) {
      const temp = new Float32Array(result);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let minVal = 1.0;
          for (let ky = -erodeRadius; ky <= erodeRadius; ky++) {
            for (let kx = -erodeRadius; kx <= erodeRadius; kx++) {
              const px = Math.min(width - 1, Math.max(0, x + kx));
              const py = Math.min(height - 1, Math.max(0, y + ky));
              const val = temp[py * width + px];
              if (val < minVal) {
                minVal = val;
              }
            }
          }
          result[y * width + x] = minVal;
        }
      }
    }

    // 2. Blur / soften matte (approximate box/gaussian filter sequence)
    const blurSigma = settings.blurMatte;
    if (blurSigma > 0) {
      const temp = new Float32Array(result);
      const blurRadius = Math.min(10, Math.ceil(blurSigma * 1.5));
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let count = 0;
          for (let ky = -blurRadius; ky <= blurRadius; ky++) {
            for (let kx = -blurRadius; kx <= blurRadius; kx++) {
              const px = Math.min(width - 1, Math.max(0, x + kx));
              const py = Math.min(height - 1, Math.max(0, y + ky));
              const weight = Math.exp(-(kx * kx + ky * ky) / (2 * blurSigma * blurSigma));
              sum += temp[py * width + px] * weight;
              count += weight;
            }
          }
          result[y * width + x] = sum / (count || 1);
        }
      }
    }

    return result;
  }

  // --- Helper conversions ---

  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta) % 6;
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / delta + 2;
      } else {
        h = (rNorm - gNorm) / delta + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
  }

  private rgbToYuv(r: number, g: number, b: number): { y: number; u: number; v: number } {
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const u = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
    const v = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;
    return { y, u, v };
  }
}
