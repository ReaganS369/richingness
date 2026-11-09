import { create } from 'zustand';
import { 
  buildCategoryTree, 
  aggregateCategoryTree, 
  recommendRecovery,
  BudgetCategory,
  CategoryNode,
  RecoverySource
} from '@repo/module-budget';

import { 
  computeAccountBalances, 
  calculateNetWorth, 
  createTransferOperations,
  Account,
  LedgerOperation,
  AccountBalance
} from '@repo/module-finance';

import { 
  calculateGoalProgress, 
  SavingGoal, 
  GoalProgressSummary 
} from '@repo/module-goals';

import { 
  generateSpendingSummary, 
  generateBudgetHealthSummary, 
  SpendingSummary,
  BudgetHealthSummary 
} from '@repo/module-reports';

import { 
  SyncEngine, 
  BackgroundSyncWorker, 
  SupabaseSyncAdapter 
} from '@repo/sync';

import { WebRepository } from '@repo/storage-web';
import { IRepository } from '@repo/database';

export type TabId = 'dashboard' | 'accounts' | 'budget' | 'transactions' | 'goals' | 'reports' | 'settings';
export type SyncStatusType = 'offline' | 'connecting' | 'pulling' | 'pushing' | 'synced' | 'failed' | 'conflict' | 'syncing' | 'pending';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  isGuest?: boolean;
}

interface AppState {
  // Auth
  session: UserSession | null;
  // Sync Status
  syncStatus: SyncStatusType;
  // Navigation
  activeTab: TabId;
  // Ledger Databases
  accounts: Account[];
  categories: BudgetCategory[];
  ledger: LedgerOperation[];
  goals: SavingGoal[];
  
  // Storage & Sync Controllers
  initializeStore: (userId: string) => Promise<void>;
  triggerSyncPass: () => Promise<void>;

  // Auth Initialization
  initAuth: () => void;
  updateProfile: (name: string, email?: string) => Promise<void>;
  resetDatabaseToDefaults: () => Promise<void>;
  exportAllData: () => Promise<string>;
  importAllData: (jsonData: string) => Promise<{ success: boolean; count: number; error?: string }>;

  // Actions
  logout: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  setSyncStatus: (status: SyncStatusType) => void;
  
  // Accounts Actions
  addAccount: (name: string, type: Account['type'], currency: string) => Promise<void>;
  // Transactions Actions
  addTransaction: (
    accountId: string,
    type: LedgerOperation['type'],
    amount: bigint,
    currency: string,
    categoryOrTargetId: string,
    merchantName?: string,
    toAccountId?: string | null,
    purpose?: string
  ) => Promise<void>;
  
  // Budget Actions
  updateAllocation: (categoryId: string, amount: bigint) => Promise<void>;
  triggerRecovery: (targetCategoryId: string, deficitAmount: bigint) => Promise<void>;

  // Goals Actions
  addGoal: (
    name: string,
    targetAmount: bigint,
    monthlyContribution: bigint,
    targetDate?: Date | null,
    linkedCategoryId?: string | null
  ) => Promise<void>;
  
  // Computed Selectors (Derived logic without UI calculations)
  getBalances: () => Map<string, AccountBalance>;
  getNetWorth: () => bigint;
  getBudgetTree: () => CategoryNode[];
  getGoalsProgress: () => (SavingGoal & { progress: GoalProgressSummary })[];
  getSpendingSummary: () => SpendingSummary;
  getBudgetHealth: () => BudgetHealthSummary;
}

// Initial Seed Data (Standard values loaded if IndexedDB is uninitialized)

import { AuthService } from '@repo/identity';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const supabaseAnonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : undefined;

export const authService = new AuthService(supabase);

export const DEFAULT_GUEST_SESSION: UserSession = {
  id: 'guest',
  email: '',
  name: '',
  avatar_url: '',
  isGuest: true
};

export const getUserKey = (session: UserSession | null): string => {
  if (!session || session.isGuest || !session.email) return 'richingness_guest_user';
  return session.email;
};

let globalRepository: IRepository | null = null;
let activeSyncEngine: SyncEngine | null = null;
let activeSyncWorker: BackgroundSyncWorker | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  session: DEFAULT_GUEST_SESSION,
  syncStatus: 'offline',
  activeTab: 'dashboard',
  accounts: [],
  categories: [],
  ledger: [],
  goals: [],

  initializeStore: async (userId: string) => {
    if (typeof window === 'undefined') return;

    // 1. Initialize IndexedDB WebRepository
    const repo = new WebRepository();
    const scopedRepo = repo.forUser(userId);

    // 2. Initialize sync components
    const supabaseAdapter = new SupabaseSyncAdapter(supabase);
    const syncEng = new SyncEngine(scopedRepo, supabaseAdapter, 'web-client-device');
    const worker = new BackgroundSyncWorker(syncEng, 15000);

    globalRepository = repo;
    activeSyncEngine = syncEng;
    activeSyncWorker = worker;

    // 3. Register change observers on repository tables
    repo.subscribe(
      ['accounts', 'categories', 'ledger', 'goals'],
      async () => {
        const accounts = await scopedRepo.getAccounts();
        const categories = await scopedRepo.getCategories();
        const ledger = await scopedRepo.getLedger();
        const goals = await scopedRepo.getGoals();

        set({ accounts, categories, ledger, goals });
      }
    );

    // Observe sync engine state changes
    syncEng.onStatusChange((event) => {
      set({ syncStatus: event.state as SyncStatusType });
    });

    // 4. Load initial database records
    let accounts = await scopedRepo.getAccounts();
    let categories = await scopedRepo.getCategories();
    let ledger = await scopedRepo.getLedger();
    let goals = await scopedRepo.getGoals();

    // Clean up any legacy starter demo seed records if present
    const isLegacyDemo = accounts.some(a => a.id === 'acct-hdfc' && a.name.includes('HDFC Salary'));
    if (isLegacyDemo) {
      const rawRepo = scopedRepo as unknown as {
        saveAccount: (record: unknown) => Promise<void>;
        saveCategory: (record: unknown) => Promise<void>;
        saveTransaction: (record: unknown) => Promise<void>;
        saveGoal: (record: unknown) => Promise<void>;
      };
      for (const a of accounts) await rawRepo.saveAccount({ ...a, deletedAt: new Date() });
      for (const c of categories) await rawRepo.saveCategory({ ...c, deletedAt: new Date() });
      for (const l of ledger) await rawRepo.saveTransaction({ ...l, deletedAt: new Date() });
      for (const g of goals) await rawRepo.saveGoal({ ...g, deletedAt: new Date() });
      accounts = [];
      categories = [];
      ledger = [];
      goals = [];
    }

    set({ accounts, categories, ledger, goals });

    // 5. Start background sync service only if authenticated
    if (supabase && userId !== 'richingness_guest_user') {
      const schemaCheck = await supabaseAdapter.verifySchema();
      if (schemaCheck.valid) {
        worker.start();
      } else {
        set({ syncStatus: 'offline' });
      }
    } else {
      set({ syncStatus: 'offline' });
    }
  },

  triggerSyncPass: async () => {
    if (activeSyncWorker) {
      await activeSyncWorker.triggerSync();
    }
  },

  initAuth: () => {
    // Force Guest mode for mobile-first testing
    const currentUser = DEFAULT_GUEST_SESSION;
    set({ session: currentUser });
    get().initializeStore(getUserKey(currentUser));
  },

  updateProfile: async (name: string, email?: string) => {
    const current = get().session;
    const updated: UserSession = {
      id: current?.id && current.id !== 'guest' ? current.id : 'usr-active-user',
      name,
      email: email || current?.email || '',
      avatar_url: current?.avatar_url || '',
      isGuest: false
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_session', JSON.stringify(updated));
    }
    set({ session: updated });
  },

  resetDatabaseToDefaults: async () => {
    const session = get().session;
    if (!globalRepository) return;
    const userKey = getUserKey(session);
    const scopedRepo = globalRepository.forUser(userKey);
    
    // Clear existing via soft-delete
    const rawRepo = scopedRepo as unknown as {
      saveAccount: (record: unknown) => Promise<void>;
      saveCategory: (record: unknown) => Promise<void>;
      saveTransaction: (record: unknown) => Promise<void>;
      saveGoal: (record: unknown) => Promise<void>;
    };
    const curAccounts = await scopedRepo.getAccounts();
    for (const a of curAccounts) await rawRepo.saveAccount({ ...a, deletedAt: new Date() });
    const curCats = await scopedRepo.getCategories();
    for (const c of curCats) await rawRepo.saveCategory({ ...c, deletedAt: new Date() });
    const curTxs = await scopedRepo.getLedger();
    for (const t of curTxs) await rawRepo.saveTransaction({ ...t, deletedAt: new Date() });
    const curGoals = await scopedRepo.getGoals();
    for (const g of curGoals) await rawRepo.saveGoal({ ...g, deletedAt: new Date() });

    // Re-initialize with pristine seed
    await get().initializeStore(userKey);
  },

  exportAllData: async () => {
    const session = get().session;
    if (!globalRepository) return '{}';
    const userKey = getUserKey(session);
    const scopedRepo = globalRepository.forUser(userKey);

    const accounts = await scopedRepo.getAccounts();
    const categories = await scopedRepo.getCategories();
    const ledger = await scopedRepo.getLedger();
    const goals = await scopedRepo.getGoals();

    const payload = {
      app: 'Richingness',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userKey,
      data: {
        accounts,
        categories,
        ledger,
        goals
      }
    };

    return JSON.stringify(payload, (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);
  },

  importAllData: async (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;
      const session = get().session;
      if (!globalRepository) return { success: false, count: 0, error: 'Repository not ready' };
      const userKey = getUserKey(session);
      const scopedRepo = globalRepository.forUser(userKey);

      let count = 0;

      if (Array.isArray(data.accounts)) {
        for (const a of data.accounts) {
          if (a.id && a.name) {
            await scopedRepo.saveAccount({
              id: a.id,
              name: a.name,
              type: a.type || 'checking',
              currency: a.currency || 'INR'
            });
            count++;
          }
        }
      }

      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          if (c.id && c.name) {
            await scopedRepo.saveCategory({
              id: c.id,
              name: c.name,
              parentId: c.parentId || null,
              rolloverMode: c.rolloverMode || 'none',
              budgetAmount: BigInt(c.budgetAmount || 0),
              priority: c.priority || 1,
              isIncome: !!c.isIncome,
              isHidden: !!c.isHidden,
              sortOrder: c.sortOrder || 1
            });
            count++;
          }
        }
      }

      if (Array.isArray(data.ledger)) {
        for (const l of data.ledger) {
          if (l.id && l.accountId) {
            await scopedRepo.saveTransaction({
              id: l.id,
              accountId: l.accountId,
              type: l.type,
              amount: BigInt(l.amount || 0),
              currency: l.currency || 'INR',
              exchangeRate: Number(l.exchangeRate || 1.0),
              date: new Date(l.date || Date.now()),
              referenceId: l.referenceId || null
            });
            count++;
          }
        }
      }

      if (Array.isArray(data.goals)) {
        for (const g of data.goals) {
          if (g.id && g.name) {
            await scopedRepo.saveGoal({
              id: g.id,
              name: g.name,
              targetAmount: BigInt(g.targetAmount || 0),
              currentAmount: BigInt(g.currentAmount || 0),
              monthlyContribution: BigInt(g.monthlyContribution || 0),
              targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
              linkedCategoryId: g.linkedCategoryId || undefined
            });
            count++;
          }
        }
      }

      // Re-load the store tables
      await get().initializeStore(userKey);
      return { success: true, count };
    } catch (err: unknown) {
      return { success: false, count: 0, error: err instanceof Error ? err.message : 'Invalid backup format' };
    }
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('richingness_demo_session');
    }
    if (activeSyncWorker) {
      activeSyncWorker.stop();
    }
    await authService.signOut().catch(() => {});
    set({ session: DEFAULT_GUEST_SESSION, syncStatus: 'offline' });
    await get().initializeStore('richingness_guest_user');
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  addAccount: async (name, type, currency) => {
    const session = get().session;
    if (!globalRepository || !session) return;
    const scopedRepo = globalRepository.forUser(getUserKey(session));

    const newAcct: Account = {
      id: `acc-${Date.now()}`,
      name,
      type,
      currency
    };

    await scopedRepo.saveAccount(newAcct);

    if (activeSyncEngine) {
      await activeSyncEngine.enqueueOperation('accounts', 'insert', newAcct as unknown as Record<string, unknown>);
    }
  },

  addTransaction: async (accountId, type, amount, currency, categoryOrTargetId, _merchantName = 'Merchant', toAccountId = null, _purpose) => {
    const session = get().session;
    if (!globalRepository || !session) return;
    const scopedRepo = globalRepository.forUser(getUserKey(session));
    const id = `op-${Date.now()}`;
    const date = new Date();

    if (type === 'TRANSFER_OUT' && toAccountId) {
      const transferOps = createTransferOperations(
        id,
        accountId,
        toAccountId,
        amount,
        currency,
        1.0,
        date
      );

      await scopedRepo.runInTransaction(async (txn) => {
        for (const op of transferOps) {
          await txn.saveTransaction(op);
          if (activeSyncEngine) {
            await activeSyncEngine.enqueueOperation('ledger', 'insert', op as unknown as Record<string, unknown>);
          }
        }
      });
      return;
    }

    const newOp: LedgerOperation = {
      id,
      accountId,
      type,
      amount,
      currency,
      exchangeRate: 1.0,
      date,
      referenceId: categoryOrTargetId,
      toAccountId
    };

    await scopedRepo.runInTransaction(async (txn) => {
      await txn.saveTransaction(newOp);
      if (activeSyncEngine) {
        await activeSyncEngine.enqueueOperation('ledger', 'insert', newOp as unknown as Record<string, unknown>);
      }

      // If it is a contribution to a Saving Goal, update the Goal balance atomically
      if (categoryOrTargetId.startsWith('goal-') && type === 'EXPENSE') {
        const goal = get().goals.find(g => g.id === categoryOrTargetId);
        if (goal) {
          const updatedGoal = { ...goal, currentAmount: goal.currentAmount + amount };
          await txn.saveGoal(updatedGoal);
          if (activeSyncEngine) {
            await activeSyncEngine.enqueueOperation('goals', 'update', updatedGoal as unknown as Record<string, unknown>);
          }
        }
      }
    });
  },

  updateAllocation: async (categoryId, amount) => {
    const session = get().session;
    if (!globalRepository || !session) return;
    const scopedRepo = globalRepository.forUser(getUserKey(session));

    const cat = get().categories.find(c => c.id === categoryId);
    if (!cat) return;

    const updated = { ...cat, budgetAmount: amount };
    await scopedRepo.saveCategory(updated);

    if (activeSyncEngine) {
      await activeSyncEngine.enqueueOperation('categories', 'update', updated as unknown as Record<string, unknown>);
    }
  },

  triggerRecovery: async (targetCategoryId, deficitAmount) => {
    const session = get().session;
    if (!globalRepository || !session) return;
    const scopedRepo = globalRepository.forUser(getUserKey(session));

    const tree = get().getBudgetTree();
    const sources: RecoverySource[] = [];

    const collectSources = (nodes: CategoryNode[]) => {
      for (const n of nodes) {
        if (n.id !== targetCategoryId && n.totalAvailableAmount > 0n) {
          sources.push({
            categoryId: n.id,
            name: n.name,
            availableBalance: n.totalAvailableAmount,
            priority: n.priority
          });
        }
        if (n.children.length > 0) {
          collectSources(n.children);
        }
      }
    };
    collectSources(tree);

    const moves = recommendRecovery(targetCategoryId, deficitAmount, sources);
    const recoveryOps: LedgerOperation[] = [];
    const timestamp = Date.now();

    for (const move of moves) {
      // Debit source category
      recoveryOps.push({
        id: `op-rec-debit-${timestamp}-${move.fromCategoryId}`,
        accountId: 'acc-hdfc',
        type: 'ADJUSTMENT',
        amount: -move.amount,
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date(),
        referenceId: move.fromCategoryId
      });

      // Credit target category
      recoveryOps.push({
        id: `op-rec-credit-${timestamp}-${move.fromCategoryId}`,
        accountId: 'acc-hdfc',
        type: 'ADJUSTMENT',
        amount: move.amount,
        currency: 'INR',
        exchangeRate: 1.0,
        date: new Date(),
        referenceId: targetCategoryId
      });
    }

    await scopedRepo.runInTransaction(async (txn) => {
      for (const op of recoveryOps) {
        await txn.saveTransaction(op);
        if (activeSyncEngine) {
          await activeSyncEngine.enqueueOperation('ledger', 'insert', op as unknown as Record<string, unknown>);
        }
      }
    });
  },

  addGoal: async (name, targetAmount, monthlyContribution, targetDate, linkedCategoryId) => {
    const session = get().session;
    if (!globalRepository || !session) return;
    const scopedRepo = globalRepository.forUser(getUserKey(session));

    const newGoal: SavingGoal = {
      id: `goal-${Date.now()}`,
      name,
      targetAmount,
      currentAmount: 0n,
      monthlyContribution,
      targetDate: targetDate || undefined,
      linkedCategoryId: linkedCategoryId || undefined
    };

    await scopedRepo.saveGoal(newGoal);

    if (activeSyncEngine) {
      await activeSyncEngine.enqueueOperation('goals', 'insert', newGoal as unknown as Record<string, unknown>);
    }
  },

  getBalances: () => {
    const state = get();
    return computeAccountBalances(state.accounts, state.ledger);
  },

  getNetWorth: () => {
    const state = get();
    const bals = state.getBalances();
    const rates = { INR: 1.0, USD: 83.5 };
    const summary = calculateNetWorth(state.accounts, bals, rates);
    return summary.netWorth;
  },

  getBudgetTree: () => {
    const state = get();
    
    const getSpentAmount = (catId: string): bigint => {
      return state.ledger
        .filter(op => op.referenceId === catId && op.type === 'EXPENSE')
        .reduce((sum, op) => sum + op.amount, 0n);
    };

    const getAssignedAmount = (catId: string): bigint => {
      const cat = state.categories.find(c => c.id === catId);
      const base = cat ? cat.budgetAmount : 0n;
      const adjustments = state.ledger
        .filter(op => op.referenceId === catId && op.type === 'ADJUSTMENT')
        .reduce((sum, op) => sum + op.amount, 0n);
      return base + adjustments;
    };

    const tree = buildCategoryTree(state.categories);
    aggregateCategoryTree(tree, getSpentAmount, getAssignedAmount);
    return tree;
  },

  getGoalsProgress: () => {
    const state = get();
    return state.goals.map(g => {
      const progress = calculateGoalProgress(g, new Date());
      return {
        ...g,
        progress
      };
    });
  },

  getSpendingSummary: () => {
    const state = get();
    const mappedTxs = state.ledger
      .filter(op => op.type === 'EXPENSE')
      .map(op => {
        const cat = state.categories.find(c => c.id === op.referenceId);
        return {
          categoryId: op.referenceId || 'misc',
          categoryName: cat ? cat.name : 'Uncategorized',
          merchantName: 'Merchant',
          amountInBase: op.amount
        };
      });
    return generateSpendingSummary(mappedTxs);
  },

  getBudgetHealth: () => {
    const state = get();
    const tree = state.getBudgetTree();

    let totalBudgeted = 0n;
    let totalSpent = 0n;

    const sumNodes = (nodes: CategoryNode[]) => {
      for (const n of nodes) {
        if (n.parentId === undefined) { 
          totalBudgeted += n.totalBudgetAmount;
          totalSpent += n.totalSpentAmount;
        }
      }
    };
    sumNodes(tree);

    return generateBudgetHealthSummary(totalBudgeted, totalSpent);
  }
}));
