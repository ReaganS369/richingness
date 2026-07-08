import { Account, LedgerOperation } from '@repo/module-finance';
import { BudgetCategory } from '@repo/module-budget';
import { SavingGoal } from '@repo/module-goals';

export { Account, LedgerOperation, BudgetCategory, SavingGoal };

export interface PendingOperation {
  id: string; // Time-ordered UUID
  table: string;
  operationType: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  hlcTimestamp: string;
  attempts: number;
}

export interface IDatabaseDriver {
  /**
   * Executes a raw SQL query or prepared statement.
   */
  execute<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Checks if the database is open/accessible.
   */
  isOpen(): boolean;

  /**
   * Runs schema migration scripts.
   */
  migrate(): Promise<void>;

  /**
   * Truncates database tables (mostly for development testing).
   */
  reset(): Promise<void>;
}

// 1. Device registry model type
export interface Device {
  deviceId: string;
  userId: string;
  platform: 'web' | 'ios' | 'android' | 'desktop';
  platformVersion: string;
  deviceName: string;
  appVersion: string;
  lastSeen: Date;
  syncVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. User Preferences model type
export interface UserPreferences {
  userId: string;
  theme: 'dark' | 'light';
  language: string;
  currency: string;
  numberFormat: string;
  notificationPreferences: Record<string, boolean>;
  layoutPreferences: Record<string, any>;
  updatedAt: Date;
}

// 3. Audit Log model type for operations auditing
export interface AuditLog {
  id: string; // UUID v7
  userId: string;
  action: string; // e.g. 'CREATE_ACCOUNT'
  entityType: string; // e.g. 'account'
  entityId: string;
  changes: string; // JSON payload details
  timestamp: Date;
  deviceId: string;
}

// 4. Global Repository boundaries interface
export interface IRepository {
  /**
   * Spawns a user-scoped repository instance gating operations.
   */
  forUser(userId: string): IScopedRepository;

  /**
   * Pub/sub observer to react automatically to storage table changes.
   */
  subscribe(
    tables: Array<'accounts' | 'categories' | 'ledger' | 'goals' | 'devices' | 'user_preferences' | 'audit_log'>,
    callback: () => void
  ): () => void;
}

// 5. Scoped user transaction repository operation bounds
export interface IScopedRepository {
  /**
   * Runs multi-step operations in an atomic local database transaction with safe rollback.
   */
  runInTransaction<T>(callback: (txn: IScopedRepository) => Promise<T>): Promise<T>;

  // Accounts CRUD
  getAccounts(): Promise<Account[]>;
  saveAccount(account: Account): Promise<void>;

  // Categories CRUD
  getCategories(): Promise<BudgetCategory[]>;
  saveCategory(category: BudgetCategory): Promise<void>;

  // Ledger Operation entries CRUD
  getLedger(): Promise<LedgerOperation[]>;
  saveTransaction(op: LedgerOperation): Promise<void>;

  // Saving Goals CRUD
  getGoals(): Promise<SavingGoal[]>;
  saveGoal(goal: SavingGoal): Promise<void>;

  // Preferences CRUD
  getPreferences(): Promise<UserPreferences | null>;
  savePreferences(prefs: UserPreferences): Promise<void>;

  // Devices CRUD
  getDevices(): Promise<Device[]>;
  saveDevice(device: Device): Promise<void>;

  // Audit Logs CRUD
  getAuditLogs(): Promise<AuditLog[]>;
  saveAuditLog(log: AuditLog): Promise<void>;

  // Sync outbox queue methods
  getPendingOperations(): Promise<PendingOperation[]>;
  enqueueOperation(op: PendingOperation): Promise<void>;
  dequeueOperations(ids: string[]): Promise<void>;
  incrementOperationAttempts(ids: string[]): Promise<void>;

  // Sync Metadata key/value cache
  getMetadata(key: string): Promise<string | null>;
  saveMetadata(key: string, value: string): Promise<void>;
}
