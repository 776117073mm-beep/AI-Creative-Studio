import { MotionVectorLayer, AnimatedProperty } from "../core/MotionTypes";
import { AnimationEngine } from "../animation/AnimationEngine";

export class VectorEngine {
  private static instance: VectorEngine | null = null;
  private anim = AnimationEngine.getInstance();

  public static getInstance(): VectorEngine {
    if (!VectorEngine.instance) {
      VectorEngine.instance = new VectorEngine();
    }
    return VectorEngine.instance;
  }

  /**
   * PARSES RAW SVG STRING PATH INTO RENDERABLE PATH OBJECTS
   */
  public parseSvg(svgString: string): { d: string; id: string }[] {
    const paths: { d: string; id: string }[] = [];
    const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/gi;
    let match;
    let index = 0;

    while ((match = pathRegex.exec(svgString)) !== null) {
      const d = match[1];
      const idMatch = /id="([^"]+)"/i.exec(match[0]);
      const id = idMatch ? idMatch[1] : `svg_path_${index++}`;
      paths.push({ d, id });
    }

    // Fallback if no paths were found but standard d attribute was supplied
    if (paths.length === 0 && svgString.includes("M")) {
      paths.push({ d: svgString, id: "direct_path" });
    }

    return paths;
  }

  /**
   * EXPORTS VECTOR ENGINE DATA BACK INTO STANDARD SVG XML
   */
  public exportToSvg(layer: MotionVectorLayer, width: number, height: number): string {
    let output = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    layer.paths.forEach((p) => {
      output += `  <path d="${p.d}" fill="none" stroke="currentColor" stroke-width="2" />\n`;
    });
    output += `</svg>`;
    return output;
  }

  /**
   * TRIM PATHS MATHEMATICAL IMPLEMENTATION
   * Computes the dasharray/dashoffset values required to render trimmed vector lines.
   */
  public computeTrimPathDash(
    totalLength: number,
    trimStart: number, // 0 to 100
    trimEnd: number,   // 0 to 100
    trimOffset: number // 0 to 360
  ): { dashArray: string; dashOffset: number } {
    const start = Math.max(0, Math.min(100, trimStart)) / 100;
    const end = Math.max(0, Math.min(100, trimEnd)) / 100;
    const offset = (trimOffset % 360) / 360;

    const visibleLength = Math.max(0, end - start) * totalLength;
    const gapLength = totalLength - visibleLength;

    // Shift start position according to start percentage + dynamic offset
    const startOffset = -(start * totalLength + offset * totalLength);

    return {
      dashArray: `${visibleLength} ${gapLength}`,
      dashOffset: startOffset
    };
  }

  /**
   * PROCEDURAL PATH WIGGLER
   * Modifies path coordinates dynamically with high-speed simplex/sinusoidal noise.
   */
  public applyPathWiggle(
    points: { x: number; y: number }[],
    frequency: number,
    amount: number,
    frame: number
  ): { x: number; y: number }[] {
    if (frequency === 0 || amount === 0) return points;

    return points.map((pt, i) => {
      // Simulating realistic 2D path wiggles using a high-frequency sine coordinate blend
      const waveX = Math.sin(frame * frequency * 0.1 + i) * amount;
      const waveY = Math.cos(frame * frequency * 0.12 + i * 1.5) * amount;
      return {
        x: pt.x + waveX,
        y: pt.y + waveY
      };
    });
  }

  /**
   * DRAW MULTIPLIED PATH REPEATER (Repeater Foundation)
   * Duplicates drawing passes by shifting scale, angle, and translation matrices recursively.
   */
  public renderRepeater(
    ctx: CanvasRenderingContext2D,
    layer: MotionVectorLayer,
    drawCallback: () => void
  ): void {
    const count = layer.repeaterCount ?? 1;
    const offset = layer.repeaterOffset ?? { x: 0, y: 0 };
    const scale = layer.repeaterScale ?? 1.0;

    for (let i = 0; i < count; i++) {
      ctx.save();
      
      // Accumulate translations for each sequential repeater instance
      ctx.translate(offset.x * i, offset.y * i);
      
      const s = Math.pow(scale, i);
      ctx.scale(s, s);

      drawCallback();
      ctx.restore();
    }
  }
}
