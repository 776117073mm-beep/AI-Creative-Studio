export interface Transform2D {
  position: { x: number; y: number }; // Relative coordinates offset
  rotationDegrees: number;
  scale: { x: number; y: number };
  anchorPoint: { x: number; y: number };
}

export interface Transform3D {
  position3D: { x: number; y: number; z: number };
  rotation3D: { pitch: number; yaw: number; roll: number };
  scale3D: { x: number; y: number; z: number };
}

export interface MotionPathNode {
  frameIndex: number;
  x: number;
  y: number;
  handleIn?: { dx: number; dy: number };
  handleOut?: { dx: number; dy: number };
}

export class MotionEngine {
  private clipTransforms: Map<string, Transform2D> = new Map();
  private clipTransforms3D: Map<string, Transform3D> = new Map();
  private motionPaths: Map<string, MotionPathNode[]> = new Map();
  private parentingMap: Map<string, string> = new Map(); // childClipId -> parentClipId

  constructor() {}

  public getOrCreateTransform(clipId: string): Transform2D {
    let transform = this.clipTransforms.get(clipId);
    if (!transform) {
      transform = {
        position: { x: 0, y: 0 },
        rotationDegrees: 0,
        scale: { x: 100, y: 100 },
        anchorPoint: { x: 0.5, y: 0.5 },
      };
      this.clipTransforms.set(clipId, transform);
    }
    return transform;
  }

  public getOrCreateTransform3D(clipId: string): Transform3D {
    let t3d = this.clipTransforms3D.get(clipId);
    if (!t3d) {
      t3d = {
        position3D: { x: 0, y: 0, z: 0 },
        rotation3D: { pitch: 0, yaw: 0, roll: 0 },
        scale3D: { x: 100, y: 100, z: 100 },
      };
      this.clipTransforms3D.set(clipId, t3d);
    }
    return t3d;
  }

  public updateTransform2D(clipId: string, updates: Partial<Transform2D>): void {
    const t = this.getOrCreateTransform(clipId);
    Object.assign(t, updates);
  }

  public updateTransform3D(clipId: string, updates: Partial<Transform3D>): void {
    const t = this.getOrCreateTransform3D(clipId);
    Object.assign(t, updates);
  }

  /**
   * Setup motion paths bezier nodes
   */
  public addMotionPathNode(clipId: string, node: MotionPathNode): void {
    let nodes = this.motionPaths.get(clipId);
    if (!nodes) {
      nodes = [];
      this.motionPaths.set(clipId, nodes);
    }
    nodes.push(node);
    nodes.sort((a, b) => a.frameIndex - b.frameIndex);
  }

  public getMotionPath(clipId: string): MotionPathNode[] {
    return this.motionPaths.get(clipId) || [];
  }

  /**
   * Transform hierarchy parenting
   */
  public parentClipTo(childClipId: string, parentClipId: string): void {
    this.parentingMap.set(childClipId, parentClipId);
  }

  public getParentClipId(clipId: string): string | undefined {
    return this.parentingMap.get(clipId);
  }

  /**
   * Compute relative layout transform summing up parenting tree
   */
  public getAbsolutePosition2D(clipId: string): { x: number; y: number } {
    let currentId = clipId;
    let absX = 0;
    let absY = 0;

    while (currentId) {
      const transform = this.clipTransforms.get(currentId);
      if (transform) {
        absX += transform.position.x;
        absY += transform.position.y;
      }
      currentId = this.parentingMap.get(currentId) || "";
    }

    return { x: absX, y: absY };
  }
}
