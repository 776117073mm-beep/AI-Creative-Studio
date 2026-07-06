import { PhysicsBody, Vector3D } from "../types";

export class VFXPhysics {
  private static instance: VFXPhysics | null = null;
  private bodies: Map<string, PhysicsBody> = new Map();

  constructor() {
    this.createDefaultBodies();
  }

  public static getInstance(): VFXPhysics {
    if (!VFXPhysics.instance) {
      VFXPhysics.instance = new VFXPhysics();
    }
    return VFXPhysics.instance;
  }

  private createDefaultBodies(): void {
    // 1. A falling heavy metallic boulder rigid body
    this.registerBody({
      id: "body_boulder",
      name: "Hero Heavy Boulder",
      type: "rigid",
      position: { x: -1.5, y: 5.0, z: -5.0 },
      velocity: { x: 0.5, y: 0.0, z: 0.0 },
      angularVelocity: { x: 0, y: 1.5, z: 0 },
      mass: 12.0,
      restitution: 0.35, // Low bounce
      friction: 0.2,
      dimensions: { x: 1.5, y: 1.5, z: 1.5 },
      isStatic: false
    });

    // 2. A bouncy rubber cube rigid body
    this.registerBody({
      id: "body_rubber_cube",
      name: "Cinematic Rubber Cube",
      type: "rigid",
      position: { x: 1.5, y: 4.0, z: -5.0 },
      velocity: { x: -0.5, y: 0.0, z: 0.0 },
      angularVelocity: { x: 2.0, y: -1.0, z: 0.5 },
      mass: 2.5,
      restitution: 0.85, // High bounce
      friction: 0.1,
      dimensions: { x: 1.0, y: 1.0, z: 1.0 },
      isStatic: false
    });

    // 3. Static stone floor boundary block
    this.registerBody({
      id: "body_floor",
      name: "Stone Ground Plane Boundary",
      type: "rigid",
      position: { x: 0, y: -4.0, z: -5.0 },
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      mass: 999999, // Infinite mass mockup
      restitution: 0.2,
      friction: 0.5,
      dimensions: { x: 15.0, y: 0.5, z: 15.0 },
      isStatic: true
    });
  }

  public registerBody(body: PhysicsBody): void {
    this.bodies.set(body.id, body);
  }

  public getBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  public getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  public removeBody(id: string): boolean {
    return this.bodies.delete(id);
  }

  /**
   * Performs real rigid and soft-body mechanical step solving (integrations + spring Hooke's law + rigid collision resolution)
   */
  public stepPhysics(deltaTimeSec: number, gravity: Vector3D, wind: Vector3D): void {
    const bodiesArray = Array.from(this.bodies.values());

    // 1. Semi-Implicit Euler integration for forces
    bodiesArray.forEach((b) => {
      if (b.isStatic) return;

      // Integrate gravitational and wind acceleration
      b.velocity.x += (gravity.x + wind.x / b.mass) * deltaTimeSec;
      b.velocity.y += (gravity.y + wind.y / b.mass) * deltaTimeSec;
      b.velocity.z += (gravity.z + wind.z / b.mass) * deltaTimeSec;

      // Soft Body Elastic Spring Mechanics (Hooke's Law: F = -k * x - c * v)
      if (b.type === "soft" && b.springK && b.damping) {
        // Pull back towards resting equilibrium position origin (0, 0, 0 in mesh local space)
        const springForceX = -b.springK * b.position.x - b.damping * b.velocity.x;
        const springForceY = -b.springK * b.position.y - b.damping * b.velocity.y;
        const springForceZ = -b.springK * b.position.z - b.damping * b.velocity.z;

        b.velocity.x += (springForceX / b.mass) * deltaTimeSec;
        b.velocity.y += (springForceY / b.mass) * deltaTimeSec;
        b.velocity.z += (springForceZ / b.mass) * deltaTimeSec;
      }

      // Translate positions
      b.position.x += b.velocity.x * deltaTimeSec;
      b.position.y += b.velocity.y * deltaTimeSec;
      b.position.z += b.velocity.z * deltaTimeSec;

      // Rotate body vectors
      b.angularVelocity.x *= Math.exp(-0.1 * deltaTimeSec); // damping
      b.angularVelocity.y *= Math.exp(-0.1 * deltaTimeSec);
      b.angularVelocity.z *= Math.exp(-0.1 * deltaTimeSec);
    });

    // 2. Simple Collision detection and Impulse resolution between physical bodies
    for (let i = 0; i < bodiesArray.length; i++) {
      const b1 = bodiesArray[i];
      if (b1.isStatic) continue;

      for (let j = 0; j < bodiesArray.length; j++) {
        if (i === j) continue;
        const b2 = bodiesArray[j];

        // AABB Box intersection check
        const half1X = b1.dimensions.x / 2;
        const half1Y = b1.dimensions.y / 2;
        const half1Z = b1.dimensions.z / 2;

        const half2X = b2.dimensions.x / 2;
        const half2Y = b2.dimensions.y / 2;
        const half2Z = b2.dimensions.z / 2;

        const overlapX = (half1X + half2X) - Math.abs(b1.position.x - b2.position.x);
        const overlapY = (half1Y + half2Y) - Math.abs(b1.position.y - b2.position.y);
        const overlapZ = (half1Z + half2Z) - Math.abs(b1.position.z - b2.position.z);

        if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
          // Collision Detected! Find minimum translation vector axis (MTV)
          const mtv = Math.min(overlapX, overlapY, overlapZ);

          if (mtv === overlapY) {
            // Collision along vertical Axis
            const pushDir = b1.position.y > b2.position.y ? 1 : -1;
            b1.position.y += overlapY * pushDir;

            // Resolve impulse bounciness
            const relativeVelocityY = b1.velocity.y - b2.velocity.y;
            const impulseRestitution = Math.min(b1.restitution, b2.restitution);

            if (relativeVelocityY * pushDir < 0) {
              const impulse = -(1 + impulseRestitution) * relativeVelocityY;
              b1.velocity.y += impulse; // Impulse resolution against static ground or each other
              b1.velocity.x *= (1.0 - b1.friction); // apply ground drag
              b1.velocity.z *= (1.0 - b1.friction);
            }
          } else if (mtv === overlapX) {
            // Horizontal X Axis
            const pushDir = b1.position.x > b2.position.x ? 1 : -1;
            b1.position.x += overlapX * pushDir;

            const relativeVelocityX = b1.velocity.x - b2.velocity.x;
            if (relativeVelocityX * pushDir < 0) {
              const impulse = -(1 + Math.min(b1.restitution, b2.restitution)) * relativeVelocityX;
              b1.velocity.x += impulse;
            }
          } else {
            // Horizontal Z Axis
            const pushDir = b1.position.z > b2.position.z ? 1 : -1;
            b1.position.z += overlapZ * pushDir;

            const relativeVelocityZ = b1.velocity.z - b2.velocity.z;
            if (relativeVelocityZ * pushDir < 0) {
              const impulse = -(1 + Math.min(b1.restitution, b2.restitution)) * relativeVelocityZ;
              b1.velocity.z += impulse;
            }
          }
        }
      }
    }
  }
}
