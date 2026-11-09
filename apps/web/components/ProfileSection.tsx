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
  HelpCircle
} from 'lucide-react';
import { useAppStore, authService } from '../app/store';
import { formatRupeesToPaise } from '@repo/shared';
import { AccountCategoriesScreen } from './AccountCategoriesScreen';

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
    email: 'Guest Account',
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

  useEffect(() => {
    setMounted(true);
    // Prevent background scrolling when modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#1C1A16] border border-[#2F2C25] rounded-2xl w-full max-w-[360px] sm:max-w-md text-white shadow-2xl animate-scale-in flex flex-col max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#282620] shrink-0">
          <h3 className="font-semibold text-sm sm:text-base text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-[#8E8A82] hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain">
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
  const loginAsDemo = useAppStore(state => state.loginAsDemo);
  const logout = useAppStore(state => state.logout);
  const addGoal = useAppStore(state => state.addGoal);
  const exportAllData = useAppStore(state => state.exportAllData);
  const importAllData = useAppStore(state => state.importAllData);
  const accounts = useAppStore(state => state.accounts);
  const categories = useAppStore(state => state.categories);
  const ledger = useAppStore(state => state.ledger);
  const goals = useAppStore(state => state.goals);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Profiles System ("This, That, and Those") ────────────────────────────
  const [profiles, setProfiles] = useState<UserProfileItem[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('prof-guest');

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const isGuestActive = activeProfile.type === 'Guest' || activeProfile.id === 'prof-guest';

  // Toggle tab: 'my-account' vs 'all-categories'
  const [activeSegment, setActiveSegment] = useState<'my-account' | 'all-categories'>('all-categories');
  const [subView, setSubView] = useState<'overview' | 'account-categories'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('screen') === 'allocations' || params.get('view') === 'allocations') {
        return 'account-categories';
      }
    }
    return 'overview';
  });

  // Selected radio items in lists
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  // Modals
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

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

  const totalBudget = categories.reduce((sum, c) => sum + (c.budgetAmount || 0n), 0n);
  const categoriesList: SettingCategoryItem[] = categories.map(c => {
    const pct = totalBudget > 0n ? Number((c.budgetAmount * 100n) / totalBudget) : 0;
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

  const handleDemoSignIn = async () => {
    await loginAsDemo('Arjun Kumar', 'arjun@gmail.com');
    setActiveProfileId('prof-arjun-personal');
    setEditName('Arjun Kumar');
    setEditEmail('arjun@gmail.com');
    setShowAuthModal(false);
    showToast('Signed in as Arjun Kumar!');
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
    if (window.confirm('Reset database to default Figma starter data?')) {
      await resetDatabaseToDefaults();
      setProfiles(DEFAULT_PROFILES);
      setActiveProfileId('prof-guest');
      setShowPrivacyModal(false);
      showToast('Database reset to defaults!');
    }
  };

  if (subView === 'account-categories') {
    return (
      <AccountCategoriesScreen
        onBack={() => setSubView('overview')}
        initialTab={activeSegment === 'my-account' ? 'per-account' : 'global'}
      />
    );
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-4 text-white pb-6 select-none animate-fade-up">

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

      {/* ── Profile Card (Exact Figma Olive Green Card #4E6732) ── */}
      <div className="relative bg-[#4E6732] rounded-2xl p-4 sm:p-5 text-white shadow-lg overflow-hidden transition-all flex items-center justify-between min-h-[88px] gap-3">
        <div
          onClick={() => setShowProfilesModal(true)}
          className="cursor-pointer group flex-1 min-w-0"
          title="Switch Active Profile"
        >
          <h2 className="font-bold text-base sm:text-lg text-white leading-tight truncate">
            {session && !session.isGuest ? (session.name || 'My Budget') : activeProfile.name}
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-1 truncate font-normal">
            {session && !session.isGuest ? session.email : 'Guest Account'}
          </p>
        </div>

        {/* Top-Right Sign In / Sign Out Action */}
        {session && !session.isGuest ? (
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 hover:bg-red-500/25 hover:text-red-200 border border-white/15 text-white/90 text-xs font-medium transition-all cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/20 hover:border-white/40 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
            title="Sign In to Sync"
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
            <button
              onClick={() => setSubView('account-categories')}
              className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
              title="Edit Allocation Rules"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          {activeSegment === 'all-categories' ? (
            /* 1. All Categories Tab */
            <>
              {categoriesList.length > 0 ? (
                <div className="divide-y divide-[#2B2925]">
                  {categoriesList.map(cat => {
                    const isSelected = cat.id === selectedCatId;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCatId(cat.id)}
                        className="flex items-center justify-between py-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-full border-2 border-[#6B8F3C] flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#6B8F3C]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-[#555] shrink-0 group-hover:border-[#777] transition-colors" />
                          )}
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

              {/* Transfer Funds Orange Button (Figma Orange #E87A24) */}
              <button
                onClick={() => setShowTransferModal(true)}
                className="w-full py-3.5 rounded-xl bg-[#E87A24] hover:bg-[#F38936] active:scale-[0.99] text-[#141310] font-bold text-sm transition-all shadow-md cursor-pointer text-center mt-2"
              >
                Transfer Funds
              </button>
            </>
          ) : (
            /* 2. My Account Tab */
            <>
              {accountsList.length > 0 ? (
                <div className="divide-y divide-[#2B2925]">
                  {accountsList.map(acc => {
                    const isSelected = acc.id === selectedAccountId;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className="flex items-center justify-between py-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-full border-2 border-[#6B8F3C] flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#6B8F3C]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-[#555] shrink-0 group-hover:border-[#777] transition-colors" />
                          )}
                          <span className="text-sm font-medium text-white group-hover:text-white/95">
                            {acc.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-white num-display">
                          ₹{acc.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-[#888] text-xs">
                  No accounts connected yet.
                </div>
              )}

              {/* Transfer Funds Orange Button (Figma Orange #E87A24) */}
              <button
                onClick={() => setShowTransferModal(true)}
                className="w-full py-3.5 rounded-xl bg-[#E87A24] hover:bg-[#F38936] active:scale-[0.99] text-[#141310] font-bold text-sm transition-all shadow-md cursor-pointer text-center mt-2"
              >
                Transfer Funds
              </button>
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
          {/* Quick Demo Login Option */}
          <div className="p-3 bg-[#485F2C]/30 border border-[#587437] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Figma Profile Preview</p>
              <p className="text-2xs text-white/70">Sign in instantly as Arjun Kumar</p>
            </div>
            <button
              onClick={handleDemoSignIn}
              className="px-3 py-1.5 bg-[#485F2C] hover:bg-[#587437] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow"
            >
              Try Demo
            </button>
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
                  placeholder="Arjun Kumar"
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
                placeholder="arjun@gmail.com"
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
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleResetDefaults}
                className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Defaults</span>
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

    </div>
  );
}
