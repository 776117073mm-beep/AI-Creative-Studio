export interface JointNode {
  id: string;
  name: string;
  x: number; // Current local/world coordinates
  y: number;
  length: number; // Bone length
  angle: number;  // Rotation in radians
  parentId?: string;
}

export interface InverseKinematicsTarget {
  targetX: number;
  targetY: number;
  maxIterations: number;
  tolerance: number;
}

export class RiggingEngine {
  private static instance: RiggingEngine | null = null;

  public static getInstance(): RiggingEngine {
    if (!RiggingEngine.instance) {
      RiggingEngine.instance = new RiggingEngine();
    }
    return RiggingEngine.instance;
  }

  /**
   * FORWARD KINEMATICS (FK) RESOLVER
   * Recursively computes global joint position coordinates down a bone skeletal tree hierarchy.
   */
  public resolveForwardKinematics(
    joints: JointNode[],
    rootX = 0,
    rootY = 0
  ): JointNode[] {
    const resolved: JointNode[] = [];
    const jointMap = new Map<string, JointNode>();

    // Sort nodes: Root nodes first, then descend down child levels
    const sorted = [...joints].sort((a, b) => {
      if (!a.parentId) return -1;
      if (!b.parentId) return 1;
      return 0;
    });

    sorted.forEach((joint) => {
      let worldX = rootX;
      let worldY = rootY;
      let totalAngle = joint.angle;

      if (joint.parentId) {
        const parent = jointMap.get(joint.parentId);
        if (parent) {
          worldX = parent.x + parent.length * Math.cos(parent.angle);
          worldY = parent.y + parent.length * Math.sin(parent.angle);
          totalAngle = parent.angle + joint.angle;
        }
      }

      const updatedNode: JointNode = {
        ...joint,
        x: worldX,
        y: worldY,
        angle: totalAngle
      };

      jointMap.set(joint.id, updatedNode);
      resolved.push(updatedNode);
    });

    return resolved;
  }

  /**
   * INVERSE KINEMATICS (IK) CCD SOLVER (Cyclic Coordinate Descent)
   * Resolves standard joint angles to align joint terminus with target coordinator coordinate.
   */
  public solveCyclicCoordinateDescent(
    chain: JointNode[],
    target: InverseKinematicsTarget
  ): JointNode[] {
    const bones = chain.map(b => ({ ...b }));
    const count = bones.length;
    if (count === 0) return bones;

    for (let iter = 0; iter < target.maxIterations; iter++) {
      // 1. Calculate end effector current position
      const lastBone = bones[count - 1];
      const endEffectorX = lastBone.x + lastBone.length * Math.cos(lastBone.angle);
      const endEffectorY = lastBone.y + lastBone.length * Math.sin(lastBone.angle);

      // Check boundary distance threshold
      const distSq = (target.targetX - endEffectorX) ** 2 + (target.targetY - endEffectorY) ** 2;
      if (distSq < target.tolerance ** 2) {
        break; // Target snapped perfectly
      }

      // 2. Iterate backwards from end-effector to base root bone
      for (let i = count - 1; i >= 0; i--) {
        const joint = bones[i];

        // End-effector coordinate
        const effX = bones[count - 1].x + bones[count - 1].length * Math.cos(bones[count - 1].angle);
        const effY = bones[count - 1].y + bones[count - 1].length * Math.sin(bones[count - 1].angle);

        // Vector from current joint pivot to End-Effector
        const currentToEffX = effX - joint.x;
        const currentToEffY = effY - joint.y;
        const distToEff = Math.sqrt(currentToEffX * currentToEffX + currentToEffY * currentToEffY) || 1;

        // Vector from current joint pivot to Target coordinates
        const currentToTargetX = target.targetX - joint.x;
        const currentToTargetY = target.targetY - joint.y;
        const distToTarget = Math.sqrt(currentToTargetX * currentToTargetX + currentToTargetY * currentToTargetY) || 1;

        // Calculate rotation offset dot product
        const cosAngle = (currentToEffX * currentToTargetX + currentToEffY * currentToTargetY) / (distToEff * distToTarget);
        let turnAngle = 0;

        if (cosAngle < 0.9999) {
          const crossProduct = currentToEffX * currentToTargetY - currentToEffY * currentToTargetX;
          const deltaAngle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
          turnAngle = crossProduct > 0 ? deltaAngle : -deltaAngle;
        }

        // Apply rotation adjustment limits
        joint.angle += turnAngle;

        // Recalculate global child joint positions forwards after rotation
        for (let j = i; j < count; j++) {
          const current = bones[j];
          if (j > 0) {
            const parent = bones[j - 1];
            current.x = parent.x + parent.length * Math.cos(parent.angle);
            current.y = parent.y + parent.length * Math.sin(parent.angle);
          }
        }
      }
    }

    return bones;
  }

  /**
   * PARENT-CHILD COORDINATES COORDINATION MULTIPLIER
   * Modifies absolute spatial offsets of sub-layers according to parent anchors/positions.
   */
  public applyParentTransform(
    childPos: { x: number; y: number },
    parentPos: { x: number; y: number },
    parentScale: { x: number; y: number },
    parentRotationDegrees: number
  ): { x: number; y: number } {
    const rad = parentRotationDegrees * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // 1. Scale child offset relative to parent origin
    const sx = childPos.x * parentScale.x;
    const sy = childPos.y * parentScale.y;

    // 2. Rotate child offsets
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;

    // 3. Translate to parent coordinate
    return {
      x: parentPos.x + rx,
      y: parentPos.y + ry
    };
  }
}
