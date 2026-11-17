'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Layers,
  Plus,
  X
} from 'lucide-react';
import { useAppStore } from '../app/store';
import { CategoryNodeAllocation } from './AccountCategoriesScreen';

// ── Types ───────────────────────────────────────────────────────────────────
export interface CategoryNodeItem {
  id: string;
  name: string;
  percentage?: number;
  level: number; // 1, 2, 3, 4, 5
  displayTotal?: number;
  income: number;
  expense: number;
  badges?: string[];
  dueNotice?: {
    text: string;
    amount: number;
    buttonText: string;
  };
  children?: CategoryNodeItem[];
}

export interface BudgetPoolPreset {
  id: string;
  name: string;
  total: number;
  income: number;
  expense: number;
  available: number;
  categories: CategoryNodeItem[];
}

// ── Presets ─────────────────────────────────────────────────────────────────

// Preset 1: Exact Figma Screen (Image 5 & Annotations - Life Budget ₹12,000)
export const FIGMA_LIFE_BUDGET_PRESET: BudgetPoolPreset = {
  id: 'figma-life-budget',
  name: 'Life Budget',
  total: 12000,
  income: 650,
  expense: 11350,
  available: 650,
  categories: [
    {
      id: 'cat-needs',
      name: 'Needs: 50%',
      percentage: 50,
      level: 1,
      displayTotal: 6000,
      income: 0,
      expense: 8000,
      children: [
        {
          id: 'cat-rent',
          name: 'Rent',
          percentage: 50,
          level: 2,
          displayTotal: 6000,
          income: 0,
          expense: 4000,
          badges: ['Due'],
          dueNotice: {
            text: 'Due taken from 2 categories',
            amount: 4000,
            buttonText: 'Pay'
          }
        },
        {
          id: 'cat-food',
          name: 'Food',
          percentage: 50,
          level: 2,
          displayTotal: 6000,
          income: 0,
          expense: 4000,
          children: [
            {
              id: 'cat-groceries',
              name: 'Groceries: 60%',
              percentage: 60,
              level: 3,
              displayTotal: 2400,
              income: 0,
              expense: 2400,
              children: [
                {
                  id: 'cat-supermarket',
                  name: 'Supermarket: 70%',
                  percentage: 70,
                  level: 4,
                  displayTotal: 1680,
                  income: 0,
                  expense: 1680,
                  children: [
                    {
                      id: 'cat-staples',
                      name: 'Organic Staples: 60%',
                      percentage: 60,
                      level: 5,
                      displayTotal: 1008,
                      income: 0,
                      expense: 1008
                    },
                    {
                      id: 'cat-dairy',
                      name: 'Dairy & Bakery: 40%',
                      percentage: 40,
                      level: 5,
                      displayTotal: 672,
                      income: 0,
                      expense: 672
                    }
                  ]
                },
                {
                  id: 'cat-produce',
                  name: 'Fresh Produce: 30%',
                  percentage: 30,
                  level: 4,
                  displayTotal: 720,
                  income: 0,
                  expense: 720
                }
              ]
            },
            {
              id: 'cat-dining',
              name: 'Dining: 40%',
              percentage: 40,
              level: 3,
              displayTotal: 1600,
              income: 0,
              expense: 1600
            }
          ]
        }
      ]
    },
    {
      id: 'cat-wants',
      name: 'Wants: 30%',
      percentage: 30,
      level: 1,
      displayTotal: 4500,
      badges: ['Repay'],
      income: 650,
      expense: 3850,
      children: [
        {
          id: 'cat-hobbies',
          name: 'Hobbies: 50%',
          percentage: 50,
          level: 2,
          displayTotal: 2250,
          income: 300,
          expense: 1900
        },
        {
          id: 'cat-lifestyle',
          name: 'Lifestyle: 50%',
          percentage: 50,
          level: 2,
          displayTotal: 2250,
          income: 350,
          expense: 1950
        }
      ]
    },
    {
      id: 'cat-savings',
      name: 'Savings: 20%',
      percentage: 20,
      level: 1,
      displayTotal: 1500,
      income: 0,
      expense: 1500,
      children: [
        {
          id: 'cat-emergency',
          name: 'Emergency Fund: 70%',
          percentage: 70,
          level: 2,
          displayTotal: 1050,
          income: 0,
          expense: 1050
        },
        {
          id: 'cat-investments',
          name: 'Investments: 30%',
          percentage: 30,
          level: 2,
          displayTotal: 450,
          income: 0,
          expense: 450
        }
      ]
    }
  ]
};

// Preset 2: User Prompt Exact Example (Pool ₹200 with 3-level percentage cascade)
export const USER_PROMPT_DEMO_PRESET: BudgetPoolPreset = {
  id: 'user-demo-200',
  name: 'User Example Budget',
  total: 200,
  income: 200,
  expense: 140,
  available: 60,
  categories: [
    {
      id: 'cat-A',
      name: 'CateA: 20%',
      percentage: 20,
      level: 1,
      income: 40,
      expense: 30,
      children: [
        {
          id: 'scat-A1',
          name: 'scateA: 25%',
          percentage: 25,
          level: 2,
          income: 10,
          expense: 7,
          children: [
            {
              id: 'sscat-A1a',
              name: 'Sub-Cat 1: 30%',
              percentage: 30,
              level: 3,
              income: 3,
              expense: 2
            },
            {
              id: 'sscat-A1b',
              name: 'Sub-Cat 2: 40%',
              percentage: 40,
              level: 3,
              income: 4,
              expense: 3
            },
            {
              id: 'sscat-A1c',
              name: 'Sub-Cat 3: 30% (Remaining)',
              percentage: 30,
              level: 3,
              income: 3,
              expense: 2
            }
          ]
        },
        {
          id: 'scat-A2',
          name: 'scateB: 75%',
          percentage: 75,
          level: 2,
          income: 30,
          expense: 23
        }
      ]
    },
    {
      id: 'cat-B',
      name: 'CateB: 80%',
      percentage: 80,
      level: 1,
      badges: ['Due'],
      income: 160,
      expense: 110,
      dueNotice: {
        text: 'Due allocated from CateB',
        amount: 50,
        buttonText: 'Pay'
      },
      children: [
        {
          id: 'scat-B1',
          name: 'Operations: 60%',
          percentage: 60,
          level: 2,
          income: 96,
          expense: 65
        },
        {
          id: 'scat-B2',
          name: 'Contingency: 40%',
          percentage: 40,
          level: 2,
          income: 64,
          expense: 45
        }
      ]
    }
  ]
};

// Preset 3: 5-Level Deep Hierarchy Test
export const FIVE_LEVEL_TEST_PRESET: BudgetPoolPreset = {
  id: 'five-level-test',
  name: '5-Level Deep Budget',
  total: 10000,
  income: 1000,
  expense: 9000,
  available: 1000,
  categories: [
    {
      id: 'l1-operations',
      name: 'L1 Operations: 50%',
      percentage: 50,
      level: 1,
      income: 500,
      expense: 4500,
      children: [
        {
          id: 'l2-tech',
          name: 'L2 Technology: 60%',
          percentage: 60,
          level: 2,
          income: 300,
          expense: 2700,
          children: [
            {
              id: 'l3-cloud',
              name: 'L3 Cloud Infra: 50%',
              percentage: 50,
              level: 3,
              income: 150,
              expense: 1350,
              children: [
                {
                  id: 'l4-cluster',
                  name: 'L4 Servers: 60%',
                  percentage: 60,
                  level: 4,
                  income: 90,
                  expense: 810,
                  children: [
                    {
                      id: 'l5-db',
                      name: 'L5 Main DB: 70%',
                      percentage: 70,
                      level: 5,
                      income: 60,
                      expense: 570
                    },
                    {
                      id: 'l5-backup',
                      name: 'L5 Backup: 30%',
                      percentage: 30,
                      level: 5,
                      income: 30,
                      expense: 240
                    }
                  ]
                },
                {
                  id: 'l4-staging',
                  name: 'L4 Staging: 40%',
                  percentage: 40,
                  level: 4,
                  income: 60,
                  expense: 540
                }
              ]
            },
            {
              id: 'l3-media',
              name: 'L3 Media & CDN: 50%',
              percentage: 50,
              level: 3,
              income: 150,
              expense: 1350
            }
          ]
        },
        {
          id: 'l2-workspace',
          name: 'L2 Workspace: 40%',
          percentage: 40,
          level: 2,
          income: 200,
          expense: 1800
        }
      ]
    },
    {
      id: 'l1-marketing',
      name: 'L1 Marketing: 30%',
      percentage: 30,
      level: 1,
      badges: ['Repay'],
      income: 300,
      expense: 2700
    },
    {
      id: 'l1-reserves',
      name: 'L1 Reserves: 20%',
      percentage: 20,
      level: 1,
      income: 200,
      expense: 1800
    }
  ]
};

// ── Refined Visual Specification (Locked for Final Production) ───────────────
// Continuous scope rails with 5.5px crisp dots, 8px rail step (2.5px gap between dots)
const REFINED_PROFILE = {
  dotDiameter: 5.5,
  lineWidth: 1.5,
  railStep: 8,       // 8px between levels -> 6.5px gap between lines, 2.5px gap between dots
  textIndent: 16,
  railX: 4
} as const;

// ── Main Component ──────────────────────────────────────────────────────────
// Convert saved allocations tree into visual CategoryNodeItem list
function convertAllocationsToItems(
  nodes: CategoryNodeAllocation[],
  parentAmount: number,
  ledgerOps: Array<{ type: string; referenceId?: string | null; description?: string; amount: bigint }>,
  level = 1
): CategoryNodeItem[] {
  return nodes.map(node => {
    const allocated = Math.round((parentAmount * (node.percentage || 0)) / 100);
    const adjustments = Number(
      ledgerOps
        .filter(op => op.type === 'ADJUSTMENT' && op.referenceId === node.id)
        .reduce((sum, op) => sum + op.amount, 0n)
    ) / 100;
    const effectiveAllocated = Math.max(0, allocated + adjustments);
    const spent = Number(
      ledgerOps
        .filter(op => op.type === 'EXPENSE' && op.referenceId === node.id)
        .reduce((sum, op) => sum + op.amount, 0n)
    ) / 100;

    const isDue = spent > effectiveAllocated && effectiveAllocated > 0;
    const isRepay = effectiveAllocated > spent && spent > 0;
    const badges: string[] = [];
    if (isDue) badges.push('Due');
    else if (isRepay && node.name.toLowerCase().includes('hobbies')) badges.push('Repay');

    const children = node.children && node.children.length > 0
      ? convertAllocationsToItems(node.children, effectiveAllocated || parentAmount, ledgerOps, level + 1)
      : undefined;

    return {
      id: node.id,
      name: node.name,
      percentage: node.percentage,
      level,
      displayTotal: effectiveAllocated,
      income: 0,
      expense: spent,
      badges: badges.length > 0 ? badges : undefined,
      dueNotice: isDue ? {
        text: `Due: ₹${spent - effectiveAllocated}`,
        amount: spent - effectiveAllocated,
        buttonText: 'Pay'
      } : undefined,
      children
    };
  });
}

export function ExpandableCategoriesTree({
  searchQuery = '',
  filter = 'ALL',
  onPayDue,
  onNavigateToAllocations,
  onSpendCategory,
  realAccountBalance = 0
}: {
  searchQuery?: string;
  filter?: 'ALL' | 'DUE' | 'REPAY';
  onPayDue?: (amount: number, categoryName: string) => void;
  onNavigateToAllocations?: (tab: 'global' | 'per-account' | 'currencies') => void;
  onSpendCategory?: (categoryId: string, categoryName: string) => void;
  realAccountBalance?: number;
}) {
  const storeCategories = useAppStore(state => state.categories);
  const storeLedger = useAppStore(state => state.ledger);

  // Modals matching Figma Draft / Category due payment pop... and Repay pop-up
  const [dueModalOpen, setDueModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);

  const activeProfile = REFINED_PROFILE;

  // Custom pool override
  const [customPoolTotal] = useState<number | null>(null);

  // Expanded nodes map (default: all collapsed so user starts with a clean, unexpanded overview)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Saved allocations in localStorage
  const [savedAllocations] = useState<CategoryNodeAllocation[] | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('richingness_category_allocations_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.globalTree) && parsed.globalTree.length > 0) {
            return parsed.globalTree;
          }
        }
      } catch {
        // Ignored
      }
    }
    return null;
  });

  const hasCategories = (savedAllocations && savedAllocations.length > 0) || storeCategories.length > 0;

  // Read unallocated buffer from localStorage (money pulled into Default Buffer outside percentage spread)
  const totalUnallocated = (() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('richingness_unallocated_by_account_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          return Object.values(parsed).reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0);
        }
      } catch {
        // ignore
      }
    }
    return 0;
  })();

  // Pool total: dynamically tied to real account balance minus unallocated buffer (or custom override)
  const effectiveBalance = Math.max(0, realAccountBalance - totalUnallocated);
  const poolTotal = customPoolTotal !== null ? customPoolTotal : effectiveBalance;

  // Dynamically convert configured allocations or store categories into visual items
  const baseCategoryItems: CategoryNodeItem[] = savedAllocations && savedAllocations.length > 0
    ? convertAllocationsToItems(savedAllocations, poolTotal, storeLedger)
    : storeCategories.map((c) => {
        const pct = Number(c.budgetAmount) > 0 ? Math.min(100, Math.round(Number(c.budgetAmount) / 100)) : 0;
        const allocated = Math.round((poolTotal * pct) / 100);
        const spent = Number(
          storeLedger
            .filter(op => op.type === 'EXPENSE' && op.referenceId === c.id)
            .reduce((sum, op) => sum + op.amount, 0n)
        ) / 100;

        return {
          id: c.id,
          name: c.name,
          percentage: pct,
          level: 1,
          displayTotal: allocated,
          income: 0,
          expense: spent,
          badges: spent > allocated && allocated > 0 ? ['Due'] : undefined,
          children: undefined
        };
      });

  const defaultBufferExpense = Number(
    storeLedger
      .filter(op => op.type === 'EXPENSE' && (op.referenceId === 'cat-default' || op.referenceId === 'cat-default-buffer' || op.referenceId?.toLowerCase().includes('default')))
      .reduce((sum, op) => sum + op.amount, 0n)
  ) / 100;

  const categoryItems: CategoryNodeItem[] = baseCategoryItems;

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Cascading math engine
  const computeAllocatedAmount = (node: CategoryNodeItem, parentAmount: number): number => {
    if (node.displayTotal !== undefined && node.percentage === undefined) {
      return node.displayTotal;
    }
    return Math.round((parentAmount * (node.percentage || 0)) / 100);
  };

  // Filter checker
  const nodeMatchesFilter = (node: CategoryNodeItem): boolean => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag =
      filter === 'ALL' ||
      (filter === 'DUE' && node.badges?.includes('Due')) ||
      (filter === 'REPAY' && node.badges?.includes('Repay'));

    if (matchesSearch && matchesTag) return true;
    if (node.children) {
      return node.children.some(child => nodeMatchesFilter(child));
    }
    return false;
  };

  // If no categories configured yet, render clean empty state matching Figma
  if (!hasCategories) {
    return (
      <div
        onClick={() => onNavigateToAllocations && onNavigateToAllocations('global')}
        className="w-full text-center bg-gradient-to-b from-[#1C1A17] to-[#151411] hover:from-[#201E1A] hover:to-[#181713] border border-white/[0.08] hover:border-[#4A622F]/60 rounded-2xl p-6 sm:p-7 space-y-3.5 shadow-xl select-none block cursor-pointer transition-all group"
      >
        <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-[#4A622F]/15 blur-md group-hover:bg-[#4A622F]/30 transition-all" />
          <div className="relative w-12 h-12 rounded-2xl bg-[#23211C] group-hover:bg-[#2A2722] border border-white/[0.08] group-hover:border-[#587437]/50 flex items-center justify-center text-[#A09C94] group-hover:text-[#A8E063] transition-all">
            <Layers className="w-5 h-5 transition-transform group-hover:scale-105" />
          </div>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#A8E063] tracking-tight transition-colors">
            No Budget Categories Yet
          </h3>
          <p className="text-xs sm:text-sm text-[#8E8A82] mt-1 max-w-xs mx-auto leading-relaxed">
            Divide your balance into categories like Needs, Wants, and Savings to maintain your budget and manage your spending well.
          </p>
        </div>

        <div className="pt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#A8E063] group-hover:text-white transition-all">
          <span>Set Up Categories</span>
          <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  }

  // Calculate live summary metrics
  const totalExpense = categoryItems.reduce((acc, cat) => acc + (cat.expense || 0), 0);
  const totalIncome = Number(storeLedger.filter(l => l.type === 'INCOME').reduce((acc, l) => acc + l.amount, 0n)) / 100;
  const lifeBudgetIncome = Math.max(0, totalIncome - (totalUnallocated > 0 ? totalUnallocated : 0));
  const availableBalance = Math.max(0, poolTotal - totalExpense);
  const expensePercentage = poolTotal > 0 ? Math.min(100, Math.round((totalExpense / poolTotal) * 100)) : 0;
  const availablePercentage = Math.max(0, 100 - expensePercentage);

  // ── Multi-Rail Category Item ──────────────────────────────────────────────
  const renderCategoryItem = (
    node: CategoryNodeItem,
    parentAmount: number,
    isFirstSibling: boolean,
    isLastSibling: boolean
  ) => {
    if (!nodeMatchesFilter(node)) return null;

    const allocated = computeAllocatedAmount(node, parentAmount);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedNodes[node.id]);

    const isLevel1 = node.level === 1;
    const isLevel2 = node.level === 2;

    const { dotDiameter, lineWidth, railStep, textIndent, railX } = activeProfile;
    const visibleChildren = (node.children || []).filter(child => nodeMatchesFilter(child));

    return (
      <div key={node.id} className="relative group/category pb-1">

        {/* ── Header Row (Dot on Line + Category Name + Badges + Chevron) ── */}
        {/* ── Entire Clickable Category Block: Parent expands; Leaf (lowest level) opens transaction ── */}
        <div
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else if (onSpendCategory) {
              onSpendCategory(node.id, node.name);
            }
          }}
          className={`rounded-xl transition-all duration-150 relative ${
            hasChildren
              ? 'cursor-pointer hover:bg-white/[0.035] active:bg-white/[0.07] -mx-1 px-1 py-0.5'
              : 'cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.08] -mx-1 px-1 py-0.5 group/leaf'
          }`}
          role="button"
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (hasChildren) toggleNode(node.id);
              else if (onSpendCategory) onSpendCategory(node.id, node.name);
            }
          }}
        >
          {/* ── Header Row (Dot on Line + Category Name + Badges + Chevron) ── */}
          <div className="flex items-center justify-between py-1 px-1 relative min-h-[28px]">
            {/* Left: Point Dot + Name + Badges */}
            <div
              className="flex items-center gap-2 min-w-0 relative"
              style={{ paddingLeft: `${textIndent}px` }}
            >
              {/* 
                REFINED POINT DOT:
                Crisp circular point dot centered precisely on this level's scope rail.
                Z-10 puts the dot clearly in front of the continuous rail line.
              */}
              <div
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10"
                style={{
                  left: `${railX}px`,
                  width: `${lineWidth}px`
                }}
              >
                <div
                  className={`rounded-full bg-gradient-to-br from-[#A8E063] to-[#78AC35] ring-1 ring-[#141310] shadow-[0_0_5px_rgba(168,224,99,0.45)] transition-transform duration-150 shrink-0 ${
                    isExpanded ? 'scale-115' : 'group-hover/category:scale-110'
                  }`}
                  style={{
                    width: `${dotDiameter}px`,
                    height: `${dotDiameter}px`
                  }}
                />
              </div>

              {/* Category Name & Rule Percentage */}
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span
                  className={`font-bold tracking-tight text-white leading-none ${
                    isLevel1
                      ? 'text-sm sm:text-base'
                      : isLevel2
                      ? 'text-xs sm:text-sm text-white/95'
                      : 'text-xs text-white/90'
                  }`}
                >
                  {node.name}
                </span>
                {node.percentage !== undefined && !node.name.includes('%') && (
                  <span className="text-[10px] font-semibold text-[#8E8A82]">
                    {node.percentage}%
                  </span>
                )}
              </div>

              {/* Badges: Due or Repay */}
              {node.badges?.map(badge => (
                <button
                  type="button"
                  key={badge}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (badge === 'Due') setDueModalOpen(true);
                    if (badge === 'Repay') setRepayModalOpen(true);
                  }}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm transition-all cursor-pointer ${
                    badge === 'Due'
                      ? 'bg-[#382C17] border border-[#685327] text-[#E8C47A] hover:border-[#E8C47A]'
                      : 'bg-[#2A2B18] border border-[#525424] text-[#D8E87A] hover:border-[#D8E87A]'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>

            {/* Right: Expand/Collapse Chevron for parent, or refined "+ SPEND" micro-pill for lowest subcategory */}
            {hasChildren ? (
              <div className="p-1 text-[#8E8A82] group-hover/category:text-white transition-colors shrink-0">
                <div className={`transition-transform duration-220 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-guide-target="spend"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSpendCategory) onSpendCategory(node.id, node.name);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#25231D] hover:bg-[#4A622F] border border-[#3A372E] hover:border-[#6B8A44] text-[#C2E88A] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
                title={`Log spend for ${node.name}`}
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Spend</span>
              </button>
            )}
          </div>

          {/* ── Metrics Row: Total | Income | Expense (3 Columns with Thin Vertical Dividers) ── */}
          <div
            className="pt-1 pb-1"
            style={{ paddingLeft: `${textIndent}px` }}
          >
            <div className="grid grid-cols-3 divide-x divide-[#282622] text-left">
              <div className="pr-3">
                <p className="text-[10px] text-[#8E8A82] font-semibold uppercase tracking-wider">Total</p>
                <p className="text-xs sm:text-sm font-extrabold text-white num-display mt-0.5 tracking-tight">
                  ₹{allocated.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="px-3">
                <p className="text-[10px] text-[#8E8A82] font-semibold uppercase tracking-wider">Income</p>
                <p className="text-xs sm:text-sm font-extrabold text-[#9CD669] num-display mt-0.5 tracking-tight">
                  ₹{node.income.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="pl-3">
                <p className="text-[10px] text-[#8E8A82] font-semibold uppercase tracking-wider">Expense</p>
                <p className="text-xs sm:text-sm font-extrabold text-white/95 num-display mt-0.5 tracking-tight">
                  ₹{node.expense.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Due Notice Olive Green Box (for Rent) */}
            {node.dueNotice && (
              <div className="bg-gradient-to-r from-[#4E6333] via-[#485C2F] to-[#3E5028] border border-[#627D40]/70 rounded-[12px] p-3 sm:p-3.5 flex items-center justify-between shadow-lg my-2 transition-all">
                <div className="min-w-0 pr-2">
                  <p className="text-[11px] sm:text-xs text-[#D8E8BA] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5F5A3] animate-pulse shrink-0" />
                    <span className="truncate">{node.dueNotice.text}</span>
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-white num-display mt-0.5 tracking-tight">
                    ₹{node.dueNotice.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDueModalOpen(true);
                  }}
                  className="px-4 sm:px-5 py-1.5 rounded-[8px] bg-gradient-to-r from-[#F2811D] to-[#E37414] hover:from-[#FF8F2D] hover:to-[#F2811D] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-[0_3px_10px_rgba(242,129,29,0.35)] transition-all cursor-pointer shrink-0"
                >
                  {node.dueNotice.buttonText}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 
          ── NESTED SUB-CATEGORIES CONTAINER WITH SMOOTH SCOPE RAIL TRANSITION ──
          GPU-accelerated CSS Grid transition (0fr -> 1fr) with zero layout thrashing or JS loops.
          Fast, buttery smooth 220ms bezier curve that feels completely native and lightweight.
        */}
        {hasChildren && visibleChildren.length > 0 && (
          <div
            className={`tree-branch-grid ${
              isExpanded ? 'is-expanded mt-1.5 mb-2' : 'pointer-events-none'
            }`}
            style={{ marginLeft: `${railStep}px` }}
          >
            <div className="tree-branch-content relative bg-[#171613]/90 border-l border-[#33302A] rounded-r-xl pl-3 pr-1 py-2 space-y-2.5 shadow-inner">
              {/* Scope Rail for this level */}
              <div
                className="absolute top-[14px] bottom-1.5 bg-[#5F7E36] rounded-full z-0 pointer-events-none"
                style={{
                  left: `${railX}px`,
                  width: `${lineWidth}px`
                }}
              />
              {visibleChildren.map((child, idx) =>
                renderCategoryItem(
                  child,
                  allocated,
                  idx === 0,
                  idx === visibleChildren.length - 1
                )
              )}
            </div>
          </div>
        )}

        {/* Clear section separator between Level 1 categories, and subtle divider between siblings */}
        {isLevel1 && !isLastSibling ? (
          <div className="border-b border-[#2C2923] my-3.5" />
        ) : !isLastSibling ? (
          <div
            className="border-b border-[#24221D] my-1.5"
            style={{ marginLeft: `${textIndent}px` }}
          />
        ) : null}

      </div>
    );
  };

  return (
    <div className="w-full space-y-3 select-none animate-fade-in">

      {/* ── Toast Notification ── */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#485F2C] text-white px-4 py-2.5 rounded-[12px] border border-[#6B8A44] shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5E89B]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Main Category Container (Figma Image 5 Layout) ── */}
      {(poolTotal > 0 || totalUnallocated === 0) && (
        <div className="bg-[#1B1A17] border border-[#2A2824] rounded-[14px] p-3.5 sm:p-5 space-y-3 shadow-xl">

        {/* Section Title & Pool Total + Expand All Button */}
        {/* Section Title & Badges (Matching Figma Design - Clean header, no Expand All button) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#E5E3DC] tracking-tight">
              Life Budget
            </h3>
            {categoryItems.some(c => c.badges?.includes('Due')) && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#382C17] border border-[#685327] text-[#E8C47A]">
                Due
              </span>
            )}
            {categoryItems.some(c => c.badges?.includes('Repay')) && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2A2B18] border border-[#525424] text-[#D8E87A]">
                Repay
              </span>
            )}
          </div>
        </div>

        {/* 4-Column Summary Strip directly below Title */}
        <div className="grid grid-cols-4 divide-x divide-[#282622] pt-0.5">
          <div className="pr-2 sm:pr-3">
            <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Total</p>
            <p className="text-xs sm:text-base font-extrabold text-white num-display mt-0.5 tracking-tight">
              ₹{poolTotal.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="px-2 sm:px-3">
            <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Income</p>
            <p className="text-xs sm:text-base font-extrabold text-[#9CD669] num-display mt-0.5 tracking-tight">
              ₹{lifeBudgetIncome.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="px-2 sm:px-3">
            <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Expense</p>
            <p className="text-xs sm:text-base font-extrabold text-white num-display mt-0.5 tracking-tight">
              ₹{totalExpense.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="pl-2 sm:px-3">
            <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Available</p>
            <p className="text-xs sm:text-base font-extrabold text-[#9CD669] num-display mt-0.5 tracking-tight">
              ₹{availableBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Budget Health Progress Bar */}
        <div className="space-y-1 pt-0.5">
          <div className="w-full h-1.5 bg-[#23211C] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#5F7E36]"
              style={{ width: `${expensePercentage}%` }}
              title={`Expense: ${expensePercentage}%`}
            />
            <div
              className="h-full bg-[#8EBA55]"
              style={{ width: `${availablePercentage}%` }}
              title={`Available: ${availablePercentage}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#7A7872] font-medium px-0.5">
            <span>{expensePercentage}% Allocated</span>
            <span className="text-[#8EBA55] font-semibold">₹{availableBalance.toLocaleString('en-IN')} Remaining</span>
          </div>
        </div>

        {/* Divider before Categories */}
        <div className="border-t border-[#282622] pt-1.5" />

        {/* 
          ── UNIFIED LEVEL 1 TREE CONTAINER WITH SCOPE RAIL ──
          Scope Rail starts at y=14px (center of first Level 1 dot) and runs continuously
          down past all Level 1 categories and nested sub-trees, terminating cleanly at bottom-1.5.
        */}
        {(() => {
          const visibleRoots = categoryItems.filter(c => {
            if (!nodeMatchesFilter(c)) return false;
            // "If its default then no need to show the other categories if the category has money assigned then only will show"
            const alloc = computeAllocatedAmount(c, poolTotal);
            const hasMoney = alloc > 0 || (c.displayTotal !== undefined && c.displayTotal > 0) || (c.expense || 0) > 0;
            if (poolTotal > 0) {
              return hasMoney;
            }
            return true;
          });
          return (
            <div className="relative pt-0">
              {visibleRoots.length > 0 && (
                <div
                  className="absolute top-[14px] bottom-1.5 bg-[#5F7E36] rounded-full z-0 pointer-events-none"
                  style={{
                    left: `${activeProfile.railX}px`,
                    width: `${activeProfile.lineWidth}px`
                  }}
                />
              )}
              {visibleRoots.length > 0 ? (
                visibleRoots.map((rootNode, idx) =>
                  renderCategoryItem(
                    rootNode,
                    poolTotal,
                    idx === 0,
                    idx === visibleRoots.length - 1
                  )
                )
              ) : (
                <div className="py-6 text-center text-xs text-[#8E8A82]">
                  No categories match your search or filter.
                </div>
              )}
            </div>
          );
        })()}

      </div>
      )}

      {/* ── General Funds Base Container (Another Base Pool Just like Life Budget) ── */}
      {totalUnallocated > 0 && (() => {
        const generalAvail = Math.max(0, totalUnallocated - defaultBufferExpense);
        const generalExpPct = totalUnallocated > 0 ? Math.min(100, Math.round((defaultBufferExpense / totalUnallocated) * 100)) : 0;
        const generalAvailPct = Math.max(0, 100 - generalExpPct);

        return (
          <div className="bg-[#1B1A17] border border-[#2A2824] rounded-[14px] p-3.5 sm:p-5 space-y-3 shadow-xl">
            {/* Section Title & Badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#E8C47A] to-[#B8923E] ring-1 ring-[#524122] shadow-[0_0_5px_rgba(232,196,122,0.45)]" />
                <h3 className="text-sm font-bold text-[#E5E3DC] tracking-tight">
                  General Funds
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#332A17] border border-[#524122] text-[#E8C47A]">
                  Base Pool
                </span>
              </div>

              <button
                type="button"
                data-guide-target="spend"
                onClick={() => onSpendCategory && onSpendCategory('cat-default-buffer', 'General Funds')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D2415] hover:bg-[#3D311C] border border-[#524122] text-[#E8C47A] text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Spend</span>
              </button>
            </div>

            {/* 4-Column Summary Strip directly below Title */}
            <div className="grid grid-cols-4 divide-x divide-[#282622] pt-0.5">
              <div className="pr-2 sm:pr-3">
                <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Total</p>
                <p className="text-xs sm:text-base font-extrabold text-white num-display mt-0.5 tracking-tight">
                  ₹{totalUnallocated.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="px-2 sm:px-3">
                <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Income</p>
                <p className="text-xs sm:text-base font-extrabold text-[#E8C47A] num-display mt-0.5 tracking-tight">
                  ₹{totalUnallocated.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="px-2 sm:px-3">
                <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Expense</p>
                <p className="text-xs sm:text-base font-extrabold text-white num-display mt-0.5 tracking-tight">
                  ₹{defaultBufferExpense.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="pl-2 sm:px-3">
                <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Available</p>
                <p className="text-xs sm:text-base font-extrabold text-[#E8C47A] num-display mt-0.5 tracking-tight">
                  ₹{generalAvail.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* General Funds Progress Bar */}
            <div className="space-y-1 pt-0.5">
              <div className="w-full h-1.5 bg-[#23211C] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#B8923E]"
                  style={{ width: `${generalExpPct}%` }}
                  title={`Expense: ${generalExpPct}%`}
                />
                <div
                  className="h-full bg-[#E8C47A]"
                  style={{ width: `${generalAvailPct}%` }}
                  title="Available"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#7A7872] font-medium px-0.5">
                <span>{generalExpPct}% Spent</span>
                <span className="text-[#E8C47A] font-semibold">₹{generalAvail.toLocaleString('en-IN')} Remaining</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Figma Due Payment Pop-up Modal (Exact Draft / Category due payment pop... from Figma) ── */}
      {dueModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs animate-fade-in p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#1B1A16] border border-[#333028] rounded-t-[20px] sm:rounded-[20px] p-5 pb-8 sm:pb-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Due ₹4,000 – Rent
                </h3>
                <p className="text-xs text-[#8E8A82] mt-0.5">
                  Borrowed from 2 categories to cover this expense
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDueModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breakdown of borrowed categories */}
            <div className="bg-[#24221D] border border-[#35322A] rounded-[12px] divide-y divide-[#333028] overflow-hidden">
              <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-white/90">Supermarket groceries</span>
                <span className="font-extrabold text-[#F2811D] num-display">₹2,500</span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-white/90">Dining &amp; Takeout</span>
                <span className="font-extrabold text-[#F2811D] num-display">₹1,500</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDueModalOpen(false);
                  if (onPayDue) onPayDue(4000, 'Rent');
                  showToast('Opened payment transfer for Rent!');
                }}
                className="w-full py-3 rounded-[12px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-[0.99] text-[#11130E] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center"
              >
                Pay from another category
              </button>
              <button
                type="button"
                onClick={() => {
                  setDueModalOpen(false);
                  showToast('Payment recorded for Rent!');
                }}
                className="w-full py-2.5 rounded-[12px] bg-[#2A2823] hover:bg-[#35322B] active:scale-[0.99] text-white font-semibold text-xs transition-all border border-[#3D3A31] cursor-pointer text-center"
              >
                Record payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Figma Category Repay Pop-up Modal (Exact Draft / Category repay pop-up from Figma) ── */}
      {repayModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs animate-fade-in p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#1B1A16] border border-[#333028] rounded-t-[20px] sm:rounded-[20px] p-5 pb-8 sm:pb-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Repay ₹650
                </h3>
                <p className="text-xs text-[#8E8A82] mt-0.5">
                  Surplus funds available to restore borrowed pools
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#24221D] border border-[#35322A] rounded-[12px] p-3 text-xs text-[#D8E8BA]">
              Restores ₹650 from Hobbies &amp; Outings back to Essential Buffer pool.
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRepayModalOpen(false);
                  showToast('Repayment of ₹650 applied successfully!');
                }}
                className="w-full py-3 rounded-[12px] bg-[#F2811D] hover:bg-[#FF8E2E] active:scale-[0.99] text-[#11130E] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center"
              >
                Repay to source category
              </button>
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="w-full py-2.5 rounded-[12px] bg-[#2A2823] hover:bg-[#35322B] active:scale-[0.99] text-[#8E8A82] hover:text-white font-semibold text-xs transition-all border border-[#3D3A31] cursor-pointer text-center"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
