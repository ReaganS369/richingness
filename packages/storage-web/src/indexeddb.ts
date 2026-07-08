import Dexie, { Table } from 'dexie';
import { Account, LedgerOperation } from '@repo/module-finance';
import { BudgetCategory } from '@repo/module-budget';
import { SavingGoal } from '@repo/module-goals';
import { PendingOperation } from '@repo/sync';
import { 
  IRepository, 
  IScopedRepository, 
  Device, 
  UserPreferences, 
  AuditLog 
} from '@repo/database';

class RichingnessDexie extends Dexie {
  accounts!: Table<Account & { userId: string }, string>;
  categories!: Table<BudgetCategory & { userId: string }, string>;
  ledger!: Table<LedgerOperation & { userId: string }, string>;
  goals!: Table<SavingGoal & { userId: string }, string>;
  devices!: Table<Device, string>;
  userPreferences!: Table<UserPreferences, string>;
  auditLogs!: Table<AuditLog, string>;
  syncOutbox!: Table<PendingOperation & { userId: string }, string>;
  syncMetadata!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('RichingnessDB');
    this.version(1).stores({
      accounts: 'id, userId, deletedAt',
      categories: 'id, userId, parentId, deletedAt',
      ledger: 'id, userId, accountId, referenceId, deletedAt',
      goals: 'id, userId, categoryId, deletedAt',
      devices: 'deviceId, userId',
      userPreferences: 'userId',
      auditLogs: 'id, userId, timestamp',
      syncOutbox: 'id, userId, table',
      syncMetadata: 'key'
    });
  }
}

type Listener = () => void;

export class WebRepository implements IRepository {
  private db: RichingnessDexie;
  private listeners: Map<string, Set<Listener>> = new Map();

  constructor() {
    this.db = new RichingnessDexie();
  }

  public forUser(userId: string): IScopedRepository {
    return new WebScopedRepository(this.db, userId, this.notify.bind(this));
  }

  public subscribe(
    tables: Array<'accounts' | 'categories' | 'ledger' | 'goals' | 'devices' | 'user_preferences' | 'audit_log'>,
    callback: () => void
  ): () => void {
    for (const t of tables) {
      if (!this.listeners.has(t)) {
        this.listeners.set(t, new Set());
      }
      this.listeners.get(t)!.add(callback);
    }
    return () => {
      for (const t of tables) {
        this.listeners.get(t)?.delete(callback);
      }
    };
  }

  private notify(tables: string[]) {
    const notified = new Set<Listener>();
    for (const t of tables) {
      const list = this.listeners.get(t);
      if (list) {
        for (const cb of list) {
          notified.add(cb);
        }
      }
    }
    for (const cb of notified) {
      cb();
    }
  }
}

class WebScopedRepository implements IScopedRepository {
  private db: RichingnessDexie;
  private userId: string;
  private notify: (tables: string[]) => void;

  constructor(db: RichingnessDexie, userId: string, notify: (tables: string[]) => void) {
    this.db = db;
    this.userId = userId;
    this.notify = notify;
  }

  public async runInTransaction<T>(callback: (txn: IScopedRepository) => Promise<T>): Promise<T> {
    const allTables = [
      this.db.accounts,
      this.db.categories,
      this.db.ledger,
      this.db.goals,
      this.db.devices,
      this.db.userPreferences,
      this.db.auditLogs,
      this.db.syncOutbox,
      this.db.syncMetadata
    ];
    return this.db.transaction('rw', allTables, async () => {
      return callback(this);
    });
  }

  public async getAccounts(): Promise<Account[]> {
    return this.db.accounts
      .where('userId')
      .equals(this.userId)
      .filter((a: any) => !a.deletedAt)
      .toArray();
  }

  public async saveAccount(account: Account): Promise<void> {
    const record = { ...account, userId: this.userId };
    await this.db.accounts.put(record);
    this.notify(['accounts']);
  }

  public async getCategories(): Promise<BudgetCategory[]> {
    return this.db.categories
      .where('userId')
      .equals(this.userId)
      .filter((c: any) => !c.deletedAt)
      .toArray();
  }

  public async saveCategory(category: BudgetCategory): Promise<void> {
    const record = { ...category, userId: this.userId };
    await this.db.categories.put(record);
    this.notify(['categories']);
  }

  public async getLedger(): Promise<LedgerOperation[]> {
    return this.db.ledger
      .where('userId')
      .equals(this.userId)
      .filter((l: any) => !l.deletedAt)
      .toArray();
  }

  public async saveTransaction(op: LedgerOperation): Promise<void> {
    const record = { ...op, userId: this.userId };
    await this.db.ledger.put(record);
    this.notify(['ledger']);
  }

  public async getGoals(): Promise<SavingGoal[]> {
    return this.db.goals
      .where('userId')
      .equals(this.userId)
      .filter((g: any) => !g.deletedAt)
      .toArray();
  }

  public async saveGoal(goal: SavingGoal): Promise<void> {
    const record = { ...goal, userId: this.userId };
    await this.db.goals.put(record);
    this.notify(['goals']);
  }

  public async getPreferences(): Promise<UserPreferences | null> {
    const record = await this.db.userPreferences.get(this.userId);
    return record || null;
  }

  public async savePreferences(prefs: UserPreferences): Promise<void> {
    const record = { ...prefs, userId: this.userId };
    await this.db.userPreferences.put(record);
    this.notify(['user_preferences']);
  }

  public async getDevices(): Promise<Device[]> {
    return this.db.devices
      .where('userId')
      .equals(this.userId)
      .toArray();
  }

  public async saveDevice(device: Device): Promise<void> {
    const record = { ...device, userId: this.userId };
    await this.db.devices.put(record);
    this.notify(['devices']);
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.db.auditLogs
      .where('userId')
      .equals(this.userId)
      .toArray();
  }

  public async saveAuditLog(log: AuditLog): Promise<void> {
    const record = { ...log, userId: this.userId };
    await this.db.auditLogs.put(record);
    this.notify(['audit_log']);
  }

  public async getPendingOperations(): Promise<PendingOperation[]> {
    return this.db.syncOutbox
      .where('userId')
      .equals(this.userId)
      .toArray();
  }

  public async enqueueOperation(op: PendingOperation): Promise<void> {
    const record = { ...op, userId: this.userId };
    await this.db.syncOutbox.put(record);
    this.notify(['sync_outbox']);
  }

  public async dequeueOperations(ids: string[]): Promise<void> {
    await this.db.syncOutbox.bulkDelete(ids);
    this.notify(['sync_outbox']);
  }

  public async incrementOperationAttempts(ids: string[]): Promise<void> {
    await this.db.transaction('rw', this.db.syncOutbox, async () => {
      for (const id of ids) {
        const op = await this.db.syncOutbox.get(id);
        if (op) {
          op.attempts++;
          await this.db.syncOutbox.put(op);
        }
      }
    });
    this.notify(['sync_outbox']);
  }

  public async getMetadata(key: string): Promise<string | null> {
    const scopedKey = `${this.userId}::${key}`;
    const record = await this.db.syncMetadata.get(scopedKey);
    return record ? record.value : null;
  }

  public async saveMetadata(key: string, value: string): Promise<void> {
    const scopedKey = `${this.userId}::${key}`;
    await this.db.syncMetadata.put({ key: scopedKey, value });
  }
}
