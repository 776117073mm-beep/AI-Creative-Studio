import { BaseEngine, EngineStatus } from './base-engine.js';
import { EventBus, globalEventBus } from '../events/index.js';

export class EngineRegistry {
  private engines: Map<string, BaseEngine> = new Map();
  private initializationOrder: string[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus = globalEventBus) {
    this.eventBus = eventBus;
  }

  register(engine: BaseEngine): void {
    if (this.engines.has(engine.id)) {
      throw new Error(`Engine with id ${engine.id} already registered`);
    }
    this.engines.set(engine.id, engine);
    this.updateInitializationOrder();
  }

  unregister(engineId: string): void {
    const engine = this.engines.get(engineId);
    if (engine && engine.getStatus() !== 'destroyed') {
      console.warn(`Engine ${engineId} must be destroyed before unregistering`);
      return;
    }
    this.engines.delete(engineId);
    this.updateInitializationOrder();
  }

  get<T extends BaseEngine>(engineId: string): T | undefined {
    return this.engines.get(engineId) as T | undefined;
  }

  has(engineId: string): boolean {
    return this.engines.has(engineId);
  }

  getAll(): BaseEngine[] {
    return Array.from(this.engines.values());
  }

  async initializeAll(): Promise<Map<string, Error | null>> {
    const results = new Map<string, Error | null>();

    for (const engineId of this.initializationOrder) {
      const engine = this.engines.get(engineId);
      if (!engine) {
        results.set(engineId, new Error('Engine not found'));
        continue;
      }

      const dependenciesReady = engine.dependencies.every(depId => {
        const dep = this.engines.get(depId);
        return dep && dep.isReady();
      });

      if (!dependenciesReady) {
        results.set(
          engineId,
          new Error(`Dependencies not ready: ${engine.dependencies.join(', ')}`)
        );
        continue;
      }

      try {
        await engine.initialize();
        results.set(engineId, null);
      } catch (error) {
        results.set(engineId, error instanceof Error ? error : new Error(String(error)));
      }
    }

    return results;
  }

  async destroyAll(): Promise<Map<string, Error | null>> {
    const results = new Map<string, Error | null>();
    const reversedOrder = [...this.initializationOrder].reverse();

    for (const engineId of reversedOrder) {
      const engine = this.engines.get(engineId);
      if (!engine) continue;

      try {
        await engine.destroy();
        results.set(engineId, null);
      } catch (error) {
        results.set(engineId, error instanceof Error ? error : new Error(String(error)));
      }
    }

    return results;
  }

  getReadyEngines(): BaseEngine[] {
    return this.getAll().filter(engine => engine.isReady());
  }

  getEnginesByStatus(status: EngineStatus): BaseEngine[] {
    return this.getAll().filter(engine => engine.getStatus() === status);
  }

  private updateInitializationOrder(): void {
    const engines = Array.from(this.engines.values());
    const sorted: BaseEngine[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (engine: BaseEngine) => {
      if (visited.has(engine.id)) return;
      if (visiting.has(engine.id)) {
        throw new Error(`Circular dependency detected involving ${engine.id}`);
      }

      visiting.add(engine.id);

      for (const depId of engine.dependencies) {
        const dep = this.engines.get(depId);
        if (dep) {
          visit(dep);
        }
      }

      visiting.delete(engine.id);
      visited.add(engine.id);
      sorted.push(engine);
    };

    engines.sort((a, b) => b.priority - a.priority);

    for (const engine of engines) {
      visit(engine);
    }

    this.initializationOrder = sorted.map(e => e.id);
  }

  getInitializationOrder(): string[] {
    return [...this.initializationOrder];
  }
}

export const globalEngineRegistry = new EngineRegistry();
