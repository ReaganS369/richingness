'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  X,
  Wallet,
  ArrowDownLeft,
  FolderTree,
  ChevronRight
} from 'lucide-react';

interface LiveInteractiveTourProps {
  accountsCount: number;
  totalBalanceRupees: number;
  primaryAccountName?: string;
  onOpenAddAccount: () => void;
  onOpenAddFunds: () => void;
  onOpenSignIn: () => void;
  isAddAcctModalOpen: boolean;
  isAddTxModalOpen: boolean;
}

export function LiveInteractiveTour({
  accountsCount,
  totalBalanceRupees,
  primaryAccountName = 'your account',
  onOpenAddAccount,
  onOpenAddFunds,
  onOpenSignIn,
  isAddAcctModalOpen,
  isAddTxModalOpen
}: LiveInteractiveTourProps) {
  // Tour Status: 'loading' | 'prompt' | 'running' | 'completed' | 'skipped'
  const [tourStatus, setTourStatus] = useState<'loading' | 'prompt' | 'running' | 'completed' | 'skipped'>('loading');

  // Check initial tour state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('richingness_live_tour');
      if (!saved) {
        setTourStatus('prompt');
      } else if (saved === 'running') {
        setTourStatus('running');
      } else if (saved === 'skipped') {
        setTourStatus('skipped');
      } else {
        setTourStatus('completed');
      }
    }

    // Listen for custom trigger from Settings (e.g. Replay Tutorial)
    const handleReplayTour = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('richingness_live_tour', 'running');
      }
      setTourStatus('running');
    };

    window.addEventListener('richingness:replay-tour', handleReplayTour);
    return () => window.removeEventListener('richingness:replay-tour', handleReplayTour);
  }, []);

  // Determine current step when tour is running
  // Step 1: No accounts -> create account
  // Step 2: Has accounts, but ₹0 balance -> add initial funds
  // Step 3: Has accounts and >₹0 balance -> categories & spending explanation
  const currentStep = accountsCount === 0 ? 1 : totalBalanceRupees <= 0 ? 2 : 3;

  // Automatically trigger modals on step transitions when tour is running
  useEffect(() => {
    if (tourStatus !== 'running') return;

    if (currentStep === 1 && !isAddAcctModalOpen) {
      const timer = setTimeout(() => {
        onOpenAddAccount();
      }, 350);
      return () => clearTimeout(timer);
    }

    if (currentStep === 2 && !isAddTxModalOpen) {
      const timer = setTimeout(() => {
        onOpenAddFunds();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [tourStatus, currentStep, isAddAcctModalOpen, isAddTxModalOpen, onOpenAddAccount, onOpenAddFunds]);

  if (tourStatus === 'loading' || tourStatus === 'completed' || tourStatus === 'skipped') {
    return null;
  }

  const handleStartTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_live_tour', 'running');
    }
    setTourStatus('running');
    if (accountsCount === 0) {
      onOpenAddAccount();
    } else if (totalBalanceRupees <= 0) {
      onOpenAddFunds();
    }
  };

  const handleSkipTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_live_tour', 'skipped');
    }
    setTourStatus('skipped');
  };

  const handleFinishTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_live_tour', 'completed');
    }
    setTourStatus('completed');
  };

  return (
    <>
      {/* ── 1. INITIAL QUESTION: ARE YOU NEW OR NOT? ── */}
      {tourStatus === 'prompt' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#191714] border border-[#2D2A24] rounded-2xl shadow-2xl p-6 sm:p-7 text-white space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#4A622F]/30 border border-[#587437]/50 flex items-center justify-center text-[#A8E063] mx-auto shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Welcome to Richingness
              </h2>
              <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed max-w-xs mx-auto">
                Smart envelope budgeting that keeps every rupee accounted for.
              </p>
            </div>

            {/* Question & Choices */}
            <div className="space-y-3">
              <p className="text-center text-xs font-bold text-[#E5A93C] uppercase tracking-wider">
                Are you new to Richingness?
              </p>

              {/* Option A: Yes, I'm new */}
              <button
                type="button"
                onClick={handleStartTour}
                className="w-full p-4 rounded-xl bg-[#211F1B] hover:bg-[#282622] border-2 border-[#4A622F] hover:border-[#587437] transition-all cursor-pointer group flex items-start gap-3.5 relative overflow-hidden shadow-lg shadow-[#4A622F]/10 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-[#4A622F] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 pr-6">
                  <span className="text-sm font-bold text-white block">
                    ✨ Yes, I&apos;m new — Show me around
                  </span>
                  <span className="text-xs text-[#A09C94] mt-0.5 block leading-relaxed">
                    Live walkthrough: We’ll open each section and guide you right inside the app.
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#A8E063] absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option B: I have used this before */}
              <button
                type="button"
                onClick={handleSkipTour}
                className="w-full p-4 rounded-xl bg-[#1C1A16] hover:bg-[#24211D] border border-[#2F2C25] hover:border-[#3D3930] transition-all cursor-pointer group flex items-start gap-3.5 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-[#292620] text-[#A09C94] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 pr-6">
                  <span className="text-sm font-bold text-white block">
                    ⚡ I&apos;ve used this before — Jump straight in
                  </span>
                  <span className="text-xs text-[#8E8A82] mt-0.5 block leading-relaxed">
                    Skip tutorials and start using the app. (You can replay anytime from Settings).
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8A82] group-hover:text-white absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Cloud Sign In Option */}
            <div className="pt-3 border-t border-[#292620] flex items-center justify-between text-xs text-[#8E8A82]">
              <span>Have an existing account?</span>
              <button
                type="button"
                onClick={() => {
                  handleSkipTour();
                  onOpenSignIn();
                }}
                className="text-[#A8E063] hover:underline font-semibold cursor-pointer"
              >
                Sign In to Cloud Sync →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. LIVE IN-APP FLOATING COACHMARK ── */}
      {tourStatus === 'running' && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-fade-up">
          <div className="bg-[#1C1A16]/95 backdrop-blur-md border-2 border-[#4A622F] rounded-2xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5 relative">
            
            {/* Top Bar with Step & Dismiss */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4A622F]/30 border border-[#587437]/50 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
                  Live Guide · Step {currentStep} of 3
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkipTour}
                className="text-xs text-[#8E8A82] hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
                title="End Tour"
              >
                <span>Skip</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Step 1 Guidance: Create Account ── */}
            {currentStep === 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <Wallet className="w-4 h-4 text-[#A8E063]" />
                  <span>Step 1: First, let&apos;s create an account</span>
                </div>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Every rupee you manage belongs to an account. Type any name for your account (e.g. Primary, My Account, or your own name) and tap <strong>Create Account</strong>.
                </p>
                {!isAddAcctModalOpen && (
                  <button
                    type="button"
                    onClick={onOpenAddAccount}
                    className="w-full mt-1 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Open Account Window</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Step 2 Guidance: Add Initial Funds ── */}
            {currentStep === 2 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <ArrowDownLeft className="w-4 h-4 text-[#A8E063]" />
                  <span>Step 2: Add initial funds</span>
                </div>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Great job! Now let’s add some starting funds. Enter your current balance or salary into <strong className="text-white">{primaryAccountName}</strong> so you have money to budget with.
                </p>
                {!isAddTxModalOpen && (
                  <button
                    type="button"
                    onClick={onOpenAddFunds}
                    className="w-full mt-1 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Open Deposit Window</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Step 3 Guidance: Categories & Spending ── */}
            {currentStep === 3 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <FolderTree className="w-4 h-4 text-[#A8E063]" />
                  <span>Step 3: Categories &amp; Envelopes</span>
                </div>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Your funds are now ready! Notice how Richingness divides your money into <strong>Needs (50%)</strong>, <strong>Wants (30%)</strong>, and <strong>Savings (20%)</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-[#14120F] border border-[#2D2A24] space-y-1 text-2xs text-[#8E8A82]">
                  <p className="text-white font-semibold">💡 How spending works:</p>
                  <p>When you spend, tap <strong className="text-[#A8E063]">+ Spend</strong> on that category. If an envelope is empty, Richingness prompts you to borrow from another envelope before spending!</p>
                </div>
                <button
                  type="button"
                  onClick={handleFinishTour}
                  className="w-full py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#4A622F]/30 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Got it, Let&apos;s Start Budgeting! 🚀</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
