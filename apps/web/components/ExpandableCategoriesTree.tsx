'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  ChevronsUpDown,
  Edit2,
  Layers
} from 'lucide-react';
import { useAppStore } from '../app/store';

// ── Types ───────────────────────────────────────────────────────────────────
export interface CategoryNodeItem {
  id: string;
  name: string;
  percentage: number;
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
const FIGMA_LIFE_BUDGET_PRESET: BudgetPoolPreset = {
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
const USER_PROMPT_DEMO_PRESET: BudgetPoolPreset = {
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
const FIVE_LEVEL_TEST_PRESET: BudgetPoolPreset = {
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
export function ExpandableCategoriesTree({
  searchQuery = '',
  filter = 'ALL',
  onPayDue
}: {
  searchQuery?: string;
  filter?: 'ALL' | 'DUE' | 'REPAY';
  onPayDue?: (amount: number, categoryName: string) => void;
}) {
  const categories = useAppStore(state => state.categories);

  // Production preset: Figma Life Budget (with full 5-level deep hierarchy)
  const [activePresetId, setActivePresetId] = useState<'figma-life-budget' | 'user-demo-200' | 'five-level-test'>('figma-life-budget');
  const activeProfile = REFINED_PROFILE;

  // Custom pool override
  const [customPoolTotal, setCustomPoolTotal] = useState<number | null>(null);
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [poolInput, setPoolInput] = useState('');

  // Expanded nodes map (default: all collapsed so user starts with a clean, unexpanded overview)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (categories.length === 0) {
    return (
      <div className="bg-[#1B1A17] border border-[#2A2824] rounded-[14px] p-8 text-center space-y-3 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-[#23211C] border border-[#33302A] flex items-center justify-center mx-auto text-[#8E8A82]">
          <Layers className="w-6 h-6 text-[#7A7872]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Categories Added Yet</h3>
          <p className="text-xs text-[#8E8A82] mt-1.5 max-w-xs mx-auto leading-relaxed">
            Your budget tree is completely empty. Start fresh by adding transactions or creating your custom budget categories.
          </p>
        </div>
      </div>
    );
  }

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const hasAnyExpanded = Object.values(expandedNodes).some(Boolean);
    const nextState: Record<string, boolean> = {};
    const recurse = (nodes: CategoryNodeItem[]) => {
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          nextState[n.id] = !hasAnyExpanded;
          recurse(n.children);
        }
      });
    };
    recurse(currentPreset.categories);
    setExpandedNodes(nextState);
  };

  const currentPreset =
    activePresetId === 'figma-life-budget'
      ? FIGMA_LIFE_BUDGET_PRESET
      : activePresetId === 'user-demo-200'
      ? USER_PROMPT_DEMO_PRESET
      : FIVE_LEVEL_TEST_PRESET;

  const poolTotal = customPoolTotal !== null ? customPoolTotal : currentPreset.total;

  // Cascading math engine
  const computeAllocatedAmount = (node: CategoryNodeItem, parentAmount: number): number => {
    if (activePresetId === 'figma-life-budget' && customPoolTotal === null && node.displayTotal !== undefined) {
      return node.displayTotal;
    }
    return Math.round((parentAmount * node.percentage) / 100);
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
        {/* ── Entire Clickable Category Block (Tapping anywhere on the whole category opens next level) ── */}
        <div
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`rounded-xl transition-all duration-150 relative ${
            hasChildren
              ? 'cursor-pointer hover:bg-white/[0.035] active:bg-white/[0.07] -mx-1 px-1 py-0.5'
              : 'py-0.5'
          }`}
          role={hasChildren ? 'button' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          onKeyDown={(e) => {
            if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              toggleNode(node.id);
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

              {/* Category Name */}
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

              {/* Badges: Due or Repay */}
              {node.badges?.map(badge => (
                <span
                  key={badge}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm transition-all ${
                    badge === 'Due'
                      ? 'bg-[#382C17] border border-[#685327] text-[#E8C47A]'
                      : 'bg-[#2A2B18] border border-[#525424] text-[#D8E87A]'
                  }`}
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Right: Expand/Collapse Chevron */}
            {hasChildren ? (
              <div className="p-1 text-[#8E8A82] group-hover/category:text-white transition-colors shrink-0">
                <div className={`transition-transform duration-220 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div className="w-3.5 h-3.5 shrink-0" />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPayDue) onPayDue(node.dueNotice!.amount, node.name);
                    showToast(`Payment of ₹${node.dueNotice!.amount} initiated for ${node.name}!`);
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
              isExpanded ? 'is-expanded mt-1 mb-1' : 'pointer-events-none'
            }`}
            style={{ marginLeft: `${railStep}px` }}
          >
            <div className="tree-branch-content relative">
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

        {/* Subtle horizontal separator between siblings (starts at textIndent so rail is never cut) */}
        {!isLastSibling && (
          <div
            className="border-b border-[#282622]/50 my-1"
            style={{ marginLeft: `${textIndent}px` }}
          />
        )}

      </div>
    );
  };

  const expensePercentage = poolTotal > 0 ? Math.min(100, Math.round((currentPreset.expense / poolTotal) * 100)) : 0;
  const availablePercentage = Math.max(0, 100 - expensePercentage);

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
      <div className="bg-[#1B1A17] border border-[#2A2824] rounded-[14px] p-3.5 sm:p-5 space-y-3 shadow-xl">

        {/* Section Title & Pool Total + Expand All Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#E5E3DC] tracking-tight">
              {currentPreset.name}
            </h3>
            {isEditingPool ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={poolInput}
                  onChange={(e) => setPoolInput(e.target.value)}
                  placeholder={poolTotal.toString()}
                  className="w-20 bg-[#12110E] border border-[#485F2C] rounded px-1.5 py-0.5 text-xs text-white outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(poolInput);
                      if (!isNaN(val) && val > 0) setCustomPoolTotal(val);
                      setIsEditingPool(false);
                    }
                    if (e.key === 'Escape') setIsEditingPool(false);
                  }}
                />
                <button
                  onClick={() => {
                    const val = parseInt(poolInput);
                    if (!isNaN(val) && val > 0) setCustomPoolTotal(val);
                    setIsEditingPool(false);
                  }}
                  className="text-[10px] bg-[#485F2C] text-white px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPoolInput(poolTotal.toString());
                  setIsEditingPool(true);
                }}
                className="text-[#7A7872] hover:text-[#8EBA55] transition-colors p-0.5 cursor-pointer"
                title="Edit pool amount"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={toggleExpandAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold text-[#A2E060] bg-[#485F2C]/20 hover:bg-[#485F2C]/35 border border-[#587437]/40 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Expand or collapse all categories"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span>{Object.values(expandedNodes).some(Boolean) ? 'Collapse All' : 'Expand All'}</span>
          </button>
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
              ₹{currentPreset.income.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="px-2 sm:px-3">
            <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Expense</p>
            <p className="text-xs sm:text-base font-extrabold text-white num-display mt-0.5 tracking-tight">
              ₹{currentPreset.expense.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="pl-2 sm:px-3">
            <p className="text-[10px] sm:text-[11px] text-[#8E8A82] font-semibold uppercase tracking-wider">Available</p>
            <p className="text-xs sm:text-base font-extrabold text-[#9CD669] num-display mt-0.5 tracking-tight">
              ₹{currentPreset.available.toLocaleString('en-IN')}
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
            <span className="text-[#8EBA55] font-semibold">₹{currentPreset.available.toLocaleString('en-IN')} Remaining</span>
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
          const visibleRoots = currentPreset.categories.filter(c => nodeMatchesFilter(c));
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

    </div>
  );
}
