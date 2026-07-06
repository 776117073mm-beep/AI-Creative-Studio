import { RotoCurve, RotoMask, BezierAnchor } from "../types";

export class VFXRotoscoper {
  private static instance: VFXRotoscoper | null = null;
  private masks: Map<string, RotoMask> = new Map();

  constructor() {
    this.createDefaultMasks();
  }

  public static getInstance(): VFXRotoscoper {
    if (!VFXRotoscoper.instance) {
      VFXRotoscoper.instance = new VFXRotoscoper();
    }
    return VFXRotoscoper.instance;
  }

  private createDefaultMasks(): void {
    // Create an initial green-screen garbage matte mask
    const screenCurve: RotoCurve = {
      id: "curve_screen_matte",
      name: "Subject Garbage Matte",
      closed: true,
      featherRadius: 8.5,
      opacity: 1.0,
      blendMode: "add",
      motionBlurEnabled: true,
      linkedTrackerId: "tracker_face",
      anchors: [
        {
          id: "anc_0",
          point: { x: 0.45, y: 0.2 },
          handleIn: { x: -0.05, y: -0.02 },
          handleOut: { x: 0.05, y: 0.02 }
        },
        {
          id: "anc_1",
          point: { x: 0.65, y: 0.2 },
          handleIn: { x: -0.02, y: -0.05 },
          handleOut: { x: 0.02, y: 0.05 }
        },
        {
          id: "anc_2",
          point: { x: 0.7, y: 0.6 },
          handleIn: { x: 0.05, y: -0.02 },
          handleOut: { x: -0.05, y: 0.02 }
        },
        {
          id: "anc_3",
          point: { x: 0.4, y: 0.6 },
          handleIn: { x: 0.02, y: 0.05 },
          handleOut: { x: -0.02, y: -0.05 }
        }
      ]
    };

    const rootMask: RotoMask = {
      id: "mask_subject_1",
      name: "Subject 1 Core Roto",
      curves: [screenCurve],
      isActive: true
    };

    this.masks.set(rootMask.id, rootMask);
  }

  public addMask(mask: RotoMask): void {
    this.masks.set(mask.id, mask);
  }

  public getMasks(): RotoMask[] {
    return Array.from(this.masks.values());
  }

  public getMask(id: string): RotoMask | undefined {
    return this.masks.get(id);
  }

  /**
   * Evaluates Cubic Bezier curve points using parametric equation:
   * B(t) = (1-t)^3 * P0 + 3*(1-t)^2 * t * P1 + 3*(1-t) * t^2 * P2 + t^3 * P3
   * where t is in [0, 1]
   */
  public evaluateCubicBezier(
    p0: { x: number; y: number }, // Anchor Start
    p1: { x: number; y: number }, // Control Handle Out of Start
    p2: { x: number; y: number }, // Control Handle In of End
    p3: { x: number; y: number }, // Anchor End
    t: number
  ): { x: number; y: number } {
    const mt = 1.0 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }

  /**
   * Traces all points along a curve at a specified sub-segment density
   */
  public traceRotoCurvePoints(curve: RotoCurve, segmentsPerSpan: number = 20): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const n = curve.anchors.length;
    if (n < 2) return [];

    // Traverse adjacent anchor nodes
    for (let i = 0; i < n - 1; i++) {
      const a1 = curve.anchors[i];
      const a2 = curve.anchors[i + 1];

      const p0 = a1.point;
      const p1 = { x: a1.point.x + a1.handleOut.x, y: a1.point.y + a1.handleOut.y };
      const p2 = { x: a2.point.x + a2.handleIn.x, y: a2.point.y + a2.handleIn.y };
      const p3 = a2.point;

      for (let s = 0; s < segmentsPerSpan; s++) {
        points.push(this.evaluateCubicBezier(p0, p1, p2, p3, s / segmentsPerSpan));
      }
    }

    // Connect final curve if closed loop
    if (curve.closed && n > 2) {
      const a1 = curve.anchors[n - 1];
      const a2 = curve.anchors[0];

      const p0 = a1.point;
      const p1 = { x: a1.point.x + a1.handleOut.x, y: a1.point.y + a1.handleOut.y };
      const p2 = { x: a2.point.x + a2.handleIn.x, y: a2.point.y + a2.handleIn.y };
      const p3 = a2.point;

      for (let s = 0; s < segmentsPerSpan; s++) {
        points.push(this.evaluateCubicBezier(p0, p1, p2, p3, s / segmentsPerSpan));
      }
    }

    return points;
  }

  /**
   * Applies the offset translation from a bound tracking feature to the Bezier anchors
   * Synchronizes manual outlines with tracking curves
   */
  public updateCurveWithTracker(
    curveId: string,
    deltaX: number,
    deltaY: number
  ): void {
    this.masks.forEach((mask) => {
      const curve = mask.curves.find((c) => c.id === curveId);
      if (curve) {
        curve.anchors.forEach((anc) => {
          anc.point.x += deltaX;
          anc.point.y += deltaY;
        });
      }
    });
  }
}
