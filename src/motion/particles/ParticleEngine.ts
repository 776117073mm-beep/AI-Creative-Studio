export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 0.0 to 1.0 (decaying)
  maxLife: number;  // in frames
  age: number;      // current frame count
  color: string;
  size: number;
}

export interface ParticleEmitterConfig {
  x: number;
  y: number;
  rate: number;       // particles per frame
  type: "point" | "area" | "circle";
  areaWidth?: number;
  areaHeight?: number;
  radius?: number;
  startSize: number;
  endSize: number;
  startColor: string; // Hex color
  endColor: string;   // Hex color
  gravityX: number;
  gravityY: number;
  initialVelocityX: number;
  initialVelocityY: number;
  velocityVar: number; // velocity randomization
}

export class ParticleEngine {
  private static instance: ParticleEngine | null = null;
  private particles: Particle[] = [];

  public static getInstance(): ParticleEngine {
    if (!ParticleEngine.instance) {
      ParticleEngine.instance = new ParticleEngine();
    }
    return ParticleEngine.instance;
  }

  /**
   * UPDATES ALL PARTICLES BY APPLYING FORCES, VELOCITY, LIFETIME DECAYS, AND COLLISIONS
   */
  public stepSimulation(
    config: ParticleEmitterConfig,
    groundY = 1000,
    windX = 0
  ): Particle[] {
    // 1. Spawning new particles based on rate
    const numToSpawn = Math.floor(config.rate) + (Math.random() < (config.rate % 1) ? 1 : 0);
    for (let i = 0; i < numToSpawn; i++) {
      this.particles.push(this.spawnParticle(config));
    }

    // 2. Update existing particles
    const active: Particle[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age++;
      p.life = 1.0 - (p.age / p.maxLife);

      // Kill dead particles
      if (p.life <= 0) continue;

      // Apply forces (Gravity + Wind)
      p.vx += config.gravityX + windX;
      p.vy += config.gravityY;

      // Apply velocity to position
      p.x += p.vx;
      p.y += p.vy;

      // Collision Foundation (Ground bounce)
      if (p.y >= groundY) {
        p.y = groundY;
        p.vy = -p.vy * 0.4; // Decay bounce velocity
        p.vx *= 0.8;        // Apply ground friction
      }

      // Linear interpolation of Size and Color over lifetime
      p.size = config.startSize + (config.endSize - config.startSize) * (1.0 - p.life);
      p.color = this.lerpColors(config.startColor, config.endColor, 1.0 - p.life);

      active.push(p);
    }

    this.particles = active;
    return this.particles;
  }

  private spawnParticle(config: ParticleEmitterConfig): Particle {
    let spawnX = config.x;
    let spawnY = config.y;

    if (config.type === "area") {
      const w = config.areaWidth ?? 100;
      const h = config.areaHeight ?? 100;
      spawnX += (Math.random() - 0.5) * w;
      spawnY += (Math.random() - 0.5) * h;
    } else if (config.type === "circle") {
      const r = config.radius ?? 50;
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.random() * r;
      spawnX += dist * Math.cos(angle);
      spawnY += dist * Math.sin(angle);
    }

    // Apply randomized velocity variance
    const angleVar = Math.random() * 2 * Math.PI;
    const speedVar = Math.random() * config.velocityVar;
    const vx = config.initialVelocityX + Math.cos(angleVar) * speedVar;
    const vy = config.initialVelocityY + Math.sin(angleVar) * speedVar;

    const maxLife = 30 + Math.floor(Math.random() * 60); // 1-3 seconds average lifetime

    return {
      id: `p_${Math.random().toString(36).substr(2, 9)}`,
      x: spawnX,
      y: spawnY,
      vx,
      vy,
      life: 1.0,
      maxLife,
      age: 0,
      color: config.startColor,
      size: config.startSize
    };
  }

  /**
   * Helper to blend HEX colors based on ratios.
   */
  public lerpColors(colorStart: string, colorEnd: string, ratio: number): string {
    const rStart = parseInt(colorStart.replace("#", "").substr(0, 2), 16);
    const gStart = parseInt(colorStart.replace("#", "").substr(2, 2), 16);
    const bStart = parseInt(colorStart.replace("#", "").substr(4, 2), 16);

    const rEnd = parseInt(colorEnd.replace("#", "").substr(0, 2), 16);
    const gEnd = parseInt(colorEnd.replace("#", "").substr(2, 2), 16);
    const bEnd = parseInt(colorEnd.replace("#", "").substr(4, 2), 16);

    const r = Math.round(rStart + (rEnd - rStart) * ratio);
    const g = Math.round(gStart + (gEnd - gStart) * ratio);
    const b = Math.round(bStart + (bEnd - bStart) * ratio);

    const hex = (val: number) => val.toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public clearParticles(): void {
    this.particles = [];
  }
}
