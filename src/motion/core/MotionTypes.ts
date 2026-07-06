export type KeyframeEasingType = "linear" | "hold" | "bezier" | "easeIn" | "easeOut" | "custom";

export interface Keyframe {
  id: string;
  frame: number;
  value: number;
  easing: KeyframeEasingType;
  controlIn?: { x: number; y: number };  // Bezier handle in (0-1 range)
  controlOut?: { x: number; y: number }; // Bezier handle out (0-1 range)
  influenceIn?: number;  // Velocity influence percentage (0-100)
  influenceOut?: number; // Velocity influence percentage (0-100)
}

export interface AnimatedProperty {
  id: string;
  name: string;
  value: number;
  keyframes: Keyframe[];
  expressions?: string; // Expression script if active
}

export interface TransformGroup {
  positionX: AnimatedProperty;
  positionY: AnimatedProperty;
  positionZ: AnimatedProperty;
  rotationX: AnimatedProperty;
  rotationY: AnimatedProperty;
  rotationZ: AnimatedProperty;
  scaleX: AnimatedProperty;
  scaleY: AnimatedProperty;
  scaleZ: AnimatedProperty;
  skewX: AnimatedProperty;
  skewY: AnimatedProperty;
  opacity: AnimatedProperty;
  anchorX: AnimatedProperty;
  anchorY: AnimatedProperty;
  anchorZ: AnimatedProperty;
}

export interface MotionLayer {
  id: string;
  name: string;
  type: "text" | "shape" | "vector" | "camera" | "light" | "null" | "precomp" | "particle";
  transform: TransformGroup;
  parentId?: string; // Parenting rigging hierarchy
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "add";
  startTime: number; // in seconds
  duration: number; // in seconds
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface MotionTextLayer extends MotionLayer {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  tracking: number; // letter spacing
  leading: number;  // line height
  alignment: "left" | "center" | "right" | "justify";
  textboxWidth?: number;
  textboxHeight?: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  kerning: boolean;
  baselineShift: number;
  textOnPathId?: string; // path ID if rendering text on path
}

export type ShapeType = "rectangle" | "ellipse" | "polygon" | "star" | "bezier";

export interface MotionShapeLayer extends MotionLayer {
  type: "shape";
  shapeType: ShapeType;
  roundedCorners: number; // For rectangle/polygons
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fillGradient?: {
    type: "linear" | "radial";
    colors: { offset: number; color: string }[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
  strokeGradient?: {
    type: "linear" | "radial";
    colors: { offset: number; color: string }[];
  };
  points?: { x: number; y: number }[]; // For customizable polygons or bezier pen paths
}

export interface MotionVectorLayer extends MotionLayer {
  type: "vector";
  svgContent?: string;
  paths: {
    id: string;
    d: string;
    strokeDasharray?: string;
    strokeDashoffset?: AnimatedProperty;
    trimStart?: AnimatedProperty; // 0 to 100
    trimEnd?: AnimatedProperty;   // 0 to 100
    trimOffset?: AnimatedProperty; // 0 to 360
  }[];
  repeaterCount?: number;
  repeaterOffset?: { x: number; y: number };
  repeaterScale?: number;
  wiggleFrequency?: number;
  wiggleAmount?: number;
}

export interface MotionCameraLayer extends MotionLayer {
  type: "camera";
  is3d: boolean;
  fov: number; // Field of View
  focusDistance: AnimatedProperty;
  aperture: AnimatedProperty; // Depth of field
  orbitRadius: number;
  orbitSpeed: number;
  shakeFrequency: number;
  shakeAmount: number;
}

export interface MotionLightLayer extends MotionLayer {
  type: "light";
  lightType: "point" | "spot" | "directional" | "ambient";
  color: string;
  intensity: AnimatedProperty;
  coneAngle?: number; // for Spotlights
  shadowsEnabled: boolean;
}

export interface MotionParticleLayer extends MotionLayer {
  type: "particle";
  emitterType: "point" | "area" | "circle";
  emitterRate: number; // particles per second
  maxParticles: number;
  gravityY: number;
  gravityX: number;
  particleLifetime: number; // in seconds
  startColor: string;
  endColor: string;
  startSize: number;
  endSize: number;
}
