import { Keyframe, KeyframeEasingType } from "../core/MotionTypes";

export class GraphEditorEngine {
  private static instance: GraphEditorEngine | null = null;

  // Viewport navigation parameters
  private zoomX = 1.0;
  private zoomY = 1.0;
  private panX = 0;
  private panY = 0;

  // Selection states
  private selectedKeyframeIds: Set<string> = new Set();

  public static getInstance(): GraphEditorEngine {
    if (!GraphEditorEngine.instance) {
      GraphEditorEngine.instance = new GraphEditorEngine();
    }
    return GraphEditorEngine.instance;
  }

  /**
   * Evaluates the cubic bezier curve at point t using De Casteljau's algorithm
   * or a Newton-Raphson approximation for parameter conversion.
   */
  public evaluateCubicBezier(
    t: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number
  ): number {
    // Normalizing handle inputs to guarantee monotonic X
    const x1 = Math.max(0, Math.min(1, p1x));
    const y1 = p1y;
    const x2 = Math.max(0, Math.min(1, p2x));
    const y2 = p2y;

    // Cubic Bezier functions
    const getX = (currT: number) => {
      const cx = 3.0 * x1;
      const bx = 3.0 * (x2 - x1) - cx;
      const ax = 1.0 - cx - bx;
      return ((ax * currT + bx) * currT + cx) * currT;
    };

    const getY = (currT: number) => {
      const cy = 3.0 * y1;
      const by = 3.0 * (y2 - y1) - cy;
      const ay = 1.0 - cy - by;
      return ((ay * currT + by) * currT + cy) * currT;
    };

    const getXDerivative = (currT: number) => {
      const cx = 3.0 * x1;
      const bx = 3.0 * (x2 - x1) - cx;
      const ax = 1.0 - cx - bx;
      return 3.0 * ax * currT * currT + 2.0 * bx * currT + cx;
    };

    // Use Newton-Raphson to solve for t_param of target X (t in this method is the target X)
    let tParam = t;
    for (let i = 0; i < 8; i++) {
      const xDiff = getX(tParam) - t;
      if (Math.abs(xDiff) < 1e-6) break;
      const dX = getXDerivative(tParam);
      if (Math.abs(dX) < 1e-6) break;
      tParam -= xDiff / dX;
    }

    return getY(tParam);
  }

  /**
   * Interpolate value between two keyframes at target frame.
   */
  public interpolate(kfStart: Keyframe, kfEnd: Keyframe, currentFrame: number): number {
    if (currentFrame <= kfStart.frame) return kfStart.value;
    if (currentFrame >= kfEnd.frame) return kfEnd.value;

    const t = (currentFrame - kfStart.frame) / (kfEnd.frame - kfStart.frame);

    switch (kfStart.easing) {
      case "hold":
        return kfStart.value;

      case "linear":
        return kfStart.value + (kfEnd.value - kfStart.value) * t;

      case "easeIn": {
        // Standard ease-in approximation curve
        const curveT = this.evaluateCubicBezier(t, 0.42, 0.0, 1.0, 1.0);
        return kfStart.value + (kfEnd.value - kfStart.value) * curveT;
      }

      case "easeOut": {
        // Standard ease-out approximation curve
        const curveT = this.evaluateCubicBezier(t, 0.0, 0.0, 0.58, 1.0);
        return kfStart.value + (kfEnd.value - kfStart.value) * curveT;
      }

      case "bezier":
      case "custom": {
        // Retrieve cubic Bezier points or build default ease handles
        const p1x = kfStart.controlOut?.x ?? 0.33;
        const p1y = kfStart.controlOut?.y ?? 0.0;
        const p2x = kfEnd.controlIn?.x ?? 0.67;
        const p2y = kfEnd.controlIn?.y ?? 1.0;

        const curveT = this.evaluateCubicBezier(t, p1x, p1y, p2x, p2y);
        return kfStart.value + (kfEnd.value - kfStart.value) * curveT;
      }

      default:
        return kfStart.value + (kfEnd.value - kfStart.value) * t;
    }
  }

  /**
   * ZOOM & PAN UTILITIES
   */
  public setZoom(x: number, y: number): void {
    this.zoomX = Math.max(0.1, Math.min(10.0, x));
    this.zoomY = Math.max(0.1, Math.min(10.0, y));
  }

  public getZoom(): { x: number; y: number } {
    return { x: this.zoomX, y: this.zoomY };
  }

  public setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
  }

  public getPan(): { x: number; y: number } {
    return { x: this.panX, y: this.panY };
  }

  public resetView(): void {
    this.zoomX = 1.0;
    this.zoomY = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  /**
   * KEYFRAME SELECTION UTILITIES
   */
  public selectKeyframe(id: string, additive = false): void {
    if (!additive) {
      this.selectedKeyframeIds.clear();
    }
    this.selectedKeyframeIds.add(id);
  }

  public deselectKeyframe(id: string): void {
    this.selectedKeyframeIds.delete(id);
  }

  public clearSelection(): void {
    this.selectedKeyframeIds.clear();
  }

  public getSelectedKeyframeIds(): string[] {
    return Array.from(this.selectedKeyframeIds);
  }

  public isKeyframeSelected(id: string): boolean {
    return this.selectedKeyframeIds.has(id);
  }
}
