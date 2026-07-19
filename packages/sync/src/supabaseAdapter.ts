import { SupabaseClient } from '@supabase/supabase-js';
import { ISyncAdapter, SyncPullResponse } from './interfaces.js';
import { PendingOperation } from './outbox.js';
import { 
  Account, 
  LedgerOperation, 
  BudgetCategory, 
  SavingGoal, 
  Device, 
  UserPreferences, 
  AuditLog 
} from '@repo/database';

export class SupabaseSyncAdapter implements ISyncAdapter {
  private supabase: SupabaseClient | null = null;

  constructor(supabaseClient?: SupabaseClient) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else {
      console.warn('Supabase connection parameters missing. Sync adapter running in local demo mode.');
    }
  }

  public async verifySchema(): Promise<{ valid: boolean, missingTables: string[] }> {
    if (!this.supabase) {
      return { valid: false, missingTables: [] }; // In offline demo mode, just ignore
    }

    try {
      const { data, error } = await this.supabase.rpc('verify_schema');
      if (error) {
        console.error('Failed to run schema verification. Is the migration deployed?', error.message);
        return { valid: false, missingTables: ['migration_not_applied'] };
      }

      const res = data as { valid: boolean, missing_tables: string[] };
      return {
        valid: res.valid,
        missingTables: res.missing_tables || []
      };
    } catch (err: any) {
      console.error('Error executing verify_schema:', err);
      return { valid: false, missingTables: ['unknown_error'] };
    }
  }

  // --- Pusher Outbox mappings ---
  public async pushOperations(operations: PendingOperation[]): Promise<string[]> {
    if (!this.supabase) {
      // Mock success for development offline preview
      return operations.map(o => o.id);
    }

    const successIds: string[] = [];

    for (const op of operations) {
      try {
        const remoteTable = this.getRemoteTableName(op.table);
        const mappedPayload = this.toRemotePayload(op.table, op.payload);

        const { error } = await this.supabase
          .from(remoteTable)
          .upsert(mappedPayload);

        if (error) {
          console.error(`Failed to push outbox operation ${op.id} to table ${remoteTable}:`, error);
        } else {
          successIds.push(op.id);
        }
      } catch (err) {
        console.error(`Error processing sync outbox operations:`, err);
      }
    }

    return successIds;
  }

  // --- Puller remote entries mappings ---
  public async pullChanges(lastSyncedAt: Date | null): Promise<SyncPullResponse> {
    const emptyResponse: SyncPullResponse = {
      accounts: [],
      categories: [],
      ledger: [],
      goals: [],
      devices: [],
      userPreferences: [],
      auditLogs: []
    };

    if (!this.supabase) {
      return emptyResponse;
    }

    try {
      const accounts = await this.pullTable('accounts', lastSyncedAt, this.toLocalAccount.bind(this));
      const categories = await this.pullTable('budget_categories', lastSyncedAt, this.toLocalCategory.bind(this));
      const ledger = await this.pullTable('ledger_operations', lastSyncedAt, this.toLocalTransaction.bind(this));
      const goals = await this.pullTable('saving_goals', lastSyncedAt, this.toLocalGoal.bind(this));
      const devices = await this.pullTable('devices', lastSyncedAt, this.toLocalDevice.bind(this));
      const userPreferences = await this.pullTable('user_preferences', lastSyncedAt, this.toLocalPreferences.bind(this));
      const auditLogs = await this.pullTable('audit_logs', lastSyncedAt, this.toLocalAuditLog.bind(this));

      return {
        accounts,
        categories,
        ledger,
        goals,
        devices,
        userPreferences,
        auditLogs
      };
    } catch (err) {
      console.error('Error pulling Supabase database schema updates:', err);
      return emptyResponse;
    }
  }

  private async pullTable<T>(
    tableName: string, 
    lastSyncedAt: Date | null, 
    mapper: (row: any) => T
  ): Promise<T[]> {
    if (!this.supabase) return [];

    let query = this.supabase.from(tableName).select('*');
    if (lastSyncedAt) {
      query = query.gt('updated_at', lastSyncedAt.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to query table ${tableName}: ${error.message}`);
    }

    return (data || []).map(mapper);
  }

  // --- Helper Table Mappings ---
  private getRemoteTableName(localTable: string): string {
    switch (localTable) {
      case 'accounts': return 'accounts';
      case 'categories': return 'budget_categories';
      case 'ledger': return 'ledger_operations';
      case 'goals': return 'saving_goals';
      case 'devices': return 'devices';
      case 'user_preferences': return 'user_preferences';
      case 'audit_log': return 'audit_logs';
      default: throw new Error(`Unknown local table mapping: ${localTable}`);
    }
  }

  // --- Model payload adapters (Local to Supabase Postgres schema) ---
  private toRemotePayload(table: string, payload: Record<string, any>): Record<string, any> {
    const base = {
      hlc_timestamp: payload.hlcTimestamp,
      updated_at: payload.updatedAt,
      deleted_at: payload.deletedAt || null
    };

    switch (table) {
      case 'accounts':
        return {
          ...base,
          id: payload.id,
          user_id: payload.userId,
          name: payload.name,
          type: payload.type,
          currency_code: payload.currency
        };
      case 'categories':
        return {
          ...base,
          id: payload.id,
          user_id: payload.userId,
          parent_id: payload.parentId || null,
          name: payload.name,
          rollover_mode: payload.rolloverMode,
          budget_amount: payload.budgetAmount?.toString(), // bigint to string representation
          priority: payload.priority,
          is_income: payload.isIncome,
          is_hidden: payload.isHidden,
          sort_order: payload.sortOrder
        };
      case 'ledger':
        return {
          ...base,
          id: payload.id,
          user_id: payload.userId,
          account_id: payload.accountId,
          to_account_id: payload.toAccountId || null,
          type: payload.type,
          amount: payload.amount?.toString(),
          currency_code: payload.currency,
          exchange_rate: payload.exchangeRate,
          date: payload.date,
          reference_id: payload.referenceId || null
        };
      case 'goals':
        return {
          ...base,
          id: payload.id,
          user_id: payload.userId,
          name: payload.name,
          target_amount: payload.targetAmount?.toString(),
          current_amount: payload.currentAmount?.toString(),
          monthly_contribution: payload.monthlyContribution?.toString(),
          target_date: payload.targetDate || null,
          category_id: payload.linkedCategoryId || null
        };
      case 'devices':
        return {
          ...base,
          device_id: payload.deviceId,
          user_id: payload.userId,
          platform: payload.platform,
          platform_version: payload.platformVersion,
          device_name: payload.deviceName,
          app_version: payload.appVersion,
          last_seen: payload.lastSeen,
          sync_version: payload.syncVersion,
          created_at: payload.createdAt
        };
      case 'user_preferences':
        return {
          ...base,
          user_id: payload.userId,
          theme: payload.theme,
          language: payload.language,
          currency_code: payload.currency,
          number_format: payload.numberFormat,
          notification_preferences: payload.notificationPreferences,
          layout_preferences: payload.layoutPreferences
        };
      case 'audit_log':
        return {
          ...base,
          id: payload.id,
          user_id: payload.userId,
          action: payload.action,
          entity_type: payload.entityType,
          entity_id: payload.entityId,
          changes: payload.changes,
          timestamp: payload.timestamp,
          device_id: payload.deviceId
        };
      default:
        return payload;
    }
  }

  // --- Models payload adapters (Supabase Postgres schema to Local) ---
  private toLocalAccount(row: any): Account & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null } {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      currency: row.currency_code,
      hlcTimestamp: row.hlc_timestamp,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private toLocalCategory(row: any): BudgetCategory & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null } {
    return {
      id: row.id,
      userId: row.user_id,
      parentId: row.parent_id || undefined,
      name: row.name,
      rolloverMode: row.rollover_mode,
      budgetAmount: BigInt(row.budget_amount || 0),
      priority: row.priority,
      isIncome: !!row.is_income,
      isHidden: !!row.is_hidden,
      sortOrder: row.sort_order || 0,
      hlcTimestamp: row.hlc_timestamp,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private toLocalTransaction(row: any): LedgerOperation & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null } {
    return {
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      toAccountId: row.to_account_id || undefined,
      type: row.type,
      amount: BigInt(row.amount || 0),
      currency: row.currency_code,
      exchangeRate: parseFloat(row.exchange_rate || '1.0'),
      date: new Date(row.date),
      referenceId: row.reference_id || undefined,
      hlcTimestamp: row.hlc_timestamp,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private toLocalGoal(row: any): SavingGoal & { userId: string; hlcTimestamp: string; updatedAt: string; deletedAt?: string | null } {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      targetAmount: BigInt(row.target_amount || 0),
      currentAmount: BigInt(row.current_amount || 0),
      monthlyContribution: BigInt(row.monthly_contribution || 0),
      targetDate: row.target_date ? new Date(row.target_date) : undefined,
      linkedCategoryId: row.category_id || undefined,
      hlcTimestamp: row.hlc_timestamp,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private toLocalDevice(row: any): Device & { hlcTimestamp: string } {
    return {
      deviceId: row.device_id,
      userId: row.user_id,
      platform: row.platform,
      platformVersion: row.platform_version,
      deviceName: row.device_name,
      appVersion: row.app_version,
      lastSeen: new Date(row.last_seen),
      syncVersion: row.sync_version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      hlcTimestamp: row.hlc_timestamp
    };
  }

  private toLocalPreferences(row: any): UserPreferences & { hlcTimestamp: string } {
    return {
      userId: row.user_id,
      theme: row.theme,
      language: row.language,
      currency: row.currency_code,
      numberFormat: row.number_format,
      notificationPreferences: row.notification_preferences,
      layoutPreferences: row.layout_preferences,
      updatedAt: new Date(row.updated_at),
      hlcTimestamp: row.hlc_timestamp
    };
  }

  private toLocalAuditLog(row: any): AuditLog & { hlcTimestamp: string } {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      changes: row.changes,
      timestamp: new Date(row.timestamp),
      deviceId: row.device_id,
      hlcTimestamp: row.hlc_timestamp
    };
  }
}
