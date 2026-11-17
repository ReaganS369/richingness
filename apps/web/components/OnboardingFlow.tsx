'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  FolderTree,
  ArrowRight,
  LogIn,
  X,
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Banknote
} from 'lucide-react';
import { authService } from '../app/store';

export type OnboardingStage =
  | 'loading'
  | 'welcome'
  | 'login_modal'
  | 'live_guide'
  | 'completed';

interface OnboardingFlowProps {
  accountsCount?: number;
  categoriesCount?: number;
  totalBalanceRupees?: number;
  onOpenAddAccount?: () => void;
  onOpenAddFunds?: () => void;
  onOpenSpend?: () => void;
  onOpenAddCategory?: () => void;
  onComplete?: () => void;
  onOpenSettings?: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'settings' | 'transactions') => void;
}

export function OnboardingFlow({
  accountsCount = 0,
  categoriesCount: _categoriesCount = 0,
  totalBalanceRupees = 0,
  onOpenAddAccount: _onOpenAddAccount,
  onOpenAddFunds: _onOpenAddFunds,
  onOpenSpend: _onOpenSpend,
  onOpenAddCategory: _onOpenAddCategory,
  onComplete,
  onOpenSettings: _onOpenSettings,
  onNavigateTab
}: OnboardingFlowProps) {
  const [stage, setStage] = useState<OnboardingStage>('loading');
  const [guideStep, setGuideStep] = useState<number>(1);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('richingness_onboarding_completed');
      if (completed === 'true') {
        setStage('completed');
      } else {
        setStage('welcome');
      }
    }

    const handleReplay = () => {
      setGuideStep(1);
      setStage('live_guide');
    };

    window.addEventListener('richingness:replay-tour', handleReplay);
    return () => window.removeEventListener('richingness:replay-tour', handleReplay);
  }, []);

  // Only advance from Step 1 if the user explicitly created an account or clicked Next
  const [initialAccountsCount, setInitialAccountsCount] = useState<number | null>(null);

  // Track live modal state for overlay guidance without polluting underlying modal markup
  const [modalOpen, setModalOpen] = useState(false);
  const [modalHasName, setModalHasName] = useState(false);
  const [modalInrSelected, setModalInrSelected] = useState(false);

  useEffect(() => {
    if (stage !== 'live_guide') return;

    const checkModal = () => {
      const isMOpen = document.body.classList.contains('modal-open');
      setModalOpen(isMOpen);
      if (isMOpen) {
        const nameInput = document.querySelector('[data-guide-target="account-name-input"]') as HTMLInputElement | null;
        setModalHasName(Boolean(nameInput && nameInput.value.trim().length > 0));
        const inrBtn = document.querySelector('[data-guide-target="modal-currency-inr"][data-selected="true"]');
        setModalInrSelected(Boolean(inrBtn));
      }
    };

    checkModal();
    const obs = new MutationObserver(checkModal);
    obs.observe(document.body, { attributes: true, subtree: true, childList: true });
    window.addEventListener('input', checkModal);
    window.addEventListener('click', checkModal);

    return () => {
      obs.disconnect();
      window.removeEventListener('input', checkModal);
      window.removeEventListener('click', checkModal);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 'live_guide' && initialAccountsCount === null) {
      setInitialAccountsCount(accountsCount);
    }
  }, [stage, initialAccountsCount, accountsCount]);

  useEffect(() => {
    if (
      stage === 'live_guide' &&
      guideStep === 1 &&
      initialAccountsCount !== null &&
      accountsCount > initialAccountsCount
    ) {
      setGuideStep(2);
    }
  }, [stage, guideStep, accountsCount, initialAccountsCount]);

  // Auto-advance from Step 3 when funds are deposited
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  useEffect(() => {
    if (stage === 'live_guide' && initialBalance === null) {
      setInitialBalance(totalBalanceRupees);
    }
  }, [stage, initialBalance, totalBalanceRupees]);

  useEffect(() => {
    if (
      stage === 'live_guide' &&
      guideStep === 3 &&
      initialBalance !== null &&
      totalBalanceRupees > initialBalance
    ) {
      setGuideStep(4);
    }
  }, [stage, guideStep, totalBalanceRupees, initialBalance]);

  const lastNavTabRef = useRef<string | null>(null);
  const onNavigateTabRef = useRef(onNavigateTab);
  useEffect(() => {
    onNavigateTabRef.current = onNavigateTab;
  }, [onNavigateTab]);

  useEffect(() => {
    if (stage === 'live_guide') {
      document.body.setAttribute('data-guide-step', String(guideStep));
      const targetTab = (guideStep === 1 || guideStep === 3) ? 'settings' : 'dashboard';
      if (lastNavTabRef.current !== targetTab) {
        lastNavTabRef.current = targetTab;
        if (onNavigateTabRef.current) onNavigateTabRef.current(targetTab as 'dashboard' | 'settings');
      }
    } else {
      document.body.removeAttribute('data-guide-step');
      lastNavTabRef.current = null;
    }
    return () => {
      document.body.removeAttribute('data-guide-step');
    };
  }, [stage, guideStep]);

  const finishOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_onboarding_completed', 'true');
    }
    document.body.removeAttribute('data-guide-step');
    if (onNavigateTab) onNavigateTab('dashboard');
    setStage('completed');
    if (onComplete) onComplete();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await authService.signIn(authEmail, authPassword);
      finishOnboarding();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials');
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      await authService.signInWithOAuth('google', redirectTo);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to connect');
      setAuthLoading(false);
    }
  };

  if (stage === 'loading' || stage === 'completed') {
    return null;
  }

  return (
    <>
      {/* ── 1. CLEAN MINIMALIST ENTRY MODAL ── */}
      {stage === 'welcome' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          {/* Subtle ambient lighting */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(74,98,47,0.18)_0%,rgba(0,0,0,0)_65%)]" />

          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1C1A16] to-[#12110E] border border-white/10 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-7 sm:p-8 text-center space-y-7 animate-scale-in">
            {/* Brand Icon & Title */}
            <div className="space-y-3.5">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-[#4A622F] blur-xl opacity-40 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-[#31431F] to-[#18210F] border border-[#587437]/60 shadow-xl flex items-center justify-center">
                  <span className="font-display font-black text-2xl text-white tracking-wide">R</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Richingness
                </h1>
                <p className="text-xs sm:text-sm text-[#A09C94] mt-1 font-medium">
                  Know where every rupee goes.
                </p>
              </div>
            </div>

            {/* Clean Dual Buttons */}
            <div className="space-y-3 pt-1">
              {/* Primary: Launches Tour */}
              <button
                type="button"
                onClick={() => {
                  setGuideStep(1);
                  setStage('live_guide');
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#4A622F] to-[#587437] hover:from-[#587437] hover:to-[#6B8D43] text-white font-bold text-sm shadow-xl shadow-[#4A622F]/30 border border-[#769C4B]/40 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                <span>Take Quick Tour</span>
                <ArrowRight className="w-4 h-4 text-[#A8E063] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary: Skip Straight to Dashboard */}
              <button
                type="button"
                onClick={finishOnboarding}
                className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/15 text-[#D1CECA] hover:text-white font-medium text-sm cursor-pointer transition-all active:scale-[0.98]"
              >
                I&apos;ve Used This Before
              </button>
            </div>

            {/* Discreet Sign In Link */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setStage('login_modal');
                }}
                className="text-xs text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
              >
                Already syncing data? <span className="text-[#A8E063] font-semibold underline underline-offset-2">Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. REAL GUIDED TOUR: FLOATING TOP OVERLAY (NEVER COVERS BUTTONS) ── */}
      {stage === 'live_guide' && (
        <div className="onboarding-guide-hud fixed top-3 left-3 right-3 sm:top-5 sm:left-auto sm:right-6 sm:max-w-md z-[10002] animate-fade-down">
          <div className="bg-[#181714]/95 backdrop-blur-2xl border border-[#4A622F]/40 rounded-2xl p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white space-y-2.5 relative">
            
            {/* Top Bar with Step Progress & Skip */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === guideStep
                          ? 'w-7 bg-[#A8E063]'
                          : step < guideStep
                          ? 'w-3 bg-[#4A622F]'
                          : 'w-3 bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-2xs font-bold text-[#A8E063] uppercase tracking-wider ml-1">
                  Tour · Step {guideStep} of 4
                </span>
              </div>
              <button
                type="button"
                onClick={finishOnboarding}
                className="text-xs text-[#8E8A82] hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <span>Exit</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Step 1: Real Account Creation ── */}
            {guideStep === 1 && (
              <div className="space-y-2 animate-fade-up">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <span>1. Add Your Account</span>
                </div>
                
                {modalOpen ? (
                  <div className="p-2.5 rounded-xl bg-[#232F1A] border border-[#3E5227] text-white space-y-1">
                    <p className="text-xs font-semibold text-[#A8E063]">
                      {!modalHasName
                        ? '👇 Step 1: Tap a preset chip below (e.g. + HDFC Bank) or type a name.'
                        : !modalInrSelected
                        ? '👇 Step 2: Select INR (₹) below to set currency.'
                        : '👇 Step 3: All set! Tap "Create Account" below to continue.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#D1CECA] leading-relaxed">
                    👇 Tap the glowing <strong className="text-[#A8E063]">+ Add Account</strong> button below to connect your primary bank, cash, or UPI balance.
                  </p>
                )}

                <div className="pt-0.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={finishOnboarding}
                    className="py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                  >
                    Skip Tour
                  </button>
                  {initialAccountsCount !== null && accountsCount > initialAccountsCount ? (
                    <button
                      type="button"
                      onClick={() => setGuideStep(2)}
                      className="py-1.5 px-3.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#4A622F]/30 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <span>Next: Categories →</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Add an account first to proceed to categories"
                      className="py-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#7A7770] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                    >
                      <span>Add account first</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: What Categories Do (Clear Use Cases) ── */}
            {guideStep === 2 && (
              <div className="space-y-2 animate-fade-up">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <FolderTree className="w-3.5 h-3.5" />
                  </div>
                  <span>2. Your Budget Categories</span>
                </div>
                <p className="text-xs text-[#D1CECA] leading-relaxed">
                  Divide your balance into 3 clear use cases so you always know where to spend:
                </p>
                <div className="text-[11px] bg-white/[0.03] border border-white/[0.08] rounded-xl p-2 space-y-1 text-[#D1CECA]">
                  <p><strong className="text-[#A8E063]">Needs (50%)</strong>: Rent, groceries &amp; bills</p>
                  <p><strong className="text-[#60A5FA]">Wants (30%)</strong>: Dining, shopping &amp; fun</p>
                  <p><strong className="text-[#FBBF24]">Savings (20%)</strong>: Emergency &amp; future wealth</p>
                </div>
                <div className="pt-0.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setGuideStep(1)}
                    className="py-1.5 px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideStep(3)}
                    className="py-1.5 px-3.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#4A622F]/30 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <span>Next: Add Funds →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Add Funds (Salary vs Fixed) ── */}
            {guideStep === 3 && (
              <div className="space-y-2 animate-fade-up">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span>3. Add Funds (Salary vs Fixed)</span>
                </div>
                
                {modalOpen ? (
                  <div className="p-2.5 rounded-xl bg-[#232F1A] border border-[#3E5227] text-white space-y-1">
                    <p className="text-xs font-semibold text-[#A8E063]">
                      💡 Keep &quot;Regular / Salary&quot; selected, tap &quot;+ ₹50,000&quot;, and tap Deposit to see your 50/30/20 auto-split!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#D1CECA] leading-relaxed">
                      Deposit money into your account in 2 smart ways:
                    </p>
                    <div className="text-[11px] bg-white/[0.03] border border-white/[0.08] rounded-xl p-2 space-y-1 text-[#D1CECA]">
                      <p>
                        <strong className="text-[#A8E063]">Regular / Salary</strong>: Auto-splits into 50/30/20 across your categories!
                      </p>
                      <p>
                        <strong className="text-white">One-Time / Fixed</strong>: Puts funds directly into one category.
                      </p>
                    </div>
                    <p className="text-2xs text-[#A8E063]">
                      👇 Tap glowing <strong>+ Add Funds</strong> below to deposit a sample salary (e.g. ₹50,000)!
                    </p>
                  </>
                )}

                <div className="pt-0.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setGuideStep(2)}
                    className="py-1.5 px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                  >
                    ← Back
                  </button>
                  {totalBalanceRupees > 0 ? (
                    <button
                      type="button"
                      onClick={() => setGuideStep(4)}
                      className="py-1.5 px-3.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#4A622F]/30 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <span>Next: How to Spend →</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Deposit a sample salary first to see categories funded"
                      className="py-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#7A7770] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                    >
                      <span>Deposit salary first</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: How to Spend Money & Smart Borrowing ── */}
            {guideStep === 4 && (
              <div className="space-y-2 animate-fade-up">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <span>4. Spend &amp; Smart Protection</span>
                </div>
                <p className="text-xs text-[#D1CECA] leading-relaxed">
                  👇 Tap the glowing <strong className="text-[#A8E063]">+ Spend</strong> button on any category below when you buy something. If a category runs out, Richingness automatically borrows from Wants so your Savings are never touched!
                </p>
                <div className="pt-0.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setGuideStep(3)}
                    className="py-1.5 px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={finishOnboarding}
                    className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#4A622F] to-[#587437] hover:from-[#587437] hover:to-[#6B8D43] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#4A622F]/30 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#A8E063]" />
                    <span>Got It, Start Budgeting! 🚀</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── 3. CLEAN SIGN IN MODAL ── */}
      {stage === 'login_modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1C1A16] to-[#12110E] border border-white/10 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-7 space-y-4 animate-scale-in text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setStage('welcome')}
                className="flex items-center gap-1 text-xs text-[#8E8A82] hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <h3 className="font-bold text-sm">Sign In</h3>
              <div className="w-8" />
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-3">
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-[#201E19] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:border-[#4A622F]"
              />
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#201E19] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:border-[#4A622F]"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Sign In</span>
              </button>
            </form>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
