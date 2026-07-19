'use client';

import React, { useState, useEffect } from 'react';
import {
  useAppStore,
  TabId,
  SyncStatusType
} from './store';
import {
  formatPaiseToRupees,
  formatRupeesToPaise
} from '@repo/shared';
import {
  LayoutDashboard,
  Wallet,
  FolderTree,
  History,
  Target,
  Settings,
  RefreshCw,
  Cloud,
  CloudOff,
  AlertTriangle,
  Plus,
  LogOut,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Wifi,
  Info,
  X,
  CheckCircle2,
  BarChart3,
  Activity,
  CreditCard
} from 'lucide-react';
import {
  CategoryNode,
  RecoverySource,
  buildCategoryTree,
  aggregateCategoryTree,
  recommendRecovery
} from '@repo/module-budget';
import { Account, aggregateMonthlyCashFlow } from '@repo/module-finance';
import { AuthScreen } from '../components/AuthScreen';

// ── Helpers ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: 'dashboard',    label: 'Overview',     icon: LayoutDashboard, group: 'core' },
  { id: 'accounts',     label: 'Accounts',     icon: Wallet,          group: 'core' },
  { id: 'budget',       label: 'Budget',       icon: FolderTree,      group: 'core' },
  { id: 'transactions', label: 'Transactions', icon: History,         group: 'core' },
  { id: 'goals',        label: 'Goals',        icon: Target,          group: 'plan' },
  { id: 'reports',      label: 'Analytics',    icon: BarChart3,       group: 'plan' },
  { id: 'settings',     label: 'Settings',     icon: Settings,        group: 'system' },
] as const;

const ACCOUNT_GRADIENTS: Record<string, string> = {
  checking:   'from-violet-950/80 to-surface',
  savings:    'from-emerald-950/70 to-surface',
  credit:     'from-rose-950/70 to-surface',
  cash:       'from-amber-950/60 to-surface',
  investment: 'from-cyan-950/70 to-surface',
  crypto:     'from-indigo-950/70 to-surface',
};

const ACCOUNT_ICON_BG: Record<string, string> = {
  checking:   'bg-violet/10 text-violet',
  savings:    'bg-emerald/10 text-emerald',
  credit:     'bg-rose/10 text-rose',
  cash:       'bg-amber/10 text-amber',
  investment: 'bg-cyan/10 text-cyan',
  crypto:     'bg-indigo/10 text-indigo',
};

const CATEGORY_COLORS = [
  '#7C5CFC', '#10D9A0', '#4F9BFF', '#F5A623',
  '#F04F54', '#06B6D4', '#8B5CF6', '#10B981',
];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d: Date | string | number): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function fmtShortDate(d: Date | string | number): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function clamp(val: number, min: number, max: number) { return Math.min(max, Math.max(min, val)); }

// ── Sync Status UI ────────────────────────────────────────────────────────
function SyncBadge({ status, onClick }: { status: SyncStatusType; onClick: () => void }) {
  const map: Record<SyncStatusType, { icon: React.ReactNode; label: string; color: string; dot: string }> = {
    synced:     { icon: <Cloud className="w-3.5 h-3.5" />,      label: 'Synced',   color: 'text-success',  dot: 'bg-success' },
    syncing:    { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Syncing', color: 'text-primary', dot: 'bg-primary animate-pulse' },
    connecting: { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Connecting', color: 'text-primary', dot: 'bg-primary animate-pulse' },
    pulling:    { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Pulling', color: 'text-primary', dot: 'bg-primary animate-pulse' },
    pushing:    { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Pushing', color: 'text-primary', dot: 'bg-primary animate-pulse' },
    offline:    { icon: <CloudOff className="w-3.5 h-3.5" />,   label: 'Offline',  color: 'text-textMuted', dot: 'bg-textMuted' },
    pending:    { icon: <Wifi className="w-3.5 h-3.5" />,       label: 'Pending',  color: 'text-warning',  dot: 'bg-warning animate-pulse' },
    failed:     { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Failed', color: 'text-danger', dot: 'bg-danger' },
    conflict:   { icon: <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />, label: 'Conflict', color: 'text-danger', dot: 'bg-danger animate-pulse' },
  };
  const s = map[status];
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surfaceHover border border-border hover:border-borderHover transition-all duration-150"
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <span className={`text-2xs font-medium ${s.color}`}>{s.label}</span>
      </div>
      <span className={`${s.color} opacity-70 group-hover:opacity-100 transition-opacity`}>{s.icon}</span>
    </button>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, trend, children
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral'; children?: React.ReactNode;
}) {
  const trendEl = trend === 'up'
    ? <TrendingUp className="w-3.5 h-3.5 text-success" />
    : trend === 'down'
    ? <TrendingDown className="w-3.5 h-3.5 text-danger" />
    : null;
  return (
    <div className="relative bg-surface rounded-2xl p-5 border border-border card-lift overflow-hidden inset-highlight shadow-card group">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
      <p className="text-2xs font-semibold text-textSecondary uppercase tracking-widest mb-3">{label}</p>
      <div className="text-2xl font-display font-bold text-textPrimary num-display leading-none mb-2">{value}</div>
      {sub && (
        <div className="flex items-center gap-1.5 text-2xs text-textSecondary">
          {trendEl}
          <span>{sub}</span>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ pct, variant = 'primary', height = 6, animated = true }: {
  pct: number; variant?: 'primary' | 'success' | 'danger' | 'warning'; height?: number; animated?: boolean;
}) {
  const cls = {
    primary: 'progress-bar-primary',
    success: 'progress-bar-success',
    danger:  'progress-bar-danger',
    warning: 'progress-bar-warning',
  }[variant];
  return (
    <div className="w-full bg-surfaceOverlay rounded-full overflow-hidden" style={{ height }}>
      <div
        className={`h-full rounded-full ${cls} ${animated ? 'transition-all duration-700 ease-out' : ''}`}
        style={{ width: `${clamp(pct, 0, 100)}%` }}
      />
    </div>
  );
}

// ── Modal Shell ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children, icon }: {
  title: string; onClose: () => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bgDeep/80 backdrop-blur-md"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-md glass-heavy rounded-2xl shadow-2xl border border-border animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primaryFaint flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            <h3 className="font-display font-bold text-textPrimary">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-textMuted hover:text-textPrimary hover:bg-surfaceRaised transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-2xs font-semibold text-textSecondary uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-surfaceRaised border border-border focus:border-primary rounded-xl px-4 py-3 text-textPrimary placeholder-textMuted outline-none transition-all duration-150 text-sm focus-ring";
const selectCls = "w-full bg-surfaceRaised border border-border focus:border-primary rounded-xl px-4 py-3 text-textPrimary outline-none transition-all duration-150 text-sm focus-ring appearance-none cursor-pointer";

function PrimaryBtn({ children, className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex-1 bg-primary hover:bg-primaryLight text-white font-semibold py-3 rounded-xl transition-all duration-150 shadow-glow hover:shadow-glow-lg text-sm ${className}`}
      {...p}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ children, className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex-1 bg-surfaceRaised hover:bg-surfaceOverlay border border-border hover:border-borderHover text-textPrimary font-semibold py-3 rounded-xl transition-all duration-150 text-sm ${className}`}
      {...p}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const {
    session, activeTab, syncStatus, accounts, goals, ledger, categories,
    initAuth, logout, setActiveTab, setSyncStatus,
    addAccount, addTransaction, updateAllocation, addGoal,
    triggerRecovery, getBalances, getNetWorth, getBudgetTree,
    getGoalsProgress, getSpendingSummary, getBudgetHealth, triggerSyncPass
  } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // ── Local state ──────────────────────────────────────────────────────────
  const [showAddTxModal,    setShowAddTxModal]    = useState(false);
  const [showAddAcctModal,  setShowAddAcctModal]  = useState(false);
  const [showAddGoalModal,  setShowAddGoalModal]  = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState<{ categoryId: string; name: string; deficit: bigint } | null>(null);

  const [txType,        setTxType]        = useState<'INCOME' | 'EXPENSE' | 'TRANSFER_OUT'>('EXPENSE');
  const [txAmount,      setTxAmount]      = useState('');
  const [txAccountId,   setTxAccountId]   = useState('');
  const [txToAccountId, setTxToAccountId] = useState('');
  const [txReferenceId, setTxReferenceId] = useState('');
  const [txMerchant,    setTxMerchant]    = useState('');

  const [acctName,     setAcctName]     = useState('');
  const [acctType,     setAcctType]     = useState<Account['type']>('checking');
  const [acctCurrency, setAcctCurrency] = useState('INR');

  const [goalName,    setGoalName]    = useState('');
  const [goalTarget,  setGoalTarget]  = useState('');
  const [goalMonthly, setGoalMonthly] = useState('');
  const [goalDate,    setGoalDate]    = useState('');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cat-needs': true, 'cat-wants': true,
  });

  const toggleCategory = (id: string) =>
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Engine selectors (all calculations in engines, not here) ─────────────
  const balances       = session ? getBalances()       : new Map();
  const netWorth       = session ? getNetWorth()       : 0n;
  const budgetTree     = session ? getBudgetTree()     : [];
  const goalsProgress  = session ? getGoalsProgress()  : [];
  const spendingSummary= session ? getSpendingSummary(): { byCategory: [], total: 0n };
  const budgetHealth   = session ? getBudgetHealth()   : { burnRatePercent: 0, status: 'good', totalSpent: 0n, variance: 0n };

  // Quick demo actions
  const handleQuickIncome = () => {
    addTransaction('acc-hdfc', 'INCOME', 10000000n, 'INR', 'cat-income', 'Employer Payroll', null, 'Salary');
  };
  const handleQuickSpend = () => {
    addTransaction('acc-hdfc', 'EXPENSE', 250000n, 'INR', 'cat-food', 'Gourmet Supermarket', null, 'Overdraft demo');
  };

  // ── Login Screen ─────────────────────────────────────────────────────────
  if (!session) {
    return <AuthScreen />;
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // ── Shell ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-textPrimary flex flex-col md:flex-row">

      {/* ── SIDEBAR (Desktop) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-surface border-r border-border flex-col shrink-0 overflow-hidden">
        {/* Branding */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow-sm shrink-0">
            <span className="font-display font-black text-sm text-white">R</span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-textPrimary text-sm leading-none truncate">Richingness</p>
            <p className="text-2xs text-textMuted mt-0.5">Financial OS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Core group */}
          <p className="text-2xs font-semibold text-textMuted uppercase tracking-widest px-3 pb-2 pt-1">Finance</p>
          {NAV_LINKS.filter(l => l.group === 'core').map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as TabId)}
                className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm">{link.label}</span>
              </button>
            );
          })}

          {/* Planning group */}
          <p className="text-2xs font-semibold text-textMuted uppercase tracking-widest px-3 pb-2 pt-4">Planning</p>
          {NAV_LINKS.filter(l => l.group === 'plan').map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as TabId)}
                className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm">{link.label}</span>
              </button>
            );
          })}

          {/* System group */}
          <p className="text-2xs font-semibold text-textMuted uppercase tracking-widest px-3 pb-2 pt-4">System</p>
          {NAV_LINKS.filter(l => l.group === 'system').map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as TabId)}
                className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm">{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2 border-t border-border/50 pt-3">
          {/* Sync status */}
          <SyncBadge status={syncStatus} onClick={triggerSyncPass} />

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surfaceHover transition-all group">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-2xs font-bold text-primary">{getInitials(session.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-textPrimary truncate leading-none">{session.name}</p>
              <p className="text-2xs text-textMuted truncate mt-0.5">{session.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-textMuted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE Bottom Navigation ───────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-heavy border-t border-border flex justify-around items-center py-2 px-2">
        {NAV_LINKS.filter(l => ['dashboard','accounts','budget','transactions','goals'].includes(l.id)).map(link => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id as TabId)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-textMuted hover:text-textSecondary'}`}
            >
              <div className={`relative ${isActive ? 'after:absolute after:-inset-1 after:rounded-full after:bg-primary/10 after:blur-sm' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-2xs font-medium">{link.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── WORKSPACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10 inset-highlight">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-display font-bold text-base text-textPrimary leading-none capitalize">
                {activeTab === 'dashboard' ? 'Overview' : activeTab}
              </h1>
              <p className="text-2xs text-textMuted mt-0.5">{monthLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab !== 'settings' && (
              <button
                onClick={() => {
                  setTxType('EXPENSE');
                  setTxAmount('');
                  setTxMerchant('');
                  if (accounts.length > 0) setTxAccountId(accounts[0].id);
                  if (categories.length > 0) setTxReferenceId(categories[0].id);
                  setShowAddTxModal(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primaryLight text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-glow hover:shadow-glow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
            )}
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6 animate-fade-up">

            {/* ═══ TAB: DASHBOARD ═══════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* Hero Net Worth Banner */}
                <div className="relative bg-surface rounded-2xl border border-border overflow-hidden shadow-card p-6 md:p-8">
                  {/* Gradient bleed */}
                  <div className="absolute inset-0 bg-mesh-primary pointer-events-none" />
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/6 blur-3xl pointer-events-none" />

                  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <p className="text-2xs font-semibold text-textSecondary uppercase tracking-widest mb-2">Total Net Worth</p>
                      <div className="font-display font-black text-4xl md:text-5xl text-textPrimary num-display leading-none">
                        ₹{formatPaiseToRupees(netWorth)}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="flex items-center gap-1 text-success text-xs font-medium bg-success/10 px-2.5 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          Assets Clearing
                        </span>
                        <span className="text-textMuted text-2xs">{monthLabel}</span>
                      </div>
                    </div>

                    {/* Mini stats row */}
                    <div className="flex gap-6 md:gap-10">
                      <div className="text-center">
                        <p className="text-2xs text-textMuted uppercase tracking-wider mb-1">Spent</p>
                        <p className="font-display font-bold text-lg text-textPrimary num-display">₹{formatPaiseToRupees(budgetHealth.totalSpent)}</p>
                      </div>
                      <div className="w-px bg-border hidden md:block" />
                      <div className="text-center">
                        <p className="text-2xs text-textMuted uppercase tracking-wider mb-1">Burn Rate</p>
                        <p className={`font-display font-bold text-lg num-display ${
                          budgetHealth.status === 'danger' ? 'text-danger'
                          : budgetHealth.status === 'warning' ? 'text-warning'
                          : 'text-success'
                        }`}>{budgetHealth.burnRatePercent.toFixed(1)}%</p>
                      </div>
                      <div className="w-px bg-border hidden md:block" />
                      <div className="text-center">
                        <p className="text-2xs text-textMuted uppercase tracking-wider mb-1">Accounts</p>
                        <p className="font-display font-bold text-lg text-textPrimary num-display">{accounts.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Burn rate bar */}
                  <div className="relative mt-6">
                    <ProgressBar
                      pct={budgetHealth.burnRatePercent}
                      variant={budgetHealth.status === 'danger' ? 'danger' : budgetHealth.status === 'warning' ? 'warning' : 'success'}
                      height={4}
                    />
                  </div>
                </div>

                {/* Metric cards row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Budget Health */}
                  <StatCard
                    label="Budget Health"
                    value={`${budgetHealth.burnRatePercent.toFixed(1)}%`}
                    sub={`₹${formatPaiseToRupees(budgetHealth.variance)} variance`}
                    trend={budgetHealth.status === 'good' ? 'up' : 'down'}
                  >
                    <div className="mt-3">
                      <ProgressBar
                        pct={budgetHealth.burnRatePercent}
                        variant={budgetHealth.status === 'danger' ? 'danger' : budgetHealth.status === 'warning' ? 'warning' : 'success'}
                        height={3}
                      />
                    </div>
                  </StatCard>

                  {/* Goals on track */}
                  <StatCard
                    label="Savings Goals"
                    value={`${goalsProgress.length}`}
                    sub={`${goalsProgress.filter(g => g.progress.progressPercent >= 50).length} on track`}
                    trend="up"
                  >
                    <div className="mt-3 flex gap-1">
                      {goalsProgress.slice(0, 6).map((g) => (
                        <div
                          key={g.id}
                          className="h-1 rounded-full flex-1"
                          style={{
                            background: g.progress.progressPercent >= 75 ? '#10D9A0'
                              : g.progress.progressPercent >= 40 ? '#7C5CFC'
                              : '#3E3E5A'
                          }}
                          title={g.name}
                        />
                      ))}
                    </div>
                  </StatCard>

                  {/* Upcoming Bills */}
                  <div className="relative bg-surface rounded-2xl p-5 border border-border card-lift overflow-hidden inset-highlight shadow-card group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-warning/5 blur-2xl pointer-events-none" />
                    <p className="text-2xs font-semibold text-textSecondary uppercase tracking-widest mb-3">Upcoming Bills</p>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Rent', amt: '₹40,000', days: 3, color: 'text-danger' },
                        { name: 'ChatGPT Plus', amt: '₹1,999', days: 8, color: 'text-warning' },
                        { name: 'Netflix', amt: '₹649', days: 14, color: 'text-textSecondary' },
                      ].map(b => (
                        <div key={b.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${b.color.replace('text-','bg-')}`} />
                            <span className="text-textPrimary font-medium">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-textMuted text-2xs">in {b.days}d</span>
                            <span className="text-textSecondary num-display font-medium">{b.amt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent transactions + Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Recent Transactions */}
                  <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-card inset-highlight">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                      <p className="font-display font-bold text-textPrimary text-sm">Recent Transactions</p>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs text-primary hover:text-primaryLight font-semibold transition-colors"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="divide-y divide-border/40">
                      {ledger.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-surfaceRaised flex items-center justify-center">
                            <History className="w-5 h-5 text-textMuted" />
                          </div>
                          <p className="text-textMuted text-sm">No transactions yet</p>
                        </div>
                      ) : (
                        ledger.slice(-5).reverse().map((op) => {
                          const acct     = accounts.find(a => a.id === op.accountId);
                          const category = categories.find(c => c.id === op.referenceId);
                          const isIncome = op.type === 'INCOME';
                          const merchant = category?.name || (op.type === 'TRANSFER_OUT' ? 'Transfer' : op.type === 'INCOME' ? 'Income' : 'Expense');
                          return (
                            <div key={op.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surfaceHover/50 transition-all">
                              {/* Avatar */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                isIncome ? 'bg-success/10 text-success' : 'bg-primaryFaint text-primary'
                              }`}>
                                {merchant.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-textPrimary truncate">{merchant}</p>
                                <p className="text-2xs text-textMuted mt-0.5">{acct?.name} · {fmtShortDate(op.date)}</p>
                              </div>
                              <span className={`text-sm font-bold num-display shrink-0 ${isIncome ? 'text-success' : 'text-textPrimary'}`}>
                                {isIncome ? '+' : '-'}₹{formatPaiseToRupees(op.amount)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Quick Heuristics */}
                  <div className="bg-surface rounded-2xl border border-border shadow-card inset-highlight flex flex-col">
                    <div className="px-5 py-4 border-b border-border/50">
                      <p className="font-display font-bold text-textPrimary text-sm">Quick Actions</p>
                      <p className="text-2xs text-textMuted mt-0.5">Seed the ledger for testing</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-3 p-5">
                      <button
                        onClick={handleQuickIncome}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-success/8 hover:bg-success/15 border border-success/20 hover:border-success/40 text-textPrimary rounded-xl text-sm font-medium transition-all"
                      >
                        <TrendingUp className="w-4 h-4 text-success shrink-0" />
                        <span>Log Payroll <span className="text-textMuted font-normal">₹1,00,000</span></span>
                      </button>
                      <button
                        onClick={handleQuickSpend}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-danger/8 hover:bg-danger/15 border border-danger/20 hover:border-danger/40 text-textPrimary rounded-xl text-sm font-medium transition-all"
                      >
                        <TrendingDown className="w-4 h-4 text-danger shrink-0" />
                        <span>Overspend Food <span className="text-textMuted font-normal">₹2,500</span></span>
                      </button>
                      <button
                        onClick={() => {
                          setTxType('EXPENSE');
                          setTxAmount('');
                          setTxMerchant('');
                          if (accounts.length > 0) setTxAccountId(accounts[0].id);
                          if (categories.length > 0) setTxReferenceId(categories[0].id);
                          setShowAddTxModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-surfaceRaised hover:bg-surfaceOverlay border border-border hover:border-borderHover text-textSecondary hover:text-textPrimary rounded-xl text-sm font-medium transition-all"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>Custom Transaction</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB: ACCOUNTS ════════════════════════════════════════ */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-textPrimary text-lg">Money Sources</h2>
                    <p className="text-textSecondary text-sm mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTxType('TRANSFER_OUT');
                        setTxAmount('');
                        if (accounts.length > 0) { setTxAccountId(accounts[0].id); setTxToAccountId(accounts[1]?.id || accounts[0].id); }
                        setShowAddTxModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surfaceHover hover:border-borderHover text-textPrimary text-sm font-semibold transition-all"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Transfer
                    </button>
                    <button
                      onClick={() => { setAcctName(''); setShowAddAcctModal(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primaryLight text-white text-sm font-semibold transition-all shadow-glow"
                    >
                      <Plus className="w-4 h-4" />
                      Add Account
                    </button>
                  </div>
                </div>

                {/* Total across accounts */}
                <div className="bg-surface border border-border rounded-2xl px-6 py-4 shadow-card flex items-center justify-between">
                  <p className="text-sm text-textSecondary">Total Balance (All Accounts)</p>
                  <p className="font-display font-bold text-2xl text-textPrimary num-display">
                    ₹{formatPaiseToRupees(netWorth)}
                  </p>
                </div>

                {/* Account cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((acct, idx) => {
                    const bal = balances.get(acct.id);
                    const display = bal ? formatPaiseToRupees(bal.clearedBalance) : '0.00';
                    const gradClass = ACCOUNT_GRADIENTS[acct.type] || 'from-violet-950/80 to-surface';
                    const iconClass = ACCOUNT_ICON_BG[acct.type] || 'bg-primary/10 text-primary';
                    const AcctIcon = acct.type === 'credit' ? CreditCard : acct.type === 'investment' ? Activity : Wallet;
                    return (
                      <div
                        key={acct.id}
                        className={`relative bg-gradient-to-br ${gradClass} rounded-2xl p-5 border border-border/50 card-lift shadow-card overflow-hidden`}
                      >
                        {/* Background pattern */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20"
                          style={{ background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] + '40' }} />

                        <div className="flex items-start justify-between mb-6">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
                            <AcctIcon className="w-4 h-4" />
                          </div>
                          <span className="text-2xs font-bold text-textMuted uppercase tracking-widest bg-surfaceOverlay/50 px-2 py-0.5 rounded-md">
                            {acct.currency}
                          </span>
                        </div>

                        <div>
                          <p className="text-2xs text-textMuted uppercase tracking-wider mb-1 font-semibold">{acct.type}</p>
                          <p className="font-semibold text-textSecondary text-sm mb-2">{acct.name}</p>
                          <p className="font-display font-bold text-2xl text-textPrimary num-display">₹{display}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add account placeholder */}
                  <button
                    onClick={() => { setAcctName(''); setShowAddAcctModal(true); }}
                    className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-surface/50 hover:bg-primaryFaint text-textMuted hover:text-primary flex flex-col items-center justify-center gap-2 p-8 transition-all card-lift min-h-[160px]"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">Add Account</span>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ TAB: BUDGET ══════════════════════════════════════════ */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-textPrimary text-lg">Budget Envelopes</h2>
                    <p className="text-textSecondary text-sm mt-0.5">Nested allocation tree · {monthLabel}</p>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-surfaceRaised border-b border-border text-2xs font-bold uppercase tracking-widest text-textMuted">
                    <div className="col-span-5">Category</div>
                    <div className="col-span-2 text-right">Assigned</div>
                    <div className="col-span-2 text-right">Spent</div>
                    <div className="col-span-2 text-right">Available</div>
                    <div className="col-span-1 text-center">—</div>
                  </div>

                  <div className="divide-y divide-border/30">
                    {budgetTree.map(node => (
                      <CategoryRow
                        key={node.id}
                        node={node}
                        depth={0}
                        expandedCategories={expandedCategories}
                        toggleCategory={toggleCategory}
                        onEditAllocation={(id, amount) => updateAllocation(id, amount)}
                        onTriggerRecovery={(id, deficit) => setShowRecoveryModal({ categoryId: id, name: node.name, deficit })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB: TRANSACTIONS ════════════════════════════════════ */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-textPrimary text-lg">Transaction Ledger</h2>
                    <p className="text-textSecondary text-sm mt-0.5">{ledger.length} immutable operations</p>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                  {ledger.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-surfaceRaised flex items-center justify-center">
                        <History className="w-6 h-6 text-textMuted" />
                      </div>
                      <p className="text-textSecondary font-medium">No transactions yet</p>
                      <p className="text-textMuted text-sm">Use Quick Actions to seed your ledger</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-surfaceRaised text-2xs text-textMuted uppercase tracking-widest font-bold">
                            <th className="text-left px-5 py-3.5">Transaction</th>
                            <th className="text-left px-4 py-3.5">Date</th>
                            <th className="text-left px-4 py-3.5">Account</th>
                            <th className="text-left px-4 py-3.5">Type</th>
                            <th className="text-right px-5 py-3.5">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {[...ledger].reverse().map(op => {
                            const acct = accounts.find(a => a.id === op.accountId);
                            const cat  = categories.find(c => c.id === op.referenceId);
                            const isIncome = op.type === 'INCOME';
                            const merchant = cat?.name || (op.type === 'TRANSFER_OUT' ? 'Transfer' : op.type === 'INCOME' ? 'Income' : 'Expense');
                            return (
                              <tr key={op.id} className="hover:bg-surfaceHover/40 transition-all">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isIncome ? 'bg-success/10 text-success' : 'bg-primaryFaint text-primary'
                                    }`}>
                                      {merchant.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-textPrimary">{merchant}</p>
                                      <p className="text-2xs text-textMuted font-mono">{op.id.slice(0, 12)}…</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-textSecondary text-xs whitespace-nowrap">{fmtDate(op.date)}</td>
                                <td className="px-4 py-3.5 text-textSecondary text-xs">{acct?.name || 'Unknown'}</td>
                                <td className="px-4 py-3.5">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-2xs font-bold ${
                                    isIncome
                                      ? 'bg-success/10 text-success'
                                      : op.type === 'TRANSFER_OUT'
                                      ? 'bg-info/10 text-info'
                                      : 'bg-primaryFaint text-primaryLight'
                                  }`}>
                                    {op.type}
                                  </span>
                                </td>
                                <td className={`px-5 py-3.5 text-right font-bold num-display ${
                                  isIncome ? 'text-success' : 'text-textPrimary'
                                }`}>
                                  {isIncome ? '+' : '-'}₹{formatPaiseToRupees(op.amount)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ TAB: GOALS ═══════════════════════════════════════════ */}
            {activeTab === 'goals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-textPrimary text-lg">Savings Goals</h2>
                    <p className="text-textSecondary text-sm mt-0.5">{goalsProgress.length} active goals</p>
                  </div>
                  <button
                    onClick={() => { setGoalName(''); setGoalTarget(''); setGoalMonthly(''); setGoalDate(''); setShowAddGoalModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primaryLight text-white text-sm font-semibold transition-all shadow-glow"
                  >
                    <Plus className="w-4 h-4" />
                    New Goal
                  </button>
                </div>

                {goalsProgress.length === 0 ? (
                  <div className="bg-surface rounded-2xl border border-border shadow-card flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primaryFaint flex items-center justify-center">
                      <Target className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-textPrimary">No goals yet</p>
                      <p className="text-textMuted text-sm mt-1">Create your first savings goal to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalsProgress.map((g, idx) => {
                      const pct = g.progress.progressPercent;
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      const isOnTrack = pct >= 50;
                      return (
                        <div key={g.id} className="bg-surface rounded-2xl border border-border card-lift shadow-card overflow-hidden">
                          {/* Goal top bar */}
                          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }} />

                          <div className="p-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-display font-bold text-textPrimary">{g.name}</h3>
                                <p className="text-2xs text-textMuted mt-1">
                                  {g.targetDate ? `Deadline: ${fmtDate(g.targetDate)}` : 'No deadline set'}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <span
                                  className="text-sm font-bold num-display px-3 py-1 rounded-xl"
                                  style={{ color, background: color + '18' }}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Arc progress (CSS) */}
                            <div className="flex items-center gap-5">
                              <SvgArc pct={pct} color={color} size={72} />
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-textMuted">Saved</span>
                                  <span className="text-textPrimary font-semibold num-display">₹{formatPaiseToRupees(g.currentAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-textMuted">Target</span>
                                  <span className="text-textPrimary font-semibold num-display">₹{formatPaiseToRupees(g.targetAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-textMuted">ETA</span>
                                  <span className="text-textPrimary font-semibold">{g.progress.monthsToTarget} months</span>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <ProgressBar pct={pct} variant={isOnTrack ? 'success' : 'primary'} height={5} />

                            {/* Recommendation */}
                            <div className="flex items-start gap-2 bg-surfaceRaised border border-border rounded-xl px-3.5 py-2.5">
                              <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                              <p className="text-2xs text-textSecondary leading-relaxed">
                                <span className="text-textPrimary font-semibold">₹{formatPaiseToRupees(g.monthlyContribution)}/mo</span> committed ·
                                Recommended: <span className="text-primary font-semibold">₹{g.progress.recommendedMonthlyContribution ? formatPaiseToRupees(g.progress.recommendedMonthlyContribution) : '0'}/mo</span>
                              </p>
                            </div>

                            {/* Contribute */}
                            <button
                              onClick={() => {
                                setTxType('EXPENSE');
                                setTxAmount('');
                                setTxMerchant('Saving Contribution');
                                if (accounts.length > 0) setTxAccountId(accounts[0].id);
                                setTxReferenceId(g.id);
                                setShowAddTxModal(true);
                              }}
                              className="w-full py-2.5 rounded-xl border border-border bg-surfaceRaised hover:bg-surfaceOverlay hover:border-primary/30 text-textPrimary text-sm font-semibold transition-all"
                            >
                              Contribute Funds
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══ TAB: REPORTS ══════════════════════════════════════════ */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-textPrimary text-lg">Analytics</h2>
                  <p className="text-textSecondary text-sm mt-0.5">Spending insights for {monthLabel}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Category breakdown */}
                  <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/50">
                      <p className="font-display font-bold text-textPrimary text-sm">Category Breakdown</p>
                      <p className="text-2xs text-textMuted mt-0.5">Where money is going this month</p>
                    </div>
                    <div className="p-5 space-y-4">
                      {spendingSummary.byCategory.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-textMuted text-sm">No spending recorded</div>
                      ) : (
                        spendingSummary.byCategory.map((item, i) => (
                          <div key={item.categoryId} className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-semibold text-textPrimary">{item.categoryName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-textMuted">{item.percentage.toFixed(1)}%</span>
                                <span className="text-textSecondary font-medium num-display">₹{formatPaiseToRupees(item.amount)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-surfaceOverlay rounded-full overflow-hidden h-2">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${item.percentage}%`,
                                  background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Cash flow */}
                  <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/50">
                      <p className="font-display font-bold text-textPrimary text-sm">Cash Flow History</p>
                      <p className="text-2xs text-textMuted mt-0.5">Monthly income vs. expenses</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-2xs text-textMuted uppercase tracking-widest font-bold border-b border-border/40">
                            <th className="text-left px-5 py-3">Month</th>
                            <th className="text-right px-4 py-3">Income</th>
                            <th className="text-right px-5 py-3">Expenses</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/25">
                          {aggregateMonthlyCashFlow(ledger, 'INR').map(flow => {
                            const net = flow.income - flow.expenses;
                            return (
                              <tr key={flow.monthYear} className="hover:bg-surfaceHover/40 transition-all">
                                <td className="px-5 py-3.5 text-textPrimary font-medium">{flow.monthYear}</td>
                                <td className="px-4 py-3.5 text-right text-success font-bold num-display">
                                  +₹{formatPaiseToRupees(flow.income)}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-textPrimary font-bold num-display">₹{formatPaiseToRupees(flow.expenses)}</span>
                                    {net !== 0n && (
                                      <span className={`text-2xs font-medium num-display ${net > 0n ? 'text-success' : 'text-danger'}`}>
                                        {net > 0n ? '+' : ''}₹{formatPaiseToRupees(net)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {aggregateMonthlyCashFlow(ledger, 'INR').length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-5 py-10 text-center text-textMuted text-sm">No data yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Budget health summary */}
                <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
                  <p className="font-display font-bold text-textPrimary text-sm mb-4">Budget Health Summary</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Spent', value: `₹${formatPaiseToRupees(budgetHealth.totalSpent)}`, color: 'text-textPrimary' },
                      { label: 'Variance', value: `₹${formatPaiseToRupees(budgetHealth.variance)}`, color: budgetHealth.variance >= 0n ? 'text-success' : 'text-danger' },
                      { label: 'Burn Rate', value: `${budgetHealth.burnRatePercent.toFixed(1)}%`, color: budgetHealth.status === 'good' ? 'text-success' : budgetHealth.status === 'warning' ? 'text-warning' : 'text-danger' },
                      { label: 'Status', value: budgetHealth.status.charAt(0).toUpperCase() + budgetHealth.status.slice(1), color: budgetHealth.status === 'good' ? 'text-success' : budgetHealth.status === 'warning' ? 'text-warning' : 'text-danger' },
                    ].map(item => (
                      <div key={item.label} className="bg-surfaceRaised rounded-xl p-4 border border-border/50">
                        <p className="text-2xs text-textMuted uppercase tracking-widest font-semibold mb-2">{item.label}</p>
                        <p className={`font-display font-bold text-xl num-display ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB: SETTINGS ════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="font-display font-bold text-textPrimary text-lg">Settings</h2>
                  <p className="text-textSecondary text-sm mt-0.5">Platform configuration & preferences</p>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-card divide-y divide-border/40">
                  {/* Currency */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-textPrimary text-sm">Reporting Currency</p>
                      <p className="text-textMuted text-xs">Default currency for all calculations</p>
                    </div>
                    <span className="bg-surfaceRaised border border-border px-3.5 py-2 rounded-xl text-sm font-bold text-textPrimary num-display">INR ₹</span>
                  </div>

                  {/* Sync override */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-textPrimary text-sm">Sync State Override</p>
                      <p className="text-textMuted text-xs">Force sync status for UI testing</p>
                    </div>
                    <select
                      value={syncStatus}
                      onChange={(e) => setSyncStatus(e.target.value as SyncStatusType)}
                      className={`${selectCls} w-auto min-w-40`}
                    >
                      <option value="synced">Synced</option>
                      <option value="syncing">Syncing</option>
                      <option value="connecting">Connecting</option>
                      <option value="pulling">Pulling</option>
                      <option value="pushing">Pushing</option>
                      <option value="offline">Offline</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="conflict">Conflict</option>
                    </select>
                  </div>

                  {/* Export */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-textPrimary text-sm">Database Backup</p>
                      <p className="text-textMuted text-xs">Export all data as a JSON snapshot</p>
                    </div>
                    <button
                      onClick={() => {
                        const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ accounts, categories, ledger, goals }));
                        const a = document.createElement('a');
                        a.setAttribute('href', d);
                        a.setAttribute('download', `richingness_backup_${Date.now()}.json`);
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surfaceRaised hover:bg-surfaceOverlay hover:border-borderHover text-textPrimary text-sm font-semibold transition-all"
                    >
                      Download JSON
                    </button>
                  </div>

                  {/* Version info */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-textPrimary text-sm">Platform Version</p>
                      <p className="text-textMuted text-xs">Richingness Financial OS</p>
                    </div>
                    <span className="text-xs text-textMuted num-display bg-surfaceRaised border border-border px-3 py-1.5 rounded-lg">v2.0 · Phase 2.5</span>
                  </div>

                  {/* Danger zone */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-danger text-sm">Sign Out</p>
                      <p className="text-textMuted text-xs">End session and clear workspace</p>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-danger/30 bg-danger/8 hover:bg-danger/15 text-danger text-sm font-semibold transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ═══ MODALS ═══════════════════════════════════════════════════════ */}

      {/* Add Transaction */}
      {showAddTxModal && (
        <Modal title="New Transaction" onClose={() => setShowAddTxModal(false)} icon={<Plus className="w-4 h-4" />}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (txAccountId && txAmount) {
                addTransaction(txAccountId, txType, formatRupeesToPaise(txAmount), 'INR', txReferenceId, txMerchant || undefined, txType === 'TRANSFER_OUT' ? txToAccountId : null);
                setShowAddTxModal(false);
              }
            }}
            className="space-y-4"
          >
            {/* Type selector */}
            <div className="flex rounded-xl bg-surfaceRaised border border-border p-1 gap-1">
              {(['EXPENSE', 'INCOME', 'TRANSFER_OUT'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxType(type)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === type
                      ? type === 'INCOME' ? 'bg-success text-black'
                        : type === 'EXPENSE' ? 'bg-primary text-white'
                        : 'bg-info text-white'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {type === 'TRANSFER_OUT' ? 'TRANSFER' : type}
                </button>
              ))}
            </div>

            <Field label="Amount (₹)">
              <input type="text" required value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="500.00" className={inputCls} />
            </Field>

            <Field label="From Account">
              <select required value={txAccountId} onChange={e => setTxAccountId(e.target.value)} className={selectCls}>
                <option value="" disabled>Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>

            {txType === 'TRANSFER_OUT' ? (
              <Field label="To Account">
                <select required value={txToAccountId} onChange={e => setTxToAccountId(e.target.value)} className={selectCls}>
                  <option value="" disabled>Select destination</option>
                  {accounts.filter(a => a.id !== txAccountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
            ) : (
              <>
                <Field label="Envelope / Goal">
                  <select required value={txReferenceId} onChange={e => setTxReferenceId(e.target.value)} className={selectCls}>
                    <option value="" disabled>Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>📂 {c.name}</option>)}
                    {goals.map(g => <option key={g.id} value={g.id}>🎯 {g.name}</option>)}
                  </select>
                </Field>
                <Field label="Merchant / Payee">
                  <input type="text" value={txMerchant} onChange={e => setTxMerchant(e.target.value)} placeholder="Swiggy, Amazon, Netflix…" className={inputCls} />
                </Field>
              </>
            )}

            <div className="flex gap-3 pt-1">
              <SecondaryBtn type="button" onClick={() => setShowAddTxModal(false)}>Cancel</SecondaryBtn>
              <PrimaryBtn type="submit">Confirm Entry</PrimaryBtn>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Account */}
      {showAddAcctModal && (
        <Modal title="Add Account" onClose={() => setShowAddAcctModal(false)} icon={<Wallet className="w-4 h-4" />}>
          <form
            onSubmit={(e) => { e.preventDefault(); if (acctName) { addAccount(acctName, acctType, acctCurrency); setShowAddAcctModal(false); } }}
            className="space-y-4"
          >
            <Field label="Account Name">
              <input type="text" required value={acctName} onChange={e => setAcctName(e.target.value)} placeholder="HDFC Checking, Cash Wallet…" className={inputCls} />
            </Field>
            <Field label="Account Type">
              <select value={acctType} onChange={e => setAcctType(e.target.value as Account['type'])} className={selectCls}>
                {['checking', 'savings', 'credit', 'cash', 'investment', 'crypto'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Currency Code">
              <input type="text" required value={acctCurrency} onChange={e => setAcctCurrency(e.target.value)} placeholder="INR" className={inputCls} />
            </Field>
            <div className="flex gap-3 pt-1">
              <SecondaryBtn type="button" onClick={() => setShowAddAcctModal(false)}>Cancel</SecondaryBtn>
              <PrimaryBtn type="submit">Create Account</PrimaryBtn>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Goal */}
      {showAddGoalModal && (
        <Modal title="New Savings Goal" onClose={() => setShowAddGoalModal(false)} icon={<Target className="w-4 h-4" />}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (goalName && goalTarget && goalMonthly) {
                addGoal(goalName, formatRupeesToPaise(goalTarget), formatRupeesToPaise(goalMonthly), goalDate ? new Date(goalDate) : null, null);
                setShowAddGoalModal(false);
              }
            }}
            className="space-y-4"
          >
            <Field label="Goal Name">
              <input type="text" required value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="MacBook Pro, Vacation Fund…" className={inputCls} />
            </Field>
            <Field label="Target Amount (₹)">
              <input type="text" required value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="100000.00" className={inputCls} />
            </Field>
            <Field label="Monthly Contribution (₹)">
              <input type="text" required value={goalMonthly} onChange={e => setGoalMonthly(e.target.value)} placeholder="5000.00" className={inputCls} />
            </Field>
            <Field label="Target Date (optional)">
              <input type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)} className={inputCls} />
            </Field>
            <div className="flex gap-3 pt-1">
              <SecondaryBtn type="button" onClick={() => setShowAddGoalModal(false)}>Cancel</SecondaryBtn>
              <PrimaryBtn type="submit">Create Goal</PrimaryBtn>
            </div>
          </form>
        </Modal>
      )}

      {/* Smart Recovery */}
      {showRecoveryModal && (
        <Modal
          title="Smart Recovery"
          onClose={() => setShowRecoveryModal(null)}
          icon={<AlertTriangle className="w-4 h-4 text-danger" />}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-danger/8 border border-danger/20 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
              <p className="text-sm text-textSecondary">
                <span className="text-textPrimary font-semibold">{showRecoveryModal.name}</span> is overspent by{' '}
                <span className="text-danger font-bold num-display">₹{formatPaiseToRupees(showRecoveryModal.deficit)}</span>
              </p>
            </div>

            <div className="bg-surfaceRaised border border-border rounded-xl p-4 space-y-3">
              <p className="text-2xs text-textMuted uppercase tracking-widest font-bold">Suggested Rebalances</p>
              {(() => {
                const getSpentAmount = (catId: string): bigint =>
                  ledger.filter(op => op.referenceId === catId && op.type === 'EXPENSE').reduce((sum, op) => sum + op.amount, 0n);
                const getAssignedAmount = (catId: string): bigint => {
                  const cat = categories.find(c => c.id === catId);
                  const base = cat ? cat.budgetAmount : 0n;
                  const adj  = ledger.filter(op => op.referenceId === catId && op.type === 'ADJUSTMENT').reduce((sum, op) => sum + op.amount, 0n);
                  return base + adj;
                };
                const sources: RecoverySource[] = categories.map(c => {
                  const tree = buildCategoryTree(categories);
                  aggregateCategoryTree(tree, getSpentAmount, getAssignedAmount);
                  const findNode = (nodes: CategoryNode[]): CategoryNode | undefined => {
                    for (const n of nodes) { if (n.id === c.id) return n; const f = findNode(n.children); if (f) return f; }
                  };
                  const node = findNode(tree);
                  return { categoryId: c.id, name: c.name, availableBalance: node ? node.totalAvailableAmount : 0n, priority: c.priority };
                });
                const moves = recommendRecovery(showRecoveryModal.categoryId, showRecoveryModal.deficit, sources);
                if (moves.length === 0) return <p className="text-sm text-textMuted">No surplus found to borrow from.</p>;
                return (
                  <div className="space-y-2">
                    {moves.map((move, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm">
                        <span className="text-textSecondary">Borrow from <span className="text-textPrimary font-semibold">{move.fromCategoryName}</span></span>
                        <span className="text-success font-bold num-display">₹{formatPaiseToRupees(move.amount)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-border text-sm font-semibold">
                      <span className="text-textSecondary">Total Recovery</span>
                      <span className="text-success num-display">₹{formatPaiseToRupees(moves.reduce((s, m) => s + m.amount, 0n))}</span>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <SecondaryBtn type="button" onClick={() => setShowRecoveryModal(null)}>Decline</SecondaryBtn>
                      <button
                        type="button"
                        onClick={() => { triggerRecovery(showRecoveryModal.categoryId, showRecoveryModal.deficit); setShowRecoveryModal(null); }}
                        className="flex-1 bg-success hover:bg-successLight text-black font-bold py-3 rounded-xl transition-all shadow-glow-success text-sm"
                      >
                        Apply Rebalance
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── SVG Arc Progress Component ────────────────────────────────────────────
function SvgArc({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size / 2) - 6;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamp(pct, 0, 100) / 100) * circumference;
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={r} fill="none" stroke="#1C1C2E" strokeWidth={5} />
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text x={center} y={center + 5} textAnchor="middle" fill={color} fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Category Row (Budget Tree) ─────────────────────────────────────────────
interface CategoryRowProps {
  node: CategoryNode;
  depth: number;
  expandedCategories: Record<string, boolean>;
  toggleCategory: (id: string) => void;
  onEditAllocation: (id: string, amount: bigint) => void;
  onTriggerRecovery: (id: string, deficit: bigint) => void;
}

function CategoryRow({ node, depth, expandedCategories, toggleCategory, onEditAllocation, onTriggerRecovery }: CategoryRowProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded  = !!expandedCategories[node.id];
  const isOverspent = node.totalAvailableAmount < 0n;

  const [isEditing,       setIsEditing]       = useState(false);
  const [allocationInput, setAllocationInput] = useState('');

  const submitEdit = () => {
    try { onEditAllocation(node.id, formatRupeesToPaise(allocationInput)); } catch (err) { console.warn('Invalid input:', err); }
    setIsEditing(false);
  };

  const spentPct = node.budgetAmount > 0n
    ? Math.min(100, Number((node.totalSpentAmount * 100n) / node.budgetAmount))
    : 0;

  return (
    <>
      <div
        className={`grid grid-cols-12 gap-2 px-5 py-3 text-sm items-center hover:bg-surfaceHover/40 transition-all ${depth > 0 ? 'bg-bg/30' : ''}`}
        style={{ paddingLeft: `${20 + depth * 20}px` }}
      >
        {/* Name column */}
        <div className="col-span-5 flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button onClick={() => toggleCategory(node.id)} className="text-textMuted hover:text-textPrimary transition-colors shrink-0 p-0.5">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <div className="min-w-0">
            <span className={`font-semibold truncate block ${depth === 0 ? 'text-textPrimary' : 'text-textSecondary'}`}>{node.name}</span>
            {/* Mini progress bar */}
            {!hasChildren && (
              <div className="w-16 bg-surfaceOverlay rounded-full h-1 mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${spentPct}%`, background: isOverspent ? '#F04F54' : '#10D9A0' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Assigned */}
        <div className="col-span-2 text-right">
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={allocationInput}
              onChange={e => setAllocationInput(e.target.value)}
              onBlur={submitEdit}
              onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setIsEditing(false); }}
              className="w-24 bg-surfaceRaised border border-primary rounded-lg text-right px-2 py-1 text-xs num-display text-textPrimary outline-none"
            />
          ) : (
            <button
              onClick={() => { setAllocationInput(formatPaiseToRupees(node.budgetAmount)); setIsEditing(true); }}
              className="text-textSecondary hover:text-primary hover:underline font-medium num-display text-xs transition-colors"
              title="Click to edit"
            >
              ₹{formatPaiseToRupees(node.budgetAmount)}
            </button>
          )}
        </div>

        {/* Spent */}
        <div className="col-span-2 text-right text-textMuted font-medium num-display text-xs">
          ₹{formatPaiseToRupees(node.totalSpentAmount)}
        </div>

        {/* Available */}
        <div className={`col-span-2 text-right font-bold num-display text-xs ${isOverspent ? 'text-danger' : 'text-success'}`}>
          {isOverspent ? '-' : ''}₹{formatPaiseToRupees(isOverspent ? -node.totalAvailableAmount : node.totalAvailableAmount)}
        </div>

        {/* Recovery */}
        <div className="col-span-1 flex justify-center">
          {isOverspent ? (
            <button
              onClick={() => onTriggerRecovery(node.id, -node.totalAvailableAmount)}
              className="text-danger bg-danger/10 hover:bg-danger hover:text-white px-2 py-0.5 rounded-lg text-2xs font-bold transition-all"
              title="Trigger Smart Recovery"
            >
              Fix
            </button>
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-success/40" />
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-border/50 ml-8">
          {node.children.map(child => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              onEditAllocation={onEditAllocation}
              onTriggerRecovery={onTriggerRecovery}
            />
          ))}
        </div>
      )}
    </>
  );
}
