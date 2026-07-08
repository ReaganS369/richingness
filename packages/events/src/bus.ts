export type EventCallback<T = any> = (data: T) => void | Promise<void>;

export interface Subscription {
  unsubscribe: () => void;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publishes an event to all active subscribers.
   */
  public publish<T = any>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    for (const callback of eventListeners) {
      try {
        const result = callback(data);
        if (result instanceof Promise) {
          result.catch(err => console.error(`Error in async event handler for ${event}:`, err));
        }
      } catch (err) {
        console.error(`Error in event handler for ${event}:`, err);
      }
    }
  }

  /**
   * Subscribes to a specific event. Returns a Subscription token to unsubscribe.
   */
  public subscribe<T = any>(event: string, callback: EventCallback<T>): Subscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const set = this.listeners.get(event)!;
    set.add(callback as EventCallback);

    return {
      unsubscribe: () => {
        set.delete(callback as EventCallback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Resets the event bus (removes all subscribers).
   */
  public reset(): void {
    this.listeners.clear();
  }
}
