import { ISyncEngine } from './interfaces.js';

export class BackgroundSyncWorker {
  private engine: ISyncEngine;
  private intervalMs: number;
  private timerId: any = null;
  private isRunning = false;

  constructor(engine: ISyncEngine, intervalMs = 15000) {
    this.engine = engine;
    this.intervalMs = intervalMs;
  }

  /**
   * Starts the background sync replication loops.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Trigger initial sync tick immediately
    this.triggerSync();

    this.timerId = setInterval(() => {
      this.triggerSync();
    }, this.intervalMs);
  }

  /**
   * Tears down background polling interval.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Direct manual trigger to instantly process outbox queues.
   */
  public async triggerSync(): Promise<void> {
    try {
      await this.engine.sync();
    } catch (err) {
      console.error('Background sync trigger failed:', err);
    }
  }
}
