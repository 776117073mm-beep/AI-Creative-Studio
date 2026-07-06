import { AppEvent, Subscription, IEventBus } from "../interfaces";

export class EventBus implements IEventBus {
  private static instance: EventBus;
  private subscriptions: Subscription[] = [];
  private eventHistory: AppEvent[] = [];
  private deadLetterQueue: AppEvent[] = [];
  private maxHistorySize = 1000;
  private maxRetries = 3;

  constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public async publish(
    type: string, 
    payload: any, 
    sender: string, 
    options?: { priority?: "low" | "medium" | "high"; correlationId?: string; async?: boolean }
  ): Promise<void> {
    const event: AppEvent = {
      id: "evt_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      type,
      payload,
      timestamp: Date.now(),
      priority: options?.priority || "medium",
      sender,
      correlationId: options?.correlationId
    };

    // Log the event to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    console.log(`[EventBus] Published Event: ${type} from ${sender}`, event);

    // Get matching subscriptions
    const matches = this.subscriptions.filter(
      sub => (sub.eventType === type || sub.eventType === "*") && (!sub.filter || sub.filter(event))
    );

    // Sort by subscriber priority (higher number = higher priority)
    matches.sort((a, b) => b.priority - a.priority);

    const executeDispatch = async () => {
      for (const sub of matches) {
        let attempts = 0;
        let success = false;
        
        while (attempts < this.maxRetries && !success) {
          try {
            sub.callback(event);
            success = true;
          } catch (err) {
            attempts++;
            console.warn(`[EventBus] Attempt ${attempts} failed for subscription ID: ${sub.id} on event: ${type}`, err);
            if (attempts >= this.maxRetries) {
              console.error(`[EventBus] Subscription ${sub.id} failed after ${this.maxRetries} retries. Moving to Dead Letter Queue.`);
              this.deadLetterQueue.push(event);
            } else {
              // Wait 50ms before retrying
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }
      }
    };

    if (options?.async) {
      // Non-blocking asynchronous dispatch
      setTimeout(() => {
        executeDispatch().catch(err => console.error("[EventBus] Async execution failed:", err));
      }, 0);
    } else {
      // Synchronous blocking dispatch
      await executeDispatch();
    }
  }

  public subscribe(
    eventType: string, 
    callback: (event: AppEvent) => void, 
    options?: { priority?: number; filter?: (event: AppEvent) => boolean }
  ): string {
    const subId = "sub_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    const subscription: Subscription = {
      id: subId,
      eventType,
      callback,
      priority: options?.priority ?? 100,
      filter: options?.filter
    };

    this.subscriptions.push(subscription);
    return subId;
  }

  public unsubscribe(subscriptionId: string): void {
    const index = this.subscriptions.findIndex(sub => sub.id === subscriptionId);
    if (index !== -1) {
      this.subscriptions.splice(index, 1);
    }
  }

  public async broadcast(type: string, payload: any, sender: string): Promise<void> {
    await this.publish(type, payload, sender, { async: true });
  }

  public publishDelayed(
    type: string,
    payload: any,
    sender: string,
    delayMs: number,
    options?: { priority?: "low" | "medium" | "high"; correlationId?: string }
  ): void {
    console.log(`[EventBus] Scheduled delayed event of type ${type} in ${delayMs}ms`);
    setTimeout(() => {
      this.publish(type, payload, sender, { ...options, async: true }).catch(err => 
        console.error("[EventBus] Failed to publish delayed event:", err)
      );
    }, delayMs);
  }

  public publishScheduled(
    type: string,
    payload: any,
    sender: string,
    intervalMs: number,
    options?: { priority?: "low" | "medium" | "high"; correlationId?: string }
  ): () => void {
    console.log(`[EventBus] Scheduled recurring event of type ${type} every ${intervalMs}ms`);
    const intervalId = setInterval(() => {
      this.publish(type, payload, sender, { ...options, async: true }).catch(err => 
        console.error("[EventBus] Failed to publish scheduled event:", err)
      );
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      console.log(`[EventBus] Cancelled scheduled recurring event of type ${type}`);
    };
  }

  public getHistory(): AppEvent[] {
    return [...this.eventHistory];
  }

  public replayHistory(startTime?: number): void {
    const eventsToReplay = startTime 
      ? this.eventHistory.filter(e => e.timestamp >= startTime)
      : this.eventHistory;

    console.log(`[EventBus] Replaying ${eventsToReplay.length} events...`);
    
    eventsToReplay.forEach(event => {
      const matches = this.subscriptions.filter(
        sub => (sub.eventType === event.type || sub.eventType === "*") && (!sub.filter || sub.filter(event))
      );
      matches.sort((a, b) => b.priority - a.priority);
      matches.forEach(sub => {
        try {
          sub.callback(event);
        } catch (err) {
          console.error(`[EventBus] Replay failure for sub ID: ${sub.id}`, err);
        }
      });
    });
  }

  public getDeadLetterQueue(): AppEvent[] {
    return [...this.deadLetterQueue];
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}
