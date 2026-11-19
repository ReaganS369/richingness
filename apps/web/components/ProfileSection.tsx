'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  ChevronRight,
  Plus,
  LogIn,
  LogOut,
  X,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Loader2,
  Check,
  Shield,
  HelpCircle,
  Layers,
  Zap,
  Trash2,
  Wallet,
  ChevronDown,
  Repeat,
  Sun,
  Moon,
  History,
  AlertTriangle,
  RefreshCw,
  ArrowDownLeft
} from 'lucide-react';
import { useAppStore, authService, IncomeSource, ScheduledSpend } from '../app/store';
import { formatRupeesToPaise } from '@repo/shared';
import { AccountCategoriesScreen, CategoryNodeAllocation } from './AccountCategoriesScreen';
import { getStorageInfo, requestStoragePersistence, StorageInfo } from '../app/storageService';

// ── Types ───────────────────────────────────────────────────────────────────
export interface UserProfileItem {
  id: string;
  name: string;
  email: string;
  type: 'Personal' | 'Business' | 'Family' | 'Guest';
  tag: string;
  currency: string;
  color: string;
  avatarInitials: string;
  balanceNote: string;
}

export interface SettingCategoryItem {
  id: string;
  name: string;
  percentage: number;
}

export interface SettingAccountItem {
  id: string;
  name: string;
  amount: number;
}

export interface SettingGoalItem {
  id: string;
  name: string;
  targetDate: string;
  percentage: number;
  amountText: string;
}

// ── Default Presets ─────────────────────────────────────────────────────────
const DEFAULT_PROFILES: UserProfileItem[] = [
  {
    id: 'prof-guest',
    name: 'Personal Budget',
    email: 'Offline Vault · Guest Mode',
    type: 'Guest',
    tag: 'Primary Budget',
    currency: 'INR (₹)',
    color: '#485F2C',
    avatarInitials: 'PB',
    balanceNote: 'Active'
  }
];

const BUDGET_TEMPLATES = [
  {
    id: 'tmpl-503020',
    title: '50/30/20 Rule Budget',
    category: 'Balanced Lifestyle',
    description: '50% Needs (Rent, Food), 30% Wants (Hobbies, Dining), 20% Savings (Emergency, Investments).',
    allocations: ['Needs: 50%', 'Wants: 30%', 'Savings: 20%']
  },
  {
    id: 'tmpl-zero-based',
    title: 'Zero-Based Budget',
    category: 'Strict Discipline',
    description: 'Every single rupee is assigned a specific job. Income minus all envelopes equals exactly zero.',
    allocations: ['Fixed Costs: 45%', 'Discretionary: 25%', 'Debt Payoff: 20%', 'Buffer: 10%']
  },
  {
    id: 'tmpl-freelancer',
    title: 'Freelancer Variable Cashflow',
    category: 'Irregular Income',
    description: 'Designed for consultants and creators: built-in tax deduction pool and 3-month expense cushion.',
    allocations: ['Operating Expenses: 35%', 'Tax Buffer: 25%', 'Owner Pay: 30%', 'Emergency Fund: 10%']
  },
  {
    id: 'tmpl-fire',
    title: 'FIRE Aggressive Accumulation',
    category: 'Early Retirement',
    description: 'High-velocity wealth building: live frugally on 40% and invest 60% into index funds.',
    allocations: ['Essential Living: 35%', 'Joy Spending: 5%', 'Index Investments: 50%', 'Safety Pool: 10%']
  }
];

export const INCOME_SUGGESTIONS = [
  { label: 'Salary (Full-time)', keywords: 'salary sal job primary ctc full time work monthly company in hand' },
  { label: 'Salary Advance / Bonus', keywords: 'salary bonus advance incentive appraisal performance perk diwali' },
  { label: 'Side Hustle', keywords: 'side hustle gig freelancing second income hobby passive' },
  { label: 'Freelance Project', keywords: 'freelance project client dev design gig upwork fiverr' },
  { label: 'Consulting Retainer', keywords: 'consulting retainer advisory contract monthly professional fee' },
  { label: 'Business Revenue', keywords: 'business sales revenue store ecommerce profit invoice client' },
  { label: 'Rental Income', keywords: 'rental rent property house flat tenant lease pg commercial' },
  { label: 'Stock Dividends & Gains', keywords: 'dividend stocks equity shares mutual fund sip profit capital' },
  { label: 'Reimbursement / Claim', keywords: 'reimbursement expense claim refund medical travel food corporate' },
  { label: 'Gift / Family Support', keywords: 'gift family support parents relative transfer pocket money' },
  { label: 'Crypto Yield / Staking', keywords: 'crypto staking yield airdrop bitcoin eth defi rewards' },
  { label: 'Interest Income', keywords: 'interest fd fixed deposit savings bank returns rd post office' },
];

export const POPULAR_INCOME_PILLS = [
  'Salary',
  'Side Hustle',
  'Freelance',
  'Bonus',
  'Rental',
  'Dividends'
];

export const POPULAR_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

export const MORE_CURRENCIES = [
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ)' },
  { code: 'CAD', symbol: '$', label: 'CAD ($)' },
  { code: 'AUD', symbol: '$', label: 'AUD ($)' },
  { code: 'SGD', symbol: '$', label: 'SGD ($)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
];

// ── SVG Radial Progress Gauge ───────────────────────────────────────────────
function CircularProgress({
  percentage,
  size = 54,
  strokeWidth = 5
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#28321E"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clampedPct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#6C8F3C"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
      <span className="absolute text-[11px] font-bold text-white tabular-nums">
        {percentage}%
      </span>
    </div>
  );
}

import { createPortal } from 'react-dom';

// ── Modal Backdrop Shell ──────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const [isGuideActive, setIsGuideActive] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkGuide = () => {
      setIsGuideActive(typeof document !== 'undefined' && document.body.hasAttribute('data-guide-step'));
    };
    checkGuide();

    const updateVp = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };
    updateVp();
    window.visualViewport?.addEventListener('resize', updateVp);
    window.visualViewport?.addEventListener('scroll', updateVp);
    window.addEventListener('resize', updateVp);

    const obs = new MutationObserver(checkGuide);
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-guide-step'] });

    // Prevent background scrolling when modal is open
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.classList.add('modal-open');

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.body.hasAttribute('data-guide-step')) {
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Strictly block touch drag on background
    const preventTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.modal-scrollable')) return;
      e.preventDefault();
    };
    window.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchmove', preventTouch);
      window.visualViewport?.removeEventListener('resize', updateVp);
      window.visualViewport?.removeEventListener('scroll', updateVp);
      window.removeEventListener('resize', updateVp);
      obs.disconnect();
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto overscroll-contain select-none"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh'
      }}
      onClick={isGuideActive ? undefined : () => onCloseRef.current?.()}
    >
      <div
        className="bg-[#1C1A16] border border-[#2F2C25] rounded-2xl w-full max-w-sm sm:max-w-md text-white shadow-2xl animate-scale-in flex flex-col overflow-hidden my-auto"
        style={{
          maxHeight: viewportHeight ? `${Math.min(viewportHeight - 24, 620)}px` : '82dvh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#282620] shrink-0">
          <h3 className="font-semibold text-sm sm:text-base text-white tracking-tight">{title}</h3>
          <button
            type="button"
            disabled={isGuideActive}
            aria-disabled={isGuideActive}
            onClick={isGuideActive ? undefined : () => onCloseRef.current?.()}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors modal-header-close-btn ${
              isGuideActive
                ? 'opacity-20 cursor-not-allowed pointer-events-none text-[#555]'
                : 'text-[#8E8A82] hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain modal-scrollable flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Settings Component ───────────────────────────────────────────────
export function ProfileSection() {
  const session = useAppStore(state => state.session);
  const syncStatus = useAppStore(state => state.syncStatus);
  const triggerSyncPass = useAppStore(state => state.triggerSyncPass);
  const updateProfile = useAppStore(state => state.updateProfile);
  const resetDatabaseToDefaults = useAppStore(state => state.resetDatabaseToDefaults);
  const logout = useAppStore(state => state.logout);
  const addGoal = useAppStore(state => state.addGoal);
  const exportAllData = useAppStore(state => state.exportAllData);
  const importAllData = useAppStore(state => state.importAllData);
  const accounts = useAppStore(state => state.accounts);
  const addAccount = useAppStore(state => state.addAccount);
  const updateAccountName = useAppStore(state => state.updateAccountName);
  const deleteAccount = useAppStore(state => state.deleteAccount);
  const categories = useAppStore(state => state.categories);
  const ledger = useAppStore(state => state.ledger);
  const goals = useAppStore(state => state.goals);
  const addTransaction = useAppStore(state => state.addTransaction);
  const storeSubView = useAppStore(state => state.settingsSubView);
  const setSettingsSubView = useAppStore(state => state.setSettingsSubView);
  const storeInitialTab = useAppStore(state => state.settingsInitialTab);
  const incomeSources = useAppStore(state => state.incomeSources);
  const scheduledSpends = useAppStore(state => state.scheduledSpends);
  const addIncomeSource = useAppStore(state => state.addIncomeSource);
  const updateIncomeSource = useAppStore(state => state.updateIncomeSource);
  const deleteIncomeSource = useAppStore(state => state.deleteIncomeSource);
  const addScheduledSpend = useAppStore(state => state.addScheduledSpend);
  const deleteScheduledSpend = useAppStore(state => state.deleteScheduledSpend);
  const payScheduledSpendEarly = useAppStore(state => state.payScheduledSpendEarly);
  const depositFromIncomeSource = useAppStore(state => state.depositFromIncomeSource);
  const resetMonthlyExpenses = useAppStore(state => state.resetMonthlyExpenses);
  const resetAccountLedger = useAppStore(state => state.resetAccountLedger);
  const resetAllData = useAppStore(state => state.resetAllData);
  const navigateToAccountHistory = useAppStore(state => state.navigateToAccountHistory);
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Storage Persistence Status
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    getStorageInfo().then(setStorageInfo);
  }, []);

  const handleRequestStorage = async () => {
    const granted = await requestStoragePersistence();
    const updated = await getStorageInfo();
    setStorageInfo(updated);
    if (granted || updated.isPersisted) {
      showToast('Persistent offline storage granted!');
    } else {
      showToast('Storage permission handled by browser policy.');
    }
  };

  // User custom display name (stored locally for guest / offline mode)
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('richingness_user_custom_name_v1') || 'Personal Budget';
    }
    return 'Personal Budget';
  });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState(userName);

  // Expandable envelope categories state inside account breakdown
  const [expandedEnvelopeNodes, setExpandedEnvelopeNodes] = useState<Record<string, boolean>>({});

  // Hierarchical rules tree
  const hierarchicalTree: CategoryNodeAllocation[] = (() => {
    // If no categories exist in store, do NOT show fake/uncreated categories!
    if (categories.length === 0) {
      return [];
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('richingness_category_allocations_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.globalTree && parsed.globalTree.length > 0) {
            return parsed.globalTree;
          }
        }
      } catch {
        // fallback
      }
    }
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      percentage: Number(c.budgetAmount) / 100 || 0,
      level: 1,
      children: []
    }));
  })();

  // Edit Income Source Modal State (Clickable Income Streams)
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false);
  const [editIncName, setEditIncName] = useState('');
  const [editIncAmount, setEditIncAmount] = useState('');
  const [editIncIsRegular, setEditIncIsRegular] = useState(true);
  const [editIncDay, setEditIncDay] = useState('1');
  const [editIncAllocationMode, setEditIncAllocationMode] = useState<'SPREAD' | 'DIRECT_CATEGORY'>('SPREAD');
  const [editIncTargetAccount, setEditIncTargetAccount] = useState<string>('GLOBAL');

  const openEditIncomeModal = (src: IncomeSource) => {
    setEditingIncome(src);
    setEditIncName(src.name);
    setEditIncAmount(src.amount.toString());
    setEditIncIsRegular(src.frequency !== 'ONE_TIME');
    setEditIncDay((src.dayOfMonth || 1).toString());
    setEditIncAllocationMode(src.allocationMode);
    setEditIncTargetAccount(src.targetAccountId || 'GLOBAL');
    setShowEditIncomeModal(true);
  };

  const handleUpdateIncomeSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome) return;
    const amt = parseFloat(editIncAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }
    updateIncomeSource(editingIncome.id, {
      name: editIncName.trim() || 'Income Stream',
      amount: amt,
      frequency: editIncIsRegular ? 'MONTHLY' : 'ONE_TIME',
      dayOfMonth: editIncIsRegular ? Math.max(1, Math.min(31, parseInt(editIncDay) || 1)) : undefined,
      allocationMode: editIncAllocationMode,
      targetAccountId: editIncTargetAccount,
    });
    setShowEditIncomeModal(false);
    showToast(`Updated income stream "${editIncName}"!`);
  };

  // ── Profiles System ("This, That, and Those") ────────────────────────────
  const [profiles, setProfiles] = useState<UserProfileItem[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('prof-guest');

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const isGuestActive = activeProfile.type === 'Guest' || activeProfile.id === 'prof-guest';

  // Toggle tab: 'my-account' vs 'all-categories' (defaults to 'my-account' when going to Settings)
  const [activeSegment, setActiveSegment] = useState<'my-account' | 'all-categories'>(() => {
    if (categories.length === 0 && storeSubView === 'account-categories') {
      return 'all-categories';
    }
    return 'my-account';
  });
  const [subView, setSubView] = useState<'overview' | 'account-categories'>(() => {
    if (storeSubView) return storeSubView;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('screen') === 'allocations' || params.get('view') === 'allocations') {
        return 'account-categories';
      }
    }
    return 'overview';
  });

  useEffect(() => {
    if (storeSubView) {
      setSubView(storeSubView);
      if (storeSubView === 'overview') {
        setActiveSegment('my-account');
      }
    } else {
      setSubView('overview');
      setActiveSegment('my-account');
    }
  }, [storeSubView]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  // Modals
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [isSubmittingFunds, setIsSubmittingFunds] = useState(false);
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsAccountId, setFundsAccountId] = useState(accounts[0]?.id || '');
  const [fundsNote, setFundsNote] = useState('');
  const [fundsDepositType, setFundsDepositType] = useState<'REGULAR' | 'ONE_TIME'>('REGULAR');
  const [fundsAllocationMode, setFundsAllocationMode] = useState<'SPREAD' | 'DEFAULT'>('SPREAD');
  const [fundsAmountMode, setFundsAmountMode] = useState<'MONTHLY' | 'CTC'>('MONTHLY');
  const [fundsCtcInput, setFundsCtcInput] = useState('');
  const [fundsFrequency, setFundsFrequency] = useState<'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY'>('MONTHLY');
  const [fundsDayOfMonth, setFundsDayOfMonth] = useState('1');
  const [fundsSaveAsRecurring, setFundsSaveAsRecurring] = useState(true);
  const [fundsNoteFocused, setFundsNoteFocused] = useState(false);

  // Unsaved changes confirmation dialog state
  const [unsavedWarning, setUnsavedWarning] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    onDiscard: () => void;
  } | null>(null);

  // Cash Flow & Schedules state
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showAddSpendModal, setShowAddSpendModal] = useState(false);

  // New Income Source form state
  const [newIncName, setNewIncName] = useState('');
  const [newIncAmount, setNewIncAmount] = useState('');
  const [newIncFrequency, setNewIncFrequency] = useState<'ONE_TIME' | 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY'>('MONTHLY');
  const [newIncDay, setNewIncDay] = useState('1');
  const [newIncTargetAccount, setNewIncTargetAccount] = useState<'GLOBAL' | string>('GLOBAL');
  const [newIncAllocationMode, setNewIncAllocationMode] = useState<'SPREAD' | 'DIRECT_CATEGORY'>('SPREAD');
  const [newIncTargetCategory, setNewIncTargetCategory] = useState('cat-needs');

  // New Scheduled Spend form state
  const [newSpendName, setNewSpendName] = useState('');
  const [newSpendAmount, setNewSpendAmount] = useState('');
  const [newSpendFrequency, setNewSpendFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'>('MONTHLY');
  const [newSpendDueDay, setNewSpendDueDay] = useState('5');
  const [newSpendAccount, setNewSpendAccount] = useState('');
  const [newSpendCategory, setNewSpendCategory] = useState('cat-needs');

  // Account Unallocated buffers (loaded from localStorage)
  const [unallocatedByAccount, setUnallocatedByAccount] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('richingness_unallocated_by_account_v1');
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return {};
  });
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [confirmResetType, setConfirmResetType] = useState<'MONTHLY_EXPENSES' | 'ACCOUNTS' | 'ALL_DATA' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Account Management & Creation Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings' | 'credit' | 'cash'>('savings');
  const [newAccountCurrency, setNewAccountCurrency] = useState('INR');
  const [showMoreCurrencies, setShowMoreCurrencies] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState('');
  const [editingAccountName, setEditingAccountName] = useState('');
  const [showAccountOptionsModal, setShowAccountOptionsModal] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState<string | null>(null);

  // Toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Lock background scroll when any modal in Settings is open
  const isAnyProfileModalOpen = Boolean(
    showRenameModal ||
    showEditIncomeModal ||
    showProfilesModal ||
    showAddProfileModal ||
    showAuthModal ||
    showProfileEditModal ||
    showTransferModal ||
    showAddFundsModal ||
    showAddIncomeModal ||
    showAddSpendModal ||
    showAddGoalModal ||
    showTemplatesModal ||
    showPrivacyModal ||
    showHelpModal ||
    showSignOutConfirm ||
    confirmResetType ||
    showAddAccountModal ||
    showEditAccountModal ||
    showAccountOptionsModal ||
    showDeleteAccountConfirm ||
    Boolean(unsavedWarning)
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isAnyProfileModalOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isAnyProfileModalOpen]);

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState(activeProfile.name);
  const [editEmail, setEditEmail] = useState(activeProfile.email);
  const [editType, setEditType] = useState<UserProfileItem['type']>(activeProfile.type);

  // Add Profile State
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileType, setNewProfileType] = useState<UserProfileItem['type']>('Personal');
  const [newProfileCurrency, setNewProfileCurrency] = useState('INR (₹)');

  // Compute Categories list, Accounts list, and Goals dynamically from real store
  const getBalances = useAppStore(state => state.getBalances);
  const balances = getBalances();

  const accountsList: SettingAccountItem[] = accounts.map(a => {
    const bal = balances.get(a.id);
    const amountRupees = bal ? Number((bal.clearedBalance + bal.pendingBalance) / 100n) : 0;
    return {
      id: a.id,
      name: a.name,
      amount: amountRupees,
    };
  });

  // Deduplicate categories by normalized name to guarantee clean UI and accurate percentages
  type CatType = (typeof categories)[number];
  const uniqueCategories = Array.from(
    categories.reduce((map, cat) => {
      const anyCat = cat as unknown as { deletedAt?: Date; isHidden?: boolean };
      if (!anyCat.deletedAt && !anyCat.isHidden) {
        const lower = cat.name.toLowerCase().trim();
        if (!map.has(lower)) {
          map.set(lower, cat);
        }
      }
      return map;
    }, new Map<string, CatType>()).values()
  );

  const totalBudget = uniqueCategories.reduce((sum, c) => sum + (c.budgetAmount || 0n), 0n);
  const categoriesList: SettingCategoryItem[] = uniqueCategories.map(c => {
    const pct = totalBudget > 0n ? Math.round(Number((c.budgetAmount * 100n) / totalBudget)) : 0;
    return {
      id: c.id,
      name: c.name,
      percentage: pct,
    };
  });

  const goalsList: SettingGoalItem[] = goals.map(g => {
    const pct = g.targetAmount > 0n ? Number((g.currentAmount * 100n) / g.targetAmount) : 0;
    const targetRupees = Number(g.targetAmount / 100n);
    const currentRupees = Number(g.currentAmount / 100n);
    return {
      id: g.id,
      name: g.name,
      targetDate: g.targetDate ? new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'No Target',
      percentage: Math.min(100, Math.max(0, pct)),
      amountText: `₹${currentRupees.toLocaleString('en-IN')} / ₹${targetRupees.toLocaleString('en-IN')}`,
    };
  });

  // Transfer Modal State
  const [transferFromId, setTransferFromId] = useState(accounts[0]?.id || '');
  const [transferToId, setTransferToId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPurpose, setTransferPurpose] = useState('');

  // Add Goal Modal State
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetMonth, setGoalTargetMonth] = useState('December 2027');

  // Handlers
  const handleSelectProfile = (profile: UserProfileItem) => {
    setActiveProfileId(profile.id);
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditType(profile.type);
    if (profile.type === 'Guest') {
      logout();
    } else {
      updateProfile(profile.name, profile.email);
    }
    setShowProfilesModal(false);
    showToast(`Switched to ${profile.name} (${profile.type})!`);
  };

  const handleAddNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const initials = newProfileName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors: Record<UserProfileItem['type'], string> = {
      Personal: '#485F2C',
      Business: '#243C50',
      Family: '#6E4D26',
      Guest: '#282622'
    };

    const newProfile: UserProfileItem = {
      id: `prof-${Date.now()}`,
      name: newProfileName.trim(),
      email: newProfileEmail.trim() || `${newProfileName.toLowerCase().replace(/\s+/g, '')}@richingness.app`,
      type: newProfileType,
      tag: `${newProfileType} Wallet`,
      currency: newProfileCurrency,
      color: colors[newProfileType] || '#485F2C',
      avatarInitials: initials || 'NP',
      balanceNote: '₹0 Active'
    };

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setShowAddProfileModal(false);
    setShowProfilesModal(false);
    setNewProfileName('');
    setNewProfileEmail('');
    showToast(`Created & switched to profile "${newProfile.name}"!`);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'signin') {
        await authService.signIn(authEmail, authPassword);
        showToast('Signed in successfully!');
        setShowAuthModal(false);
      } else {
        await authService.signUp(authEmail, authPassword, authName || undefined);
        showToast('Account created! Verification email sent.');
        setShowAuthModal(false);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      setProfiles(prev =>
        prev.map(p =>
          p.id === activeProfileId
            ? { ...p, name: editName.trim(), email: editEmail.trim(), type: editType }
            : p
        )
      );
      updateProfile(editName.trim(), editEmail.trim() || undefined);
      setShowProfileEditModal(false);
      showToast('Profile updated!');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || isNaN(Number(transferAmount))) return;
    showToast(`₹${Number(transferAmount).toLocaleString('en-IN')} transferred successfully!`);
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferPurpose('');
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTargetAmount) return;
    try {
      const targetPaise = formatRupeesToPaise(goalTargetAmount);
      await addGoal(goalName.trim(), targetPaise, 1000000n, new Date('2027-12-31'));
      setShowAddGoalModal(false);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalCurrentAmount('');
      showToast(`Goal "${goalName}" created!`);
    } catch {
      showToast('Failed to create goal.');
    }
  };

  const handleApplyTemplate = (tmpl: typeof BUDGET_TEMPLATES[0]) => {
    setShowTemplatesModal(false);
    showToast(`Applied "${tmpl.title}" template to active budget!`);
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportAllData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `richingness_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Offline backup downloaded successfully!');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importAllData(text);
      if (result.success) {
        showToast(`Imported ${result.count} records into offline database!`);
      } else {
        showToast(`Import failed: ${result.error || 'Invalid file format'}`);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all cache and wipe all local data? This will reset every single thing on this site.')) {
      await resetDatabaseToDefaults();
    }
  };

  const handleAddFundsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingFunds) return;
    const amt = parseFloat(fundsAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    const targetAccId = fundsAccountId || selectedAccountId || accounts[0]?.id;
    if (!targetAccId) {
      showToast('No account found to deposit funds into');
      return;
    }

    setIsSubmittingFunds(true);
    try {
      const finalNote = fundsNote.trim() || (fundsDepositType === 'REGULAR' ? 'Regular Salary / Income' : 'Deposit / Add Funds');

      if (fundsAllocationMode === 'DEFAULT') {
        const nextUnallocated = {
          ...unallocatedByAccount,
          [targetAccId]: (unallocatedByAccount[targetAccId] || 0) + amt
        };
        setUnallocatedByAccount(nextUnallocated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('richingness_unallocated_by_account_v1', JSON.stringify(nextUnallocated));
          } catch {
            // ignore
          }
        }
        await addTransaction(
          targetAccId,
          'INCOME',
          formatRupeesToPaise(fundsAmount),
          'INR',
          'cat-default',
          finalNote,
          null,
          'Default Category Buffer'
        );
        showToast(`₹${amt.toLocaleString('en-IN')} deposited into Default Category (Unspread Pool)!`);
      } else {
        await addTransaction(
          targetAccId,
          'INCOME',
          formatRupeesToPaise(fundsAmount),
          'INR',
          '',
          finalNote,
          null,
          'Dynamic Category Spread'
        );
        showToast(`₹${amt.toLocaleString('en-IN')} added! Funds distributed across envelopes.`);
      }

      if (fundsDepositType === 'REGULAR' && fundsSaveAsRecurring) {
        addIncomeSource({
          name: finalNote,
          amount: amt,
          frequency: fundsFrequency,
          dayOfMonth: parseInt(fundsDayOfMonth, 10) || 1,
          targetAccountId: targetAccId,
          allocationMode: fundsAllocationMode === 'DEFAULT' ? 'DIRECT_CATEGORY' : 'SPREAD',
          targetCategoryId: fundsAllocationMode === 'DEFAULT' ? 'cat-default' : undefined,
          isActive: true
        });
      }

      setShowAddFundsModal(false);
      setFundsAmount('');
      setFundsCtcInput('');
      setFundsNote('');
    } catch {
      showToast('Failed to add funds.');
    } finally {
      setIsSubmittingFunds(false);
    }
  };

  const handleCreateIncomeSource = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newIncAmount);
    if (!newIncName.trim() || isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid stream name and amount.');
      return;
    }
    addIncomeSource({
      name: newIncName.trim(),
      amount: amt,
      frequency: newIncFrequency,
      dayOfMonth: parseInt(newIncDay, 10) || 1,
      targetAccountId: newIncTargetAccount,
      allocationMode: newIncAllocationMode,
      targetCategoryId: newIncAllocationMode === 'DIRECT_CATEGORY' ? newIncTargetCategory : undefined,
      isActive: true
    });
    setShowAddIncomeModal(false);
    setNewIncName('');
    setNewIncAmount('');
    showToast(`Income stream "${newIncName}" added!`);
  };

  const handleCreateScheduledSpend = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newSpendAmount);
    if (!newSpendName.trim() || isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid bill name and amount.');
      return;
    }
    const targetAccId = newSpendAccount || accounts[0]?.id || '';
    addScheduledSpend({
      name: newSpendName.trim(),
      amount: amt,
      frequency: newSpendFrequency,
      dueDay: parseInt(newSpendDueDay, 10) || 5,
      accountId: targetAccId,
      categoryId: newSpendCategory,
      nextDueDate: `${newSpendDueDay}th of each month`
    });
    setShowAddSpendModal(false);
    setNewSpendName('');
    setNewSpendAmount('');
    showToast(`Scheduled spend / EMI "${newSpendName}" created!`);
  };

  if (subView === 'account-categories') {
    return (
      <AccountCategoriesScreen
        onBack={(targetSegment) => {
          setSubView('overview');
          setSettingsSubView('overview');
          if (targetSegment) {
            setActiveSegment(targetSegment);
          }
        }}
        initialTab={storeInitialTab || (activeSegment === 'my-account' ? 'per-account' : 'global')}
      />
    );
  }

  return (
    <div className="w-full md:max-w-xl lg:max-w-2xl md:mx-auto space-y-4 text-white pb-6 animate-fade-up px-1 sm:px-0">

      {/* ── Toast Notification ── */}
      {feedbackMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#485F2C] text-white px-4 py-2 rounded-xl border border-[#6B8A44] shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5E89B]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── Top Header: Settings (Figma Style) ── */}
      <div className="pt-2 pb-1 flex items-center justify-between">
        <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-tight">
          Settings
        </h1>
      </div>

      {/* ── Profile Card ── */}
      <div className="relative bg-[#4E6732] rounded-2xl p-4 sm:p-5 text-white shadow-lg overflow-hidden transition-all flex items-center justify-between min-h-[80px] gap-3">
        <div
          onClick={() => {
            setRenameInput(session && !session.isGuest ? (session.name || userName) : userName);
            setShowRenameModal(true);
          }}
          className="cursor-pointer group flex-1 min-w-0"
          title="Tap to rename"
        >
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base sm:text-lg text-white leading-tight truncate group-hover:underline">
              {session && !session.isGuest ? (session.name || userName) : userName}
            </h2>
            <Pencil className="w-3.5 h-3.5 text-white/70 group-hover:text-white shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-white/70 text-xs sm:text-sm mt-1 truncate font-normal">
            {session && !session.isGuest ? session.email : 'Offline Vault'}
          </p>
        </div>

        {/* Top-Right Sign In / Sign Out Action */}
        {session && !session.isGuest ? (
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 hover:bg-red-500/25 hover:text-red-200 border border-white/15 text-white/90 text-xs font-medium transition-all cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setShowAuthModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/20 hover:border-white/40 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
            title="Sign In"
          >
            <LogIn className="w-3.5 h-3.5 text-[#C5E89B]" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* ── Accounts & Categories Section ── */}
      <div className="pt-2 space-y-3">
        <h3 className="font-bold text-base sm:text-lg text-white">Accounts & Categories</h3>

        {/* Figma Segmented Control: dark oval container with full rounded green pill */}
        <div className="bg-[#242621] p-1 rounded-full flex items-center">
          <button
            onClick={() => setActiveSegment('my-account')}
            className={`flex-1 py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center ${
              activeSegment === 'my-account'
                ? 'bg-[#4E6732] text-white shadow-sm'
                : 'text-[#8E9089] hover:text-white'
            }`}
          >
            My Account
          </button>
          <button
            onClick={() => setActiveSegment('all-categories')}
            className={`flex-1 py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center ${
              activeSegment === 'all-categories'
                ? 'bg-[#4E6732] text-white shadow-sm'
                : 'text-[#8E9089] hover:text-white'
            }`}
          >
            All Categories
          </button>
        </div>

        {/* Content Card below segmented control (Exact Figma Node 554-1763) */}
        <div className="bg-[#1C1A16] rounded-2xl p-4 sm:p-5 border border-[#2B2925] space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="font-semibold text-sm sm:text-base text-white">
              {activeSegment === 'all-categories' ? 'All Categories' : 'My Account'}
            </span>
            {activeSegment === 'all-categories' && (
              <button
                onClick={() => setSubView('account-categories')}
                className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
                title="Edit Allocation Rules"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeSegment === 'all-categories' ? (
            /* 1. All Categories Tab */
            <>
              {categoriesList.length > 0 ? (
                <div className="divide-y divide-[#2B2925]">
                  {categoriesList.map(cat => {
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between py-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              cat.name.toLowerCase().includes('need')
                                ? 'bg-[#8EBA55]'
                                : cat.name.toLowerCase().includes('want')
                                ? 'bg-[#4A90E2]'
                                : 'bg-[#E5A93C]'
                            }`}
                          />
                          <span className="text-sm font-medium text-white group-hover:text-white/95">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white/90">
                          {cat.percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-[#888] text-xs">
                  No categories created yet. Tap the edit pencil to create categories.
                </div>
              )}
            </>
          ) : (
            /* 2. My Account Tab */
            <>
              {accountsList.length > 0 ? (
                <div className="divide-y divide-[#2B2925]">
                  {accountsList.map(acc => {
                    const unallocated = unallocatedByAccount[acc.id] || 0;
                    const pool = Math.max(0, acc.amount - unallocated);
                    const isExpanded = acc.id === selectedAccountId;

                    // Recursive renderer for an envelope node with subcategories
                    const renderEnvelopeNode = (node: CategoryNodeAllocation, parentAlloc: number, depth: number = 0): React.ReactNode => {
                      const alloc = Math.round((parentAlloc * node.percentage) / 100);
                      const nodeKeyWord = node.name.toLowerCase().split(' ')[0] || '';
                      const spent = ledger
                        .filter(op => op.accountId === acc.id && op.type === 'EXPENSE' && op.referenceId && (
                          op.referenceId === node.id ||
                          op.referenceId.toLowerCase().includes(nodeKeyWord)
                        ))
                        .reduce((sum, op) => sum + Number(op.amount) / 100, 0);
                      const available = Math.max(0, alloc - spent);

                      // If zero allocation at root and pool is 0, don't show ("if category has money assigned then only will show")
                      if (alloc === 0 && spent === 0 && depth === 0) return null;

                      const hasChildren = Boolean(node.children && node.children.length > 0);
                      const isNodeExpanded = !!expandedEnvelopeNodes[`${acc.id}-${node.id}`];

                      return (
                        <div key={node.id} className="space-y-1">
                          <div
                            onClick={() => {
                              if (hasChildren) {
                                setExpandedEnvelopeNodes(prev => ({
                                  ...prev,
                                  [`${acc.id}-${node.id}`]: !prev[`${acc.id}-${node.id}`]
                                }));
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                              depth === 0 ? 'bg-[#12110E] border-[#222]' : 'bg-[#161512] border-[#282622] ml-3'
                            } ${hasChildren ? 'cursor-pointer hover:border-[#38352C]' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {hasChildren ? (
                                <ChevronRight
                                  className={`w-3.5 h-3.5 text-[#888] transition-transform duration-200 shrink-0 ${
                                    isNodeExpanded ? 'rotate-90 text-[#8EBA55]' : ''
                                  }`}
                                />
                              ) : (
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    node.name.toLowerCase().includes('need') || node.name.toLowerCase().includes('rent')
                                      ? 'bg-[#8EBA55]'
                                      : node.name.toLowerCase().includes('want') || node.name.toLowerCase().includes('dining')
                                      ? 'bg-[#4A90E2]'
                                      : 'bg-[#E5A93C]'
                                  }`}
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-white">{node.name}</span>
                                  <span className="text-[10px] text-[#888]">({node.percentage}%)</span>
                                </div>
                                <span className="text-[10px] text-[#777]">
                                  Alloc: ₹{alloc.toLocaleString('en-IN')} · Spent: ₹{spent.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-[#A8E063] block">
                                ₹{available.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[9px] text-[#666]">available</span>
                            </div>
                          </div>

                          {hasChildren && isNodeExpanded && (
                            <div className="space-y-1 pt-0.5">
                              {node.children!.map(child => renderEnvelopeNode(child, alloc, depth + 1))}
                            </div>
                          )}
                        </div>
                      );
                    };

                    const accIncomes = incomeSources.filter(src => src.targetAccountId === acc.id || (src.targetAccountId === 'GLOBAL' && acc.id === accountsList[0]?.id));
                    const accSpends = scheduledSpends.filter(s => s.accountId === acc.id || (!s.accountId && acc.id === accountsList[0]?.id));
                    const hasCashFlow = accIncomes.length > 0 || accSpends.length > 0;

                    return (
                      <div key={acc.id} className="py-2.5">
                        <div
                          onClick={() => setSelectedAccountId(isExpanded ? '' : acc.id)}
                          className="flex items-center justify-between cursor-pointer group py-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#242621] border border-[#333] flex items-center justify-center text-[#8EBA55] shrink-0">
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white group-hover:text-white/95 block">
                                {acc.name}
                              </span>
                              <span className="text-[10px] text-[#8E8A82] block">
                                {isExpanded ? 'Tap to collapse breakdown' : 'Tap to inspect categories & reallocate'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              data-guide-target="add-funds"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFundsAccountId(acc.id);
                                setShowAddFundsModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Funds</span>
                            </button>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-white num-display block">
                                ₹{acc.amount.toLocaleString('en-IN')}
                              </span>
                              {unallocated > 0 && (
                                <span className="text-[10px] text-[#E8C47A] font-medium">
                                  ₹{unallocated.toLocaleString('en-IN')} in General Funds
                                </span>
                              )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-[#888] transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#8EBA55]' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2.5 p-3.5 bg-[#171613] rounded-xl border border-[#2D2A24] space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-[#26241F] pb-2">
                              <div className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-[#8EBA55]" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Account Categories</span>
                              </div>
                              <span className="text-[11px] text-[#8E8A82]">Net Available Funds</span>
                            </div>

                            {/* Envelopes Table with Net Math */}
                            <div className="space-y-1.5">
                              {hierarchicalTree.length > 0 ? (
                                hierarchicalTree.map(rootNode => renderEnvelopeNode(rootNode, pool, 0))
                              ) : (
                                <div className="p-3 bg-[#191814] rounded-lg border border-[#2D2A24] text-center space-y-1">
                                  <p className="text-xs text-[#8E8A82]">No categories created yet.</p>
                                  <p className="text-[10px] text-[#666]">
                                    All account funds ({acc.amount > 0 ? `₹${acc.amount.toLocaleString('en-IN')}` : '₹0'}) are in General Balance.
                                  </p>
                                </div>
                              )}

                              {/* General Funds (Single unspread category) */}
                              {unallocated > 0 && (
                                <div className="flex items-center justify-between bg-[#191814] p-2.5 rounded-lg border border-[#3E382A]">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#E8C47A]" />
                                      <span className="text-xs font-semibold text-white">General Funds</span>
                                      <span className="text-[9px] bg-[#3A3222] text-[#E8C47A] px-1.5 py-0.5 rounded font-bold">General Pool</span>
                                    </div>
                                    <span className="text-[10px] text-[#A69B85]">
                                      Flexible unallocated buffer · Not split across subcategories
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-bold text-[#E8C47A] block">
                                      ₹{unallocated.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-[9px] text-[#888]">available</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Account Cash Flow (Income Streams & Recurring Spends / EMIs) */}
                            {hasCashFlow && (
                              <div className="pt-2 border-t border-[#26241F] space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <RefreshCw className="w-3 h-3 text-[#A8E063]" />
                                    Cash Flow & Schedules
                                  </span>
                                  <span className="text-[10px] text-[#888]">
                                    {accIncomes.length} Income · {accSpends.length} Spends
                                  </span>
                                </div>

                                {/* Income Streams (CLICKABLE to edit regular vs one-time, general vs spread) */}
                                {accIncomes.map(src => (
                                  <div
                                    key={src.id}
                                    onClick={() => openEditIncomeModal(src)}
                                    className="p-2.5 bg-[#12110E] hover:bg-[#181713] rounded-xl border border-[#222] hover:border-[#3D3A2F] flex items-center justify-between gap-2 cursor-pointer transition-all group"
                                    title="Tap to edit this income stream"
                                  >
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs text-white group-hover:text-[#A8E063] transition-colors truncate">
                                          {src.name}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2D2A24] text-[#C5E89B] font-medium shrink-0">
                                          {src.frequency === 'ONE_TIME' ? 'One-Time' : `Day ${src.dayOfMonth || 1}`}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#232B1C] text-[#A8E063] border border-[#3E5227] font-semibold shrink-0">
                                          {src.allocationMode === 'SPREAD' ? '50/30/20' : 'General'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-[#888]">
                                        ₹{src.amount.toLocaleString('en-IN')} · Tap to adjust rules or frequency
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs font-bold text-[#A8E063]">
                                        +₹{src.amount.toLocaleString('en-IN')}
                                      </span>
                                      <Pencil className="w-3 h-3 text-[#666] group-hover:text-white" />
                                    </div>
                                  </div>
                                ))}

                                {/* Recurring Spends & EMIs */}
                                {accSpends.map(spend => (
                                  <div
                                    key={spend.id}
                                    className="p-2.5 bg-[#12110E] rounded-xl border border-[#222] flex items-center justify-between gap-2"
                                  >
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs text-white truncate">
                                          {spend.name}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3D2D1A] text-[#E5A93C] font-medium shrink-0">
                                          Due {spend.dueDay}th
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-[#888]">
                                        ₹{spend.amount.toLocaleString('en-IN')} · {spend.frequency} · Deducts from {spend.categoryId.replace('cat-', '')}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => payScheduledSpendEarly(spend.id)}
                                        className="py-1 px-2 rounded-lg bg-[#E5832E] hover:bg-[#F28F38] text-black font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                        title="Pay now ahead of schedule"
                                      >
                                        <Zap className="w-3 h-3" />
                                        Pay Early
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          deleteScheduledSpend(spend.id);
                                          showToast(`Removed scheduled spend "${spend.name}"`);
                                        }}
                                        className="p-1 rounded-lg text-[#666] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                        title="Delete EMI / Bill"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Inside Account Actions: Add Funds, History & Edit */}
                            <div className="pt-2 flex items-center gap-2">
                              <button
                                type="button"
                                data-guide-target="add-funds"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFundsAccountId(acc.id);
                                  setShowAddFundsModal(true);
                                }}
                                className="flex-1 py-2 px-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] active:scale-[0.99] text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Funds</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToAccountHistory(acc.id);
                                }}
                                className="py-2 px-3 rounded-xl bg-[#242621] hover:bg-[#2F322B] border border-[#3E4A30] text-[#DCE8C8] hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="View Account History"
                              >
                                <History className="w-3.5 h-3.5 text-[#8EBA55]" />
                                <span>History</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAccountId(acc.id);
                                  setEditingAccountName(acc.name);
                                  setShowEditAccountModal(true);
                                }}
                                className="py-2 px-3 rounded-xl bg-[#242621] hover:bg-[#2F322B] border border-[#3E4A30] text-[#DCE8C8] hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Edit Account Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-[#888] text-xs">
                  No accounts added yet.
                </div>
              )}

              {/* Action Buttons: Add Account + Transfer Funds (only when 2+ accounts exist) */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  data-guide-target="add-account"
                  onClick={() => setShowAddAccountModal(true)}
                  className="w-full py-3.5 rounded-xl bg-[#242621] hover:bg-[#2F322B] active:scale-[0.99] text-[#DCE8C8] hover:text-white border border-[#3E4A30] font-bold text-sm transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#8EBA55]" />
                  <span>Add Account</span>
                </button>

                {accountsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="w-full py-3 rounded-xl bg-[#E87A24] hover:bg-[#F38936] active:scale-[0.99] text-[#141310] font-bold text-sm transition-all shadow-md cursor-pointer text-center"
                  >
                    Transfer Funds Between Accounts
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Goals Section ── */}
      <div className="pt-1 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Savings Goals</h3>
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="w-7 h-7 rounded-lg bg-[#201F1B] border border-[#2E2C27] text-[#888] hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Add Goal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Goals List or Empty State */}
        {goalsList.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {goalsList.map(goal => (
              <div
                key={goal.id}
                className="bg-[#1C1A16] rounded-2xl p-3 border border-[#282622] flex flex-col items-center justify-between text-center min-h-[145px]"
              >
                <div>
                  <h4 className="font-semibold text-xs text-white truncate max-w-full">
                    {goal.name}
                  </h4>
                  <p className="text-[10px] text-[#7A7872] mt-0.5 truncate">
                    {goal.targetDate}
                  </p>
                </div>

                {/* Radial Progress Gauge */}
                <div className="my-1.5">
                  <CircularProgress percentage={goal.percentage} size={48} strokeWidth={4.5} />
                </div>

                <p className="text-[10px] text-[#9E9C95] font-semibold truncate max-w-full num-display">
                  {goal.amountText}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1C1A16] rounded-2xl border border-[#282622] p-5 text-center text-[#888] text-xs">
            No savings goals set yet. Tap + to create your first goal.
          </div>
        )}
      </div>

      {/* ── Data & Backups Section ── */}
      <div className="pt-1 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Data & Backups</h3>
          <span className="text-[10px] font-bold text-[#A6C485] bg-[#4A622F]/20 px-2.5 py-0.5 rounded-full border border-[#587437]/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6C485]" />
            Encrypted & Secure
          </span>
        </div>

        <div className="bg-[#1C1A16] rounded-2xl border border-[#282622] p-4 space-y-3 shadow-md">
          {/* Quick Storage Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#12110E] p-2 rounded-xl text-center border border-[#282622]">
              <span className="block text-2xs text-[#888]">Accounts</span>
              <span className="text-xs font-bold text-white num-display">{accounts.length}</span>
            </div>
            <div className="bg-[#12110E] p-2 rounded-xl text-center border border-[#282622]">
              <span className="block text-2xs text-[#888]">Categories</span>
              <span className="text-xs font-bold text-white num-display">{categories.length}</span>
            </div>
            <div className="bg-[#12110E] p-2 rounded-xl text-center border border-[#282622]">
              <span className="block text-2xs text-[#888]">Ledger</span>
              <span className="text-xs font-bold text-white num-display">{ledger.length}</span>
            </div>
            <div className="bg-[#12110E] p-2 rounded-xl text-center border border-[#282622]">
              <span className="block text-2xs text-[#888]">Goals</span>
              <span className="text-xs font-bold text-white num-display">{goals.length}</span>
            </div>
          </div>

          {/* Backup Action Buttons */}
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={handleExportBackup}
              className="flex-1 py-2 px-3 rounded-xl bg-[#201F1B] hover:bg-[#282622] border border-[#2D2B26] hover:border-[#485F2C] text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-[#A6C485]" />
              <span>Export JSON</span>
            </button>

            <label className="flex-1 py-2 px-3 rounded-xl bg-[#201F1B] hover:bg-[#282622] border border-[#2D2B26] hover:border-[#485F2C] text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98">
              <Upload className="w-3.5 h-3.5 text-[#C5E89B]" />
              <span>Import JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          {/* Browser Storage Permission & Persistence Status */}
          <div className="pt-2 border-t border-[#282622] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${storageInfo?.isPersisted ? 'bg-[#9CD669]' : 'bg-[#E08518]'}`} />
              <span className="text-[#8E8A82]">
                {storageInfo?.isPersisted ? 'Storage: Persistent' : 'Storage: Browser Offline'}
              </span>
              {storageInfo?.usageFormatted && (
                <span className="text-[#666]">({storageInfo.usageFormatted})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!storageInfo?.isPersisted && (
                <button
                  type="button"
                  onClick={handleRequestStorage}
                  className="text-[11px] font-semibold text-[#8EBA55] hover:underline cursor-pointer"
                >
                  Enable Persistence
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('richingness_onboarding_completed');
                    localStorage.removeItem('richingness_live_tour');
                    setActiveTab('dashboard');
                    window.dispatchEvent(new CustomEvent('richingness:replay-tour'));
                  }
                }}
                className="text-[11px] font-semibold text-[#A8E063] hover:underline cursor-pointer"
                title="Replay the guided interactive walkthrough"
              >
                Replay Guided Tour
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] font-semibold text-[#EF4444] hover:underline cursor-pointer"
                title="Clear all local data and reset cache"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* ── Appearance & Theme (Dark Black Default vs Light White) ── */}
      <div className="pt-2 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Appearance & Theme</h3>
          <span className="text-xs text-[#8E8A82]">
            {theme === 'light' ? 'Light Mode (White)' : 'Dark Mode (Black Default)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Dark / Black Option (Default) */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              theme === 'dark'
                ? 'bg-[#1F1E19] border-[#4A622F] shadow-md shadow-[#4A622F]/20'
                : 'bg-[#171613] border-[#2B2925] opacity-60 hover:opacity-100'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-black border border-[#333] flex items-center justify-center text-white shrink-0">
              <Moon className="w-4 h-4 text-[#8EBA55]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Dark Mode</span>
              <span className="text-[10px] text-[#8E8A82] block">Rich Black (Default)</span>
            </div>
          </button>

          {/* Light / White Option */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              theme === 'light'
                ? 'bg-[#F3F4F6] border-[#4A622F] shadow-md shadow-[#4A622F]/20'
                : 'bg-[#171613] border-[#2B2925] opacity-60 hover:opacity-100'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#1A1A1A] shrink-0">
              <Sun className="w-4 h-4 text-[#E87A24]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Light Mode</span>
              <span className="text-[10px] text-[#8E8A82] block">Crisp White</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Support Section ── */}
      <div className="pt-2">
        <h3 className="font-bold text-base sm:text-lg text-white mb-3">Support</h3>
        <div className="bg-[#1B1A17] rounded-2xl border border-[#282622] divide-y divide-[#282622] overflow-hidden">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#8E8A82]" />
              <span className="text-sm font-medium text-white">Privacy & Security</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A7872]" />
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-[#8E8A82]" />
              <span className="text-sm font-medium text-white">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7A7872]" />
          </button>
          {!isGuestActive && (
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-red-500/10 transition-colors cursor-pointer text-left text-red-400 group"
            >
              <span className="text-sm font-medium text-red-400 group-hover:text-red-300">Sign Out to Guest Mode</span>
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* ── 1. PROFILES SWITCHER MODAL ("This, That, and Those") ── */}
      {showProfilesModal && (
        <Modal title="Manage Profiles" onClose={() => setShowProfilesModal(false)}>
          <div className="space-y-3">
            <p className="text-xs text-[#8E8A82]">
              Switch seamlessly between personal, freelance, family, or offline guest budgets:
            </p>

            {/* List of profiles */}
            <div className="space-y-2">
              {profiles.map(p => {
                const isActive = p.id === activeProfileId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#485F2C]/30 border-[#6B8A44] ring-1 ring-[#6B8A44]/50'
                        : 'bg-[#12110E] border-[#282622] hover:border-[#3D3A34]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar initials with profile custom color */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-white/10 text-white/90">
                            {p.type}
                          </span>
                        </div>
                        <p className="text-2xs text-[#8E8A82] truncate mt-0.5">{p.email} • {p.balanceNote}</p>
                      </div>
                    </div>

                    {/* Active check icon */}
                    {isActive ? (
                      <div className="w-6 h-6 rounded-full bg-[#485F2C] text-[#C5E89B] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProfile(p);
                        }}
                        className="text-2xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#C5E89B] shrink-0"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#282622]">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowProfilesModal(false);
                    setShowAddProfileModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfilesModal(false);
                    setEditName(activeProfile.name);
                    setEditEmail(activeProfile.email);
                    setEditType(activeProfile.type);
                    setShowProfileEditModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Current</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowProfilesModal(false);
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#201F1B] hover:bg-[#282622] border border-[#2D2B26] text-[#A2E060] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Cloud Account</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 2. ADD NEW PROFILE MODAL ── */}
      {showAddProfileModal && (
        <Modal title="Create New Profile" onClose={() => setShowAddProfileModal(false)}>
          <form onSubmit={handleAddNewProfile} className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Profile Name</label>
              <input
                type="text"
                required
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="e.g. Consulting Studio, Family Fund"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Email / Label</label>
              <input
                type="email"
                value={newProfileEmail}
                onChange={e => setNewProfileEmail(e.target.value)}
                placeholder="e.g. consulting@richingness.app"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Profile Type</label>
                <select
                  value={newProfileType}
                  onChange={e => setNewProfileType(e.target.value as UserProfileItem['type'])}
                  className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#485F2C]"
                >
                  <option value="Personal">Personal</option>
                  <option value="Business">Business</option>
                  <option value="Family">Family</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Currency</label>
                <select
                  value={newProfileCurrency}
                  onChange={e => setNewProfileCurrency(e.target.value)}
                  className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#485F2C]"
                >
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-sm transition-all cursor-pointer mt-2"
            >
              Save Profile
            </button>
          </form>
        </Modal>
      )}

      {/* ── 3. BROWSE TEMPLATES MODAL ── */}
      {showTemplatesModal && (
        <Modal title="Budget Templates" onClose={() => setShowTemplatesModal(false)}>
          <div className="space-y-3">
            <p className="text-xs text-[#8E8A82]">
              Choose a proven allocation framework for your cash flow:
            </p>
            <div className="space-y-2.5">
              {BUDGET_TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.id}
                  className="p-3 bg-[#12110E] border border-[#282622] rounded-xl hover:border-[#485F2C] transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{tmpl.title}</h4>
                      <p className="text-2xs text-[#8EBA55] font-semibold">{tmpl.category}</p>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-lg bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-2xs transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-2xs text-[#9E9C95] leading-relaxed">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tmpl.allocations.map(al => (
                      <span key={al} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/80 font-medium">
                        {al}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── 4. Auth Modal ── */}
      {showAuthModal && (
        <Modal title={authMode === 'signin' ? 'Sign In' : 'Create Account'} onClose={() => setShowAuthModal(false)}>
          <div className="space-y-3.5">
            {/* Google One-Click Sign In Button */}
            <button
              type="button"
              disabled={authLoading}
              onClick={async () => {
                try {
                  setAuthLoading(true);
                  await authService.signInWithOAuth('google', window.location.origin);
                } catch {
                  showToast('Redirecting to Google Sign-In…');
                } finally {
                  setAuthLoading(false);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#201F1B] hover:bg-[#282622] border border-[#35332C] hover:border-[#6B8F3C] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-[#2B2925]"></div>
              <span className="flex-shrink mx-3 text-[10px] text-[#6E6A62] uppercase tracking-wider font-semibold">or continue with email</span>
              <div className="flex-grow border-t border-[#2B2925]"></div>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-[#12110E] p-1 rounded-xl border border-[#282622]">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signin' ? 'bg-[#2A2924] text-white' : 'text-[#888]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signup' ? 'bg-[#2A2924] text-white' : 'text-[#888]'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
                />
              </div>
            )}
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>
        </div>
      </Modal>
      )}

      {/* ── 5. Edit Profile Modal ── */}
      {showProfileEditModal && (
        <Modal title="Edit Profile" onClose={() => setShowProfileEditModal(false)}>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Profile Type</label>
              <select
                value={editType}
                onChange={e => setEditType(e.target.value as UserProfileItem['type'])}
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#485F2C]"
              >
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
                <option value="Family">Family</option>
                <option value="Guest">Guest</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-sm transition-all cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileEditModal(false);
                  setShowSignOutConfirm(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-sm transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 6. Transfer Funds Modal ── */}
      {showTransferModal && (
        <Modal title="Transfer Funds" onClose={() => setShowTransferModal(false)}>
          <form onSubmit={handleTransferSubmit} className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">From Account</label>
              <select
                value={transferFromId}
                onChange={e => setTransferFromId(e.target.value)}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                {accountsList.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.amount.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">To Account</label>
              <select
                value={transferToId}
                onChange={e => setTransferToId(e.target.value)}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                {accountsList.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.amount.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="5000"
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Note / Purpose (Optional)</label>
              <input
                type="text"
                value={transferPurpose}
                onChange={e => setTransferPurpose(e.target.value)}
                placeholder="Monthly savings or fund rebalance"
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587438] active:scale-95 text-white font-bold text-xs transition-all cursor-pointer mt-2 shadow-md border border-[#64853E]/40"
            >
              Complete Transfer
            </button>
          </form>
        </Modal>
      )}

      {/* ── Add Funds to Account Modal ── */}
      {showAddFundsModal && (
        <Modal
          title="Add Funds to Account"
          onClose={() => {
            const hasData = fundsAmount.trim() !== '' || fundsCtcInput.trim() !== '' || fundsNote.trim() !== '';
            if (hasData) {
              setUnsavedWarning({
                isOpen: true,
                title: 'Discard Unsaved Deposit?',
                message: 'You have entered deposit details that are not saved yet. Do you want to discard them?',
                onDiscard: () => {
                  setUnsavedWarning(null);
                  setShowAddFundsModal(false);
                  setFundsAmount('');
                  setFundsCtcInput('');
                  setFundsNote('');
                  setFundsNoteFocused(false);
                }
              });
            } else {
              setShowAddFundsModal(false);
              setFundsNoteFocused(false);
            }
          }}
        >
          <form onSubmit={handleAddFundsSubmit} className="space-y-3.5">
            <div className="bg-[#141B10] border border-[#27351F] rounded-xl p-3 text-xs text-[#C5E89B] space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <span>💰 Smart Fund Deposit</span>
                {fundsDepositType === 'REGULAR' && (
                  <span className="text-[10px] bg-[#4A622F] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                    50/30/20 Auto-Split
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[#8EA083] leading-relaxed">
                {fundsDepositType === 'REGULAR'
                  ? 'Regular / Salary deposits automatically divide into Needs (50%), Wants (30%), and Savings (20%) across your categories.'
                  : 'One-Time deposits add funds directly without splitting, perfect for gifts, refunds, or bonus cash.'}
              </p>
            </div>

            {/* Regular vs One-Time selector */}
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1.5">Deposit Type</label>
              <div className="grid grid-cols-2 gap-2 bg-[#141310] p-1 rounded-xl border border-[#2B2925]">
                <button
                  type="button"
                  onClick={() => setFundsDepositType('REGULAR')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    fundsDepositType === 'REGULAR'
                      ? 'bg-[#4A622F] text-white shadow-sm'
                      : 'text-[#8E8A82] hover:text-white'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Regular / Salary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFundsDepositType('ONE_TIME')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    fundsDepositType === 'ONE_TIME'
                      ? 'bg-[#4A622F] text-white shadow-sm'
                      : 'text-[#8E8A82] hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>One-Time Deposit</span>
                </button>
              </div>
            </div>

            {/* Allocation Method: Spread vs Default Category */}
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1.5">Allocation Method</label>
              <div className="grid grid-cols-2 gap-2 bg-[#141310] p-1 rounded-xl border border-[#2B2925]">
                <button
                  type="button"
                  onClick={() => setFundsAllocationMode('SPREAD')}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    fundsAllocationMode === 'SPREAD'
                      ? 'bg-[#4A622F] text-white shadow-sm font-bold'
                      : 'text-[#8E8A82] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Spread Categories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFundsAllocationMode('DEFAULT')}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    fundsAllocationMode === 'DEFAULT'
                      ? 'bg-[#E87A24] text-white shadow-sm font-bold'
                      : 'text-[#8E8A82] hover:text-white'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Default Category</span>
                </button>
              </div>
              <p className="text-[10px] text-[#7E8D74] mt-1 pl-1">
                {fundsAllocationMode === 'SPREAD'
                  ? 'Distributes across categories according to configured 50/30/20 percentage rules.'
                  : 'Single unspread default buffer category — funds stay intact without splitting.'}
              </p>
            </div>

            {/* Target Account */}
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Target Account</label>
              {accountsList.length <= 1 ? (
                <div className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2.5 text-xs text-white font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#8EBA55]" />
                    <span>{accounts[0]?.name || 'Primary Account'}</span>
                  </div>
                  <span className="text-[#8EBA55] font-semibold">₹{(accountsList[0]?.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <select
                  value={fundsAccountId}
                  onChange={e => setFundsAccountId(e.target.value)}
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                >
                  {accountsList.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.amount.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount Field: If ONE_TIME, clean direct amount; if REGULAR, Monthly vs CTC mode */}
            {fundsDepositType === 'ONE_TIME' ? (
              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={fundsAmount}
                  onChange={e => setFundsAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4A622F] font-bold"
                />
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#8E8A82] font-semibold">Quick fill:</span>
                  {[
                    { label: '+ ₹5,000', val: '5000' },
                    { label: '+ ₹10,000', val: '10000' },
                    { label: '+ ₹25,000', val: '25000' }
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setFundsAmount(chip.val)}
                      className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer border ${
                        fundsAmount === chip.val
                          ? 'bg-[#4A622F] text-white border-[#6B8A44]'
                          : 'bg-[#1C1A16] text-[#A09C94] hover:text-white border-[#2E2C27]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-2xs font-semibold text-[#8E8A82] uppercase">
                    {fundsAmountMode === 'CTC' ? 'Annual CTC / Package (₹)' : 'Monthly Deposit Amount (₹)'}
                  </label>
                  <div className="flex items-center gap-1 bg-[#141310] p-0.5 rounded-lg border border-[#2B2925]">
                    <button
                      type="button"
                      onClick={() => setFundsAmountMode('MONTHLY')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        fundsAmountMode === 'MONTHLY' ? 'bg-[#374923] text-[#A8E063]' : 'text-[#8E8A82] hover:text-white'
                      }`}
                    >
                      Monthly Base
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFundsAmountMode('CTC');
                        if (fundsAmount && !fundsCtcInput) {
                          const parsed = parseFloat(fundsAmount);
                          if (!isNaN(parsed) && parsed > 0) {
                            setFundsCtcInput(String(Math.round(parsed * 12)));
                          }
                        }
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                        fundsAmountMode === 'CTC' ? 'bg-[#374923] text-[#A8E063]' : 'text-[#8E8A82] hover:text-white'
                      }`}
                    >
                      Annual CTC (÷ 12)
                    </button>
                  </div>
                </div>

                {fundsAmountMode === 'CTC' ? (
                  <div className="space-y-1.5">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={fundsCtcInput}
                      onChange={e => {
                        const val = e.target.value;
                        setFundsCtcInput(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed) && parsed > 0) {
                          setFundsAmount(String(Math.round(parsed / 12)));
                        } else {
                          setFundsAmount('');
                        }
                      }}
                      placeholder="e.g. 1200000 (12 LPA)"
                      className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4A622F] font-bold"
                    />
                    {parseFloat(fundsCtcInput) > 0 && (
                      <p className="text-[11px] text-[#A8E063] font-medium pl-1">
                        ≈ ₹{Math.round(parseFloat(fundsCtcInput) / 12).toLocaleString('en-IN')} / month in-hand deposit
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={fundsAmount}
                    onChange={e => setFundsAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4A622F] font-bold"
                  />
                )}
                {/* Quick Salary Chips */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#8E8A82] font-semibold">Quick fill:</span>
                  {[
                    { label: '+ ₹25,000', val: '25000' },
                    { label: '+ ₹50,000', val: '50000' },
                    { label: '+ ₹1,00,000', val: '100000' }
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => {
                        setFundsAmount(chip.val);
                        if (fundsAmountMode === 'CTC') {
                          setFundsCtcInput(String(Number(chip.val) * 12));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all cursor-pointer border ${
                        fundsAmount === chip.val
                          ? 'bg-[#4A622F] text-white border-[#6B8A44]'
                          : 'bg-[#1C1A16] text-[#A09C94] hover:text-white border-[#2E2C27]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Schedule Details ONLY if Regular Deposit */}
            {fundsDepositType === 'REGULAR' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Frequency</label>
                    <select
                      value={fundsFrequency}
                      onChange={e => setFundsFrequency(e.target.value as 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY')}
                      className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="BI_WEEKLY">Bi-Weekly</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Payout Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={fundsDayOfMonth}
                      onChange={e => setFundsDayOfMonth(e.target.value)}
                      placeholder="1"
                      className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={fundsSaveAsRecurring}
                    onChange={e => setFundsSaveAsRecurring(e.target.checked)}
                    className="accent-[#6B8F3C] w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-[#C5E89B]">Save as recurring stream in Cash Flow schedules</span>
                </label>
              </>
            )}

            {/* Source / Note with Interactive Autocomplete & Suggestions */}
            <div className="relative">
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Source / Note (Optional)</label>
              <input
                type="text"
                value={fundsNote}
                onFocus={() => setFundsNoteFocused(true)}
                onChange={e => {
                  setFundsNote(e.target.value);
                  setFundsNoteFocused(true);
                }}
                placeholder="e.g. Monthly Salary, Freelance Deposit, Client Payment"
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              />

              {/* Dynamic Typeahead Suggestions Dropdown */}
              {fundsNoteFocused && fundsNote.trim().length > 0 && (() => {
                const q = fundsNote.trim().toLowerCase();
                const matches = INCOME_SUGGESTIONS.filter(s =>
                  s.label.toLowerCase().includes(q) || s.keywords.includes(q)
                );
                if (matches.length === 0) return null;
                return (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#1C1A16] border border-[#333027] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 max-h-48 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-[#7E7A72] uppercase px-2 py-1">Matching Sources</p>
                    {matches.map(s => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => {
                          setFundsNote(s.label);
                          setFundsNoteFocused(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-white hover:bg-[#2A371F] hover:text-[#A8E063] transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{s.label}</span>
                        <span className="text-[10px] text-[#7E7A72]">Select</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Quick Preset Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[#7E7A72]">Presets:</span>
                {POPULAR_INCOME_PILLS.map(pill => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => {
                      setFundsNote(pill);
                      setFundsNoteFocused(false);
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      fundsNote === pill
                        ? 'bg-[#2B3B1D] text-[#A8E063] border-[#4A622F]'
                        : 'bg-[#181714] text-[#8E8A82] border-[#2A2824] hover:border-[#444] hover:text-white'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingFunds}
              className={`w-full py-3 rounded-xl bg-[#4A622F] hover:bg-[#587438] active:scale-95 text-white font-bold text-xs transition-all cursor-pointer mt-2 shadow-md border border-[#64853E]/40 ${
                isSubmittingFunds ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmittingFunds ? 'Processing Deposit…' : 'Deposit & Distribute Funds'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Add New Account Modal ── */}
      {showAddAccountModal && (
        <Modal
          title="Add New Account"
          onClose={() => {
            if (typeof document !== 'undefined' && document.body.hasAttribute('data-guide-step')) return;
            if (newAccountName.trim() !== '') {
              setUnsavedWarning({
                isOpen: true,
                title: 'Discard New Account?',
                message: "You have entered an account name that hasn't been saved. Do you want to discard it?",
                onDiscard: () => {
                  setUnsavedWarning(null);
                  setShowAddAccountModal(false);
                  setNewAccountName('');
                }
              });
            } else {
              setShowAddAccountModal(false);
              setNewAccountName('');
            }
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newAccountName.trim()) return;
              await addAccount(newAccountName.trim(), newAccountType, newAccountCurrency);
              setShowAddAccountModal(false);
              setNewAccountName('');
              showToast(`Account "${newAccountName.trim()}" created successfully!`);
            }}
            className="space-y-4"
          >
            {/* Account Name */}
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1.5 tracking-wider">
                Account Name
              </label>
              <input
                type="text"
                required
                autoFocus
                data-guide-target="account-name-input"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
                placeholder="e.g. HDFC Checking, Cash Wallet, Savings…"
                className="w-full bg-[#12110E] border border-[#2B2925] focus:border-[#4A622F] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
              />
            </div>

            {/* Currency Selection Pills (Original Design) */}
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1.5 tracking-wider">
                Currency
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CURRENCIES.map(c => {
                  const isSelected = newAccountCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      data-guide-target={c.code === 'INR' ? 'currency-inr-btn' : undefined}
                      onClick={() => {
                        setNewAccountCurrency(c.code);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('guide:currency-selected', { detail: c.code }));
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border relative ${
                        isSelected
                          ? 'bg-[#4A622F] text-white border-[#6B8A44] shadow-md shadow-[#4A622F]/30'
                          : 'bg-[#141310] text-[#A09C94] hover:text-white border-[#2B2925] hover:border-[#4A622F]'
                      }`}
                    >
                      <span>{c.label}</span>
                    </button>
                  );
                })}

                {/* + More Button */}
                <button
                  type="button"
                  onClick={() => setShowMoreCurrencies(!showMoreCurrencies)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                    showMoreCurrencies
                      ? 'bg-[#2B2925] text-white border-[#4A622F]'
                      : 'bg-[#141310] text-[#8E8A82] hover:text-white border-[#2B2925]'
                  }`}
                  title="More currencies"
                >
                  <Plus className={`w-3.5 h-3.5 transition-transform ${showMoreCurrencies ? 'rotate-45' : ''}`} />
                  <span>{showMoreCurrencies ? 'Less' : 'More'}</span>
                </button>
              </div>

              {/* Expanded More Currencies Grid */}
              {showMoreCurrencies && (
                <div className="p-2.5 mt-2 rounded-xl bg-[#141310] border border-[#2B2925] grid grid-cols-3 gap-1.5 animate-fade-in">
                  {MORE_CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setNewAccountCurrency(c.code);
                        setShowMoreCurrencies(false);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('guide:currency-selected', { detail: c.code }));
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all cursor-pointer border ${
                        newAccountCurrency === c.code
                          ? 'bg-[#4A622F] text-white border-[#6B8A44]'
                          : 'bg-[#1C1A16] text-[#A09C94] hover:text-white border-[#2E2C27]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions: Cancel & Create Account */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={typeof document !== 'undefined' && document.body.hasAttribute('data-guide-step')}
                onClick={() => {
                  if (typeof document !== 'undefined' && document.body.hasAttribute('data-guide-step')) return;
                  setShowAddAccountModal(false);
                }}
                className={`flex-1 py-2.5 rounded-xl border font-semibold text-xs transition-all ${
                  typeof document !== 'undefined' && document.body.hasAttribute('data-guide-step')
                    ? 'bg-[#171613] border-[#22201C] text-[#555] cursor-not-allowed pointer-events-none'
                    : 'bg-[#201F1B] hover:bg-[#2B2924] border-[#2E2C27] text-[#888] hover:text-white cursor-pointer'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-guide-target="account-submit-btn"
                disabled={!newAccountName.trim()}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                  newAccountName.trim()
                    ? 'bg-[#4A622F] hover:bg-[#587437] text-white shadow-[#4A622F]/30'
                    : 'bg-[#201F1B] text-[#666] border border-[#2E2C27] cursor-not-allowed opacity-60'
                }`}
              >
                Create Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Account Details & Manage Funds Modal ── */}
      {showEditAccountModal && (
        <Modal
          title="Account Details & Actions"
          onClose={() => {
            const orig = accounts.find(a => a.id === editingAccountId)?.name || '';
            if (editingAccountName.trim() !== orig && editingAccountName.trim() !== '') {
              setUnsavedWarning({
                isOpen: true,
                title: 'Discard Account Changes?',
                message: 'You have edited the account name without saving. Do you want to discard your changes?',
                onDiscard: () => {
                  setUnsavedWarning(null);
                  setShowEditAccountModal(false);
                  setEditingAccountId('');
                  setEditingAccountName('');
                }
              });
            } else {
              setShowEditAccountModal(false);
              setEditingAccountId('');
              setEditingAccountName('');
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">
                Account Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingAccountName}
                  onChange={e => setEditingAccountName(e.target.value)}
                  placeholder="Account name"
                  className="flex-1 bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (editingAccountId && editingAccountName.trim()) {
                      await updateAccountName(editingAccountId, editingAccountName.trim());
                      showToast('Account name updated!');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#242621] hover:bg-[#2F322B] border border-[#3E4A30] text-[#DCE8C8] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#171613] border border-[#2B2925] space-y-2.5">
              <span className="text-[11px] font-semibold text-[#8E8A82] uppercase tracking-wider block">
                Manage Funds & Envelopes
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAccountModal(false);
                    setFundsAccountId(editingAccountId);
                    setShowAddFundsModal(true);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Funds / Deposit to this Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAccountModal(false);
                    setSubView('account-categories');
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#201F1B] hover:bg-[#2B2924] border border-[#2E2C27] text-[#DCE8C8] hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#8EBA55]" />
                  <span>Configure Category Allocation Rules</span>
                </button>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEditAccountModal(false)}
                className="py-2.5 px-4 rounded-xl bg-[#201F1B] hover:bg-[#2B2924] border border-[#2E2C27] text-[#888] hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>

              {/* Discrete Delete Account Option */}
              <button
                type="button"
                onClick={() => {
                  if (accounts.length <= 1) {
                    showToast('Cannot delete your only account. Add another account first.');
                    return;
                  }
                  setShowDeleteAccountConfirm(editingAccountId);
                }}
                className="text-[11px] font-semibold text-[#B34040] hover:text-[#E05252] transition-colors flex items-center gap-1.5 p-2 rounded-lg hover:bg-[#2B1717] cursor-pointer"
                title="Delete this account"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete Account Warning Modal ── */}
      {showDeleteAccountConfirm && (
        <Modal
          title="Delete Account"
          onClose={() => setShowDeleteAccountConfirm(null)}
        >
          <div className="space-y-4">
            <div className="bg-[#2B1717] border border-[#592626] rounded-xl p-3.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#E05252] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-white">
                  Warning: Delete &ldquo;{accounts.find(a => a.id === showDeleteAccountConfirm)?.name}&rdquo;?
                </h4>
                <p className="text-[11px] text-[#D8A3A3] leading-relaxed">
                  This account will be permanently removed from your active accounts list. Envelopes for this account will be archived. Historical transaction records will be retained.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteAccountConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#242621] hover:bg-[#2F322B] text-xs font-semibold text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = showDeleteAccountConfirm;
                  const targetObj = accounts.find(a => a.id === targetId);
                  setShowDeleteAccountConfirm(null);
                  setShowEditAccountModal(false);
                  if (targetId) {
                    await deleteAccount(targetId);
                    showToast(`Account "${targetObj?.name || 'Account'}" deleted.`);
                    if (selectedAccountId === targetId) {
                      const remaining = accounts.filter(a => a.id !== targetId);
                      setSelectedAccountId(remaining[0]?.id || '');
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#B33939] text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Account Options Modal (Header Pencil Tap) ── */}
      {showAccountOptionsModal && (
        <Modal
          title="Account & Funds Management"
          onClose={() => setShowAccountOptionsModal(false)}
        >
          <div className="space-y-3">
            <p className="text-xs text-[#8E8A82]">
              Select an action to manage your account, deposit funds, or configure envelope allocations:
            </p>

            <button
              type="button"
              onClick={() => {
                setShowAccountOptionsModal(false);
                setFundsAccountId(selectedAccountId || accounts[0]?.id || '');
                setShowAddFundsModal(true);
              }}
              className="w-full p-3 rounded-xl bg-[#171613] hover:bg-[#22211C] border border-[#2E2C27] hover:border-[#4A622F] text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#4A622F]/20 text-[#8EBA55] flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-xs text-white group-hover:text-[#DCE8C8] block">
                  Add Funds / Deposit
                </span>
                <span className="text-[10px] text-[#888] block">
                  Deposit salary, side income, or one-time funds with automatic envelope allocation
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAccountOptionsModal(false);
                setShowAddAccountModal(true);
              }}
              className="w-full p-3 rounded-xl bg-[#171613] hover:bg-[#22211C] border border-[#2E2C27] hover:border-[#4A622F] text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#242621] text-[#DCE8C8] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-xs text-white group-hover:text-[#DCE8C8] block">
                  Add New Account
                </span>
                <span className="text-[10px] text-[#888] block">
                  Connect another bank checking, savings, or cash wallet account
                </span>
              </div>
            </button>

            {accounts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowAccountOptionsModal(false);
                  const acc = accounts.find(a => a.id === selectedAccountId) || accounts[0];
                  setEditingAccountId(acc.id);
                  setEditingAccountName(acc.name);
                  setShowEditAccountModal(true);
                }}
                className="w-full p-3 rounded-xl bg-[#171613] hover:bg-[#22211C] border border-[#2E2C27] hover:border-[#4A622F] text-left transition-all cursor-pointer group flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#242621] text-[#C5E89B] flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-white group-hover:text-[#DCE8C8] block">
                    Edit Account Details
                  </span>
                  <span className="text-[10px] text-[#888] block">
                    Rename account or manage account settings
                  </span>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowAccountOptionsModal(false);
                setSubView('account-categories');
              }}
              className="w-full p-3 rounded-xl bg-[#171613] hover:bg-[#22211C] border border-[#2E2C27] hover:border-[#4A622F] text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[#242621] text-[#E8C47A] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-xs text-white group-hover:text-[#DCE8C8] block">
                  Category Allocation Rules
                </span>
                <span className="text-[10px] text-[#888] block">
                  Customize percentage splits (Needs 50%, Wants 30%, Savings 20%)
                </span>
              </div>
            </button>
          </div>
        </Modal>
      )}

      {/* ── Add Income Stream Modal ── */}
      {showAddIncomeModal && (
        <Modal title="Add Income Stream" onClose={() => setShowAddIncomeModal(false)}>
          <form onSubmit={handleCreateIncomeSource} className="space-y-3.5">
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Stream Name</label>
              <input
                type="text"
                required
                value={newIncName}
                onChange={e => setNewIncName(e.target.value)}
                placeholder="e.g. Full-time Salary, Rental Income"
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Expected Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={newIncAmount}
                  onChange={e => setNewIncAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Frequency</label>
                <select
                  value={newIncFrequency}
                  onChange={e => setNewIncFrequency(e.target.value as IncomeSource['frequency'])}
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="BI_WEEKLY">Bi-Weekly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
              </div>
            </div>

            {newIncFrequency === 'MONTHLY' && (
              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newIncDay}
                  onChange={e => setNewIncDay(e.target.value)}
                  placeholder="1"
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                />
              </div>
            )}

            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Target Account</label>
              <select
                value={newIncTargetAccount}
                onChange={e => setNewIncTargetAccount(e.target.value)}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                <option value="GLOBAL">All Accounts (Global Default)</option>
                {accountsList.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Allocation Mode</label>
              <select
                value={newIncAllocationMode}
                onChange={e => setNewIncAllocationMode(e.target.value as IncomeSource['allocationMode'])}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                <option value="SPREAD">Auto-Spread across Categories (50/30/20)</option>
                <option value="DIRECT_CATEGORY">Route to Specific Category</option>
              </select>
            </div>

            {newIncAllocationMode === 'DIRECT_CATEGORY' && (
              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Target Category</label>
                <select
                  value={newIncTargetCategory}
                  onChange={e => setNewIncTargetCategory(e.target.value)}
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                >
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587438] active:scale-95 text-white font-bold text-xs transition-all cursor-pointer mt-2 shadow-md border border-[#64853E]/40"
            >
              Create Income Stream
            </button>
          </form>
        </Modal>
      )}

      {/* ── Add Scheduled Spend / EMI Modal ── */}
      {showAddSpendModal && (
        <Modal title="Schedule Recurring Spend / EMI" onClose={() => setShowAddSpendModal(false)}>
          <form onSubmit={handleCreateScheduledSpend} className="space-y-3.5">
            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Bill / EMI Name</label>
              <input
                type="text"
                required
                value={newSpendName}
                onChange={e => setNewSpendName(e.target.value)}
                placeholder="e.g. Home Loan EMI, Netflix, Rent"
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={newSpendAmount}
                  onChange={e => setNewSpendAmount(e.target.value)}
                  placeholder="15000"
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Due Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newSpendDueDay}
                  onChange={e => setNewSpendDueDay(e.target.value)}
                  placeholder="5"
                  className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Frequency</label>
              <select
                value={newSpendFrequency}
                onChange={e => setNewSpendFrequency(e.target.value as ScheduledSpend['frequency'])}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="ONE_TIME">One-Time</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Deduct from Account</label>
              <select
                value={newSpendAccount}
                onChange={e => setNewSpendAccount(e.target.value)}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                {accountsList.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.amount.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase mb-1">Envelope Category</label>
              <select
                value={newSpendCategory}
                onChange={e => setNewSpendCategory(e.target.value)}
                className="w-full bg-[#12110E] border border-[#2B2925] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4A622F]"
              >
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>📂 {cat.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#E87A24] hover:bg-[#F38936] text-[#141310] font-bold text-xs transition-all cursor-pointer mt-2 shadow-md"
            >
              Schedule Spend / EMI
            </button>
          </form>
        </Modal>
      )}

      {/* ── 7. Add Goal Modal ── */}
      {showAddGoalModal && (
        <Modal title="Create New Goal" onClose={() => setShowAddGoalModal(false)}>
          <form onSubmit={handleAddGoalSubmit} className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Goal Name</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                placeholder="e.g. Europe Trip or New Laptop"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Target Amount (₹)</label>
              <input
                type="number"
                required
                min="100"
                value={goalTargetAmount}
                onChange={e => setGoalTargetAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Initial Saved Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={goalCurrentAmount}
                onChange={e => setGoalCurrentAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-[#888] uppercase mb-1">Target Date</label>
              <input
                type="text"
                value={goalTargetMonth}
                onChange={e => setGoalTargetMonth(e.target.value)}
                placeholder="e.g. December 2027"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-sm transition-all cursor-pointer mt-2"
            >
              Add Goal
            </button>
          </form>
        </Modal>
      )}

      {/* ── 8. Privacy & Security Modal ── */}
      {showPrivacyModal && (
        <Modal title="Privacy & Security" onClose={() => setShowPrivacyModal(false)}>
          <div className="space-y-3 text-xs text-[#AAA]">
            <div className="p-3 bg-[#12110E] border border-[#282622] rounded-xl">
              <p className="font-semibold text-white mb-1">Encrypted Secure Storage</p>
              <p>Your financial records are encrypted with bank-grade privacy. Sign in anytime to sync securely across all your devices.</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#12110E] border border-[#282622] rounded-xl">
              <div>
                <p className="font-semibold text-white">Cloud Sync Status</p>
                <p className="text-2xs capitalize">{syncStatus}</p>
              </div>
              <button
                onClick={async () => {
                  await triggerSyncPass();
                  showToast('Sync pass executed');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#485F2C] text-white font-semibold text-2xs hover:bg-[#587437] cursor-pointer"
              >
                Sync Now
              </button>
            </div>
            {/* Deep Privacy & Reset Controls */}
            <div className="pt-2 border-t border-[#282622] space-y-2">
              <p className="font-semibold text-white text-xs">Reset & Data Controls</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivacyModal(false);
                    setConfirmResetType('MONTHLY_EXPENSES');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#24211D] hover:bg-[#2F2A23] border border-[#3A3326] text-[#E5A93C] text-xs font-semibold flex items-center justify-between cursor-pointer transition-all"
                >
                  <span>Reset Monthly Spends (Restore 100% Envelopes)</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivacyModal(false);
                    setConfirmResetType('ACCOUNTS');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#24211D] hover:bg-[#2F2A23] border border-[#3A3326] text-[#E5A93C] text-xs font-semibold flex items-center justify-between cursor-pointer transition-all"
                >
                  <span>Reset Account Balances to Zero</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivacyModal(false);
                    setConfirmResetType('ALL_DATA');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#2B1717] hover:bg-[#3B1F1F] border border-[#522929] text-[#F05A5A] text-xs font-semibold flex items-center justify-between cursor-pointer transition-all"
                >
                  <span>Factory Reset (Wipe All Data)</span>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleExportBackup}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirmation Modal for Data Resets ── */}
      {confirmResetType && (
        <Modal
          title={
            confirmResetType === 'MONTHLY_EXPENSES'
              ? 'Reset Monthly Spends?'
              : confirmResetType === 'ACCOUNTS'
              ? 'Reset Account Balances?'
              : 'Factory Reset All Data?'
          }
          onClose={() => setConfirmResetType(null)}
        >
          <div className="space-y-4">
            <div className="bg-[#241F14] border border-[#4D3F20] rounded-xl p-3 text-xs text-[#E5A93C]">
              <p className="font-semibold text-white">⚠️ Please confirm this action</p>
              <p className="text-[11px] text-[#C4B79D] mt-1 leading-relaxed">
                {confirmResetType === 'MONTHLY_EXPENSES'
                  ? 'This will clear all expense transactions for the active user. Your account allocations and category percentages will remain intact, with available envelope funds restored to 100%.'
                  : confirmResetType === 'ACCOUNTS'
                  ? 'This will wipe all ledger records and reset all account balances back to ₹0.'
                  : 'This will permanently wipe all local database records, custom categories, goals, income schedules, and reset the app back to initial defaults.'}
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmResetType(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#211F1B] border border-[#2F2C25] text-[#8E8A82] hover:text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    if (confirmResetType === 'MONTHLY_EXPENSES') {
                      await resetMonthlyExpenses();
                      showToast('Monthly spends reset! Category envelopes restored to 100%.');
                    } else if (confirmResetType === 'ACCOUNTS') {
                      await resetAccountLedger();
                      showToast('Account balances reset to zero.');
                    } else if (confirmResetType === 'ALL_DATA') {
                      await resetAllData();
                      showToast('All local data wiped. Factory defaults restored.');
                    }
                  } catch {
                    showToast('Reset failed.');
                  } finally {
                    setIsResetting(false);
                    setConfirmResetType(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#F2555A] text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                {isResetting ? 'Resetting…' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 9. Help & Support Modal ── */}
      {showHelpModal && (
        <Modal title="Help & Support" onClose={() => setShowHelpModal(false)}>
          <div className="space-y-3 text-xs text-[#AAA]">
            <div className="p-3 bg-[#12110E] border border-[#282622] rounded-xl space-y-1">
              <p className="font-semibold text-white">About Richingness</p>
              <p>Richingness is a zero-based financial operating system designed to give every Rupee a purpose.</p>
              <p className="text-2xs text-[#777] pt-1">Version 1.0.0 • Richingness Finance</p>
            </div>
            <div className="p-3 bg-[#12110E] border border-[#282622] rounded-xl space-y-1.5">
              <p className="font-semibold text-white">Common Questions</p>
              <p><strong className="text-white">Do I need an account?</strong> You can start tracking your finances right away without signing in, or create an account to back up and sync across devices.</p>
              <p><strong className="text-white">Can I switch profiles?</strong> Yes! Tap the top profile card anytime to switch between Personal, Business, Family, or Guest profiles.</p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#485F2C] text-white font-bold text-xs hover:bg-[#587437] transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}

      {/* ── 10. Sign Out Confirmation ── */}
      {showSignOutConfirm && (
        <Modal title="Sign Out?" onClose={() => setShowSignOutConfirm(false)}>
          <p className="text-xs text-[#AAA]">
            You will be signed out of your account. Your records will remain securely accessible.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setActiveProfileId('prof-guest');
                setShowSignOutConfirm(false);
                setShowProfileEditModal(false);
                showToast('Signed out to Guest profile.');
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs cursor-pointer"
            >
              Confirm Sign Out
            </button>
          </div>
        </Modal>
      )}

      {/* ── 11. Unsaved Changes Warning Confirmation Modal ── */}
      {unsavedWarning?.isOpen && (
        <Modal
          title={unsavedWarning.title || 'Discard Unsaved Changes?'}
          onClose={() => setUnsavedWarning(null)}
        >
          <div className="space-y-4">
            <div className="bg-[#241B12] border border-[#523B1C] rounded-xl p-3.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F2811D] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-white">
                  {unsavedWarning.title || 'Unsaved Changes'}
                </h4>
                <p className="text-[11px] text-[#DEBF99] leading-relaxed">
                  {unsavedWarning.message || 'You have entered changes that have not been saved yet. If you leave now, your input will be discarded.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUnsavedWarning(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#242621] hover:bg-[#2F322B] text-xs font-semibold text-white cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={unsavedWarning.onDiscard}
                className="flex-1 py-2.5 rounded-xl bg-[#F2811D] hover:bg-[#FF8E2E] text-xs font-bold text-black shadow-md transition-all cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Rename Profile Modal ── */}
      {showRenameModal && (
        <Modal title="Rename Profile" onClose={() => setShowRenameModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1.5 block">
                Profile Name
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                placeholder="e.g. Personal Budget"
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#485F2C]"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const trimmed = renameInput.trim() || 'Personal Budget';
                    setUserName(trimmed);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('richingness_user_custom_name_v1', trimmed);
                    }
                    setShowRenameModal(false);
                    showToast('Profile name updated!');
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = renameInput.trim() || 'Personal Budget';
                  setUserName(trimmed);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('richingness_user_custom_name_v1', trimmed);
                  }
                  setShowRenameModal(false);
                  showToast('Profile name updated!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Income Modal (Regular vs One-Time & General Funds vs Spread) ── */}
      {showEditIncomeModal && editingIncome && (
        <Modal title={`Edit Income · ${editingIncome.name}`} onClose={() => setShowEditIncomeModal(false)}>
          <form onSubmit={handleUpdateIncomeSource} className="space-y-4">
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1 block">
                Income Source Name
              </label>
              <input
                type="text"
                value={editIncName}
                onChange={e => setEditIncName(e.target.value)}
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
                required
              />
            </div>

            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1 block">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={editIncAmount}
                onChange={e => setEditIncAmount(e.target.value)}
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
                required
              />
            </div>

            {/* Regular vs One-Time */}
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1.5 block">
                Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditIncIsRegular(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    editIncIsRegular
                      ? 'bg-[#485F2C] text-white border-[#587437]'
                      : 'bg-[#181714] text-[#888] border-[#282622] hover:text-white'
                  }`}
                >
                  Regular (Monthly)
                </button>
                <button
                  type="button"
                  onClick={() => setEditIncIsRegular(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    !editIncIsRegular
                      ? 'bg-[#485F2C] text-white border-[#587437]'
                      : 'bg-[#181714] text-[#888] border-[#282622] hover:text-white'
                  }`}
                >
                  One-Time
                </button>
              </div>
            </div>

            {editIncIsRegular && (
              <div>
                <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1 block">
                  Day of Month (1 - 31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editIncDay}
                  onChange={e => setEditIncDay(e.target.value)}
                  className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
                />
              </div>
            )}

            {/* Destination Mode: Spread Envelopes vs General Funds */}
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1.5 block">
                Category Allocation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditIncAllocationMode('SPREAD')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    editIncAllocationMode === 'SPREAD'
                      ? 'bg-[#485F2C] text-white border-[#587437]'
                      : 'bg-[#181714] text-[#888] border-[#282622] hover:text-white'
                  }`}
                >
                  Spread (50/30/20)
                </button>
                <button
                  type="button"
                  onClick={() => setEditIncAllocationMode('DIRECT_CATEGORY')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    editIncAllocationMode === 'DIRECT_CATEGORY'
                      ? 'bg-[#485F2C] text-white border-[#587437]'
                      : 'bg-[#181714] text-[#888] border-[#282622] hover:text-white'
                  }`}
                >
                  General Funds
                </button>
              </div>
              <p className="text-[11px] text-[#777] mt-1.5">
                {editIncAllocationMode === 'SPREAD'
                  ? 'Allocates across Needs, Wants, and Savings according to category percentages.'
                  : 'Deposits into General Funds as a flexible reserve pool.'}
              </p>
            </div>

            {/* Target Account */}
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-[#999] mb-1 block">
                Target Account
              </label>
              <select
                value={editIncTargetAccount}
                onChange={e => setEditIncTargetAccount(e.target.value)}
                className="w-full bg-[#12110E] border border-[#282622] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#485F2C]"
              >
                <option value="GLOBAL">Primary / Default Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions: Deposit Now, Save, Delete */}
            <div className="pt-2 border-t border-[#282622] space-y-2">
              <button
                type="button"
                onClick={() => {
                  depositFromIncomeSource(editingIncome.id);
                  setShowEditIncomeModal(false);
                  showToast(`Deposited ₹${editingIncome.amount.toLocaleString()} into account!`);
                }}
                className="w-full py-2.5 rounded-xl bg-[#242A1D] hover:bg-[#303B23] border border-[#485F2C] text-[#C5E89B] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Deposit Now (Instant Credit)
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    deleteIncomeSource(editingIncome.id);
                    setShowEditIncomeModal(false);
                    showToast(`Deleted income stream "${editingIncome.name}"`);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-semibold text-xs cursor-pointer flex items-center justify-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditIncomeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#485F2C] hover:bg-[#587437] text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
