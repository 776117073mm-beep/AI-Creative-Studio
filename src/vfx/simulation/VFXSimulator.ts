import { FluidCell, Vector3D } from "../types";

export class VFXSimulator {
  private static instance: VFXSimulator | null = null;

  // Grid dimensions
  private cols = 32;
  private rows = 32;
  private grid: FluidCell[] = [];

  constructor() {
    this.resetGrid();
  }

  public static getInstance(): VFXSimulator {
    if (!VFXSimulator.instance) {
      VFXSimulator.instance = new VFXSimulator();
    }
    return VFXSimulator.instance;
  }

  public resetGrid(): void {
    this.grid = [];
    const size = this.cols * this.rows;
    for (let i = 0; i < size; i++) {
      this.grid.push({
        density: 0,
        temperature: 0,
        u: 0,
        v: 0,
        uPrev: 0,
        vPrev: 0,
        densityPrev: 0
      });
    }
  }

  public getGrid(): FluidCell[] {
    return this.grid;
  }

  public getGridSize(): { cols: number; rows: number } {
    return { cols: this.cols, rows: this.rows };
  }

  /**
   * Inject density and velocity upward forces at coordinates (simulating fire ignition source)
   */
  public injectSource(
    col: number,
    row: number,
    densityAmount: number,
    uForce: number,
    vForce: number
  ): void {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      const idx = row * this.cols + col;
      this.grid[idx].density += densityAmount;
      this.grid[idx].u += uForce;
      this.grid[idx].v += vForce;
      this.grid[idx].temperature += densityAmount * 1.5;
    }
  }

  /**
   * Computational Navier-Stokes fluid solver step (Advection + Diffusion + Projection)
   */
  public stepFluidSimulation(
    deltaTimeSec: number,
    viscosity: number, // velocity diffusion
    diffusion: number, // density diffusion
    buoyancyFactor: number // heat convection pull
  ): void {
    const size = this.cols * this.rows;

    // 1. Swap buffers for integration
    for (let i = 0; i < size; i++) {
      const cell = this.grid[i];
      cell.uPrev = cell.u;
      cell.vPrev = cell.v;
      cell.densityPrev = cell.density;
    }

    // 2. Apply Buoyancy / Thermal convection (rising heat forces velocity upwards)
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = y * this.cols + x;
        const cell = this.grid[idx];
        // Velocity y-axis is directed upwards (or downwards depending on grid layout, we pull v negative here)
        cell.v += cell.temperature * buoyancyFactor * deltaTimeSec;
      }
    }

    // 3. Diffuse velocities (viscous dampening)
    this.diffuse(1, viscosity, deltaTimeSec);
    this.diffuse(2, viscosity, deltaTimeSec);

    // 4. Project for incompressibility (Poisson solver enforcing divergence-free vector fields)
    this.project();

    // 5. Advect velocities (propagate velocities along their own paths)
    this.advect(1, deltaTimeSec);
    this.advect(2, deltaTimeSec);
    this.project();

    // 6. Diffuse density
    this.diffuse(0, diffusion, deltaTimeSec);

    // 7. Advect density
    this.advect(0, deltaTimeSec);

    // 8. Decay thermal dissipation
    for (let i = 0; i < size; i++) {
      this.grid[i].density *= Math.exp(-0.6 * deltaTimeSec); // fade smoke
      this.grid[i].temperature *= Math.exp(-1.2 * deltaTimeSec); // cool fire
    }
  }

  // --- Navier-Stokes mathematical grid diffusion solver (Gauss-Seidel relaxation) ---
  private diffuse(b: number, diffRate: number, dt: number): void {
    const a = dt * diffRate * this.cols * this.rows;
    const c = 1 + 4 * a;

    // 20 Iterations of relaxation solver
    for (let k = 0; k < 20; k++) {
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          const idx = y * this.cols + x;
          const left = idx - 1;
          const right = idx + 1;
          const up = idx - this.cols;
          const down = idx + this.cols;

          if (b === 1) { // Velocity U
            this.grid[idx].u = (this.grid[idx].uPrev + a * (
              this.grid[left].u + this.grid[right].u + this.grid[up].u + this.grid[down].u
            )) / c;
          } else if (b === 2) { // Velocity V
            this.grid[idx].v = (this.grid[idx].vPrev + a * (
              this.grid[left].v + this.grid[right].v + this.grid[up].v + this.grid[down].v
            )) / c;
          } else { // Density
            this.grid[idx].density = (this.grid[idx].densityPrev + a * (
              this.grid[left].density + this.grid[right].density + this.grid[up].density + this.grid[down].density
            )) / c;
          }
        }
      }
      this.setBoundary(b);
    }
  }

  // --- Poisson Incompressibility projection solver (Helmholtz decomposition) ---
  private project(): void {
    const size = this.cols * this.rows;
    const p = new Float32Array(size);
    const div = new Float32Array(size);

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = y * this.cols + x;
        div[idx] = -0.5 * (
          this.grid[idx + 1].u - this.grid[idx - 1].u +
          this.grid[idx + this.cols].v - this.grid[idx - this.cols].v
        ) / this.cols;
        p[idx] = 0;
      }
    }

    this.setBoundaryArray(div);
    this.setBoundaryArray(p);

    // Solve linear system equations for pressure grid
    for (let k = 0; k < 20; k++) {
      for (let y = 1; y < this.rows - 1; y++) {
        for (let x = 1; x < this.cols - 1; x++) {
          const idx = y * this.cols + x;
          p[idx] = (div[idx] + (
            p[idx - 1] + p[idx + 1] + p[idx - this.cols] + p[idx + this.cols]
          )) / 4;
        }
      }
      this.setBoundaryArray(p);
    }

    // Subtract pressure gradient from velocities
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = y * this.cols + x;
        this.grid[idx].u -= 0.5 * this.cols * (p[idx + 1] - p[idx - 1]);
        this.grid[idx].v -= 0.5 * this.cols * (p[idx + this.cols] - p[idx - this.cols]);
      }
    }

    this.setBoundary(1);
    this.setBoundary(2);
  }

  // --- Semi-Lagrangian Advection solver ---
  private advect(b: number, dt: number): void {
    const dt0 = dt * this.cols;

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const idx = y * this.cols + x;

        // Trace backward in time to locate cell source coordinates
        let px = x - dt0 * this.grid[idx].u;
        let py = y - dt0 * this.grid[idx].v;

        // Clamp boundaries
        if (px < 0.5) px = 0.5;
        if (px > this.cols - 1.5) px = this.cols - 1.5;
        if (py < 0.5) py = 0.5;
        if (py > this.rows - 1.5) py = this.rows - 1.5;

        // Bilinear interpolation
        const i0 = Math.floor(px);
        const i1 = i0 + 1;
        const j0 = Math.floor(py);
        const j1 = j0 + 1;

        const s1 = px - i0;
        const s0 = 1.0 - s1;
        const t1 = py - j0;
        const t0 = 1.0 - t1;

        const i0_j0 = j0 * this.cols + i0;
        const i1_j0 = j0 * this.cols + i1;
        const i0_j1 = j1 * this.cols + i0;
        const i1_j1 = j1 * this.cols + i1;

        if (b === 1) { // Velocity U
          this.grid[idx].u =
            s0 * (t0 * this.grid[i0_j0].uPrev + t1 * this.grid[i0_j1].uPrev) +
            s1 * (t0 * this.grid[i1_j0].uPrev + t1 * this.grid[i1_j1].uPrev);
        } else if (b === 2) { // Velocity V
          this.grid[idx].v =
            s0 * (t0 * this.grid[i0_j0].vPrev + t1 * this.grid[i0_j1].vPrev) +
            s1 * (t0 * this.grid[i1_j0].vPrev + t1 * this.grid[i1_j1].vPrev);
        } else { // Density
          this.grid[idx].density =
            s0 * (t0 * this.grid[i0_j0].densityPrev + t1 * this.grid[i0_j1].densityPrev) +
            s1 * (t0 * this.grid[i1_j0].densityPrev + t1 * this.grid[i1_j1].densityPrev);
        }
      }
    }

    this.setBoundary(b);
  }

  // --- Grid boundary reflection constraints ---
  private setBoundary(b: number): void {
    // Left & Right bounds
    for (let y = 1; y < this.rows - 1; y++) {
      const lIdx = y * this.cols;
      const rIdx = y * this.cols + (this.cols - 1);
      this.grid[lIdx].u = b === 1 ? -this.grid[lIdx + 1].u : this.grid[lIdx + 1].u;
      this.grid[rIdx].u = b === 1 ? -this.grid[rIdx - 1].u : this.grid[rIdx - 1].u;
    }

    // Top & Bottom bounds
    for (let x = 1; x < this.cols - 1; x++) {
      const tIdx = x;
      const bIdx = (this.rows - 1) * this.cols + x;
      this.grid[tIdx].v = b === 2 ? -this.grid[tIdx + this.cols].v : this.grid[tIdx + this.cols].v;
      this.grid[bIdx].v = b === 2 ? -this.grid[bIdx - this.cols].v : this.grid[bIdx - this.cols].v;
    }

    // Corner blends
    const c00 = 0;
    const c01 = this.cols - 1;
    const c10 = (this.rows - 1) * this.cols;
    const c11 = this.rows * this.cols - 1;

    this.grid[c00].u = 0.5 * (this.grid[c00 + 1].u + this.grid[c00 + this.cols].u);
    this.grid[c01].u = 0.5 * (this.grid[c01 - 1].u + this.grid[c01 + this.cols].u);
    this.grid[c10].u = 0.5 * (this.grid[c10 + 1].u + this.grid[c10 - this.cols].u);
    this.grid[c11].u = 0.5 * (this.grid[c11 - 1].u + this.grid[c11 - this.cols].u);
  }

  private setBoundaryArray(arr: Float32Array): void {
    for (let y = 1; y < this.rows - 1; y++) {
      arr[y * this.cols] = arr[y * this.cols + 1];
      arr[y * this.cols + (this.cols - 1)] = arr[y * this.cols + (this.cols - 2)];
    }
    for (let x = 1; x < this.cols - 1; x++) {
      arr[x] = arr[x + this.cols];
      arr[(this.rows - 1) * this.cols + x] = arr[(this.rows - 1) * this.cols + x - this.cols];
    }
  }
}
