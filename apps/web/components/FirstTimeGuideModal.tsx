'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wallet,
  FolderTree,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Zap,
  Play
} from 'lucide-react';

interface FirstTimeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreateAccount?: () => void;
  onOpenSignIn?: () => void;
  accountsCount: number;
}

export function FirstTimeGuideModal({
  isOpen,
  onClose,
  onStartCreateAccount,
  onOpenSignIn,
  accountsCount
}: FirstTimeGuideModalProps) {
  // Mode: 'WELCOME' (Choice: New or Returning) | 'GUIDE' (Step by Step Tour)
  const [mode, setMode] = useState<'WELCOME' | 'GUIDE'>('WELCOME');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  useEffect(() => {
    if (isOpen) {
      // Check if user previously skipped or if they are in middle
      setMode('WELCOME');
      setCurrentStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_onboarding_guide', 'skipped');
    }
    onClose();
  };

  const handleCompleteGuide = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_onboarding_guide', 'completed');
    }
    onClose();
  };

  const handleStartSetup = () => {
    handleCompleteGuide();
    if (onStartCreateAccount) {
      onStartCreateAccount();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[#191714] border border-[#2D2A24] rounded-2xl shadow-2xl text-white flex flex-col overflow-hidden my-auto max-h-[92vh]">

        {/* ── Top Header ── */}
        <div className="px-5 py-4 border-b border-[#2D2A24] flex items-center justify-between shrink-0 bg-[#14120F]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4A622F]/30 border border-[#587437]/50 flex items-center justify-center text-[#A8E063]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {mode === 'WELCOME' ? 'Welcome to Richingness' : `Interactive Guide · Step ${currentStep} of ${totalSteps}`}
              </h3>
              <p className="text-[11px] text-[#8E8A82]">
                {mode === 'WELCOME' ? 'First time setup & orientation' : 'How zero-deficit envelope budgeting works'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg text-[#8E8A82] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Mode 1: Welcome Choice Screen ── */}
        {mode === 'WELCOME' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A622F]/20 border border-[#587437]/40 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
                Financial Operating System
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Are you new to Richingness?
              </h2>
              <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed max-w-sm mx-auto">
                Tell us your experience so we can personalize your onboarding.
              </p>
            </div>

            {/* Options Grid */}
            <div className="space-y-3 pt-1">
              {/* Option A: I'm New - Show Me Around */}
              <button
                onClick={() => setMode('GUIDE')}
                className="w-full text-left p-4 rounded-xl bg-[#211F1B] hover:bg-[#282622] border-2 border-[#4A622F] hover:border-[#587437] transition-all cursor-pointer group flex items-start gap-3.5 relative overflow-hidden shadow-lg shadow-[#4A622F]/10"
              >
                <div className="w-10 h-10 rounded-xl bg-[#4A622F] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-white" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">I&apos;m New · Guide Me Through</span>
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#4A622F]/40 text-[#A8E063] border border-[#587437]/50">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                    Interactive tutorial with visual examples of how Accounts, Envelopes &amp; Spending work.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#A8E063] absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option B: I have used this before */}
              <button
                onClick={handleSkip}
                className="w-full text-left p-4 rounded-xl bg-[#1C1A16] hover:bg-[#24211D] border border-[#2F2C25] hover:border-[#3D3930] transition-all cursor-pointer group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#292620] text-[#A09C94] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-sm font-bold text-white">I&apos;ve Used This Before · Skip Tour</span>
                  <p className="text-xs text-[#8E8A82] mt-1 leading-relaxed">
                    Jump straight into the app. No tutorials or introduction modals.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8A82] group-hover:text-white absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Bottom Actions: Sign In / Guest */}
            <div className="pt-3 border-t border-[#292620] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E8A82] gap-2">
              <span>Have an existing account?</span>
              <button
                onClick={() => {
                  handleSkip();
                  if (onOpenSignIn) onOpenSignIn();
                }}
                className="text-[#A8E063] hover:underline font-semibold cursor-pointer"
              >
                Sign In to Cloud Sync →
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 2: Step-by-Step Interactive Guide ── */}
        {mode === 'GUIDE' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Step Progress Bar */}
            <div className="w-full bg-[#14120F] px-5 py-2.5 border-b border-[#25221D] flex items-center justify-between text-2xs text-[#8E8A82]">
              <div className="flex items-center gap-1.5 font-semibold">
                {[1, 2, 3, 4].map(step => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all ${
                      step === currentStep
                        ? 'w-6 bg-[#A8E063]'
                        : step < currentStep
                        ? 'w-3 bg-[#4A622F]'
                        : 'w-3 bg-[#2D2A24]'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono">Step {currentStep} of {totalSteps}</span>
            </div>

            {/* Step Content Container */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">

              {/* ── STEP 1: ACCOUNTS (MONEY SOURCES) ── */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-[#A8E063]">
                    <Wallet className="w-5 h-5" />
                    <span className="text-xs uppercase font-extrabold tracking-wider">Step 1 · Money Sources</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">What is an Account?</h3>
                    <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                      Every rupee you own lives in a real-world Account. It can be your Bank (HDFC, SBI), a UPI wallet, or physical Cash in hand.
                    </p>
                  </div>

                  {/* Visual Example Card */}
                  <div className="bg-[#211F1B] border border-[#2E2B25] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#8E8A82]">
                      <span className="font-semibold uppercase tracking-wider text-2xs">Live Example</span>
                      <span className="text-[#A8E063] font-mono text-2xs">Bank Account</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#171512] rounded-lg p-3 border border-[#292620]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4A622F]/30 border border-[#587437]/50 flex items-center justify-center text-[#A8E063]">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">HDFC Salary Account</p>
                          <p className="text-2xs text-[#8E8A82]">Savings · Primary Account</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[#A8E063] font-mono">₹10,000</p>
                        <p className="text-2xs text-[#8E8A82]">Available</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#A09C94] leading-relaxed">
                      💡 <strong>Tip:</strong> In Richingness, you start by creating your first account. You can connect multiple accounts anytime from the Accounts tab.
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 2: GENERAL FUNDS (UNALLOCATED POOL) ── */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-[#E5A93C]">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs uppercase font-extrabold tracking-wider">Step 2 · Initial Funds</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Adding Initial Funds &amp; General Pool</h3>
                    <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                      When salary, income, or opening cash enters your account, it lands in your <strong>General Funds</strong> (Base Pool).
                    </p>
                  </div>

                  {/* Visual Example Card */}
                  <div className="bg-[#211F1B] border border-[#2E2B25] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#8E8A82]">
                      <span className="font-semibold uppercase tracking-wider text-2xs">The Inflow Concept</span>
                      <span className="text-[#E5A93C] font-mono text-2xs">Ready to Budget</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-[#171512] rounded-lg p-2.5 border border-[#292620]">
                        <span className="text-xs font-semibold text-white">1. Deposit Salary</span>
                        <span className="text-xs font-bold text-[#A8E063]">+ ₹10,000</span>
                      </div>
                      <div className="flex justify-center text-[#8E8A82]">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </div>
                      <div className="flex items-center justify-between bg-[#2C2417] rounded-lg p-2.5 border border-[#4E3F24]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
                          <span className="text-xs font-bold text-white">General Funds (Base Pool)</span>
                        </div>
                        <span className="text-xs font-bold text-[#E5A93C]">₹10,000</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#A09C94] leading-relaxed">
                      💡 <strong>Rule:</strong> General Funds is money waiting for an assignment. Next, we give every rupee a job using Categories!
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 3: WHAT IS A CATEGORY? (THE ENVELOPE METHOD) ── */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-[#5B9DF8]">
                    <FolderTree className="w-5 h-5" />
                    <span className="text-xs uppercase font-extrabold tracking-wider">Step 3 · What is a Category?</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">The Digital Envelope Method</h3>
                    <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                      Instead of keeping all ₹10,000 in one pile and guessing if you have enough for rent, you split it into <strong>Categories (Envelopes)</strong>:
                    </p>
                  </div>

                  {/* 50/30/20 Visual Breakdown */}
                  <div className="space-y-2 bg-[#211F1B] border border-[#2E2B25] rounded-xl p-3.5">
                    <p className="text-2xs uppercase tracking-wider text-[#8E8A82] font-bold">Standard 50/30/20 Life Budget</p>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      {/* Needs */}
                      <div className="bg-[#171E14] border border-[#2E4522] rounded-lg p-2">
                        <span className="text-2xs text-[#A8E063] font-bold uppercase block">Needs 50%</span>
                        <p className="text-xs font-extrabold text-white mt-0.5">₹5,000</p>
                        <p className="text-[10px] text-[#8E8A82] mt-0.5">Rent, Bills, Food</p>
                      </div>

                      {/* Wants */}
                      <div className="bg-[#1E1C12] border border-[#483B1E] rounded-lg p-2">
                        <span className="text-2xs text-[#E5A93C] font-bold uppercase block">Wants 30%</span>
                        <p className="text-xs font-extrabold text-white mt-0.5">₹3,000</p>
                        <p className="text-[10px] text-[#8E8A82] mt-0.5">Dining, Hobbies</p>
                      </div>

                      {/* Savings */}
                      <div className="bg-[#131922] border border-[#23354C] rounded-lg p-2">
                        <span className="text-2xs text-[#5B9DF8] font-bold uppercase block">Savings 20%</span>
                        <p className="text-xs font-extrabold text-white mt-0.5">₹2,000</p>
                        <p className="text-[10px] text-[#8E8A82] mt-0.5">Emergency, Gold</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#A09C94] leading-relaxed pt-1">
                      🎯 <strong>Why this matters:</strong> You only spend what is inside that category envelope. You will never accidentally spend rent money on a luxury dinner!
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 4: SPENDING & ZERO DEFICIT PROTECTION ── */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-[#A8E063]">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-xs uppercase font-extrabold tracking-wider">Step 4 · Spending &amp; Zero Overdraft</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">How Spending &amp; Tracking Works</h3>
                    <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                      Whenever you spend money, tap <strong>+ Spend</strong> on that category. Richingness deducts it directly from the envelope.
                    </p>
                  </div>

                  {/* Visual Simulation */}
                  <div className="bg-[#211F1B] border border-[#2E2B25] rounded-xl p-3.5 space-y-2.5">
                    <p className="text-2xs uppercase tracking-wider text-[#8E8A82] font-bold">Zero-Overdraft Safeguard</p>
                    
                    <div className="bg-[#171512] rounded-lg p-3 border border-[#292620] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">🍔 Dining Out Envelope</span>
                        <span className="text-[#A8E063] font-bold">₹1,500 Available</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#E5A93C] bg-[#292419] p-2 rounded border border-[#483B1E]">
                        <span>Spend ₹500 at Cafe</span>
                        <span className="font-bold">➔ Leaves ₹1,000 Available</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-[#1A1815] p-2.5 rounded-lg border border-[#332F28]">
                      <ShieldCheck className="w-4 h-4 text-[#A8E063] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#A09C94] leading-relaxed">
                        If a category is empty, Richingness <strong>blocks accidental overspending</strong> and asks you to borrow surplus from another envelope first!
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Step Navigation Footer */}
            <div className="p-4 sm:p-5 border-t border-[#2D2A24] bg-[#14120F] flex items-center justify-between shrink-0">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-3 py-2 rounded-xl border border-[#2D2A24] text-xs font-semibold text-[#A09C94] hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  onClick={() => setMode('WELCOME')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#8E8A82] hover:text-white transition-all cursor-pointer"
                >
                  Change Option
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#4A622F]/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleStartSetup}
                  className="px-5 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#4A622F]/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{accountsCount === 0 ? 'Create My First Account' : 'Got It, Let’s Go!'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
