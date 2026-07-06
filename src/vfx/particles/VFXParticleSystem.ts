import { VFXParticle, ParticleEmitter, Vector3D } from "../types";

export class VFXParticleSystem {
  private static instance: VFXParticleSystem | null = null;
  private particles: VFXParticle[] = [];
  private emitters: Map<string, ParticleEmitter> = new Map();
  private maxParticleLimit = 2000;

  constructor() {
    this.createDefaultEmitters();
  }

  public static getInstance(): VFXParticleSystem {
    if (!VFXParticleSystem.instance) {
      VFXParticleSystem.instance = new VFXParticleSystem();
    }
    return VFXParticleSystem.instance;
  }

  private createDefaultEmitters(): void {
    // 1. Fire sparks emitter at the bottom
    this.registerEmitter({
      id: "emitter_sparks",
      name: "Cinematic Fire Sparks",
      type: "box",
      position: { x: 0, y: -2, z: -5 },
      direction: { x: 0, y: 1, z: 0 },
      spreadAngle: 45,
      rate: 80, // particles per second
      speed: 4.5,
      lifetime: 3.5,
      colorStart: { r: 255, g: 140, b: 0, a: 1.0 }, // bright orange
      colorEnd: { r: 180, g: 0, b: 0, a: 0.0 }, // dark red fading
      sizeStart: 4.0,
      sizeEnd: 0.5
    });

    // 2. Snow/Dust ambient emitter
    this.registerEmitter({
      id: "emitter_dust",
      name: "Ambient Ash Particles",
      type: "sphere",
      position: { x: 0, y: 6, z: -8 },
      direction: { x: 0.1, y: -0.8, z: 0.1 },
      spreadAngle: 90,
      rate: 30,
      speed: 1.2,
      lifetime: 8.0,
      colorStart: { r: 240, g: 240, b: 245, a: 0.8 }, // white-grey
      colorEnd: { r: 200, g: 200, b: 205, a: 0.0 },
      sizeStart: 2.0,
      sizeEnd: 2.0
    });
  }

  public registerEmitter(emitter: ParticleEmitter): void {
    this.emitters.set(emitter.id, emitter);
  }

  public getEmitters(): ParticleEmitter[] {
    return Array.from(this.emitters.values());
  }

  public getEmitter(id: string): ParticleEmitter | undefined {
    return this.emitters.get(id);
  }

  public updateEmitterProperties(id: string, props: Partial<Omit<ParticleEmitter, "id">>): void {
    const emit = this.emitters.get(id);
    if (emit) {
      Object.assign(emit, props);
    }
  }

  public getParticles(): VFXParticle[] {
    return this.particles;
  }

  /**
   * Clears all active particles from the system
   */
  public resetParticles(): void {
    this.particles = [];
  }

  /**
   * Spawns particles from emitters based on current delta-time
   */
  public emitFromEmitters(deltaTimeSec: number): void {
    this.emitters.forEach((emitter) => {
      const spawnCount = Math.floor(emitter.rate * deltaTimeSec + Math.random());
      for (let i = 0; i < spawnCount; i++) {
        if (this.particles.length >= this.maxParticleLimit) break;
        this.spawnParticle(emitter);
      }
    });
  }

  private spawnParticle(emitter: ParticleEmitter): void {
    let pos: Vector3D = { ...emitter.position };

    // Emit source offsets based on emitter volume geometry
    if (emitter.type === "box") {
      pos.x += (Math.random() - 0.5) * 4.0;
      pos.z += (Math.random() - 0.5) * 4.0;
    } else if (emitter.type === "sphere") {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 3.0;
      pos.x += Math.cos(theta) * r;
      pos.z += Math.sin(theta) * r;
    }

    // Spread angle cone vector calculation
    const spreadRad = (emitter.spreadAngle * Math.PI) / 180;
    const phi = Math.random() * Math.PI * 2;
    const theta = (Math.random() - 0.5) * spreadRad;

    // Approximate rotated direction vector
    const dirX = emitter.direction.x + Math.sin(theta) * Math.cos(phi);
    const dirY = emitter.direction.y + Math.cos(theta);
    const dirZ = emitter.direction.z + Math.sin(theta) * Math.sin(phi);

    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
    const speed = emitter.speed * (0.8 + Math.random() * 0.4);

    const velocity: Vector3D = {
      x: (dirX / length) * speed,
      y: (dirY / length) * speed,
      z: (dirZ / length) * speed
    };

    const particle: VFXParticle = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      position: pos,
      velocity,
      acceleration: { x: 0, y: 0, z: 0 },
      color: { ...emitter.colorStart },
      size: emitter.sizeStart,
      life: emitter.lifetime * (0.9 + Math.random() * 0.2),
      maxLife: emitter.lifetime,
      mass: 0.1 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 2.0
    };

    this.particles.push(particle);
  }

  /**
   * Main Physics Tick updating positions, velocities, forces, lifespans, and color interpolations
   */
  public updatePhysicsTick(
    deltaTimeSec: number,
    globalGravity: Vector3D,
    windForce: Vector3D
  ): void {
    // 1. Process active emitters spawning
    this.emitFromEmitters(deltaTimeSec);

    // 2. Step individual particle physics
    const nextParticles: VFXParticle[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Decrease lifespan
      p.life -= deltaTimeSec;
      if (p.life <= 0) continue; // Despawn

      // Interpolate sizes & colors based on normalized life percentage
      const lifeRatio = p.life / p.maxLife; // 1.0 down to 0.0
      const emitter = Array.from(this.emitters.values())[0]; // fallback template

      if (emitter) {
        // Interpolate colors Start -> End
        p.color.r = Math.round(emitter.colorEnd.r * (1 - lifeRatio) + emitter.colorStart.r * lifeRatio);
        p.color.g = Math.round(emitter.colorEnd.g * (1 - lifeRatio) + emitter.colorStart.g * lifeRatio);
        p.color.b = Math.round(emitter.colorEnd.b * (1 - lifeRatio) + emitter.colorStart.b * lifeRatio);
        p.color.a = emitter.colorEnd.a * (1 - lifeRatio) + emitter.colorStart.a * lifeRatio;

        // Interpolate size Start -> End
        p.size = emitter.sizeEnd * (1 - lifeRatio) + emitter.sizeStart * lifeRatio;
      }

      // Compute total force vectors: Gravity * Mass + Wind
      const fX = globalGravity.x * p.mass + windForce.x;
      const fY = globalGravity.y * p.mass + windForce.y;
      const fZ = globalGravity.z * p.mass + windForce.z;

      // Update velocities based on acceleration (Force / Mass)
      p.velocity.x += (fX / p.mass) * deltaTimeSec;
      p.velocity.y += (fY / p.mass) * deltaTimeSec;
      p.velocity.z += (fZ / p.mass) * deltaTimeSec;

      // Apply air friction damping
      const damping = Math.exp(-0.1 * deltaTimeSec);
      p.velocity.x *= damping;
      p.velocity.y *= damping;
      p.velocity.z *= damping;

      // Update positions
      p.position.x += p.velocity.x * deltaTimeSec;
      p.position.y += p.velocity.y * deltaTimeSec;
      p.position.z += p.velocity.z * deltaTimeSec;

      // Update rotation
      p.rotation += p.angularVelocity * deltaTimeSec;

      // Bounding box / ground collision simulation at Y = -4 (fictional ground plane)
      if (p.position.y < -4.0) {
        p.position.y = -4.0;
        p.velocity.y = -p.velocity.y * 0.4; // Bounce with dampening
        p.velocity.x *= 0.8; // Friction
        p.velocity.z *= 0.8;
      }

      nextParticles.push(p);
    }

    this.particles = nextParticles;
  }
}
