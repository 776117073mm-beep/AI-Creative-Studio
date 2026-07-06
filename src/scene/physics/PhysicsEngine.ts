import { PhysicsParams, Vector3D } from "../core/types";
import { SceneGraph } from "../graph/SceneGraph";

export class PhysicsEngine {
  private static instance: PhysicsEngine | null = null;

  // Global settings
  private gravity: Vector3D = { x: 0.0, y: -9.81, z: 0.0 };
  private globalWindForce: Vector3D = { x: 2.0, y: 0.0, z: -1.0 }; // wind pushing slightly on hair/cloth
  private collisionThresholdY: number = 0.0; // Collides with y=0 ground grid level

  // Active simulated physics node parameters map
  private physicsMap: Map<string, PhysicsParams> = new Map();

  // Velocities cache map keyed by nodeId
  private velocities: Map<string, Vector3D> = new Map();

  private constructor() {
    this.registerInitialPhysicsBodies();
  }

  public static getInstance(): PhysicsEngine {
    if (!PhysicsEngine.instance) {
      PhysicsEngine.instance = new PhysicsEngine();
    }
    return PhysicsEngine.instance;
  }

  private registerInitialPhysicsBodies(): void {
    // 1. Sci-Fi Recon Drone gets soft bouncy suspension physics
    this.physicsMap.set("mesh_mech_0", {
      bodyType: "rigid",
      mass: 120.0,
      gravityScale: 1.0,
      restitution: 0.45, // Decent bounciness
      friction: 0.35,
      windResistance: 0.05,
      collisionGroup: 1,
      enabled: false // User toggled
    });

    this.velocities.set("mesh_mech_0", { x: 0.0, y: 15.0, z: 0.0 }); // Launch up initially
  }

  // --- Parameters API ---

  public getPhysicsParams(nodeId: string): PhysicsParams | undefined {
    return this.physicsMap.get(nodeId);
  }

  public addPhysicsBody(nodeId: string, params: PhysicsParams): void {
    this.physicsMap.set(nodeId, params);
    if (!this.velocities.has(nodeId)) {
      this.velocities.set(nodeId, { x: 0, y: 0, z: 0 });
    }
  }

  public removePhysicsBody(nodeId: string): void {
    this.physicsMap.delete(nodeId);
    this.velocities.delete(nodeId);
  }

  public getGravity(): Vector3D {
    return this.gravity;
  }

  public setGravity(g: Vector3D): void {
    this.gravity = g;
  }

  public getGlobalWind(): Vector3D {
    return this.globalWindForce;
  }

  public setGlobalWind(w: Vector3D): void {
    this.globalWindForce = w;
  }

  // --- Realtime Simulation Loops ---

  /**
   * Evaluates and updates physical bodies position vectors over discrete delta ticks
   */
  public stepPhysicsSimulation(deltaTimeSec: number): void {
    const sceneGraph = SceneGraph.getInstance();
    const dt = Math.min(0.05, deltaTimeSec); // clamp delta time for stability

    this.physicsMap.forEach((params, nodeId) => {
      if (!params.enabled) return;

      const node = sceneGraph.getNode(nodeId);
      if (!node) return;

      const pos = node.transform.position;
      const vel = this.velocities.get(nodeId) || { x: 0, y: 0, z: 0 };

      if (params.bodyType === "rigid") {
        // --- RIGID BODY SIMULATION ---
        // Gravity integration: v = v + g * dt * scale
        vel.y += this.gravity.y * params.gravityScale * dt;
        vel.x += this.gravity.x * params.gravityScale * dt;
        vel.z += this.gravity.z * params.gravityScale * dt;

        // Apply constant air wind drag resistance
        vel.x *= (1.0 - params.windResistance * dt);
        vel.y *= (1.0 - params.windResistance * dt);
        vel.z *= (1.0 - params.windResistance * dt);

        // Update translation: x = x + v * dt
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        pos.z += vel.z * dt;

        // Ground Plane collision test (bounding y collision threshold)
        if (pos.y < this.collisionThresholdY) {
          pos.y = this.collisionThresholdY;
          // Reverse direction with restitution factor bounce coefficient
          vel.y = -vel.y * params.restitution;
          vel.x *= (1.0 - params.friction);
          vel.z *= (1.0 - params.friction);

          // Damp small velocities to sleep thresholds
          if (Math.abs(vel.y) < 0.15) {
            vel.y = 0.0;
            vel.x = 0.0;
            vel.z = 0.0;
          }
        }
      } else if (params.bodyType === "hair" || params.bodyType === "cloth") {
        // --- ORGANIC JIGGLE WIND SIMULATION ---
        // Uses wind vector oscillations to procedurally rotate object slightly
        const phase = Date.now() * 0.0035;
        const windIntensity = Math.sin(phase) * params.windResistance * 12.0;

        node.transform.rotation.z = Math.sin(phase * 1.5) * windIntensity;
        node.transform.rotation.x = Math.cos(phase * 0.8) * windIntensity * 0.5;
      } else if (params.bodyType === "soft") {
        // --- SOFT BODY DEFORMATION BOUNCE ---
        // Elastic organic squish and stretch based on sine velocity waves
        const squish = Math.sin(Date.now() * 0.008) * 0.15;
        node.transform.scale.y = 2.0 - squish;
        node.transform.scale.x = 2.0 + squish * 0.5;
        node.transform.scale.z = 2.0 + squish * 0.5;
      }

      this.velocities.set(nodeId, vel);
    });
  }

  // --- Reset/Launch impulse helpers ---

  public applyLinearImpulse(nodeId: string, impulse: Vector3D): void {
    const vel = this.velocities.get(nodeId) || { x: 0, y: 0, z: 0 };
    vel.x += impulse.x;
    vel.y += impulse.y;
    vel.z += impulse.z;
    this.velocities.set(nodeId, vel);
  }
}
