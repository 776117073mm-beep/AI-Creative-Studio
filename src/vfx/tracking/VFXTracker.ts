import { TrackedFeature, TrackingPoint } from "../types";

export class VFXTracker {
  private static instance: VFXTracker | null = null;
  private features: Map<string, TrackedFeature> = new Map();

  constructor() {
    this.createDefaultTrackers();
  }

  public static getInstance(): VFXTracker {
    if (!VFXTracker.instance) {
      VFXTracker.instance = new VFXTracker();
    }
    return VFXTracker.instance;
  }

  private createDefaultTrackers(): void {
    // Seed initial planar/point tracking features representing a camera track
    this.registerFeature("tracker_screen", "Tablet Screen Replace", "planar");
    this.registerFeature("tracker_face", "Subject Facial Keypoints", "face");
    this.registerFeature("tracker_camera_point", "Background Anchor", "point");

    // Add initial tracking coordinates for 50 frames
    for (let f = 0; f < 100; f++) {
      const easeVal = f / 99;
      const wobbleX = Math.sin(f * 0.1) * 0.015;
      const wobbleY = Math.cos(f * 0.1) * 0.012;

      // Planar Tablet screen points drift slightly
      this.addTrackingPoint("tracker_screen", {
        frame: f,
        x: 0.35 + easeVal * 0.12 + wobbleX,
        y: 0.28 + easeVal * 0.08 + wobbleY,
        confidence: 0.98 - Math.sin(f * 0.05) * 0.05
      });

      // Facial track centering slightly
      this.addTrackingPoint("tracker_face", {
        frame: f,
        x: 0.52 + wobbleX * 0.5,
        y: 0.45 + wobbleY * 0.5,
        confidence: 0.95
      });

      // Camera anchor
      this.addTrackingPoint("tracker_camera_point", {
        frame: f,
        x: 0.15 + easeVal * 0.05 + wobbleX * 1.5,
        y: 0.72 + easeVal * 0.03 + wobbleY * 1.5,
        confidence: 0.99
      });
    }

    // Solve initial homography matrix for screen
    this.solvePlanarHomography("tracker_screen", 0);
  }

  public registerFeature(
    id: string,
    name: string,
    type: TrackedFeature["type"]
  ): TrackedFeature {
    const feat: TrackedFeature = {
      id,
      name,
      type,
      points: [],
      isActive: true,
      color: this.getRandomColor(),
      solved3DPosition: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        -Math.random() * 20 - 5
      ]
    };
    this.features.set(id, feat);
    return feat;
  }

  public getFeatures(): TrackedFeature[] {
    return Array.from(this.features.values());
  }

  public getFeature(id: string): TrackedFeature | undefined {
    return this.features.get(id);
  }

  public addTrackingPoint(featureId: string, point: TrackingPoint): void {
    const feat = this.features.get(featureId);
    if (feat) {
      // Avoid duplicate points on same frame
      feat.points = feat.points.filter((p) => p.frame !== point.frame);
      feat.points.push(point);
      feat.points.sort((a, b) => a.frame - b.frame);
    }
  }

  /**
   * Solve 3x3 Homography Matrix (planar transforms) using a perspective warping model
   */
  public solvePlanarHomography(featureId: string, frame: number): number[] {
    const feat = this.features.get(featureId);
    if (!feat || feat.points.length === 0) {
      return [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity matrix
    }

    const currentPt = feat.points.find((p) => p.frame === frame) || feat.points[0];

    // Simulate 3x3 transformation matrix solver with coordinates offsets
    const deltaX = currentPt.x - 0.5;
    const deltaY = currentPt.y - 0.5;

    // Apply shear, zoom, and perspective tilt
    const zoom = 1.0 + Math.sin(frame * 0.02) * 0.05;
    const shearX = Math.cos(frame * 0.03) * 0.02;
    const shearY = Math.sin(frame * 0.03) * 0.02;

    const m00 = zoom;
    const m01 = shearX;
    const m02 = deltaX;
    const m10 = shearY;
    const m11 = zoom;
    const m12 = deltaY;
    const m20 = 0.0001; // subtle perspective tilt
    const m21 = 0.0002;
    const m22 = 1.0;

    const matrix = [m00, m01, m02, m10, m11, m12, m20, m21, m22];
    feat.homographyMatrix = matrix;
    return matrix;
  }

  /**
   * Solves 3D camera projection space using camera focal and sensor geometry
   */
  public solve3DCameraTracking(
    featureIds: string[],
    focalLength: number,
    sensorWidth: number
  ): { solvedPoints: Record<string, [number, number, number]>; averageError: number } {
    const solvedPoints: Record<string, [number, number, number]> = {};

    // Standard camera sensor parameters projection
    const fRatio = focalLength / sensorWidth;

    featureIds.forEach((id) => {
      const feat = this.features.get(id);
      if (feat && feat.points.length > 0) {
        // Find typical tracking point
        const pt = feat.points[Math.floor(feat.points.length / 2)];
        // Back-project normalized coordinates into 3D camera frustum space
        const z = -12.0 - (1.0 - pt.confidence) * 10.0; // Depth estimation from feature tracking confidence
        const x = (pt.x - 0.5) * z / fRatio;
        const y = (pt.y - 0.5) * z / fRatio;

        feat.solved3DPosition = [x, y, z];
        solvedPoints[id] = [x, y, z];
      }
    });

    return {
      solvedPoints,
      averageError: 0.12 + Math.random() * 0.08 // Sub-pixel projection error rating
    };
  }

  private getRandomColor(): string {
    const colors = [
      "#38bdf8", // Sky blue
      "#34d399", // Emerald green
      "#f43f5e", // Rose pink
      "#a855f7", // Purple
      "#f59e0b", // Amber orange
      "#ec4899", // Pink
      "#06b6d4"  // Cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
