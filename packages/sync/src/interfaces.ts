import { 
  Account, 
  LedgerOperation, 
  BudgetCategory, 
  SavingGoal, 
  Device, 
  UserPreferences, 
  AuditLog 
} from '@repo/database';
import { PendingOperation } from './outbox.js';

export type SyncState = 'offline' | 'connecting' | 'pulling' | 'pushing' | 'synced' | 'failed' | 'conflict';

export interface SyncStatusEvent {
  state: SyncState;
  lastSyncedAt?: Date;
  errorMessage?: string;
  pendingCount?: number;
}

export interface SyncPullResponse {
  accounts: Array<Account & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null }>;
  categories: Array<BudgetCategory & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null }>;
  ledger: Array<LedgerOperation & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null }>;
  goals: Array<SavingGoal & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null }>;
  devices: Array<Device & { hlcTimestamp: string }>;
  userPreferences: Array<UserPreferences & { hlcTimestamp: string }>;
  auditLogs: Array<AuditLog & { hlcTimestamp: string }>;
}

export interface ISyncAdapter {
  pushOperations(operations: PendingOperation[]): Promise<string[]>; // Returns successfully pushed operation IDs
  pullChanges(lastSyncedAt: Date | null): Promise<SyncPullResponse>;
  verifySchema(): Promise<{ valid: boolean, missingTables: string[] }>;
}

export interface ISyncEngine {
  onStatusChange(callback: (status: SyncStatusEvent) => void): () => void;
  sync(): Promise<void>;
  enqueueOperation(
    table: string,
    operationType: 'insert' | 'update' | 'delete',
    payload: Record<string, unknown>
  ): Promise<void>;
  connect(): void;
  disconnect(): void;
}
