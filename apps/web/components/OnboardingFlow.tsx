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
  Banknote,
  ArrowDown,
  ArrowUp,
  Plus
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
  onApplyStarterCategories?: () => Promise<void> | void;
  onComplete?: () => void;
  onOpenSettings?: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'settings' | 'transactions') => void;
}

export function OnboardingFlow({
  accountsCount = 0,
  categoriesCount = 0,
  totalBalanceRupees = 0,
  onOpenAddAccount: _onOpenAddAccount,
  onOpenAddFunds: _onOpenAddFunds,
  onOpenSpend: _onOpenSpend,
  onOpenAddCategory: _onOpenAddCategory,
  onApplyStarterCategories,
  onComplete,
  onOpenSettings: _onOpenSettings,
  onNavigateTab
}: OnboardingFlowProps) {
  const [stage, setStage] = useState<OnboardingStage>('loading');
  const [guideStep, setGuideStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('richingness_tour_step');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 4) return parsed;
      }
    }
    return accountsCount > 0 ? 2 : 1;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_tour_step', String(guideStep));
    }
  }, [guideStep]);

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
      setGuideStep(accountsCount > 0 ? 2 : 1);
      setStage('live_guide');
    };

    window.addEventListener('richingness:replay-tour', handleReplay);
    return () => window.removeEventListener('richingness:replay-tour', handleReplay);
  }, []);

  // Only advance from Step 1 if the user explicitly created an account or clicked Next
  const [initialAccountsCount, setInitialAccountsCount] = useState<number | null>(null);

  // Modal sub-step state for in-modal interactive pointer guidance
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubstep, setModalSubstep] = useState<'name' | 'currency' | 'submit'>('name');

  // Track target element rect for spotlight and arrow callout
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(210);

  // Measure tooltip actual rendered height dynamically
  useEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.offsetHeight;
      if (h > 50 && h !== tooltipHeight) {
        setTooltipHeight(h);
      }
    }
  });

  // Reset modal substep whenever modal opens/closes
  const [categoryModalSubstep, setCategoryModalSubstep] = useState<'name' | 'submit'>('name');
  const [hasTypedCategory, setHasTypedCategory] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setModalSubstep('name');
      setCategoryModalSubstep('name');
      setHasTypedCategory(false);
    }
  }, [modalOpen]);

  // Track whether user has typed anything into the account name input or category name input
  const [hasTypedName, setHasTypedName] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setHasTypedName(false);
      setHasTypedCategory(false);
      return;
    }

    const checkInput = () => {
      const inputEl = document.querySelector('[data-guide-target="account-name-input"]') as HTMLInputElement | null;
      setHasTypedName(!!inputEl && inputEl.value.trim().length > 0);

      const catInputEl = document.querySelector('[data-guide-target="category-name-input"]') as HTMLInputElement | null;
      setHasTypedCategory(!!catInputEl && catInputEl.value.trim().length > 0);
    };

    checkInput();
    window.addEventListener('input', checkInput);
    window.addEventListener('keyup', checkInput);
    window.addEventListener('change', checkInput);

    return () => {
      window.removeEventListener('input', checkInput);
      window.removeEventListener('keyup', checkInput);
      window.removeEventListener('change', checkInput);
    };
  }, [modalOpen, modalSubstep, categoryModalSubstep]);

  // Track whether user has chosen INR in currency substep
  const [inrConfirmed, setInrConfirmed] = useState(false);

  useEffect(() => {
    const handleCurrency = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === 'INR') {
        setInrConfirmed(true);
        setModalSubstep('submit');
      }
    };
    window.addEventListener('guide:currency-selected', handleCurrency);
    return () => window.removeEventListener('guide:currency-selected', handleCurrency);
  }, []);

  // Strict scroll lock when tour is active
  useEffect(() => {
    if (stage === 'live_guide') {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.classList.add('guide-no-scroll');

      const preventScroll = (e: TouchEvent | WheelEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.closest('.onboarding-guide-hud') || target.closest('[role="dialog"]') || target.closest('.modal-scrollable'))) {
          return;
        }
        e.preventDefault();
      };

      window.addEventListener('touchmove', preventScroll, { passive: false });
      window.addEventListener('wheel', preventScroll, { passive: false });

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
        document.body.classList.remove('guide-no-scroll');
        window.removeEventListener('touchmove', preventScroll);
        window.removeEventListener('wheel', preventScroll);
      };
    }
  }, [stage]);

  // Track live modal state instantaneously via MutationObserver
  useEffect(() => {
    if (stage !== 'live_guide') return;

    const checkModal = () => {
      const isMOpen = document.body.classList.contains('modal-open');
      setModalOpen(isMOpen);
    };

    checkModal();
    const obs = new MutationObserver(checkModal);
    obs.observe(document.body, { attributes: true, subtree: true, childList: true });

    return () => obs.disconnect();
  }, [stage]);

  // Set substep indicator on body for CSS spotlight
  useEffect(() => {
    if (stage === 'live_guide' && modalOpen) {
      if (guideStep === 1) {
        document.body.setAttribute('data-guide-substep', modalSubstep);
      } else if (guideStep === 2) {
        document.body.setAttribute('data-guide-substep', `cat-${categoryModalSubstep}`);
      }
    } else {
      document.body.removeAttribute('data-guide-substep');
    }
    return () => {
      document.body.removeAttribute('data-guide-substep');
    };
  }, [stage, guideStep, modalOpen, modalSubstep, categoryModalSubstep]);

  // ZERO-DELAY target position tracker (Immediate synchronous + RAF + MutationObserver)
  useEffect(() => {
    if (stage !== 'live_guide') {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      let selector: string | null = null;
      if (guideStep === 1) {
        if (modalOpen) {
          if (modalSubstep === 'name') selector = '[data-guide-target="account-name-input"]';
          else if (modalSubstep === 'currency') selector = '[data-guide-target="currency-inr-btn"]';
          else selector = '[data-guide-target="account-submit-btn"]';
        } else {
          selector = '[data-guide-target="add-account"]';
        }
      } else if (guideStep === 2) {
        if (modalOpen) {
          if (hasTypedCategory) {
            selector = '[data-guide-target="category-submit-btn"]';
          } else {
            selector = '[data-guide-target="category-name-input"]';
          }
        } else {
          selector = '[data-guide-target="create-category"]';
        }
      } else if (guideStep === 3) {
        selector = '[data-guide-target="add-funds"]';
      } else if (guideStep === 4) {
        selector = '[data-guide-target="spend"]';
      }

      if (selector) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
            return;
          }
        }
      }
      setTargetRect(null);
    };

    // Immediate calculation with 0 delay
    updateTargetRect();
    const rafId = requestAnimationFrame(updateTargetRect);

    const obs = new MutationObserver(updateTargetRect);
    obs.observe(document.body, { attributes: true, subtree: true, childList: true });
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, { capture: true });

    const fastInterval = setInterval(updateTargetRect, 80);

    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
      clearInterval(fastInterval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, { capture: true });
    };
  }, [stage, guideStep, modalOpen, modalSubstep]);

  // Smooth scroll target into view immediately when it changes
  useEffect(() => {
    if (stage !== 'live_guide') return;

    let targetSelector: string | null = null;
    if (guideStep === 1) {
      if (modalOpen) {
        if (modalSubstep === 'name') targetSelector = '[data-guide-target="account-name-input"]';
        else if (modalSubstep === 'currency') targetSelector = '[data-guide-target="currency-inr-btn"]';
        else targetSelector = '[data-guide-target="account-submit-btn"]';
      } else {
        targetSelector = '[data-guide-target="add-account"]';
      }
    } else if (guideStep === 2) {
      targetSelector = '[data-guide-target="create-category"]';
    } else if (guideStep === 3) {
      targetSelector = '[data-guide-target="add-funds"]';
    } else if (guideStep === 4) {
      targetSelector = '[data-guide-target="spend"]';
    }

    if (targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [stage, guideStep, modalOpen, modalSubstep]);

  useEffect(() => {
    if (stage === 'live_guide' && initialAccountsCount === null) {
      setInitialAccountsCount(accountsCount);
    }
  }, [stage, initialAccountsCount, accountsCount]);

  useEffect(() => {
    if (stage === 'live_guide' && guideStep === 1 && accountsCount > 0) {
      setGuideStep(2);
    }
  }, [stage, guideStep, accountsCount]);

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
      localStorage.removeItem('richingness_tour_step');
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
      {/* â”€â”€ 1. CLEAN MINIMALIST ENTRY MODAL â”€â”€ */}
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

      {/* ── 2. REAL GUIDED TOUR: SLEEK SINGLE COACHMARK TOOLTIP (DTUNES STYLE) ── */}
      {stage === 'live_guide' && (
        <>
          {/* Full-screen Darkening Backdrop with SVG Spotlight Cutout */}
          <svg
            className="fixed inset-0 z-[10000] w-full h-full pointer-events-auto"
            style={{ width: '100vw', height: '100vh' }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <defs>
              <mask id="guide-spotlight-mask">
                {/* Everything white is covered by the dark overlay */}
                <rect width="100%" height="100%" fill="white" />
                {/* Target cutout in black cuts a 100% transparent spotlight window */}
                {targetRect && (
                  <rect
                    x={targetRect.left - 4}
                    y={targetRect.top - 4}
                    width={targetRect.width + 8}
                    height={targetRect.height + 8}
                    rx={14}
                    ry={14}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            {/* Dark scrim with the cutout hole */}
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.82)"
              mask="url(#guide-spotlight-mask)"
            />
            {/* Dashed green highlight ring around cutout */}
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx={14}
                ry={14}
                fill="none"
                stroke="#A8E063"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
            )}
          </svg>

          {/* Transparent click catcher over target */}
          {!modalOpen && targetRect && (
            <div
              style={{
                position: 'fixed',
                top: `${targetRect.top}px`,
                left: `${targetRect.left}px`,
                width: `${targetRect.width}px`,
                height: `${targetRect.height}px`,
                zIndex: 10005,
                cursor: 'pointer'
              }}
              onClick={() => {
                let selector = '[data-guide-target="add-account"]';
                if (guideStep === 2) selector = '[data-guide-target="create-category"]';
                else if (guideStep === 3) selector = '[data-guide-target="add-funds"]';
                else if (guideStep === 4) selector = '[data-guide-target="spend"]';
                const el = document.querySelector(selector) as HTMLElement | null;
                if (el) el.click();
              }}
              aria-label="Click highlighted target"
            />
          )}

          {/* ONE Unified Coachmark Tooltip Bubble (Dtunes / FinX Style) */}
          {(() => {
            const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 390;
            const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
            const tooltipWidth = Math.min(290, windowWidth - 32);

            const spaceBelow = targetRect ? windowHeight - targetRect.bottom : windowHeight;
            const spaceAbove = targetRect ? targetRect.top : 0;
            // If there is an input (e.g. Account Name input, Category input), keep on top so mobile keyboard never covers it!
            const isInputTarget = modalOpen && (guideStep === 2 || modalSubstep === 'name');
            const placeAtBottom = !isInputTarget && (spaceBelow >= 160 || spaceBelow >= spaceAbove);

            const targetCenterX = targetRect ? targetRect.left + targetRect.width / 2 : windowWidth / 2;

            // Determine left/right corner: if target is on left, place box in corner; otherwise opposite
            const cardLeft = targetCenterX < windowWidth * 0.45
              ? Math.max(16, windowWidth - tooltipWidth - 16)
              : 16;

            const cardTop = placeAtBottom
              ? windowHeight - 24 - tooltipHeight
              : 36;

            // Curved arrow geometry:
            // Start at top of card (if card is at bottom) or bottom of card (if card is at top)
            const arrowStartX = cardLeft + (targetCenterX > cardLeft + tooltipWidth / 2 ? tooltipWidth * 0.75 : tooltipWidth * 0.35);
            const arrowStartY = placeAtBottom ? cardTop : cardTop + tooltipHeight;

            // Arrow endpoint: strictly stops 14px away from target button/input so tip NEVER touches the button!
            const arrowEndX = targetCenterX;
            const arrowEndY = placeAtBottom
              ? (targetRect ? targetRect.bottom + 14 : cardTop - 30)
              : (targetRect ? targetRect.top - 14 : cardTop + tooltipHeight + 30);

            const deltaX = arrowEndX - arrowStartX;
            const deltaY = arrowEndY - arrowStartY;

            // Natural smooth Bézier swoop
            const cp1X = arrowStartX + deltaX * 0.05;
            const cp1Y = arrowStartY + (placeAtBottom ? -Math.abs(deltaY) * 0.55 : Math.abs(deltaY) * 0.55);
            const cp2X = arrowEndX - deltaX * 0.15;
            const cp2Y = arrowEndY + (placeAtBottom ? Math.abs(deltaY) * 0.35 : -Math.abs(deltaY) * 0.35);

            const curvePath = `M ${arrowStartX} ${arrowStartY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${arrowEndX} ${arrowEndY}`;

            return (
              <>
                {/* Full-screen SVG for elegant curved arrow */}
                {targetRect && (
                  <svg
                    className="fixed inset-0 pointer-events-none"
                    style={{ width: '100vw', height: '100vh', zIndex: modalOpen ? 10025 : 10008 }}
                  >
                    <defs>
                      <marker
                        id="guide-curved-arrowhead"
                        markerWidth="9"
                        markerHeight="9"
                        refX="5"
                        refY="4.5"
                        orient="auto"
                      >
                        <path d="M1,1.5 L7.5,4.5 L1,7.5 Z" fill="#A8E063" />
                      </marker>
                    </defs>
                    <path
                      d={curvePath}
                      fill="none"
                      stroke="#A8E063"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      strokeLinecap="round"
                      markerEnd="url(#guide-curved-arrowhead)"
                    />
                  </svg>
                )}

                {/* Card Container in Bottom Corner */}
                <div
                  ref={tooltipRef}
                  style={{
                    position: 'fixed',
                    left: `${cardLeft}px`,
                    ...(placeAtBottom ? { bottom: '24px' } : { top: `${cardTop}px` }),
                    zIndex: modalOpen ? 10030 : 10006
                  }}
                  className="w-[280px] sm:w-[290px] onboarding-guide-card animate-fade-in select-none relative"
                >
                  {/* Tooltip Card (shadow-none so no shadow interferes with highlighted target) */}
                  <div className="bg-[#181C15] border border-[#3E5227] rounded-[20px] p-4 shadow-none text-white space-y-3">
                    {/* Header: Step counter + Skip All */}
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <span className="text-[11px] font-bold text-[#A8E063] tracking-wider uppercase bg-[#23301B] px-2.5 py-0.5 rounded-full border border-[#3A4E2A]">
                        {modalOpen && guideStep === 1
                          ? `Step 1 • ${modalSubstep === 'name' ? '1/3' : modalSubstep === 'currency' ? '2/3' : '3/3'}`
                          : `Step ${guideStep} of 4`}
                      </span>
                      <button
                        type="button"
                        onClick={finishOnboarding}
                        className="text-xs font-semibold text-[#8E8A82] hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Skip All
                      </button>
                    </div>

                    {/* Body Content based on Step */}
                    {guideStep === 1 && !modalOpen && (
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-[#A8E063]" />
                          <span>Create Your First Account</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          This is your manual vault. Here are some examples to name your account: Bank Name, Cash, or Savings.
                        </p>
                        <p className="text-2xs text-[#A8E063] font-medium pt-0.5">
                          👇 Tap &ldquo;+ Add Account&rdquo; below to start.
                        </p>
                      </div>
                    )}

                    {/* Step 1 Inside Modal: Substep 1 - Name */}
                    {guideStep === 1 && modalOpen && modalSubstep === 'name' && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-[#A8E063]" />
                          <span>Name Your Account</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          Type any name you want to track your money. Here are some examples: Bank Name, Cash, or Wallet.
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (hasTypedName) setModalSubstep('currency');
                            }}
                            disabled={!hasTypedName}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1 ${
                              hasTypedName
                                ? 'bg-[#4A622F] hover:bg-[#587437] text-white cursor-pointer shadow-[#4A622F]/30'
                                : 'bg-[#252822] text-[#6A6E64] opacity-50 cursor-not-allowed border border-white/[0.06]'
                            }`}
                          >
                            <span>Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 1 Inside Modal: Substep 2 - Currency */}
                    {guideStep === 1 && modalOpen && modalSubstep === 'currency' && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-[#A8E063]" />
                          <span>Choose Currency</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          Tap INR (₹) below to set Indian Rupee. You need to choose INR to continue.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setModalSubstep('name')}
                            className="py-1.5 px-3 rounded-xl bg-white/[0.05] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (inrConfirmed) setModalSubstep('submit');
                            }}
                            disabled={!inrConfirmed}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1 ${
                              inrConfirmed
                                ? 'bg-[#4A622F] hover:bg-[#587437] text-white cursor-pointer shadow-[#4A622F]/30'
                                : 'bg-[#252822] text-[#6A6E64] opacity-50 cursor-not-allowed border border-white/[0.06]'
                            }`}
                          >
                            <span>Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 1 Inside Modal: Substep 3 - Submit */}
                    {guideStep === 1 && modalOpen && modalSubstep === 'submit' && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#A8E063]" />
                          <span>Save Account</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          Click Create Account below to save this account into your vault.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setModalSubstep('currency')}
                            className="py-1.5 px-3 rounded-xl bg-white/[0.05] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const btn = document.querySelector('[data-guide-target="account-submit-btn"]') as HTMLButtonElement | null;
                              if (btn) btn.click();
                            }}
                            className="flex-1 py-2 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                          >
                            Create Account ✓
                          </button>
                        </div>
                      </div>
                    )}

                    {guideStep === 2 && !modalOpen && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <FolderTree className="w-4 h-4 text-[#A8E063]" />
                          <span>Set Your Categories</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          Categories organize where your money goes (like Needs, Wants, and Savings). Tap &ldquo;+ Create Category&rdquo; above to add your first category.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (accountsCount === 0) setGuideStep(1);
                            }}
                            disabled={accountsCount > 0}
                            className={`py-1.5 px-3 rounded-xl text-xs transition-colors ${
                              accountsCount > 0
                                ? 'opacity-30 cursor-not-allowed text-[#666] bg-transparent'
                                : 'bg-white/[0.05] text-[#8E8A82] hover:text-white cursor-pointer'
                            }`}
                          >
                            ← Back
                          </button>
                        </div>
                      </div>
                    )}

                    {guideStep === 2 && modalOpen && (
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <FolderTree className="w-4 h-4 text-[#A8E063]" />
                          <span>{hasTypedCategory ? 'Save Your Category' : 'Name Your Category'}</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          {hasTypedCategory
                            ? 'Tap «Create Category» below to save it.'
                            : 'Type any category name you want to track (e.g. Rent, Groceries, or Savings).'}
                        </p>
                      </div>
                    )}

                    {guideStep === 3 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-[#A8E063]" />
                          <span>Add Your Funds</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          Enter your starting balance or salary manually. Tap &ldquo;+ Add Funds&rdquo; below to start.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setGuideStep(2)}
                            className="py-1.5 px-3 rounded-xl bg-white/[0.05] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                          >
                            ← Back
                          </button>
                        </div>
                      </div>
                    )}

                    {guideStep === 4 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#A8E063]" />
                          <span>Track Your Spending</span>
                        </h4>
                        <p className="text-xs text-[#C5C8C0] leading-relaxed">
                          Log daily expenses as you spend. If a category runs out, it borrows from Wants to keep Savings safe.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setGuideStep(3)}
                            className="py-1.5 px-3 rounded-xl bg-white/[0.05] text-xs text-[#8E8A82] hover:text-white cursor-pointer"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={finishOnboarding}
                            className="flex-1 py-2 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                          >
                            Start Budgeting! 🚀
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
      {/* â”€â”€ 3. CLEAN SIGN IN MODAL â”€â”€ */}
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
