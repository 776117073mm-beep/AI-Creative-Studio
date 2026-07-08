import { BaseEngine, EngineConfigSchema } from '@ai-creative-studio/core';
import { z } from 'zod';

const StateConfigSchema = EngineConfigSchema.extend({
  persistenceEnabled: z.boolean().optional(),
  syncEnabled: z.boolean().optional(),
  maxSnapshots: z.number().optional(),
});

type StateConfig = z.infer<typeof StateConfigSchema>;

export class StateEngine extends BaseEngine {
  constructor(config: StateConfig) {
    super(StateConfigSchema.parse(config));
  }

  protected async onInitialize(): Promise<void> {
  }

  getCapabilities(): string[] {
    return [
      'state-management',
      'undo-redo',
      'snapshots',
      'versioning',
      'persistence',
      'realtime-sync',
    ];
  }
}

export * from './store.js';
export * from './actions.js';
export * from './selectors.js';
