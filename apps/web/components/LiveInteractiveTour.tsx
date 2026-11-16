'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  CheckCircle2,
  X,
  Wallet,
  ArrowDownLeft,
  FolderTree,
  ChevronRight,
  ShieldCheck,
  Layers
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
      {/* ── 1. WELCOME MODAL: CLEAN CONSUMER-GRADE PRESENTATION ── */}
      {tourStatus === 'prompt' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1C1A17] to-[#141310] border border-white/[0.08] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-7 text-white space-y-6 overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#4A622F]/20 blur-3xl pointer-events-none rounded-full" />

            {/* Header */}
            <div className="text-center space-y-2 relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A622F]/20 border border-[#587437]/35 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#A8E063]" />
                <span>Financial OS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                Welcome to Richingness
              </h2>
              <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed max-w-xs mx-auto">
                Intelligent envelope budgeting crafted to give every rupee purpose and clarity.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 relative">
              {/* Option A: Guided Tour (Recommended) */}
              <button
                type="button"
                onClick={handleStartTour}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#23211C] to-[#1C1A16] hover:from-[#2A2722] hover:to-[#221F1B] border border-[#4A622F]/60 hover:border-[#587437] transition-all cursor-pointer group flex items-start gap-3.5 relative shadow-lg shadow-black/40 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A622F] to-[#384B23] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-tight">
                      Take Guided Tour
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#4A622F]/30 text-[#A8E063] text-[10px] font-bold uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                    A quick 60-second interactive setup to create your primary account and assign budget envelopes.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#A8E063] absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* Option B: Explore on My Own */}
              <button
                type="button"
                onClick={handleSkipTour}
                className="w-full p-4 rounded-2xl bg-[#181613] hover:bg-[#1E1C18] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group flex items-start gap-3.5 relative text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] text-[#8E8A82] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-sm font-semibold text-white tracking-tight block">
                    Explore on My Own
                  </span>
                  <p className="text-xs text-[#8E8A82] mt-1 leading-relaxed">
                    Jump directly to your empty dashboard. You can replay the walkthrough anytime from Settings.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8A82] group-hover:text-white absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>

            {/* Cloud Sign In Option */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8E8A82]">
              <span>Already syncing data?</span>
              <button
                type="button"
                onClick={() => {
                  handleSkipTour();
                  onOpenSignIn();
                }}
                className="text-[#A8E063] hover:text-white font-medium transition-colors cursor-pointer"
              >
                Sign In with Cloud Sync →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. LIVE IN-APP FLOATING HUD COACHMARK ── */}
      {tourStatus === 'running' && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9990] animate-fade-up">
          <div className="bg-[#181714]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white space-y-3.5 relative overflow-hidden">
            {/* Top Bar with Step Progress & Dismiss */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === currentStep
                          ? 'w-6 bg-[#A8E063]'
                          : step < currentStep
                          ? 'w-3 bg-[#4A622F]'
                          : 'w-3 bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-2xs font-bold text-[#A8E063] tracking-wider uppercase ml-1">
                  Step {currentStep} of 3
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkipTour}
                className="text-xs text-[#8E8A82] hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <span>Exit Guide</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Step 1 Guidance: Create Account ── */}
            {currentStep === 1 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span>Create Your Primary Account</span>
                </div>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Every transaction and budget envelope is backed by real accounts. Enter a name for your primary bank or cash account to get started.
                </p>
                {!isAddAcctModalOpen && (
                  <button
                    type="button"
                    onClick={onOpenAddAccount}
                    className="w-full mt-1 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4A622F]/25 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Open Account Form</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Step 2 Guidance: Add Initial Funds ── */}
            {currentStep === 2 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <span>Fund Your Workspace</span>
                </div>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Deposit your current balance or recent salary into <strong className="text-white">{primaryAccountName}</strong>. These funds flow into your unallocated pool, ready for budgeting.
                </p>
                {!isAddTxModalOpen && (
                  <button
                    type="button"
                    onClick={onOpenAddFunds}
                    className="w-full mt-1 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4A622F]/25 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Open Deposit Form</span>
                  </button>
                )}
              </div>
            )}

            {/* ── Step 3 Guidance: Categories & Spending ── */}
            {currentStep === 3 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-lg bg-[#4A622F]/30 border border-[#587437]/40 flex items-center justify-center text-[#A8E063] shrink-0">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <span>Envelopes &amp; Smart Borrowing</span>
                </div>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Your funds are ready! Richingness divides your money into <strong>Needs (50%)</strong>, <strong>Wants (30%)</strong>, and <strong>Savings (20%)</strong>.
                </p>
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-1 text-2xs text-[#A09C94] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#A8E063]" />
                    <span>How envelope budgeting protects you:</span>
                  </div>
                  <p>
                    When spending, tap <strong>+ Spend</strong> on any category. If an envelope runs out, Richingness suggests borrowing from Wants before ever touching your Savings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFinishTour}
                  className="w-full py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#4A622F]/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#A8E063]" />
                  <span>Complete Setup &amp; Enter Dashboard</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
