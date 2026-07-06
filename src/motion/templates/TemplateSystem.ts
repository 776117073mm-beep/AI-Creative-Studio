import { MotionLayer, TransformGroup, TransformGroup as CoreTransform } from "../core/MotionTypes";
import { AnimationEngine } from "../animation/AnimationEngine";

export interface Precomposition {
  id: string;
  name: string;
  version: number;
  width: number;
  height: number;
  durationFrames: number;
  layers: MotionLayer[];
}

export interface MotionTemplate {
  id: string;
  name: string;
  category: "titles" | "lower_thirds" | "logo_reveals" | "transitions" | "social";
  description: string;
  thumbnail: string;
  generateLayers: (width: number, height: number) => MotionLayer[];
}

export class TemplateSystem {
  private static instance: TemplateSystem | null = null;
  private anim = AnimationEngine.getInstance();

  private precomps: Map<string, Precomposition> = new Map();
  private templates: Map<string, MotionTemplate> = new Map();

  private constructor() {
    this.registerDefaultTemplates();
  }

  public static getInstance(): TemplateSystem {
    if (!TemplateSystem.instance) {
      TemplateSystem.instance = new TemplateSystem();
    }
    return TemplateSystem.instance;
  }

  /**
   * PRECOMPOSITION REGISTRY & VERSION CONTROL
   */
  public registerPrecomp(precomp: Precomposition): void {
    const existing = this.precomps.get(precomp.id);
    if (existing) {
      precomp.version = existing.version + 1; // Bump version
    }
    this.precomps.set(precomp.id, precomp);
  }

  public getPrecomp(id: string): Precomposition | undefined {
    return this.precomps.get(id);
  }

  public getPrecomps(): Precomposition[] {
    return Array.from(this.precomps.values());
  }

  /**
   * REGISTER BROADCAST GRAPHICS PACKAGE TEMPLATES
   */
  private registerDefaultTemplates(): void {
    // 1. Neon Lower Third template
    this.registerTemplate({
      id: "neon_lower_third",
      name: "Cyber Neon Lower Third",
      category: "lower_thirds",
      description: "Glowing futuristic title and subtitle bars with sliding easing.",
      thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=60",
      generateLayers: (w, h) => {
        // Build shape backing bar
        const bar: MotionLayer = {
          id: `bar_${Math.random().toString(36).substr(2, 9)}`,
          name: "Neon Glass Bar",
          type: "shape",
          blendMode: "screen",
          startTime: 0,
          duration: 10,
          zIndex: 1,
          visible: true,
          locked: false,
          transform: this.anim.createTransformGroup()
        };
        // Slide position keyframes
        this.anim.addKeyframe(bar.transform.positionX, 0, -800, "bezier");
        this.anim.addKeyframe(bar.transform.positionX, 24, 150, "bezier");
        this.anim.addKeyframe(bar.transform.positionY, 0, h - 160);

        // Build Title text layer
        const text: MotionLayer = {
          id: `text_${Math.random().toString(36).substr(2, 9)}`,
          name: "Presenter Name",
          type: "text",
          blendMode: "normal",
          startTime: 0.3,
          duration: 9.7,
          zIndex: 2,
          visible: true,
          locked: false,
          transform: this.anim.createTransformGroup()
        };
        this.anim.addKeyframe(text.transform.opacity, 10, 0, "linear");
        this.anim.addKeyframe(text.transform.opacity, 24, 100, "linear");
        this.anim.addKeyframe(text.transform.positionX, 0, 170);
        this.anim.addKeyframe(text.transform.positionY, 0, h - 170);

        return [bar, text];
      }
    });

    // 2. Cinematic Logo Reveal
    this.registerTemplate({
      id: "cinematic_logo_reveal",
      name: "Liquid Gold Logo Reveal",
      category: "logo_reveals",
      description: "Organic gold reflection reveal with scale-out camera zooms.",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60",
      generateLayers: (w, h) => {
        const logo: MotionLayer = {
          id: `logo_${Math.random().toString(36).substr(2, 9)}`,
          name: "Central Logo",
          type: "shape",
          blendMode: "normal",
          startTime: 0,
          duration: 8,
          zIndex: 1,
          visible: true,
          locked: false,
          transform: this.anim.createTransformGroup()
        };

        // Bouncing scale in
        this.anim.addKeyframe(logo.transform.scaleX, 0, 0, "bezier");
        this.anim.addKeyframe(logo.transform.scaleY, 0, 0, "bezier");
        this.anim.addKeyframe(logo.transform.scaleX, 30, 1.15, "bezier");
        this.anim.addKeyframe(logo.transform.scaleY, 30, 1.15, "bezier");
        this.anim.addKeyframe(logo.transform.scaleX, 45, 1.0, "linear");
        this.anim.addKeyframe(logo.transform.scaleY, 45, 1.0, "linear");

        // Rotate slightly
        this.anim.addKeyframe(logo.transform.rotationZ, 0, -180, "bezier");
        this.anim.addKeyframe(logo.transform.rotationZ, 45, 0, "bezier");

        return [logo];
      }
    });

    // 3. Dynamic Warp Slide Transition
    this.registerTemplate({
      id: "warp_slide_transition",
      name: "Teal Warp Slide Transition",
      category: "transitions",
      description: "A fast wipe transition block with high speed zoom blur aesthetics.",
      thumbnail: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=120&auto=format&fit=crop&q=60",
      generateLayers: (w, h) => {
        const trans: MotionLayer = {
          id: `trans_${Math.random().toString(36).substr(2, 9)}`,
          name: "Wipe Overlay",
          type: "shape",
          blendMode: "add",
          startTime: 0,
          duration: 1.5,
          zIndex: 10,
          visible: true,
          locked: false,
          transform: this.anim.createTransformGroup()
        };

        this.anim.addKeyframe(trans.transform.positionX, 0, -w, "bezier");
        this.anim.addKeyframe(trans.transform.positionX, 15, 0, "bezier");
        this.anim.addKeyframe(trans.transform.positionX, 30, w, "bezier");

        return [trans];
      }
    });
  }

  public registerTemplate(template: MotionTemplate): void {
    this.templates.set(template.id, template);
  }

  public getTemplates(): MotionTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(id: string): MotionTemplate | undefined {
    return this.templates.get(id);
  }
}
