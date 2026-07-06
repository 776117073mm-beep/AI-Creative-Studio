import { MotionTextLayer } from "../core/MotionTypes";

export interface FontConfig {
  family: string;
  url?: string;
  fallback: string;
  loaded: boolean;
}

export interface CharacterLayoutMetric {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  wordIndex: number;
  lineIndex: number;
}

export class TextEngine {
  private static instance: TextEngine | null = null;
  private fonts: Map<string, FontConfig> = new Map();

  private constructor() {
    this.registerDefaultFonts();
  }

  public static getInstance(): TextEngine {
    if (!TextEngine.instance) {
      TextEngine.instance = new TextEngine();
    }
    return TextEngine.instance;
  }

  private registerDefaultFonts(): void {
    const systemFonts: FontConfig[] = [
      { family: "Inter", fallback: "sans-serif", loaded: true },
      { family: "Space Grotesk", fallback: "sans-serif", loaded: true },
      { family: "JetBrains Mono", fallback: "monospace", loaded: true },
      { family: "Playfair Display", fallback: "serif", loaded: true }
    ];

    systemFonts.forEach(font => this.fonts.set(font.family, font));
  }

  public registerFont(family: string, fallback: string, url?: string): void {
    this.fonts.set(family, { family, url, fallback, loaded: false });
  }

  public getFonts(): FontConfig[] {
    return Array.from(this.fonts.values());
  }

  /**
   * Computes layout metrics for characters in a text box, allowing individual character/word/line level animating.
   */
  public computeTextLayout(
    layer: MotionTextLayer,
    ctx?: CanvasRenderingContext2D
  ): CharacterLayoutMetric[] {
    const metrics: CharacterLayoutMetric[] = [];
    const text = layer.text;
    const tracking = layer.tracking ?? 0;
    const leading = layer.leading ?? layer.fontSize * 1.2;
    const boxWidth = layer.textboxWidth ?? 800;

    // Use a mock calculation if no canvas context is provided (headless mode)
    const getCharWidth = (char: string) => {
      if (ctx) {
        ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
        return ctx.measureText(char).width;
      }
      return layer.fontSize * 0.6; // fallback approximation
    };

    const words = text.split(" ");
    let currentX = 0;
    let currentY = layer.fontSize + layer.baselineShift;
    let lineIdx = 0;
    let wordIdx = 0;

    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const wordChars: string[] = word.split("");
      
      // Calculate word width
      let wordWidth = 0;
      wordChars.forEach(c => {
        wordWidth += getCharWidth(c) + tracking;
      });

      // Wrap lines if we exceed the bounding text box width
      if (currentX + wordWidth > boxWidth && currentX > 0) {
        currentX = 0;
        currentY += leading;
        lineIdx++;
      }

      // Layout each character of the word
      for (let c = 0; c < wordChars.length; c++) {
        const char = wordChars[c];
        const wChar = getCharWidth(char);

        metrics.push({
          char,
          x: currentX,
          y: currentY,
          width: wChar,
          height: layer.fontSize,
          wordIndex: wordIdx,
          lineIndex: lineIdx
        });

        currentX += wChar + tracking;
      }

      // Add trailing space layout unless it's the final word
      if (w < words.length - 1) {
        const spaceWidth = getCharWidth(" ");
        metrics.push({
          char: " ",
          x: currentX,
          y: currentY,
          width: spaceWidth,
          height: layer.fontSize,
          wordIndex: wordIdx,
          lineIndex: lineIdx
        });
        currentX += spaceWidth + tracking;
      }

      wordIdx++;
    }

    return metrics;
  }

  /**
   * INTERPOLATES CHARACTER COORDINATES ALONG AN ARBITRARY BEZIER PATH (Text on Path Foundation)
   */
  public layoutTextOnPath(
    metrics: CharacterLayoutMetric[],
    pathPoints: { x: number; y: number }[]
  ): { char: string; x: number; y: number; angle: number }[] {
    if (pathPoints.length < 2) {
      return metrics.map(m => ({ char: m.char, x: m.x, y: m.y, angle: 0 }));
    }

    // Measure total path distance
    const segmentLengths: number[] = [];
    let totalPathLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const dx = pathPoints[i + 1].x - pathPoints[i].x;
      const dy = pathPoints[i + 1].y - pathPoints[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(len);
      totalPathLength += len;
    }

    // Find point coordinates at precise cumulative distance ratio (0.0 to 1.0) along the path
    const getPointAtLength = (targetLen: number): { x: number; y: number; angle: number } => {
      let accumulated = 0;
      for (let i = 0; i < segmentLengths.length; i++) {
        const segLen = segmentLengths[i];
        if (accumulated + segLen >= targetLen) {
          const ratio = (targetLen - accumulated) / segLen;
          const pStart = pathPoints[i];
          const pEnd = pathPoints[i + 1];
          const x = pStart.x + (pEnd.x - pStart.x) * ratio;
          const y = pStart.y + (pEnd.y - pStart.y) * ratio;
          const angle = Math.atan2(pEnd.y - pStart.y, pEnd.x - pStart.x);
          return { x, y, angle };
        }
        accumulated += segLen;
      }
      const last = pathPoints[pathPoints.length - 1];
      const prev = pathPoints[pathPoints.length - 2];
      return { x: last.x, y: last.y, angle: Math.atan2(last.y - prev.y, last.x - prev.x) };
    };

    // Distribute characters proportionally
    const pathLayout: { char: string; x: number; y: number; angle: number }[] = [];
    let currentDist = 0;

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      if (currentDist > totalPathLength) break;

      const pt = getPointAtLength(currentDist);
      pathLayout.push({
        char: metric.char,
        x: pt.x,
        y: pt.y,
        angle: pt.angle
      });

      currentDist += metric.width + 4; // increment offset by character width plus safety padding
    }

    return pathLayout;
  }
}
