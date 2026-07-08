export type SyncStatus = 'offline' | 'online' | 'syncing' | 'synced' | 'failed';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType =
  | 'cash'
  | 'bank'
  | 'upi'
  | 'credit'
  | 'debit'
  | 'wallet'
  | 'investment'
  | 'crypto'
  | 'other';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface SyncMetadata {
  syncId: string;
  clientId: string;
  hlcTimestamp: string;
  serverVersion: bigint;
  syncedAt?: Date | null;
}
