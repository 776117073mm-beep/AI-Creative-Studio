export interface PhysicsObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  elasticity: number; // 0 (clay) to 1 (perfect bounce)
}

export interface ForceField {
  id: string;
  type: "wind" | "vortex" | "gravity_well";
  strength: number;
  x?: number; // center for wells
  y?: number;
  directionX?: number; // direction for wind
  directionY?: number;
}

export class PhysicsEngine {
  private static instance: PhysicsEngine | null = null;

  public static getInstance(): PhysicsEngine {
    if (!PhysicsEngine.instance) {
      PhysicsEngine.instance = new PhysicsEngine();
    }
    return PhysicsEngine.instance;
  }

  /**
   * HOOKE'S LAW SPRING FORCE SOLVER
   * Calculates the snappy springing offsets for a target node returning to its anchor center.
   */
  public solveSpring(
    current: number,
    target: number,
    velocity: number,
    stiffness: number, // spring constant k
    damping: number    // damping factor c
  ): { position: number; velocity: number } {
    const displacement = current - target;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;

    const acceleration = springForce + dampingForce; // assuming mass = 1.0
    const nextVelocity = velocity + acceleration;
    const nextPosition = current + nextVelocity;

    return {
      position: nextPosition,
      velocity: nextVelocity
    };
  }

  /**
   * RESOLVES MOMENTUM SHIFT FROM COLLIDING ELASTIC SPHERES
   */
  public resolveSphereCollision(
    obj1: PhysicsObject,
    obj2: PhysicsObject
  ): void {
    const dx = obj2.x - obj1.x;
    const dy = obj2.y - obj1.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const minDist = obj1.radius + obj2.radius;

    if (dist < minDist) {
      // 1. Separate objects slightly to resolve overlap
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      // Translate objects out of overlap based on inverse mass ratios
      const totalMass = obj1.mass + obj2.mass;
      obj1.x -= nx * overlap * (obj2.mass / totalMass);
      obj1.y -= ny * overlap * (obj2.mass / totalMass);
      obj2.x += nx * overlap * (obj1.mass / totalMass);
      obj2.y += ny * overlap * (obj1.mass / totalMass);

      // 2. Compute relative velocities along the normal vector
      const rvx = obj2.vx - obj1.vx;
      const rvy = obj2.vy - obj1.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      // Only resolve if objects are moving towards each other
      if (velAlongNormal < 0) {
        // Average the restitution / elasticity coefficients
        const e = Math.min(obj1.elasticity, obj2.elasticity);

        // Calculate scalar impulse
        let impulseScalar = -(1 + e) * velAlongNormal;
        impulseScalar /= (1 / obj1.mass + 1 / obj2.mass);

        // Apply impulse forces to each object
        obj1.vx -= (impulseScalar / obj1.mass) * nx;
        obj1.vy -= (impulseScalar / obj1.mass) * ny;
        obj2.vx += (impulseScalar / obj2.mass) * nx;
        obj2.vy += (impulseScalar / obj2.mass) * ny;
      }
    }
  }

  /**
   * INJECTS FORCE FIELDS (Wind direction vectors, vortex attraction wells) INTO OBJECTS
   */
  public applyFields(
    obj: PhysicsObject,
    fields: ForceField[]
  ): void {
    fields.forEach((field) => {
      switch (field.type) {
        case "wind": {
          const fx = (field.directionX ?? 1.0) * field.strength * 0.05;
          const fy = (field.directionY ?? 0.0) * field.strength * 0.05;
          obj.vx += fx / obj.mass;
          obj.vy += fy / obj.mass;
          break;
        }

        case "gravity_well": {
          if (field.x === undefined || field.y === undefined) break;
          const dx = field.x - obj.x;
          const dy = field.y - obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Stronger force attraction close to well center (inverse distance math)
          const force = field.strength / (dist * 0.01 + 1);
          obj.vx += (dx / dist) * force * 0.05 / obj.mass;
          obj.vy += (dy / dist) * force * 0.05 / obj.mass;
          break;
        }

        case "vortex": {
          if (field.x === undefined || field.y === undefined) break;
          const dx = field.x - obj.x;
          const dy = field.y - obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Tangential rotation vector perpendicular to center line
          const tx = -dy / dist;
          const ty = dx / dist;

          const force = field.strength / (dist * 0.02 + 1);
          obj.vx += tx * force * 0.05 / obj.mass;
          obj.vy += ty * force * 0.05 / obj.mass;
          break;
        }
      }
    });
  }
}
