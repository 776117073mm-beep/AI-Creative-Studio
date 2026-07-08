import { EventEmitter } from 'eventemitter3';

export type EventPriority = 'high' | 'normal' | 'low';

export interface IEvent {
  type: string;
  timestamp: number;
  source?: string;
  priority?: EventPriority;
  propagate?: boolean;
}

export interface IEventHandler<T extends IEvent = IEvent> {
  (event: T): void | Promise<void>;
}

export interface IEventSubscription {
  unsubscribe: () => void;
}

export class EventBus {
  private emitter = new EventEmitter<string, IEvent>();
  private middleware: Array<(event: IEvent) => IEvent | null> = [];

  on<T extends IEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): IEventSubscription {
    this.emitter.on(eventType, handler as IEventHandler);
    return {
      unsubscribe: () => this.emitter.off(eventType, handler as IEventHandler),
    };
  }

  once<T extends IEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): IEventSubscription {
    this.emitter.once(eventType, handler as IEventHandler);
    return {
      unsubscribe: () => this.emitter.off(eventType, handler as IEventHandler),
    };
  }

  off<T extends IEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): void {
    this.emitter.off(eventType, handler as IEventHandler);
  }

  emit<T extends IEvent>(event: T): void {
    let processedEvent: IEvent | null = event;

    for (const middleware of this.middleware) {
      processedEvent = middleware(processedEvent);
      if (processedEvent === null) return;
    }

    this.emitter.emit(event.type, processedEvent as T);
  }

  emitAsync<T extends IEvent>(event: T): Promise<void> {
    let processedEvent: IEvent | null = event;

    for (const middleware of this.middleware) {
      processedEvent = middleware(processedEvent);
      if (processedEvent === null) return Promise.resolve();
    }

    const listeners = this.emitter.listeners(event.type);
    return Promise.all(
      listeners.map(handler => (handler as IEventHandler<T>)(processedEvent as T))
    ).then(() => {});
  }

  addMiddleware(
    middleware: (event: IEvent) => IEvent | null
  ): () => void {
    this.middleware.push(middleware);
    return () => {
      const index = this.middleware.indexOf(middleware);
      if (index > -1) {
        this.middleware.splice(index, 1);
      }
    };
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.emitter.removeAllListeners(eventType);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }
}

export const globalEventBus = new EventBus();

export type EngineEventType =
  | 'engine:init'
  | 'engine:ready'
  | 'engine:error'
  | 'engine:destroy'
  | 'state:change'
  | 'state:undo'
  | 'state:redo'
  | 'state:snapshot'
  | 'project:load'
  | 'project:save'
  | 'project:close'
  | 'timeline:timechange'
  | 'timeline:play'
  | 'timeline:pause'
  | 'timeline:seek'
  | 'timeline:loop'
  | 'canvas:render'
  | 'canvas:resize'
  | 'canvas:zoom'
  | 'canvas:pan'
  | 'selection:change'
  | 'selection:clear'
  | 'asset:upload'
  | 'asset:process'
  | 'asset:ready'
  | 'asset:error'
  | 'effect:apply'
  | 'effect:remove'
  | 'animation:keyframe:add'
  | 'animation:keyframe:remove'
  | 'animation:keyframe:update'
  | 'export:start'
  | 'export:progress'
  | 'export:complete'
  | 'export:error'
  | 'ai:command'
  | 'ai:response'
  | 'ai:error'
  | 'plugin:load'
  | 'plugin:unload'
  | 'plugin:error';

export type EngineEvent = IEvent & {
  type: EngineEventType;
};

export function createEngineEvent<T extends EngineEventType>(
  type: T,
  data?: Partial<IEvent>
): EngineEvent {
  const event: IEvent = {
    type,
    timestamp: Date.now(),
    propagate: true,
    ...data,
  };
  return event as EngineEvent;
}
