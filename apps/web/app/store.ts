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

interface UserSession {
  email: string;
  name: string;
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

  // Actions
  login: (email: string, name: string) => void;
  logout: () => void;
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
const initialAccounts: Account[] = [
  { id: 'acc-hdfc', name: 'HDFC Bank Checking', type: 'checking', currency: 'INR' },
  { id: 'acc-icici', name: 'ICICI Credit Card', type: 'credit', currency: 'INR' },
  { id: 'acc-cash', name: 'Physical Cash Wallet', type: 'cash', currency: 'INR' }
];

const initialCategories: BudgetCategory[] = [
  { id: 'cat-needs', parentId: null, name: 'Needs', rolloverMode: 'carry', budgetAmount: 80000n, priority: 5, isIncome: false, isHidden: false, sortOrder: 1 },
  { id: 'cat-food', parentId: 'cat-needs', name: 'Groceries & Dining', rolloverMode: 'carry', budgetAmount: 20000n, priority: 4, isIncome: false, isHidden: false, sortOrder: 1 },
  { id: 'cat-rent', parentId: 'cat-needs', name: 'House Rent', rolloverMode: 'recover', budgetAmount: 40000n, priority: 5, isIncome: false, isHidden: false, sortOrder: 2 },
  
  { id: 'cat-wants', parentId: null, name: 'Wants', rolloverMode: 'none', budgetAmount: 30000n, priority: 3, isIncome: false, isHidden: false, sortOrder: 2 },
  { id: 'cat-entertainment', parentId: 'cat-wants', name: 'Streaming & Games', rolloverMode: 'none', budgetAmount: 10000n, priority: 2, isIncome: false, isHidden: false, sortOrder: 1 },
  { id: 'cat-clothing', parentId: 'cat-wants', name: 'Apparel & Shopping', rolloverMode: 'none', budgetAmount: 15000n, priority: 3, isIncome: false, isHidden: false, sortOrder: 2 }
];

const initialLedger: LedgerOperation[] = [
  { id: 'op-init-checking', accountId: 'acc-hdfc', type: 'INCOME', amount: 15000000n, currency: 'INR', exchangeRate: 1.0, date: new Date() }, 
  { id: 'op-init-rent', accountId: 'acc-hdfc', type: 'EXPENSE', amount: 4000000n, currency: 'INR', exchangeRate: 1.0, date: new Date(), referenceId: 'cat-rent' }, 
  { id: 'op-init-food', accountId: 'acc-hdfc', type: 'EXPENSE', amount: 850000n, currency: 'INR', exchangeRate: 1.0, date: new Date(), referenceId: 'cat-food' }
];

const initialGoals: SavingGoal[] = [
  { id: 'goal-macbook', name: 'M4 MacBook Pro', targetAmount: 20000000n, currentAmount: 5000000n, monthlyContribution: 1500000n, targetDate: new Date('2026-12-31') }
];

let globalRepository: IRepository | null = null;
let activeSyncEngine: SyncEngine | null = null;
let activeSyncWorker: BackgroundSyncWorker | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
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
    const supabaseAdapter = new SupabaseSyncAdapter();
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
    const accounts = await scopedRepo.getAccounts();
    const categories = await scopedRepo.getCategories();
    const ledger = await scopedRepo.getLedger();
    const goals = await scopedRepo.getGoals();

    if (accounts.length === 0 && categories.length === 0) {
      // Seed default initial values inside an atomic transaction
      await scopedRepo.runInTransaction(async (txn) => {
        for (const a of initialAccounts) await txn.saveAccount(a);
        for (const c of initialCategories) await txn.saveCategory(c);
        for (const l of initialLedger) await txn.saveTransaction(l);
        for (const g of initialGoals) await txn.saveGoal(g);
      });
    } else {
      set({ accounts, categories, ledger, goals });
    }

    // 5. Start background sync service
    worker.start();
  },

  triggerSyncPass: async () => {
    if (activeSyncWorker) {
      await activeSyncWorker.triggerSync();
    }
  },

  login: (email, name) => {
    set({ session: { email, name } });
    get().initializeStore(email);
  },

  logout: () => {
    if (activeSyncWorker) {
      activeSyncWorker.stop();
    }
    globalRepository = null;
    activeSyncEngine = null;
    activeSyncWorker = null;
    set({ session: null, syncStatus: 'offline', accounts: [], categories: [], ledger: [], goals: [] });
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  addAccount: async (name, type, currency) => {
    const session = get().session;
    if (!globalRepository || !session) return;
    const scopedRepo = globalRepository.forUser(session.email);

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
    const scopedRepo = globalRepository.forUser(session.email);
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
    const scopedRepo = globalRepository.forUser(session.email);

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
    const scopedRepo = globalRepository.forUser(session.email);

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
    const scopedRepo = globalRepository.forUser(session.email);

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
