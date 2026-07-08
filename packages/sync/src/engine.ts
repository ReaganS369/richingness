import { IScopedRepository } from '@repo/database';
import { 
  ISyncEngine, 
  ISyncAdapter, 
  SyncState, 
  SyncStatusEvent 
} from './interfaces.js';
import { resolveConflict, SyncRecord } from './conflict.js';
import { HLC } from './hlc.js';

export class SyncEngine implements ISyncEngine {
  private repo: IScopedRepository;
  private adapter: ISyncAdapter;
  private deviceId: string;
  private state: SyncStatusEvent = { state: 'offline', pendingCount: 0 };
  private listeners: Set<(event: SyncStatusEvent) => void> = new Set();

  constructor(repo: IScopedRepository, adapter: ISyncAdapter, deviceId: string) {
    this.repo = repo;
    this.adapter = adapter;
    this.deviceId = deviceId;
  }

  public onStatusChange(callback: (status: SyncStatusEvent) => void): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private setState(state: SyncState, errorMessage?: string, pendingCount?: number) {
    this.state = {
      state,
      lastSyncedAt: this.state.lastSyncedAt,
      errorMessage,
      pendingCount: pendingCount !== undefined ? pendingCount : this.state.pendingCount
    };
    this.listeners.forEach(cb => cb(this.state));
  }

  public async sync(): Promise<void> {
    try {
      const ops = await this.repo.getPendingOperations();
      this.setState('connecting', undefined, ops.length);

      // 1. Pull Phase
      this.setState('pulling');
      const lastSyncedStr = await this.repo.getMetadata('lastSyncedAt');
      const lastSynced = lastSyncedStr ? new Date(lastSyncedStr) : null;
      
      const remote = await this.adapter.pullChanges(lastSynced);

      // Run conflict resolutions within transactional boundaries for safety
      await this.repo.runInTransaction(async (txn) => {
        // Accounts Pull
        const localAccounts = await txn.getAccounts();
        for (const rem of remote.accounts) {
          const loc = localAccounts.find(a => a.id === rem.id);
          if (!loc) {
            await txn.saveAccount(rem);
          } else {
            const res = resolveConflict(loc as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.saveAccount(res.resolved as any);
            }
          }
        }

        // Categories Pull
        const localCategories = await txn.getCategories();
        for (const rem of remote.categories) {
          const loc = localCategories.find(c => c.id === rem.id);
          if (!loc) {
            await txn.saveCategory(rem);
          } else {
            const res = resolveConflict(loc as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.saveCategory(res.resolved as any);
            }
          }
        }

        // Ledger Pull
        const localLedger = await txn.getLedger();
        for (const rem of remote.ledger) {
          const loc = localLedger.find(l => l.id === rem.id);
          if (!loc) {
            await txn.saveTransaction(rem);
          } else {
            const res = resolveConflict(loc as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.saveTransaction(res.resolved as any);
            }
          }
        }

        // Goals Pull
        const localGoals = await txn.getGoals();
        for (const rem of remote.goals) {
          const loc = localGoals.find(g => g.id === rem.id);
          if (!loc) {
            await txn.saveGoal(rem);
          } else {
            const res = resolveConflict(loc as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.saveGoal(res.resolved as any);
            }
          }
        }

        // User Preferences Pull
        const localPrefs = await txn.getPreferences();
        for (const rem of remote.userPreferences) {
          if (!localPrefs) {
            await txn.savePreferences(rem);
          } else {
            const res = resolveConflict(localPrefs as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.savePreferences(res.resolved as any);
            }
          }
        }

        // Devices Pull
        const localDevices = await txn.getDevices();
        for (const rem of remote.devices) {
          const loc = localDevices.find(d => d.deviceId === rem.deviceId);
          if (!loc) {
            await txn.saveDevice(rem);
          } else {
            const res = resolveConflict(loc as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.saveDevice(res.resolved as any);
            }
          }
        }

        // Audit Logs Pull
        const localLogs = await txn.getAuditLogs();
        for (const rem of remote.auditLogs) {
          const loc = localLogs.find(l => l.id === rem.id);
          if (!loc) {
            await txn.saveAuditLog(rem);
          } else {
            const res = resolveConflict(loc as any, rem as any);
            if (res.action === 'remote_win') {
              await txn.saveAuditLog(res.resolved as any);
            }
          }
        }

        // Update last synced physical time
        const now = new Date();
        await txn.saveMetadata('lastSyncedAt', now.toISOString());
        this.state.lastSyncedAt = now;
      });

      // 2. Push Phase
      this.setState('pushing');
      const pendingOps = await this.repo.getPendingOperations();
      if (pendingOps.length > 0) {
        const batchIds = pendingOps.map(o => o.id);
        try {
          const successIds = await this.adapter.pushOperations(pendingOps);
          await this.repo.dequeueOperations(successIds);
          
          const failedIds = batchIds.filter(id => !successIds.includes(id));
          if (failedIds.length > 0) {
            await this.repo.incrementOperationAttempts(failedIds);
          }
        } catch (err: any) {
          await this.repo.incrementOperationAttempts(batchIds);
          throw err;
        }
      }

      const finalOps = await this.repo.getPendingOperations();
      this.setState('synced', undefined, finalOps.length);
    } catch (err: any) {
      console.error('Synchronization pass failed:', err);
      const remainingOps = await this.repo.getPendingOperations();
      this.setState('failed', err.message || 'Unknown network error', remainingOps.length);
    }
  }

  public async enqueueOperation(
    table: string,
    operationType: 'insert' | 'update' | 'delete',
    payload: Record<string, unknown>
  ): Promise<void> {
    const clockStateStr = await this.repo.getMetadata('hlcClockState');
    let localHlc: HLC;
    if (clockStateStr) {
      localHlc = HLC.parse(clockStateStr);
    } else {
      localHlc = new HLC(Date.now(), 0, this.deviceId);
    }

    const nextHlc = HLC.increment(localHlc, Date.now());
    await this.repo.saveMetadata('hlcClockState', nextHlc.toString());

    // Inject sync metadata into payload
    payload.hlcTimestamp = nextHlc.toString();
    payload.updatedAt = new Date().toISOString();

    const opId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.repo.enqueueOperation({
      id: opId,
      table,
      operationType,
      payload,
      hlcTimestamp: nextHlc.toString(),
      attempts: 0
    });

    const finalOps = await this.repo.getPendingOperations();
    this.setState(this.state.state, undefined, finalOps.length);
  }

  public connect(): void {
    this.setState('synced');
  }

  public disconnect(): void {
    this.setState('offline');
  }
}
