'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  LayoutTemplate,
  Globe,
  Check,
  X,
  Wallet,
  Edit2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Percent,
  Sliders,
  CheckCheck
} from 'lucide-react';
import { useAppStore } from '../app/store';

// ── Types ───────────────────────────────────────────────────────────────────
export interface CategoryRuleItem {
  id: string;
  name: string;
  percentage: number;
  isAutoRemainder?: boolean;
}

export interface FeaturedTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  categories: { name: string; percentage: number }[];
}

// ── Default Presets ─────────────────────────────────────────────────────────
const DEFAULT_RULES: CategoryRuleItem[] = [
  { id: 'cat-needs', name: 'Needs', percentage: 50 },
  { id: 'cat-wants', name: 'Wants', percentage: 30 },
  { id: 'cat-savings', name: 'Savings', percentage: 20, isAutoRemainder: true },
];

const FEATURED_TEMPLATES: FeaturedTemplate[] = [
  {
    id: 'tmpl-503020',
    title: '50/30/20 Rule Budget',
    category: 'Balanced Lifestyle',
    description: '50% Needs (Rent, Food), 30% Wants (Hobbies, Dining), 20% Savings (Emergency, Investments).',
    categories: [
      { name: 'Needs', percentage: 50 },
      { name: 'Wants', percentage: 30 },
      { name: 'Savings', percentage: 20 },
    ]
  },
  {
    id: 'tmpl-zero-based',
    title: 'Zero-Based Budget',
    category: 'Strict Discipline',
    description: 'Every single rupee is assigned a specific job. Fixed costs, debt payoff, and savings buffers.',
    categories: [
      { name: 'Fixed Costs', percentage: 45 },
      { name: 'Discretionary', percentage: 25 },
      { name: 'Debt Payoff', percentage: 20 },
      { name: 'Buffer Pool', percentage: 10 },
    ]
  },
  {
    id: 'tmpl-freelancer',
    title: 'Freelancer Variable Cashflow',
    category: 'Irregular Income',
    description: 'Designed for consultants and creators: built-in tax deduction pool and 3-month expense cushion.',
    categories: [
      { name: 'Operating Expenses', percentage: 35 },
      { name: 'Tax Buffer', percentage: 25 },
      { name: 'Owner Pay', percentage: 30 },
      { name: 'Emergency Fund', percentage: 10 },
    ]
  },
  {
    id: 'tmpl-fire',
    title: 'FIRE Aggressive Accumulation',
    category: 'Early Retirement',
    description: 'High-velocity wealth building: live frugally on 40% and invest 60% into index funds.',
    categories: [
      { name: 'Index Investments', percentage: 50 },
      { name: 'Essential Living', percentage: 35 },
      { name: 'Safety Pool', percentage: 10 },
      { name: 'Joy Spending', percentage: 5 },
    ]
  },
  {
    id: 'tmpl-602020',
    title: '60/20/20 Comfort Formula',
    category: 'Simplicity',
    description: '60% Essentials, 20% Committed Goals & Savings, 20% Guilt-Free Spending.',
    categories: [
      { name: 'Essentials', percentage: 60 },
      { name: 'Goals & Savings', percentage: 20 },
      { name: 'Guilt-Free Fun', percentage: 20 },
    ]
  }
];

interface AccountCategoriesScreenProps {
  onBack?: () => void;
  initialTab?: 'global' | 'per-account' | 'currencies';
}

export function AccountCategoriesScreen({
  onBack,
  initialTab = 'global'
}: AccountCategoriesScreenProps) {
  const { accounts, addAccount, updateAccountName } = useAppStore();

  // Active top navigation tab (Global | Per Account | Currencies)
  const [activeTab, setActiveTab] = useState<'global' | 'per-account' | 'currencies'>(() => {
    // If only one account exists, Per Account tab is disabled, default to 'global'
    if (initialTab === 'per-account' && accounts.length <= 1) return 'global';
    return initialTab;
  });

  // Rename account state
  const [isRenamingAccount, setIsRenamingAccount] = useState(false);
  const [renamedTitle, setRenamedTitle] = useState('');

  // Allocation mode: 'auto' (total always 100% with auto-balancing) or 'manual' (freely editable with total warning)
  const [allocationMode, setAllocationMode] = useState<'auto' | 'manual'>('auto');

  // UI Allocation Experience Version Selector:
  // v1: Safe Pin & Lock System with Smart Remaining Pool & Steppers (Prevents previous items from breaking)
  // v2: Direct Visual Tap Cards (Fixed quick percentage chips 10%, 20%, 30%, 50% + Custom + Fill Remainder)
  // v3: Original Slider (Figma baseline with isolated manual override)
  const [uiVersion, setUiVersion] = useState<'v1' | 'v2' | 'v3'>('v1');
  const [lockedCategoryIds, setLockedCategoryIds] = useState<Record<string, boolean>>({});

  const toggleCategoryLock = (id: string) => {
    setLockedCategoryIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const moveCategoryOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeRules.length) return;

    setActiveRules(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Selected account for 'per-account' tab
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return accounts.length > 0 ? accounts[0].id : 'acct-hdfc';
  });
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Global allocation rules
  const [globalRules, setGlobalRules] = useState<CategoryRuleItem[]>(DEFAULT_RULES);

  // Per-account allocation rules map (accountId -> CategoryRuleItem[])
  const [perAccountRules, setPerAccountRules] = useState<Record<string, CategoryRuleItem[]>>({
    'acct-hdfc': [
      { id: 'cat-needs', name: 'Needs', percentage: 50 },
      { id: 'cat-wants', name: 'Wants', percentage: 30 },
      { id: 'cat-savings', name: 'Savings', percentage: 20, isAutoRemainder: true },
    ]
  });

  // UI Modals & Notifications
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings' | 'credit' | 'cash'>('savings');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Currency Tab State
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['INR', 'USD', 'EUR', 'GBP', 'BTC', 'ETH']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Current active rules based on tab
  const activeRules = activeTab === 'global'
    ? globalRules
    : perAccountRules[selectedAccountId] || DEFAULT_RULES;

  const setActiveRules = (updater: (prev: CategoryRuleItem[]) => CategoryRuleItem[]) => {
    if (activeTab === 'global') {
      setGlobalRules(updater);
    } else {
      setPerAccountRules(prev => ({
        ...prev,
        [selectedAccountId]: updater(prev[selectedAccountId] || DEFAULT_RULES)
      }));
    }
  };

  // Calculate current total percentage
  const totalPercentage = activeRules.reduce((sum, r) => sum + r.percentage, 0);
  const isTotal100 = totalPercentage === 100;

  // Auto remainder category id (defaults to category flagged isAutoRemainder or the last category)
  const getAutoCategoryId = (rules: CategoryRuleItem[]): string => {
    const explicit = rules.find(r => r.isAutoRemainder);
    if (explicit) return explicit.id;
    return rules[rules.length - 1]?.id || '';
  };

  // ── Auto Adjust Engine ───────────────────────────────────────────────────────
  const autoBalanceRules = (rules: CategoryRuleItem[], targetAutoId?: string): CategoryRuleItem[] => {
    if (rules.length === 0) return rules;
    if (rules.length === 1) {
      return [{ ...rules[0], percentage: 100, isAutoRemainder: true }];
    }

    const autoId = targetAutoId || getAutoCategoryId(rules);
    const nonAutoRules = rules.filter(r => r.id !== autoId);
    const sumNonAuto = nonAutoRules.reduce((s, r) => s + r.percentage, 0);

    if (sumNonAuto <= 100) {
      const remainder = 100 - sumNonAuto;
      return rules.map(r => ({
        ...r,
        percentage: r.id === autoId ? remainder : r.percentage,
        isAutoRemainder: r.id === autoId
      }));
    } else {
      const scale = 95 / sumNonAuto;
      let scaledSum = 0;
      const scaled = rules.map((r) => {
        if (r.id === autoId) return r;
        const val = Math.max(1, Math.round(r.percentage * scale));
        scaledSum += val;
        return { ...r, percentage: val, isAutoRemainder: false };
      });
      const remainder = Math.max(0, 100 - scaledSum);
      return scaled.map(r => ({
        ...r,
        percentage: r.id === autoId ? remainder : r.percentage,
        isAutoRemainder: r.id === autoId
      }));
    }
  };

  // ── Handle Percentage Change (via Slider or Written Input) ─────────────────
  const handlePercentageChange = (id: string, newRawValue: number) => {
    const clampedVal = Math.min(100, Math.max(0, Math.round(newRawValue)));

    if (allocationMode === 'auto') {
      setActiveRules(prev => {
        const autoId = getAutoCategoryId(prev);

        let effectiveAutoId = autoId;
        if (id === autoId) {
          const alternate = prev.find(r => r.id !== id);
          if (alternate) effectiveAutoId = alternate.id;
        }

        const updated = prev.map(r => {
          if (r.id === id) {
            return { ...r, percentage: clampedVal };
          }
          return r;
        });

        return autoBalanceRules(updated, effectiveAutoId);
      });
    } else {
      setActiveRules(prev =>
        prev.map(r => (r.id === id ? { ...r, percentage: clampedVal } : r))
      );
    }
  };

  const triggerAutoBalance = () => {
    setActiveRules(prev => autoBalanceRules(prev));
    showToast('Categories auto-adjusted to exactly 100%!');
  };

  const toggleAutoRemainder = (id: string) => {
    setActiveRules(prev => autoBalanceRules(prev, id));
    showToast(`Set category as auto-adjusting remainder.`);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newId = `cat-custom-${Date.now()}`;
    const newCat: CategoryRuleItem = {
      id: newId,
      name: newCategoryName.trim(),
      percentage: 10,
      isAutoRemainder: false
    };

    if (allocationMode === 'auto') {
      setActiveRules(prev => autoBalanceRules([...prev, newCat]));
    } else {
      setActiveRules(prev => [...prev, newCat]);
    }

    setNewCategoryName('');
    setShowAddCategoryModal(false);
    showToast(`Category "${newCat.name}" added!`);
  };

  const handleRemoveCategory = (id: string) => {
    if (activeRules.length <= 1) {
      showToast('You must have at least one category.');
      return;
    }
    setActiveRules(prev => {
      const filtered = prev.filter(r => r.id !== id);
      if (allocationMode === 'auto') {
        return autoBalanceRules(filtered);
      }
      return filtered;
    });
    showToast('Category removed.');
  };

  const applyDefaultAllocation = () => {
    const standard: CategoryRuleItem[] = [
      { id: 'cat-needs', name: 'Needs', percentage: 50 },
      { id: 'cat-wants', name: 'Wants', percentage: 30 },
      { id: 'cat-savings', name: 'Savings', percentage: 20, isAutoRemainder: true },
    ];
    setActiveRules(() => standard);
    showToast('Applied Default 50/30/20 Allocation!');
  };

  const handleApplyTemplate = (tmpl: FeaturedTemplate) => {
    const mapped: CategoryRuleItem[] = tmpl.categories.map((c, i) => ({
      id: `cat-tmpl-${i}-${Date.now()}`,
      name: c.name,
      percentage: c.percentage,
      isAutoRemainder: i === tmpl.categories.length - 1
    }));
    setActiveRules(() => mapped);
    setShowTemplateModal(false);
    showToast(`Applied "${tmpl.title}" template!`);
  };

  const handleSaveAllocation = () => {
    if (!isTotal100) {
      if (allocationMode === 'manual') {
        showToast(`Cannot save: Total is ${totalPercentage}%. Must equal 100%. Click Auto-Fix to balance.`);
        return;
      }
    }
    try {
      const payload = {
        globalRules,
        perAccountRules,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('richingness_category_allocations', JSON.stringify(payload));
    } catch {
      // Ignored
    }
    showToast(`Allocation saved for ${activeTab === 'global' ? 'All Accounts' : 'Selected Account'}!`);
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('richingness_category_allocations');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.globalRules) setGlobalRules(parsed.globalRules);
        if (parsed.perAccountRules) setPerAccountRules(parsed.perAccountRules);
      }
    } catch {
      // Ignored
    }
  }, []);

  const accountOptions = accounts;
  const activeAccountObj = accountOptions.find(a => a.id === selectedAccountId) || accountOptions[0] || {
    id: 'acct-default',
    name: 'Primary Account',
    type: 'savings' as const,
    currency: 'INR'
  };

  return (
    <div className="w-full max-w-md mx-auto text-white select-none animate-fade-in pb-8">

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#485F2C] text-white px-4 py-2.5 rounded-[12px] border border-[#6B8A44] shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5E89B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header: < back | Account & Categories (Figma Exact Title Bar) ── */}
      <div className="flex items-center justify-between py-2 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-[#8F9E82] hover:text-white transition-colors cursor-pointer active:scale-95 py-1 px-1 -ml-1 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>back</span>
        </button>
        <h1 className="font-semibold text-sm text-white tracking-tight">
          {activeTab === 'currencies' ? 'Manage Currencies' : 'Account & Categories'}
        </h1>
        <div className="w-10" />
      </div>

      {/* ── Top Navigation Tabs (Global | Per Account | 🌐 Currency) ── */}
      <div className="bg-[#182114] p-1 rounded-[14px] border border-[#27351F] flex items-center gap-1 mb-4 shadow-sm">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-semibold transition-all cursor-pointer text-center ${
            activeTab === 'global'
              ? 'bg-[#4A622F] text-white shadow-sm'
              : 'text-[#829577] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Global
        </button>
        <button
          onClick={() => {
            if (accounts.length > 1) {
              setActiveTab('per-account');
            } else {
              showToast('Per-account allocation requires at least 2 accounts.');
            }
          }}
          disabled={accounts.length <= 1}
          className={`flex-1 py-2 px-3 rounded-[10px] text-xs font-semibold transition-all text-center ${
            accounts.length <= 1
              ? 'text-[#505F48] opacity-50 cursor-not-allowed'
              : activeTab === 'per-account'
              ? 'bg-[#4A622F] text-white shadow-sm cursor-pointer'
              : 'text-[#829577] hover:text-white hover:bg-white/[0.04] cursor-pointer'
          }`}
          title={accounts.length <= 1 ? "Add another account to customize per-account allocations" : "Per Account Allocations"}
        >
          Per Account {accounts.length <= 1 && '(2+ Accts)'}
        </button>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`w-9 h-8 flex items-center justify-center rounded-[10px] transition-all cursor-pointer ${
            activeTab === 'currencies'
              ? 'bg-[#4A622F] text-white shadow-sm'
              : 'text-[#829577] hover:text-white hover:bg-white/[0.04]'
          }`}
          title="Manage Currencies"
        >
          <Globe className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 & 2: GLOBAL & PER ACCOUNT ALLOCATION RULES                       */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab !== 'currencies' && (
        <div className="space-y-4">

          {/* ── Subtitle / Dropdown Bar & Sleek Mode Switch ── */}
          {activeTab === 'global' ? (
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs text-[#7D8F72] font-medium">All accounts</span>

              {/* Refined Auto / Manual Switch Pill */}
              <div className="flex items-center gap-0.5 bg-[#172013] p-0.5 rounded-lg border border-[#283620]">
                <button
                  onClick={() => {
                    setAllocationMode('auto');
                    setActiveRules(prev => autoBalanceRules(prev));
                    showToast('Auto-adjust mode: Total is always 100%');
                  }}
                  className={`px-2 py-1 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    allocationMode === 'auto'
                      ? 'bg-[#4A622F] text-white shadow-xs'
                      : 'text-[#7D8F72] hover:text-white'
                  }`}
                  title="Auto-balances remainder category so total is always 100%"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Auto 100%</span>
                </button>
                <button
                  onClick={() => {
                    setAllocationMode('manual');
                    showToast('Manual mode: Freely set values (warns if sum != 100%)');
                  }}
                  className={`px-2 py-1 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer ${
                    allocationMode === 'manual'
                      ? 'bg-[#F2811D] text-black font-extrabold shadow-xs'
                      : 'text-[#7D8F72] hover:text-white'
                  }`}
                  title="Manually set percentages. Warns if sum != 100%"
                >
                  Manual
                </button>
              </div>
            </div>
          ) : (
            /* Per Account Dropdown & Add Account Button */
            <div className="space-y-2">
              <div className="relative">
                {isRenamingAccount ? (
                  <div className="flex items-center gap-2 bg-[#1A2315] border border-[#4A622F] rounded-[12px] px-3 py-2">
                    <input
                      type="text"
                      autoFocus
                      value={renamedTitle}
                      onChange={e => setRenamedTitle(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && renamedTitle.trim()) {
                          await updateAccountName(activeAccountObj.id, renamedTitle.trim());
                          setIsRenamingAccount(false);
                          showToast(`Account renamed to "${renamedTitle.trim()}"`);
                        }
                        if (e.key === 'Escape') setIsRenamingAccount(false);
                      }}
                      className="flex-1 bg-transparent text-xs font-semibold text-white outline-none"
                    />
                    <button
                      onClick={async () => {
                        if (renamedTitle.trim()) {
                          await updateAccountName(activeAccountObj.id, renamedTitle.trim());
                          setIsRenamingAccount(false);
                          showToast(`Account renamed to "${renamedTitle.trim()}"`);
                        }
                      }}
                      className="text-[#8EBA55] hover:text-white p-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsRenamingAccount(false)}
                      className="text-[#8E8A82] hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => accountOptions.length > 1 && setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                      className={`flex-1 bg-[#1A2315] border border-[#2C3B23] rounded-[12px] px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-white transition-all ${
                        accountOptions.length > 1 ? 'cursor-pointer hover:border-[#4A622F]' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-[#8EBA55]" />
                        <span>{activeAccountObj.name}</span>
                      </div>
                      {accountOptions.length > 1 && (
                        <ChevronDown className={`w-3.5 h-3.5 text-[#7D8F72] transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRenamedTitle(activeAccountObj.name);
                        setIsRenamingAccount(true);
                      }}
                      className="w-9 h-9 rounded-[12px] bg-[#1A2315] border border-[#2C3B23] hover:border-[#4A622F] flex items-center justify-center text-[#8EBA55] hover:text-white transition-all cursor-pointer shrink-0"
                      title="Rename account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isAccountDropdownOpen && (
                  <div className="absolute top-12 left-0 right-0 z-30 bg-[#1A2315] border border-[#334428] rounded-[12px] shadow-2xl py-1 animate-fade-in overflow-hidden">
                    {accountOptions.map(acct => (
                      <button
                        key={acct.id}
                        onClick={() => {
                          setSelectedAccountId(acct.id);
                          setIsAccountDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between cursor-pointer ${
                          selectedAccountId === acct.id ? 'bg-[#4A622F] text-white' : 'text-[#8A9A80] hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>{acct.name}</span>
                        {selectedAccountId === acct.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Account Button & Auto/Manual Toggle Row */}
              <div className="flex items-center justify-between px-0.5">
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="text-xs text-[#8EBA55] hover:text-[#A6D66B] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add account</span>
                </button>

                {/* Auto / Manual Mode Toggle */}
                <div className="flex items-center gap-0.5 bg-[#172013] p-0.5 rounded-lg border border-[#283620]">
                  <button
                    onClick={() => {
                      setAllocationMode('auto');
                      setActiveRules(prev => autoBalanceRules(prev));
                      showToast('Auto-adjust mode: Total is always 100%');
                    }}
                    className={`px-2 py-1 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      allocationMode === 'auto'
                        ? 'bg-[#4A622F] text-white shadow-xs'
                        : 'text-[#7D8F72] hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Auto 100%</span>
                  </button>
                  <button
                    onClick={() => {
                      setAllocationMode('manual');
                      showToast('Manual mode: Freely set values (warns if sum != 100%)');
                    }}
                    className={`px-2 py-1 rounded-[6px] text-[10px] font-bold transition-all cursor-pointer ${
                      allocationMode === 'manual'
                        ? 'bg-[#F2811D] text-black font-extrabold shadow-xs'
                        : 'text-[#7D8F72] hover:text-white'
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Section Title & Version Selector ── */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {activeTab === 'global' ? 'Allocation for all accounts' : 'Allocation for this account'}
              </h2>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="text-[11px] font-semibold text-[#8EBA55] hover:text-[#A8E063] flex items-center gap-1 cursor-pointer transition-colors"
                title="Add a new category rule"
              >
                <Plus className="w-3 h-3" />
                <span>Add Category</span>
              </button>
            </div>

            {/* ── Version Switcher Pills (v1: Lock & Steppers, v2: Quick Chips, v3: Slider) ── */}
            <div className="bg-[#141B10] p-1 rounded-xl border border-[#27351F] flex items-center gap-1">
              <button
                onClick={() => {
                  setUiVersion('v1');
                  showToast('Version 1: Smart Pin & Steppers. Previous items stay locked!');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  uiVersion === 'v1'
                    ? 'bg-[#4A622F] text-white shadow-xs'
                    : 'text-[#7D8F72] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>v1: Smart Lock</span>
              </button>

              <button
                onClick={() => {
                  setUiVersion('v2');
                  showToast('Version 2: Quick Percentage Chips & Fill Remainder');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  uiVersion === 'v2'
                    ? 'bg-[#4A622F] text-white shadow-xs'
                    : 'text-[#7D8F72] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>v2: Quick Chips</span>
              </button>

              <button
                onClick={() => {
                  setUiVersion('v3');
                  showToast('Version 3: Classic Range Sliders');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  uiVersion === 'v3'
                    ? 'bg-[#4A622F] text-white shadow-xs'
                    : 'text-[#7D8F72] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>v3: Sliders</span>
              </button>
            </div>
          </div>

          {/* ── Remaining Unassigned Pool Banner (for v1 and v2) ── */}
          {uiVersion !== 'v3' && (
            <div className="bg-[#1C2417] border border-[#2E3C25] rounded-[12px] p-3 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#8EBA55] uppercase tracking-wider">Unassigned Budget</span>
                <p className="text-xs text-[#A8B79F]">
                  {100 - totalPercentage === 0 ? (
                    <span className="text-[#A5E265] font-semibold flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Perfectly balanced (100%)
                    </span>
                  ) : 100 - totalPercentage > 0 ? (
                    <span><strong className="text-white">{100 - totalPercentage}%</strong> left to allocate</span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Over-allocated by {totalPercentage - 100}%</span>
                  )}
                </p>
              </div>

              {100 - totalPercentage !== 0 && (
                <button
                  onClick={triggerAutoBalance}
                  className="px-2.5 py-1 bg-[#4A622F] hover:bg-[#587538] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Distribute</span>
                </button>
              )}
            </div>
          )}

          {/* ── Categories Allocation Rows ── */}
          <div className="space-y-3.5">
            {activeRules.map((category, index) => {
              const isAuto = category.isAutoRemainder && allocationMode === 'auto';
              const isLocked = !!lockedCategoryIds[category.id];
              const remainingTo100 = Math.max(0, 100 - (totalPercentage - category.percentage));

              return (
                <div key={category.id} className="bg-[#171F13] border border-[#26331F] rounded-[14px] p-3 space-y-2.5 transition-all">
                  
                  {/* Category Header: Name + Order buttons (Top to Bottom) + Delete */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Top to Bottom Order Arrows */}
                      <div className="flex items-center gap-0.5 bg-[#1F291A] rounded-md p-0.5 border border-[#2C3B24]">
                        <button
                          onClick={() => moveCategoryOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-[#7D8F72] text-[#7D8F72] transition-colors cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveCategoryOrder(index, 'down')}
                          disabled={index === activeRules.length - 1}
                          className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-[#7D8F72] text-[#7D8F72] transition-colors cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-semibold text-white/95 text-xs sm:text-sm truncate">
                        {category.name}
                      </span>

                      {isAuto && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#384A25] text-[#C5E89B] border border-[#4C6432] shrink-0">
                          auto
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Set Auto Button (v3 only) */}
                      {uiVersion === 'v3' && allocationMode === 'auto' && !isAuto && (
                        <button
                          onClick={() => toggleAutoRemainder(category.id)}
                          className="text-[10px] text-[#7D8F72] hover:text-[#A8E063] transition-colors cursor-pointer mr-1"
                          title="Click to set this category as the auto-adjusting remainder"
                        >
                          set auto
                        </button>
                      )}

                      {/* Lock Toggle Button */}
                      <button
                        onClick={() => toggleCategoryLock(category.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isLocked
                            ? 'bg-[#4A622F] border-[#6B8A44] text-white shadow-xs'
                            : 'bg-[#1F291A] border-[#2C3B24] text-[#7D8F72] hover:text-white'
                        }`}
                        title={isLocked ? "Category is locked (will not change)" : "Click to lock this category percentage"}
                      >
                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>

                      {/* Remove category */}
                      {activeRules.length > 1 && (
                        <button
                          onClick={() => handleRemoveCategory(category.id)}
                          className="text-[#657858] hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                          title="Remove category"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── VERSION 1: Smart Pin & Steppers (Prevents previous numbers from breaking) ── */}
                  {uiVersion === 'v1' && (
                    <div className="flex items-center gap-2">
                      {/* Steppers */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const next = Math.max(0, category.percentage - 5);
                            handlePercentageChange(category.id, next);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-[#212C1B] hover:bg-[#2C3B24] text-white text-[11px] font-bold border border-[#303F27] active:scale-95 transition-all cursor-pointer"
                          title="Decrease by 5%"
                        >
                          -5%
                        </button>
                        <button
                          onClick={() => {
                            const next = Math.max(0, category.percentage - 1);
                            handlePercentageChange(category.id, next);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-[#212C1B] hover:bg-[#2C3B24] text-white text-[11px] font-bold border border-[#303F27] active:scale-95 transition-all cursor-pointer"
                          title="Decrease by 1%"
                        >
                          -1%
                        </button>
                      </div>

                      {/* Center Direct Input */}
                      <div className="flex-1 h-[36px] bg-[#141C10] border border-[#2E3C25] rounded-[10px] flex items-center justify-center px-2 focus-within:border-[#8EBA55] transition-all">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={category.percentage}
                          onChange={(e) => handlePercentageChange(category.id, Number(e.target.value))}
                          className="no-spin w-10 bg-transparent text-white text-center outline-none num-display font-extrabold text-sm"
                        />
                        <span className="text-[#7E9173] text-xs font-bold">%</span>
                      </div>

                      {/* Steppers + */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const next = Math.min(100, category.percentage + 1);
                            handlePercentageChange(category.id, next);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-[#212C1B] hover:bg-[#2C3B24] text-white text-[11px] font-bold border border-[#303F27] active:scale-95 transition-all cursor-pointer"
                          title="Increase by 1%"
                        >
                          +1%
                        </button>
                        <button
                          onClick={() => {
                            const next = Math.min(100, category.percentage + 5);
                            handlePercentageChange(category.id, next);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-[#212C1B] hover:bg-[#2C3B24] text-white text-[11px] font-bold border border-[#303F27] active:scale-95 transition-all cursor-pointer"
                          title="Increase by 5%"
                        >
                          +5%
                        </button>
                        <button
                          onClick={() => {
                            handlePercentageChange(category.id, remainingTo100);
                            showToast(`Assigned remaining balance (${remainingTo100}%) to ${category.name}`);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-[#384A25] hover:bg-[#4A622F] text-[#C5E89B] text-[10px] font-extrabold border border-[#4C6432] active:scale-95 transition-all cursor-pointer shrink-0"
                          title="Assign all remaining unallocated percent to this category"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── VERSION 2: Quick Percentage Chips ── */}
                  {uiVersion === 'v2' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[10, 20, 30, 40, 50, 60].map(val => (
                          <button
                            key={val}
                            onClick={() => handlePercentageChange(category.id, val)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              category.percentage === val
                                ? 'bg-[#4A622F] text-white font-bold border border-[#6B8A44]'
                                : 'bg-[#1F291A] text-[#8EBA55] border border-[#2B3923] hover:bg-[#293623]'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                        <button
                          onClick={() => handlePercentageChange(category.id, remainingTo100)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#384A25] text-[#C5E89B] border border-[#4C6432] hover:bg-[#4A622F] transition-all cursor-pointer"
                        >
                          Fill Remainder ({remainingTo100}%)
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#7D8F72]">Custom:</span>
                        <div className="w-[72px] h-[30px] bg-[#141C10] border border-[#2E3C25] rounded-[8px] flex items-center justify-between px-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={category.percentage}
                            onChange={(e) => handlePercentageChange(category.id, Number(e.target.value))}
                            className="no-spin w-8 bg-transparent text-white text-right outline-none num-display font-bold text-xs"
                          />
                          <span className="text-[#7E9173] text-xs font-semibold ml-1">%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── VERSION 3: Classic Range Slider ── */}
                  {uiVersion === 'v3' && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={category.percentage}
                          onChange={(e) => handlePercentageChange(category.id, Number(e.target.value))}
                          className="figma-allocation-slider"
                          style={{
                            background: `linear-gradient(to right, #6B8F3C 0%, #8EBA55 ${category.percentage}%, #252D1E ${category.percentage}%, #252D1E 100%)`
                          }}
                        />
                      </div>
                      <div className="w-[66px] h-[34px] bg-[#1E2618] border border-[#313E27] rounded-[8px] flex items-center justify-between px-2.5 focus-within:border-[#8EBA55] transition-colors shadow-inner shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={category.percentage}
                          onChange={(e) => handlePercentageChange(category.id, Number(e.target.value))}
                          className="no-spin w-8 bg-transparent text-white text-right outline-none num-display font-bold text-xs"
                        />
                        <span className="text-[#7E9173] text-xs font-semibold ml-1">%</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* ── Total Row ── */}
          <div className="flex items-center justify-between pt-3 border-t border-[#26331E]">
            <span className="font-bold text-sm text-white">Total</span>
            <div className="flex items-center gap-2">
              {allocationMode === 'manual' && !isTotal100 && (
                <button
                  onClick={triggerAutoBalance}
                  className="text-[10px] bg-[#4A622F] text-white px-2 py-0.5 rounded-md font-bold hover:bg-[#587538] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Auto balance to 100%"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Auto Fix</span>
                </button>
              )}
              <span
                className={`font-extrabold text-sm num-display tracking-tight ${
                  isTotal100 ? 'text-white' : 'text-[#F2811D]'
                }`}
              >
                {totalPercentage}%
              </span>
            </div>
          </div>

          {/* ── Manual Mode Warning: When Total != 100% ── */}
          {allocationMode === 'manual' && !isTotal100 && (
            <div className="bg-[#261D12] border border-[#6E4215] rounded-[12px] p-3 text-xs flex items-start gap-2.5 animate-fade-in shadow-lg">
              <AlertTriangle className="w-4 h-4 text-[#F2811D] shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-bold text-[#F2811D] leading-tight">
                  Total is not 100% ({totalPercentage}%)
                </p>
                <p className="text-[11px] text-[#E0B496] leading-relaxed">
                  The allocation must always equal 100% of the parent category. You are currently{' '}
                  <span className="font-bold">
                    {totalPercentage < 100 ? `short by ${100 - totalPercentage}%` : `over by ${totalPercentage - 100}%`}
                  </span>.
                </p>
                <button
                  onClick={triggerAutoBalance}
                  className="mt-1 px-3 py-1 rounded-[6px] bg-[#F2811D] hover:bg-[#FF8F2D] text-black font-extrabold text-[10px] shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Adjust to 100%</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Action Buttons (Figma Save allocation & Use Default Allocation) ── */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Save Allocation (Orange Button) */}
            <button
              onClick={handleSaveAllocation}
              className="w-full py-3.5 rounded-[12px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-[0.99] text-[#11130E] font-bold text-sm shadow-md transition-all cursor-pointer text-center"
            >
              Save allocation
            </button>

            {/* 2. Use Default Allocation (Dark Olive Green Button) */}
            <div className="space-y-1">
              <button
                onClick={applyDefaultAllocation}
                className="w-full py-2.5 rounded-[12px] bg-[#314221] hover:bg-[#3B5027] active:scale-[0.99] text-white font-semibold text-xs transition-all border border-[#4A622F] cursor-pointer text-center"
              >
                Use Default Allocation
              </button>
              <p className="text-[11px] text-[#788A6E] text-center">
                Quickly apply standard settings without visiting library
              </p>
            </div>
          </div>

          {/* ── Featured Template Card (Figma Exact Section) ── */}
          <div className="bg-[#1A2214] border border-[#2B3822] rounded-[14px] p-4 space-y-2 mt-4 shadow-sm">
            <h3 className="font-bold text-xs text-white">Using a featured template</h3>
            <p className="text-[11px] text-[#7D8F72] leading-relaxed">
              When you use the default allocation, a featured template will be applied to allocate the selected account&apos;s funds across different categories.
            </p>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="w-full py-2.5 rounded-[10px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-[0.99] text-[#11130E] font-bold text-xs shadow-sm transition-all cursor-pointer text-center mt-1"
            >
              View more templates
            </button>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: MANAGE CURRENCIES 2.0 (Figma Screen 3)                          */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'currencies' && (
        <div className="space-y-4 animate-fade-in">

          {/* Currency Sub-Tabs: All | Fiat | Crypto */}
          <div className="bg-[#182114] p-1 rounded-[12px] border border-[#27351F] flex items-center gap-1">
            {(['all', 'fiat', 'crypto'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCurrencyFilter(tab)}
                className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-semibold capitalize transition-all cursor-pointer text-center ${
                  currencyFilter === tab
                    ? 'bg-[#4A622F] text-white shadow-xs'
                    : 'text-[#829577] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Default Currency Section */}
          <div className="space-y-2">
            <span className="text-xs text-[#7D8F72] font-semibold">Default currency</span>
            <div className="bg-[#1A2214] border border-[#2B3822] rounded-[12px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-[#8EBA55] flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#8EBA55]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Indian Rupee</p>
                  <p className="text-[10px] text-[#7D8F72]">INR</p>
                </div>
              </div>
              <span className="text-xs font-bold text-white num-display">₹1.00</span>
            </div>
          </div>

          {/* Fiat Currencies */}
          {(currencyFilter === 'all' || currencyFilter === 'fiat') && (
            <div className="space-y-2">
              <span className="text-xs text-[#7D8F72] font-semibold">Fiat currencies</span>
              <div className="bg-[#1A2214] border border-[#2B3822] rounded-[12px] divide-y divide-[#27351F] overflow-hidden">
                {[
                  { id: 'USD', name: 'US Dollar', code: 'USD', rate: '₹83.24', sub: '1 USD = ₹83.24' },
                  { id: 'EUR', name: 'Euro', code: 'EUR', rate: '₹91.37', sub: '1 EUR = ₹91.37' },
                  { id: 'GBP', name: 'British Pound', code: 'GBP', rate: '₹106.11', sub: '1 GBP = ₹106.11' },
                ].map(curr => {
                  const isChecked = selectedCurrencies.includes(curr.id);
                  return (
                    <div
                      key={curr.id}
                      onClick={() => {
                        setSelectedCurrencies(prev =>
                          prev.includes(curr.id) ? prev.filter(c => c !== curr.id) : [...prev, curr.id]
                        );
                      }}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isChecked ? 'border-[#8EBA55]' : 'border-[#444]'
                        }`}>
                          {isChecked && <div className="w-2 h-2 rounded-full bg-[#8EBA55]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{curr.name}</p>
                          <p className="text-[10px] text-[#7D8F72]">{curr.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white num-display">{curr.rate}</p>
                        <p className="text-[9px] text-[#7D8F72]">{curr.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Crypto Currencies */}
          {(currencyFilter === 'all' || currencyFilter === 'crypto') && (
            <div className="space-y-2">
              <span className="text-xs text-[#7D8F72] font-semibold">Crypto currencies</span>
              <div className="bg-[#1A2214] border border-[#2B3822] rounded-[12px] divide-y divide-[#27351F] overflow-hidden">
                {[
                  { id: 'BTC', name: 'Bitcoin', code: 'BTC', rate: '₹6,842,311.20', sub: '1 BTC = ₹6.84M' },
                  { id: 'ETH', name: 'Ethereum', code: 'ETH', rate: '₹281,543.12', sub: '1 ETH = ₹281.5K' },
                ].map(curr => {
                  const isChecked = selectedCurrencies.includes(curr.id);
                  return (
                    <div
                      key={curr.id}
                      onClick={() => {
                        setSelectedCurrencies(prev =>
                          prev.includes(curr.id) ? prev.filter(c => c !== curr.id) : [...prev, curr.id]
                        );
                      }}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isChecked ? 'border-[#8EBA55]' : 'border-[#444]'
                        }`}>
                          {isChecked && <div className="w-2 h-2 rounded-full bg-[#8EBA55]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{curr.name}</p>
                          <p className="text-[10px] text-[#7D8F72]">{curr.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white num-display">{curr.rate}</p>
                        <p className="text-[9px] text-[#7D8F72]">{curr.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Change Button */}
          <button
            onClick={() => showToast('Currency settings updated!')}
            className="w-full py-3.5 rounded-[12px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-[0.99] text-[#11130E] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center mt-2"
          >
            Save Change
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODALS: TEMPLATES, ADD CATEGORY, ADD ACCOUNT                            */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}

      {/* ── 1. Templates Modal ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#161D12] border border-[#2B3822] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27351F] pb-3">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-[#8EBA55]" />
                <h3 className="font-bold text-sm text-white">Allocation Templates</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-[#888] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {FEATURED_TEMPLATES.map(tmpl => (
                <div
                  key={tmpl.id}
                  className="bg-[#1A2214] border border-[#2B3822] hover:border-[#4A622F] rounded-xl p-3.5 space-y-2 transition-all cursor-pointer"
                  onClick={() => handleApplyTemplate(tmpl)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">{tmpl.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4A622F]/40 text-[#C5E89B] border border-[#526B36]">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7D8F72] leading-relaxed">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tmpl.categories.map(c => (
                      <span key={c.name} className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/90">
                        {c.name}: <span className="font-bold text-[#8EBA55]">{c.percentage}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Add Category Modal ── */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#161D12] border border-[#2B3822] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27351F] pb-3">
              <h3 className="font-bold text-sm text-white">Add Category Rule</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-[#888] hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#7D8F72] font-semibold">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Investment, Debt, Education"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-[#1A2214] border border-[#2B3822] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#20271A] text-xs font-semibold text-[#888] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 py-2 rounded-xl bg-[#4A622F] hover:bg-[#587538] disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Add Account Modal ── */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#161D12] border border-[#2B3822] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27351F] pb-3">
              <h3 className="font-bold text-sm text-white">Add New Account</h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-[#888] hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7D8F72] font-semibold">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. ICICI Bank, SBI Savings"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full bg-[#1A2214] border border-[#2B3822] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-[#7D8F72] font-semibold">Account Type</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as 'checking' | 'savings' | 'credit' | 'cash')}
                  className="w-full bg-[#1A2214] border border-[#2B3822] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none mt-1 cursor-pointer"
                >
                  <option value="savings">Savings Account</option>
                  <option value="checking">Checking Account</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash / Physical Wallet</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#20271A] text-xs font-semibold text-[#888] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newAccountName.trim()) {
                    await addAccount(newAccountName.trim(), newAccountType, 'INR');
                    setShowAddAccountModal(false);
                    setNewAccountName('');
                    showToast(`Account "${newAccountName}" created!`);
                  }
                }}
                disabled={!newAccountName.trim()}
                className="flex-1 py-2 rounded-xl bg-[#4A622F] hover:bg-[#587538] disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
