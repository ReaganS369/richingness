import { describe, it, expect } from 'vitest';
import { HLC } from './hlc.js';
import { OutboxQueue, PendingOperation } from './outbox.js';
import { resolveConflict, SyncRecord } from './conflict.js';

describe('Sync Engine Clocks & Conflict Resolvers', () => {
  describe('Hybrid Logical Clock (HLC)', () => {
    it('should generate properly formatted string representations', () => {
      const clock = new HLC(1719830400000, 5, 'device-node-1');
      expect(clock.toString()).toBe('001719830400000:00005:device-node-1');
    });

    it('should increment correctly when local clock moves forward', () => {
      const clock = new HLC(1719830400000, 5, 'node-a');
      
      // Incremented at same time moves counter up
      const sameTime = HLC.increment(clock, 1719830400000);
      expect(sameTime.ts).toBe(1719830400000);
      expect(sameTime.count).toBe(6);

      // Incremented at a future time updates physical ms and resets counter
      const futureTime = HLC.increment(clock, 1719830500000);
      expect(futureTime.ts).toBe(1719830500000);
      expect(futureTime.count).toBe(0);
    });

    it('should resolve updates when receiving ticks from other nodes', () => {
      const local = new HLC(1719830400000, 2, 'node-local');
      const remote = new HLC(1719830500000, 4, 'node-remote');

      const received = HLC.receive(local, remote, 1719830450000);
      // physical should be remote (since 1719830500000 is larger than local and nowMs)
      expect(received.ts).toBe(1719830500000);
      // count should be remote count + 1 (5) because physical matched remote physical
      expect(received.count).toBe(5);
    });
  });

  describe('Sync Outbox Queue', () => {
    it('should enqueue operations sorted by HLC strings chronologically', () => {
      const queue = new OutboxQueue();
      
      const op1: PendingOperation = {
        id: 'op-1',
        table: 'transactions',
        operationType: 'insert',
        payload: {},
        hlcTimestamp: '0001719830400000:00005:node-a',
        attempts: 0
      };

      const op2: PendingOperation = {
        id: 'op-2',
        table: 'transactions',
        operationType: 'insert',
        payload: {},
        hlcTimestamp: '0001719830400000:00002:node-a', // Older counter
        attempts: 0
      };

      queue.enqueue(op1);
      queue.enqueue(op2);

      const batch = queue.getBatch();
      // Assert older counter goes first
      expect(batch[0].id).toBe('op-2');
      expect(batch[1].id).toBe('op-1');
    });
  });

  describe('Conflict Resolution Logic', () => {
    it('should implement delete overrides edit rule', () => {
      const local: SyncRecord = {
        id: 'rec-123',
        hlcTimestamp: '0001719830500000:00000:node-a',
        updatedAt: new Date('2026-07-08T12:00:00.000Z'),
        name: 'Edited Name'
      };

      const remote: SyncRecord = {
        id: 'rec-123',
        hlcTimestamp: '0001719830400000:00000:node-b',
        updatedAt: new Date('2026-07-08T11:00:00.000Z'),
        deletedAt: new Date('2026-07-08T11:05:00.000Z'), // Deleted on remote
        name: 'Original Name'
      };

      const result = resolveConflict(local, remote);
      // Remote was deleted, so resolved item must carry deletedAt even though HLC is older
      expect(result.resolved.deletedAt).toBeDefined();
    });

    it('should implement Last-Write-Wins using HLC timestamps', () => {
      const local: SyncRecord = {
        id: 'rec-123',
        hlcTimestamp: '0001719830400000:00005:node-a',
        updatedAt: new Date(),
        name: 'Older local change'
      };

      const remote: SyncRecord = {
        id: 'rec-123',
        hlcTimestamp: '0001719830400000:00008:node-b', // Newer HLC count
        updatedAt: new Date(),
        name: 'Newer remote change'
      };

      const result = resolveConflict(local, remote);
      expect(result.resolved.name).toBe('Newer remote change');
      expect(result.action).toBe('remote_win');
    });
  });
});
