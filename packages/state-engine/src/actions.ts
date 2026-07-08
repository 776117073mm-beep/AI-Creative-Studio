import { z } from 'zod';
import { NodeId, ProjectId, AssetId } from '@ai-creative-studio/core';

export const ActionTypeSchema = z.enum([
  'project:load',
  'project:save',
  'project:close',
  'project:create',
  'node:add',
  'node:remove',
  'node:update',
  'node:select',
  'node:deselect',
  'selection:clear',
  'selection:group',
  'selection:ungroup',
  'timeline:play',
  'timeline:pause',
  'timeline:stop',
  'timeline:seek',
  'timeline:trim-clip',
  'timeline:split-clip',
  'timeline:delete-clip',
  'timeline:move-clip',
  'track:add',
  'track:remove',
  'track:update',
  'asset:upload',
  'asset:remove',
  'asset:update',
  'effect:apply',
  'effect:remove',
  'animation:add-keyframe',
  'animation:remove-keyframe',
  'animation:update-keyframe',
  'workspace:switch',
  'panel:toggle',
  'panel:resize',
  'panel:move',
  'ui:show-modal',
  'ui:hide-modal',
  'ui:add-notification',
  'ui:remove-notification',
  'ai:execute-command',
  'ai:cancel-task',
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

export interface IAction {
  type: ActionType;
  payload: unknown;
  timestamp: number;
  userId?: string;
  undoable: boolean;
  meta?: Record<string, unknown>;
}

export interface IActionContext {
  dispatch: (action: IAction) => void;
  getState: () => unknown;
  userId?: string;
}

export type ActionHandler = (
  payload: unknown,
  context: IActionContext
) => unknown | Promise<unknown>;

export interface IActionDefinition {
  type: ActionType;
  payloadSchema: z.ZodType;
  handler: ActionHandler;
  undoHandler?: ActionHandler;
  label: string;
  category: string;
  description?: string;
}

export function createAction<T>(
  type: ActionType,
  payload: T,
  options: Partial<IAction> = {}
): IAction {
  return {
    type,
    payload,
    timestamp: Date.now(),
    undoable: options.undoable ?? true,
    userId: options.userId,
    meta: options.meta,
  };
}

export const ProjectActions = {
  loadProject: (projectId: ProjectId) =>
    createAction('project:load', { projectId }),

  createProject: (name: string, settings?: Record<string, unknown>) =>
    createAction('project:create', { name, settings }),

  saveProject: () =>
    createAction('project:save', {}),

  closeProject: () =>
    createAction('project:close', {}),
};

export const NodeActions = {
  addNode: (type: string, data: unknown, parentId?: NodeId) =>
    createAction('node:add', { type, data, parentId }),

  removeNode: (nodeId: NodeId) =>
    createAction('node:remove', { nodeId }),

  updateNode: (nodeId: NodeId, updates: unknown) =>
    createAction('node:update', { nodeId, updates }),

  selectNodes: (nodeIds: NodeId[], mode: 'replace' | 'add' | 'toggle' = 'replace') =>
    createAction('node:select', { nodeIds, mode }),

  deselectNodes: (nodeIds: NodeId[]) =>
    createAction('node:deselect', { nodeIds }),

  clearSelection: () =>
    createAction('selection:clear', {}),
};

export const TimelineActions = {
  play: () =>
    createAction('timeline:play', {}),

  pause: () =>
    createAction('timeline:pause', {}),

  stop: () =>
    createAction('timeline:stop', {}),

  seek: (time: number) =>
    createAction('timeline:seek', { time }),

  trimClip: (clipId: string, start: number, end: number) =>
    createAction('timeline:trim-clip', { clipId, start, end }),

  splitClip: (clipId: string, time: number) =>
    createAction('timeline:split-clip', { clipId, time }),

  deleteClip: (clipId: string) =>
    createAction('timeline:delete-clip', { clipId }),

  moveClip: (clipId: string, trackId: string, time: number) =>
    createAction('timeline:move-clip', { clipId, trackId, time }),

  addTrack: (type: 'video' | 'audio' | 'text' | 'effect', name?: string) =>
    createAction('track:add', { type, name }),

  removeTrack: (trackId: string) =>
    createAction('track:remove', { trackId }),
};

export const AssetActions = {
  upload: (files: File[], folder?: string) =>
    createAction('asset:upload', { files, folder }),

  remove: (assetId: AssetId) =>
    createAction('asset:remove', { assetId }),
};

export const AIActions = {
  executeCommand: (query: string, context?: Record<string, unknown>) =>
    createAction('ai:execute-command', { query, context }),

  cancelTask: (taskId: string) =>
    createAction('ai:cancel-task', { taskId }),
};
