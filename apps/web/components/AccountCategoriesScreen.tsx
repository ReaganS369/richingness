'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
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
  Edit2
} from 'lucide-react';
import { useAppStore } from '../app/store';

// ── Types ───────────────────────────────────────────────────────────────────
export interface CategoryNodeAllocation {
  id: string;
  name: string;
  percentage: number; // percentage of this level's budget (0-100)
  level: number;      // 1 = Root, 2 = Subcategory, 3 = Sub-sub, etc.
  parentId?: string | null;
  children?: CategoryNodeAllocation[];
}

export interface FeaturedTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  categories: { name: string; percentage: number }[];
}

// ── Default Hierarchical Category Structure ────────────────────────────────
export const DEFAULT_HIERARCHICAL_RULES: CategoryNodeAllocation[] = [
  {
    id: 'cat-needs',
    name: 'Needs',
    percentage: 50,
    level: 1,
    children: [
      {
        id: 'cat-rent',
        name: 'Rent & Housing',
        percentage: 50,
        level: 2,
        parentId: 'cat-needs',
      },
      {
        id: 'cat-food',
        name: 'Food & Groceries',
        percentage: 50,
        level: 2,
        parentId: 'cat-needs',
        children: [
          {
            id: 'cat-groceries',
            name: 'Supermarket Groceries',
            percentage: 60,
            level: 3,
            parentId: 'cat-food',
          },
          {
            id: 'cat-dining',
            name: 'Dining & Takeout',
            percentage: 40,
            level: 3,
            parentId: 'cat-food',
          }
        ]
      }
    ]
  },
  {
    id: 'cat-wants',
    name: 'Wants',
    percentage: 30,
    level: 1,
    children: [
      {
        id: 'cat-entertainment',
        name: 'Entertainment & Outings',
        percentage: 50,
        level: 2,
        parentId: 'cat-wants',
      },
      {
        id: 'cat-shopping',
        name: 'Shopping & Hobbies',
        percentage: 30,
        level: 2,
        parentId: 'cat-wants',
      },
      {
        id: 'cat-subscriptions',
        name: 'Digital Subscriptions',
        percentage: 20,
        level: 2,
        parentId: 'cat-wants',
      }
    ]
  },
  {
    id: 'cat-savings',
    name: 'Savings',
    percentage: 20,
    level: 1,
    children: [
      {
        id: 'cat-emergency',
        name: 'Emergency Fund',
        percentage: 60,
        level: 2,
        parentId: 'cat-savings',
      },
      {
        id: 'cat-investments',
        name: 'Index Investments',
        percentage: 40,
        level: 2,
        parentId: 'cat-savings',
      }
    ]
  }
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

// Helper: Colors for segmented distribution bar
const CATEGORY_COLORS = [
  '#8EBA55', // Olive green
  '#4A90E2', // Blue
  '#F5A623', // Amber / Gold
  '#9B51E0', // Purple
  '#E056FD', // Pink
  '#2ECC71', // Emerald
  '#E67E22', // Orange
];

interface AccountCategoriesScreenProps {
  onBack?: (targetSegment?: 'my-account' | 'all-categories') => void;
  initialTab?: 'global' | 'per-account' | 'currencies';
}

export function AccountCategoriesScreen({
  onBack,
  initialTab = 'global'
}: AccountCategoriesScreenProps) {
  const { accounts, addAccount, updateAccountName, syncCategoryAllocations } = useAppStore();

  const [isSavingAllocation, setIsSavingAllocation] = useState(false);

  // Active top navigation tab (Global | Per Account | Currencies)
  const [activeTab, setActiveTab] = useState<'global' | 'per-account' | 'currencies'>(() => {
    if (initialTab === 'per-account' && accounts.length <= 1) return 'global';
    return initialTab;
  });

  // Rename account state
  const [isRenamingAccount, setIsRenamingAccount] = useState(false);
  const [renamedTitle, setRenamedTitle] = useState('');

  // Archived for future reuse: Version 2 Precision Slider
  // const [uiVersion, setUiVersion] = useState<'v1' | 'v2'>('v1');
  // const updatePercentageSafeSlider = ... (stored in codebase archive)

  // Hierarchy Navigation Path: [] = Level 1 (Root), ['cat-needs'] = Level 2, ['cat-needs', 'cat-food'] = Level 3
  const [navigationPath, setNavigationPath] = useState<string[]>([]);

  // Selected account for 'per-account' tab
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return accounts.length > 0 ? accounts[0].id : 'acct-hdfc';
  });
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Global hierarchical tree rules (loaded from localStorage or empty)
  const [globalTree, setGlobalTree] = useState<CategoryNodeAllocation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('richingness_category_allocations_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.globalTree)) return parsed.globalTree;
        }
      } catch {
        // Ignored
      }
    }
    return [];
  });

  // Per-account hierarchical tree rules map
  const [perAccountTrees, setPerAccountTrees] = useState<Record<string, CategoryNodeAllocation[]>>({});

  // UI Modals & Notifications
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings' | 'credit' | 'cash'>('savings');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardExitConfirm, setShowDiscardExitConfirm] = useState(false);

  // Currency Tab State
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['INR', 'USD', 'EUR', 'GBP', 'BTC', 'ETH']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBackOrCancel = () => {
    if (hasUnsavedChanges) {
      setShowDiscardExitConfirm(true);
    } else {
      const targetSegment = activeTab === 'per-account' ? 'my-account' : 'all-categories';
      onBack?.(targetSegment);
    }
  };

  // Lock background scrolling when any modal in AccountCategoriesScreen is open
  const isAnyModalOpen = showTemplateModal || showAddCategoryModal || showAddAccountModal || showDiscardExitConfirm;
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isAnyModalOpen) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
    };
  }, [isAnyModalOpen]);

  // Active hierarchical tree based on tab
  const activeTree = activeTab === 'global'
    ? globalTree
    : perAccountTrees[selectedAccountId] || DEFAULT_HIERARCHICAL_RULES;

  const setActiveTree = (updater: (prev: CategoryNodeAllocation[]) => CategoryNodeAllocation[]) => {
    if (activeTab === 'global') {
      setGlobalTree(updater);
    } else {
      setPerAccountTrees(prev => ({
        ...prev,
        [selectedAccountId]: updater(prev[selectedAccountId] || DEFAULT_HIERARCHICAL_RULES)
      }));
    }
  };

  // ── Tree Traversal Helpers ─────────────────────────────────────────────────
  const getNodeAtPath = (tree: CategoryNodeAllocation[], path: string[]): CategoryNodeAllocation | null => {
    let current: CategoryNodeAllocation | null = null;
    let list = tree;
    for (const stepId of path) {
      const found = list.find(n => n.id === stepId);
      if (!found) return null;
      current = found;
      list = found.children || [];
    }
    return current;
  };

  const getNodesAtCurrentLevel = (tree: CategoryNodeAllocation[], path: string[]): CategoryNodeAllocation[] => {
    if (path.length === 0) return tree;
    const parent = getNodeAtPath(tree, path);
    return parent?.children || [];
  };

  const activeLevelNodes = getNodesAtCurrentLevel(activeTree, navigationPath);
  const parentNode = navigationPath.length > 0 ? getNodeAtPath(activeTree, navigationPath) : null;
  const currentLevelNumber = navigationPath.length + 1;

  // Breadcrumb path info
  const breadcrumbChain: { id: string; name: string }[] = [];
  let tempTree = activeTree;
  for (const stepId of navigationPath) {
    const found = tempTree.find(n => n.id === stepId);
    if (found) {
      breadcrumbChain.push({ id: found.id, name: found.name });
      tempTree = found.children || [];
    }
  }

  // Calculate current total percentage at this level
  const totalPercentage = activeLevelNodes.reduce((sum, r) => sum + r.percentage, 0);
  const isTotal100 = totalPercentage === 100;
  const remainingTo100 = 100 - totalPercentage;

  // ── Non-Destructive Update of a Category's Percentage ─────────────────────
  // Editing one category NEVER alters or breaks previous categories!
  const updatePercentageNonDestructive = (id: string, newPercentage: number) => {
    setHasUnsavedChanges(true);
    const clampedVal = Math.max(0, Math.min(100, Math.round(newPercentage)));

    const recursiveUpdate = (nodes: CategoryNodeAllocation[], currentDepth = 0): CategoryNodeAllocation[] => {
      // If we are at the target level where the node lives
      if (currentDepth === navigationPath.length) {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, percentage: clampedVal };
          }
          return node;
        });
      }

      // Otherwise traverse down along navigationPath
      const targetChildId = navigationPath[currentDepth];
      return nodes.map(node => {
        if (node.id === targetChildId && node.children) {
          return {
            ...node,
            children: recursiveUpdate(node.children, currentDepth + 1)
          };
        }
        return node;
      });
    };

    setActiveTree(prev => recursiveUpdate(prev));
  };

  // Archived for future reuse: Safe Clamped Slider update
  // const updatePercentageSafeSlider = (id: string, newPercentage: number) => { ... };

  // Auto-distribute remainder at current level
  const handleAutoBalanceCurrentLevel = () => {
    if (activeLevelNodes.length === 0) return;

    if (activeLevelNodes.length === 1) {
      updatePercentageNonDestructive(activeLevelNodes[0].id, 100);
      showToast('Set to 100%!');
      return;
    }

    // If remaining budget > 0, assign remainder to the last item
    if (remainingTo100 > 0) {
      const last = activeLevelNodes[activeLevelNodes.length - 1];
      updatePercentageNonDestructive(last.id, last.percentage + remainingTo100);
      showToast(`Assigned remaining ${remainingTo100}% to ${last.name}`);
      return;
    }

    // If over-allocated (> 100%), scale down proportionally
    const scale = 100 / totalPercentage;
    let newSum = 0;
    const scaled = activeLevelNodes.map((node, i) => {
      if (i === activeLevelNodes.length - 1) {
        return { ...node, percentage: Math.max(0, 100 - newSum) };
      }
      const val = Math.max(1, Math.round(node.percentage * scale));
      newSum += val;
      return { ...node, percentage: val };
    });

    const recursiveReplace = (nodes: CategoryNodeAllocation[], currentDepth = 0): CategoryNodeAllocation[] => {
      if (currentDepth === navigationPath.length) {
        return scaled;
      }
      const targetChildId = navigationPath[currentDepth];
      return nodes.map(node => {
        if (node.id === targetChildId && node.children) {
          return {
            ...node,
            children: recursiveReplace(node.children, currentDepth + 1)
          };
        }
        return node;
      });
    };

    setActiveTree(prev => recursiveReplace(prev));
    showToast('Balanced current level to exactly 100%!');
  };

  // Add category or subcategory at current level
  const handleAddCategoryAtCurrentLevel = () => {
    if (!newCategoryName.trim()) return;
    setHasUnsavedChanges(true);

    const newId = `cat-${Date.now()}`;
    const newCat: CategoryNodeAllocation = {
      id: newId,
      name: newCategoryName.trim(),
      percentage: Math.max(5, Math.min(25, remainingTo100 > 0 ? remainingTo100 : 10)),
      level: currentLevelNumber,
      parentId: parentNode?.id || null,
      children: []
    };

    const recursiveAdd = (nodes: CategoryNodeAllocation[], currentDepth = 0): CategoryNodeAllocation[] => {
      if (currentDepth === navigationPath.length) {
        return [...nodes, newCat];
      }
      const targetChildId = navigationPath[currentDepth];
      return nodes.map(node => {
        if (node.id === targetChildId) {
          return {
            ...node,
            children: recursiveAdd(node.children || [], currentDepth + 1)
          };
        }
        return node;
      });
    };

    setActiveTree(prev => recursiveAdd(prev));
    setNewCategoryName('');
    setShowAddCategoryModal(false);
    showToast(`Added "${newCat.name}" to Level ${currentLevelNumber}!`);
  };

  // Remove category at current level
  const handleRemoveCategory = (id: string) => {
    if (activeLevelNodes.length <= 1) {
      showToast('You must have at least one category at this level.');
      return;
    }

    const recursiveRemove = (nodes: CategoryNodeAllocation[], currentDepth = 0): CategoryNodeAllocation[] => {
      if (currentDepth === navigationPath.length) {
        return nodes.filter(n => n.id !== id);
      }
      const targetChildId = navigationPath[currentDepth];
      return nodes.map(node => {
        if (node.id === targetChildId && node.children) {
          return {
            ...node,
            children: recursiveRemove(node.children, currentDepth + 1)
          };
        }
        return node;
      });
    };

    setActiveTree(prev => recursiveRemove(prev));
    showToast('Category removed.');
  };

  // Drill down into a category's subcategories
  const handleDrillDown = (category: CategoryNodeAllocation) => {
    // If it doesn't have children yet, initialize with default subcategories
    if (!category.children || category.children.length === 0) {
      const defaultChildren: CategoryNodeAllocation[] = [
        {
          id: `cat-sub-1-${Date.now()}`,
          name: `${category.name} Primary`,
          percentage: 60,
          level: category.level + 1,
          parentId: category.id
        },
        {
          id: `cat-sub-2-${Date.now()}`,
          name: `${category.name} Secondary`,
          percentage: 40,
          level: category.level + 1,
          parentId: category.id
        }
      ];

      const recursiveInitChildren = (nodes: CategoryNodeAllocation[]): CategoryNodeAllocation[] => {
        return nodes.map(node => {
          if (node.id === category.id) {
            return { ...node, children: defaultChildren };
          }
          if (node.children) {
            return { ...node, children: recursiveInitChildren(node.children) };
          }
          return node;
        });
      };

      setActiveTree(prev => recursiveInitChildren(prev));
    }

    setNavigationPath(prev => [...prev, category.id]);
  };

  // Apply default 50/30/20 allocation
  const applyDefaultAllocation = async () => {
    setActiveTree(() => DEFAULT_HIERARCHICAL_RULES);
    setNavigationPath([]);
    try {
      const payload = {
        globalTree: DEFAULT_HIERARCHICAL_RULES,
        perAccountTrees,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('richingness_category_allocations_v2', JSON.stringify(payload));
      await syncCategoryAllocations(DEFAULT_HIERARCHICAL_RULES.map(node => ({ name: node.name, percentage: node.percentage })));
    } catch {
      // Ignored
    }
    showToast('Applied Default 50/30/20 with subcategories!');
  };

  // Apply template
  const handleApplyTemplate = async (tmpl: FeaturedTemplate) => {
    const mapped: CategoryNodeAllocation[] = tmpl.categories.map((c, i) => ({
      id: `cat-tmpl-${i}-${Date.now()}`,
      name: c.name,
      percentage: c.percentage,
      level: 1,
      children: []
    }));
    setActiveTree(() => mapped);
    setNavigationPath([]);
    setShowTemplateModal(false);
    try {
      const payload = {
        globalTree: activeTab === 'global' ? mapped : globalTree,
        perAccountTrees: activeTab !== 'global' ? { ...perAccountTrees, [selectedAccountId]: mapped } : perAccountTrees,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('richingness_category_allocations_v2', JSON.stringify(payload));
      await syncCategoryAllocations(mapped.map(node => ({ name: node.name, percentage: node.percentage })));
    } catch {
      // Ignored
    }
    showToast(`Applied "${tmpl.title}" template!`);
  };

  // Save allocations to local storage and sync categories
  const handleSaveAllocation = async () => {
    if (isSavingAllocation) return;
    setIsSavingAllocation(true);

    if (!isTotal100) {
      showToast(`Notice: Current level total is ${totalPercentage}%. Recommended to balance to 100%.`);
    }
    try {
      const payload = {
        globalTree,
        perAccountTrees,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('richingness_category_allocations_v2', JSON.stringify(payload));

      const targetTree = activeTab === 'global' ? globalTree : (perAccountTrees[selectedAccountId] || globalTree);
      await syncCategoryAllocations(targetTree.map(node => ({ name: node.name, percentage: node.percentage })));
      setHasUnsavedChanges(false);
      showToast(`Allocations saved successfully!`);

      // Return to settings preview tab: 'my-account' for Per Account, 'all-categories' for Global
      setTimeout(() => {
        const targetSegment = activeTab === 'per-account' ? 'my-account' : 'all-categories';
        onBack?.(targetSegment);
      }, 400);
    } catch {
      showToast('Failed to save allocations.');
      setIsSavingAllocation(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('richingness_category_allocations_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.globalTree) setGlobalTree(parsed.globalTree);
        if (parsed.perAccountTrees) setPerAccountTrees(parsed.perAccountTrees);
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
    <div className="w-full md:max-w-xl lg:max-w-2xl md:mx-auto text-white select-none animate-fade-in pb-8 px-1 sm:px-0">

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#485F2C] text-white px-4 py-2.5 rounded-[12px] border border-[#6B8A44] shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5E89B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header: < Back | Account & Categories | 🌐 Currency | Cancel ── */}
      <div className="flex items-center justify-between py-2 mb-2">
        <button
          type="button"
          onClick={handleBackOrCancel}
          className="flex items-center gap-1 text-xs text-[#8F9E82] hover:text-white transition-colors cursor-pointer active:scale-95 py-1 px-1 -ml-1 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-sm text-white tracking-tight">
            {activeTab === 'currencies' ? 'Manage Currencies' : 'Account & Categories'}
          </h1>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'currencies' ? 'global' : 'currencies')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'currencies' ? 'bg-[#4A622F] text-white shadow-sm' : 'text-[#8F9E82] hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Manage Currencies"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleBackOrCancel}
          className="text-xs font-semibold text-[#8F9E82] hover:text-white transition-colors cursor-pointer active:scale-95 py-1 px-2 rounded-lg hover:bg-white/[0.05]"
          title="Cancel and return to Settings"
        >
          Cancel
        </button>
      </div>

      {/* ── Allocation Scope Header Card (Global Default + Optional Per-Account Checkbox) ── */}
      {activeTab !== 'currencies' && (
        <div className="bg-[#151D11] border border-[#27351F] rounded-[14px] p-3 mb-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === 'per-account' ? 'bg-[#E87A24]/20 text-[#E87A24]' : 'bg-[#4A622F]/20 text-[#8EBA55]'
              }`}>
                {activeTab === 'per-account' ? <Wallet className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {activeTab === 'per-account' ? 'Custom Per-Account Rules' : 'Globally Allocated'}
                </span>
                <span className="text-[10px] text-[#7E9173] block truncate">
                  {activeTab === 'per-account' ? `Configuring custom split for ${activeAccountObj.name}` : 'By default, allocation applies across all accounts'}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-[#10160D] border border-[#26331E] px-2.5 py-1.5 rounded-xl hover:border-[#3E4F32] transition-colors shrink-0">
              <input
                type="checkbox"
                checked={activeTab === 'per-account'}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (accounts.length <= 1) {
                      showToast('Add another account to configure different per-account rules.');
                      return;
                    }
                    setActiveTab('per-account');
                  } else {
                    setActiveTab('global');
                  }
                }}
                className="accent-[#6B8F3C] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-[#C5E89B]">Per-Account</span>
            </label>
          </div>

          {activeTab === 'per-account' && (
            <div className="pt-2 border-t border-[#232F1B] flex items-center justify-between gap-2 animate-fade-in">
              <span className="text-[11px] text-[#7E9173] font-medium">Select Account:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-[#1B2315] border border-[#2B3921] rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer font-medium"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 & 2: GLOBAL & PER ACCOUNT HIERARCHICAL ALLOCATION RULES          */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab !== 'currencies' && (
        <div className="space-y-3.5">

          {/* ── Global Scope Box (Figma Design) ── */}
          {activeTab === 'global' && (
            <div className="space-y-1.5">
              <div className="bg-[#1A2315] border border-[#2C3B23] rounded-[12px] px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-white">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#8EBA55]" />
                  <span>All accounts</span>
                </div>
              </div>
              <div className="px-0.5 pt-0.5">
                <span className="text-xs font-bold text-white tracking-tight">
                  Allocation for all accounts
                </span>
              </div>
            </div>
          )}

          {/* ── Per Account Dropdown (if Per-Account tab is active) ── */}
          {activeTab === 'per-account' && (
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

              <div className="flex items-center justify-between px-0.5">
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="text-xs text-[#8EBA55] hover:text-[#A6D66B] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add account</span>
                </button>
              </div>

              <div className="px-0.5 pt-0.5">
                <span className="text-xs font-bold text-white tracking-tight">
                  Allocation for this account
                </span>
              </div>
            </div>
          )}

          {/* (Note: Version 2 Precision Slider is preserved in codebase archives for future reuse if needed) */}

          {/* ── SLEEK COMPACT ALLOCATION INDICATOR (Minimal vertical space) ── */}
          <div className="bg-[#172013] border border-[#283620] rounded-[12px] p-2.5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isTotal100 ? 'bg-[#A8E063] shadow-[0_0_8px_rgba(168,224,99,0.5)]' : totalPercentage > 100 ? 'bg-rose-400' : 'bg-[#F2811D]'
                }`} />
                <div className="truncate">
                  {isTotal100 ? (
                    <span className="font-bold text-[#A8E063] text-xs">
                      100% Balanced ✓
                    </span>
                  ) : totalPercentage < 100 ? (
                    <span className="text-white/90 font-medium text-xs">
                      <strong className="text-white font-bold">{totalPercentage}%</strong> allocated · <span className="text-[#A5E265] font-semibold">{remainingTo100}% left</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold text-xs">
                      {totalPercentage}% (Over by {totalPercentage - 100}%)
                    </span>
                  )}
                </div>
              </div>

              {!isTotal100 && (
                <button
                  onClick={handleAutoBalanceCurrentLevel}
                  className="px-2 py-0.5 rounded-[6px] bg-[#364923] hover:bg-[#465F2D] text-[#C5E89B] text-[10px] font-bold border border-[#4C6432] transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Auto-Balance</span>
                </button>
              )}
            </div>

            {/* Segmented Color Breakdown Bar */}
            <div className="w-full h-1.5 bg-[#10160D] rounded-full overflow-hidden flex items-center">
              {activeLevelNodes.map((cat, idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const widthPercent = Math.max(0, Math.min(100, cat.percentage));
                return (
                  <div
                    key={cat.id}
                    style={{ width: `${widthPercent}%`, backgroundColor: color }}
                    className="h-full transition-all duration-300"
                    title={`${cat.name}: ${cat.percentage}%`}
                  />
                );
              })}
              {remainingTo100 > 0 && (
                <div
                  style={{ width: `${remainingTo100}%` }}
                  className="h-full bg-white/10"
                  title={`Unallocated: ${remainingTo100}%`}
                />
              )}
            </div>
          </div>

          {/* ── Quick-Switch Category Segmented Bar (Single Tap between Root and Top Categories) ── */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 pt-0.5">
            <button
              type="button"
              onClick={() => setNavigationPath([])}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                navigationPath.length === 0
                  ? 'bg-[#4A622F] text-white shadow-xs border border-[#5F7C3C]'
                  : 'bg-[#182114] text-[#829577] hover:text-white border border-[#27351F]'
              }`}
            >
              <span>Root Level</span>
            </button>
            {activeTree.map((rootCat, idx) => {
              const isSelected = navigationPath[0] === rootCat.id;
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              return (
                <button
                  key={rootCat.id}
                  type="button"
                  onClick={() => {
                    handleDrillDown(rootCat);
                  }}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#4A622F] text-white shadow-xs border border-[#5F7C3C]'
                      : 'bg-[#182114] text-[#829577] hover:text-white border border-[#27351F]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span>{rootCat.name}</span>
                  <span className="text-[10px] opacity-80 font-bold">{rootCat.percentage}%</span>
                </button>
              );
            })}
          </div>

          {/* ── Refined Breadcrumb & Level Path ── */}
          <div className="bg-[#141C10] border border-[#232F1B] rounded-[12px] px-3.5 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <button
                type="button"
                onClick={() => setNavigationPath([])}
                className={`transition-colors cursor-pointer text-xs ${
                  navigationPath.length === 0 ? 'text-[#A8E063] font-bold' : 'text-[#7D8F72] hover:text-white font-medium'
                }`}
              >
                All Categories
              </button>

              {breadcrumbChain.map((bc, idx) => {
                const isLast = idx === breadcrumbChain.length - 1;
                return (
                  <React.Fragment key={bc.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-[#506346] shrink-0" />
                    <button
                      type="button"
                      onClick={() => setNavigationPath(navigationPath.slice(0, idx + 1))}
                      className={`truncate max-w-[120px] transition-colors cursor-pointer text-xs ${
                        isLast ? 'text-[#A8E063] font-bold' : 'text-[#7D8F72] hover:text-white font-medium'
                      }`}
                    >
                      {bc.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {parentNode ? (
              <button
                type="button"
                onClick={() => setNavigationPath(prev => prev.slice(0, -1))}
                className="text-[11px] text-[#A8E063] hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer font-medium"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Up</span>
              </button>
            ) : (
              <span className="text-[10px] font-medium text-[#657858] shrink-0">
                Root Level
              </span>
            )}
          </div>

          {/* Context Note when inside a Subcategory */}
          {parentNode && (
            <div className="flex items-center justify-between px-1 text-[11px] text-[#8EA083]">
              <span>
                Subcategories inside <strong className="text-white">{parentNode.name}</strong> ({parentNode.percentage}% of parent)
              </span>
            </div>
          )}

          {/* ── Category List Header & Add Button ── */}
          <div className="flex items-center justify-between px-0.5 pt-1">
            <span className="text-xs font-bold text-white tracking-tight">
              {parentNode ? `${parentNode.name} Subcategories` : 'Categories'}
            </span>
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="text-xs font-semibold text-[#8EBA55] hover:text-[#A8E063] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{parentNode ? 'Add Subcategory' : 'Add Category'}</span>
            </button>
          </div>

          {/* ── Categories Allocation Rows ── */}
          <div className="space-y-2.5">
            {activeLevelNodes.length === 0 ? (
              <div className="bg-[#171F13] border border-[#26331F] rounded-[14px] p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#202B1A] border border-[#304026] flex items-center justify-center mx-auto text-[#8E8A82]">
                  <LayoutTemplate className="w-6 h-6 text-[#A8E063]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No categories configured yet</h4>
                  <p className="text-xs text-[#8E8A82] mt-1 max-w-xs mx-auto">
                    Add your first category below, or apply a template from the template section to speed up setup.
                  </p>
                </div>
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="py-2.5 px-5 rounded-[10px] bg-[#4A622F] hover:bg-[#587538] text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                  >
                    + Add Category
                  </button>
                </div>
              </div>
            ) : (
              activeLevelNodes.map((category, index) => {
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              const childCount = category.children?.length || 0;
              const hasChildren = childCount > 0;

              return (
                <div
                  key={category.id}
                  className="bg-[#171F13] border border-[#26331F] rounded-[14px] p-3.5 space-y-3 transition-all shadow-sm"
                >
                  
                  {/* Category Title Row: Color Indicator + Name + Subcategory Link + [Version 2 Value Box] + Delete */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-white/95 text-sm truncate">
                        {category.name}
                      </span>

                      {/* Subcategory Navigation */}
                      <button
                        type="button"
                        onClick={() => handleDrillDown(category)}
                        className={`text-xs font-medium flex items-center gap-1 py-0.5 px-2 rounded-lg transition-colors cursor-pointer ${
                          hasChildren
                            ? 'text-[#A8E063] hover:bg-white/[0.04]'
                            : 'text-[#6C7E61] hover:text-[#A8E063] hover:bg-white/[0.03]'
                        }`}
                        title={hasChildren ? `View ${childCount} subcategories` : `Add subcategories`}
                      >
                        {hasChildren ? (
                          <>
                            <span>{childCount} subs</span>
                            <ChevronRight className="w-3 h-3 text-[#A8E063]" />
                          </>
                        ) : (
                          <>
                            <Plus className="w-2.5 h-2.5" />
                            <span>Sub</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Remove category */}
                      {activeLevelNodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category.id)}
                          className="text-[#56684E] hover:text-rose-400 p-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                          title="Remove category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ═════════════════════════════════════════════════════════════ */}
                  {/* Tactile ±5% Stepper Pill                                     */}
                  {/* ═════════════════════════════════════════════════════════════ */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <div className="text-xs text-[#829577] min-w-0 truncate">
                      Allocation: <span className="text-white font-bold">{category.percentage}%</span>
                    </div>

                    {/* Integrated Stepper Pill */}
                    <div className="flex items-center bg-[#11170D] border border-[#2B3921] rounded-[10px] overflow-hidden shadow-inner shrink-0">
                      <button
                        type="button"
                        onClick={() => updatePercentageNonDestructive(category.id, category.percentage - 5)}
                        className="w-11 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.07] active:bg-white/[0.15] text-lg font-bold transition-all cursor-pointer active:scale-95"
                        title="Decrease 5%"
                      >
                        −
                      </button>
                      <div className="w-14 h-9 flex items-center justify-center border-x border-[#2B3921] bg-[#0E130B] px-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={category.percentage}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '');
                            updatePercentageNonDestructive(category.id, clean === '' ? 0 : Number(clean));
                          }}
                          className="no-spin w-8 bg-transparent text-white text-center outline-none font-bold text-xs"
                        />
                        <span className="text-[#7E9173] text-[11px] font-semibold">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePercentageNonDestructive(category.id, category.percentage + 5)}
                        className="w-11 h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.07] active:bg-white/[0.15] text-lg font-bold transition-all cursor-pointer active:scale-95"
                        title="Increase 5%"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>
              );
            }))}
          </div>

          {/* ── Level Total Summary ── */}
          <div className="flex items-center justify-between pt-2 border-t border-[#232F1B]">
            <span className="font-bold text-xs text-white">
              Level {currentLevelNumber} Total
            </span>
            <div className="flex items-center gap-2">
              {!isTotal100 && (
                <button
                  onClick={handleAutoBalanceCurrentLevel}
                  className="text-[10px] bg-[#3B5026] text-[#C5E89B] px-2 py-0.5 rounded-md font-bold hover:bg-[#4B6630] border border-[#4E6B34] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Auto balance to 100%"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Fix to 100%</span>
                </button>
              )}
              <span
                className={`font-extrabold text-sm num-display tracking-tight ${
                  isTotal100 ? 'text-[#A8E063]' : 'text-[#F2811D]'
                }`}
              >
                {totalPercentage}%
              </span>
            </div>
          </div>

          {/* Warning banner if not 100% */}
          {!isTotal100 && (
            <div className="bg-[#241B12] border border-[#5E3812] rounded-[10px] p-2.5 text-xs flex items-center justify-between gap-2 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F2811D] shrink-0" />
                <span className="text-[11px] text-[#E0B496] truncate">
                  {totalPercentage < 100
                    ? `${100 - totalPercentage}% unassigned at this level`
                    : `Over-allocated by ${totalPercentage - 100}%`}
                </span>
              </div>
              <button
                onClick={handleAutoBalanceCurrentLevel}
                className="px-2.5 py-1 rounded-[6px] bg-[#F2811D] hover:bg-[#FF8F2D] text-black font-extrabold text-[10px] transition-all cursor-pointer shrink-0"
              >
                Auto-Fix
              </button>
            </div>
          )}

          {/* ── Action Buttons (Cancel, Save & Default Allocation) ── */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackOrCancel}
                className="flex-1 py-3.5 rounded-[12px] bg-[#1B2317] hover:bg-[#253020] text-[#8E9E82] hover:text-white font-semibold text-xs border border-[#2B3921] transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllocation}
                disabled={isSavingAllocation}
                className={`flex-[2] py-3.5 rounded-[12px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-[0.99] text-[#11130E] font-bold text-sm shadow-md transition-all cursor-pointer text-center ${
                  isSavingAllocation ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isSavingAllocation ? 'Saving...' : 'Save allocation'}
              </button>
            </div>

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

          {/* ── Featured Template Card (Figma Exact) ── */}
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
      {/* TAB 3: MANAGE CURRENCIES 2.0                                           */}
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

      {/* ── 1. Templates Store Modal (Exact Figma Draft / Templates store Screen) ── */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overscroll-contain"
          style={{ touchAction: 'none' }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="relative w-full max-w-md bg-[#161D12] border border-[#2B3822] rounded-[20px] p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            style={{ touchAction: 'pan-y' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#27351F] pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Templates store</h3>
                <p className="text-[11px] text-[#7D8F72]">Speed up setting your categories with tested templates</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Search Bar */}
            <div className="bg-[#10160D] border border-[#27351F] rounded-[10px] px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7D8F72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search templates"
                className="bg-transparent text-xs text-white placeholder-[#687C5E] outline-none w-full font-medium"
              />
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Featured Templates */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#A8E063] uppercase tracking-wider">
                  Featured Templates
                </span>
                <div className="bg-[#1A2214] border border-[#3B4D2F] rounded-xl p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">50/30/20 Budget</h4>
                      <p className="text-[11px] text-[#A2BA92] mt-0.5">By Richingness · ★ 4.8 | 12.4K uses</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(FEATURED_TEMPLATES[0])}
                      className="px-3.5 py-1.5 rounded-[8px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-95 text-[#11130E] font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      Use
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7D8F72] leading-relaxed">
                    Standard balanced formula: 50% Needs, 30% Wants, 20% Savings.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/90">
                      Needs: <span className="font-bold text-[#8EBA55]">50%</span>
                    </span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/90">
                      Wants: <span className="font-bold text-[#8EBA55]">30%</span>
                    </span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/90">
                      Savings: <span className="font-bold text-[#8EBA55]">20%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Popular Templates */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#8EA083] uppercase tracking-wider">
                  Popular Templates
                </span>
                <div className="space-y-2">
                  {FEATURED_TEMPLATES.slice(1).map(tmpl => (
                    <div
                      key={tmpl.id}
                      className="bg-[#171F13] border border-[#27351F] hover:border-[#3D522F] rounded-xl p-3 space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-white">{tmpl.title}</h4>
                          <p className="text-[10px] text-[#788C6C]">By Richingness · ★ 4.7 | 8.2K uses</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-3 py-1 rounded-[8px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-95 text-[#11130E] font-bold text-xs shadow-sm transition-all cursor-pointer"
                        >
                          Use
                        </button>
                      </div>
                      <p className="text-[11px] text-[#7D8F72] leading-relaxed">{tmpl.description}</p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
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
          </div>
        </div>
      )}

      {/* ── 2. Add Category Modal ── */}
      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overscroll-contain"
          style={{ touchAction: 'none' }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="relative w-full max-w-sm bg-[#161D12] border border-[#2B3822] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
            style={{ touchAction: 'pan-y' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#27351F] pb-3">
              <h3 className="font-bold text-sm text-white">
                {parentNode ? `Add Subcategory inside ${parentNode.name}` : 'Add Category Rule'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (newCategoryName.trim()) {
                    setShowDiscardExitConfirm(true);
                  } else {
                    setShowAddCategoryModal(false);
                  }
                }}
                className="text-[#888] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#7D8F72] font-semibold">
                {parentNode ? 'Subcategory Name' : 'Category Name'}
              </label>
              <input
                type="text"
                placeholder={parentNode ? "e.g. Groceries, Car Loan, Streaming" : "e.g. Needs, Wants, Savings"}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-[#1A2214] border border-[#2B3822] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategoryAtCurrentLevel()}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (newCategoryName.trim()) {
                    setShowDiscardExitConfirm(true);
                  } else {
                    setShowAddCategoryModal(false);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-[#20271A] text-xs font-semibold text-[#888] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategoryAtCurrentLevel}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overscroll-contain"
          style={{ touchAction: 'none' }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="relative w-full max-w-sm bg-[#161D12] border border-[#2B3822] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
            style={{ touchAction: 'pan-y' }}
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* ── 4. Unsaved Changes Exit Confirmation Modal ── */}
      {showDiscardExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overscroll-contain"
          style={{ touchAction: 'none' }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="relative w-full max-w-sm bg-[#181F13] border border-[#2D3B23] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
            style={{ touchAction: 'pan-y' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F2811D]/15 text-[#F2811D] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">Discard Unsaved Changes?</h3>
                <p className="text-xs text-[#9DAE93] leading-relaxed">
                  You have made changes to the category allocations that have not been saved yet. Leaving now will discard these changes.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#232C1B] hover:bg-[#2C3822] text-xs font-semibold text-white cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardExitConfirm(false);
                  setHasUnsavedChanges(false);
                  const targetSegment = activeTab === 'per-account' ? 'my-account' : 'all-categories';
                  onBack?.(targetSegment);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#F2811D] hover:bg-[#FF8E2E] text-xs font-bold text-black shadow-md transition-all cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
