import { z } from 'zod';

export const NodeIdSchema = z.string().uuid();
export const ProjectIdSchema = z.string().uuid();
export const AssetIdSchema = z.string().uuid();
export const TrackIdSchema = z.string().uuid();
export const ClipIdSchema = z.string().uuid();
export const KeyframeIdSchema = z.string().uuid();
export const EffectIdSchema = z.string().uuid();
export const AnimationIdSchema = z.string().uuid();
export const LayerIdSchema = z.string().uuid();
export const SceneIdSchema = z.string().uuid();

export type NodeId = z.infer<typeof NodeIdSchema>;
export type ProjectId = z.infer<typeof ProjectIdSchema>;
export type AssetId = z.infer<typeof AssetIdSchema>;
export type TrackId = z.infer<typeof TrackIdSchema>;
export type ClipId = z.infer<typeof ClipIdSchema>;
export type KeyframeId = z.infer<typeof KeyframeIdSchema>;
export type EffectId = z.infer<typeof EffectIdSchema>;
export type AnimationId = z.infer<typeof AnimationIdSchema>;
export type LayerId = z.infer<typeof LayerIdSchema>;
export type SceneId = z.infer<typeof SceneIdSchema>;

export const NodeTypeSchema = z.enum([
  'project',
  'scene',
  'layer',
  'track',
  'clip',
  'asset',
  'effect',
  'filter',
  'animation',
  'keyframe',
  'transition',
  'text',
  'shape',
  'image',
  'video',
  'audio',
  'canvas',
  'camera',
  'light',
  'group',
  'mask',
  'export',
  'template',
]);

export type NodeType = z.infer<typeof NodeTypeSchema>;

export const Vec2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const Vec4Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  w: z.number(),
});

export const ColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).default(1),
});

export const TransformSchema = z.object({
  position: Vec2Schema,
  scale: Vec2Schema.default({ x: 1, y: 1 }),
  rotation: z.number().default(0),
  anchor: Vec2Schema.default({ x: 0.5, y: 0.5 }),
  opacity: z.number().min(0).max(1).default(1),
});

export type Vec2 = z.infer<typeof Vec2Schema>;
export type Vec3 = z.infer<typeof Vec3Schema>;
export type Vec4 = z.infer<typeof Vec4Schema>;
export type Color = z.infer<typeof ColorSchema>;
export type Transform = z.infer<typeof TransformSchema>;

export const BoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type Bounds = z.infer<typeof BoundsSchema>;

export const TimeRangeSchema = z.object({
  start: z.number(),
  end: z.number(),
});

export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const EasingTypeSchema = z.enum([
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'bounce',
  'elastic',
  'back',
  'cubic-bezier',
]);

export type EasingType = z.infer<typeof EasingTypeSchema>;

export const InterpolationTypeSchema = z.enum([
  'hold',
  'linear',
  'bezier',
  'catmull-rom',
]);

export type InterpolationType = z.infer<typeof InterpolationTypeSchema>;

export const MediaTypeSchema = z.enum([
  'image',
  'video',
  'audio',
  'font',
  'document',
  'project',
  'template',
  'brush',
  'preset',
]);

export type MediaType = z.infer<typeof MediaTypeSchema>;

export const ExportFormatSchema = z.enum([
  'mp4',
  'webm',
  'gif',
  'png',
  'jpg',
  'webp',
  'pdf',
  'svg',
  'mp3',
  'wav',
  'ogg',
  'json',
]);

export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ResolutionSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  pixelAspectRatio: z.number().positive().default(1),
});

export type Resolution = z.infer<typeof ResolutionSchema>;

export const FrameRateSchema = z.number().positive();
export type FrameRate = z.infer<typeof FrameRateSchema>;

export const SampleRateSchema = z.number().positive();
export type SampleRate = z.infer<typeof SampleRateSchema>;
