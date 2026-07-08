import { PendingOperation } from '@repo/database';
export { PendingOperation };

export interface SyncPushBatch {
  clientId: string;
  operations: PendingOperation[];
}

export class OutboxQueue {
  private queue: PendingOperation[] = [];

  /**
   * Adds an operation to the outbox queue.
   */
  public enqueue(op: Omit<PendingOperation, 'attempts'>): void {
    // Prevent duplicates by checking operation ID
    const exists = this.queue.some(item => item.id === op.id);
    if (exists) return;

    this.queue.push({
      ...op,
      attempts: 0
    });

    // Sort operations chronologically by HLC timestamp
    this.queue.sort((a, b) => a.hlcTimestamp.localeCompare(b.hlcTimestamp));
  }

  /**
   * Gets the top items from the outbox queue to push.
   */
  public getBatch(limit = 50): PendingOperation[] {
    return this.queue.slice(0, limit);
  }

  /**
   * Clears successfully synced operations.
   */
  public dequeue(ids: string[]): void {
    const idSet = new Set(ids);
    this.queue = this.queue.filter(op => !idSet.has(op.id));
  }

  /**
   * Increments the attempt count for failed operations.
   */
  public incrementAttempts(ids: string[]): void {
    const idSet = new Set(ids);
    for (const op of this.queue) {
      if (idSet.has(op.id)) {
        op.attempts++;
      }
    }
  }

  /**
   * Returns the total count of pending changes in the queue.
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Clears the entire queue (mostly for testing/resetting).
   */
  public clear(): void {
    this.queue = [];
  }
}
