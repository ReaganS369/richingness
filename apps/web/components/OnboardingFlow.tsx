'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  FolderTree,
  ShieldCheck,
  ArrowRight,
  LogIn,
  X,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { authService } from '../app/store';

export type OnboardingStage =
  | 'loading'
  | 'welcome'
  | 'login_modal'
  | 'guide'
  | 'completed';

interface OnboardingFlowProps {
  onComplete?: () => void;
  onOpenSettings?: () => void;
}

export function OnboardingFlow({ onComplete, onOpenSettings: _onOpenSettings }: OnboardingFlowProps) {
  const [stage, setStage] = useState<OnboardingStage>('loading');
  const [slide, setSlide] = useState<number>(1);

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
      setSlide(1);
      setStage('guide');
    };

    window.addEventListener('richingness:replay-tour', handleReplay);
    return () => window.removeEventListener('richingness:replay-tour', handleReplay);
  }, []);

  const finishOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_onboarding_completed', 'true');
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in">
      
      {/* ── 1. CLEAN MINIMALIST WELCOME ── */}
      {stage === 'welcome' && (
        <div className="relative w-full max-w-sm bg-[#161512] border border-white/10 rounded-[28px] shadow-2xl p-7 text-center space-y-7 animate-scale-in">
          {/* Brand Icon & Title */}
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#4A622F] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#4A622F]/30 text-2xl font-black">
              R
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Richingness</h2>
              <p className="text-sm text-[#A09C94] mt-1">Simple envelope budgeting.</p>
            </div>
          </div>

          {/* Clean Primary Buttons */}
          <div className="space-y-3">
            {/* New User -> Quick Guide */}
            <button
              type="button"
              onClick={() => {
                setSlide(1);
                setStage('guide');
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-sm shadow-lg shadow-[#4A622F]/25 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>I&apos;m New — Show Me Around</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Existing User -> Direct to Dashboard */}
            <button
              type="button"
              onClick={finishOnboarding}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#22201B] hover:bg-[#2A2722] border border-white/5 text-white font-semibold text-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              I&apos;ve Used This Before
            </button>
          </div>

          {/* Discreet Sign In Link */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setStage('login_modal');
              }}
              className="text-xs text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
            >
              Already syncing? <span className="text-[#A8E063] font-semibold underline underline-offset-2">Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. VISUAL 3-SLIDE GUIDE (ALMOST NO TEXT, ZERO CLUTTER) ── */}
      {stage === 'guide' && (
        <div className="relative w-full max-w-sm bg-[#161512] border border-white/10 rounded-[28px] shadow-2xl p-6 sm:p-7 space-y-6 animate-scale-in text-white">
          {/* Header with dots and skip */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slide ? 'w-6 bg-[#A8E063]' : 'w-2 bg-white/15'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-xs text-[#8E8A82] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Skip</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Slide 1: Real Accounts */}
          {slide === 1 && (
            <div className="space-y-5 animate-fade-up">
              {/* Graphic Mockup */}
              <div className="p-4 rounded-2xl bg-[#201E19] border border-white/5 flex items-center gap-3.5 shadow-inner">
                <div className="w-11 h-11 rounded-xl bg-[#4A622F]/30 text-[#A8E063] flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">Primary Bank</h4>
                  <p className="text-xs text-[#8E8A82]">Cash &amp; Bank Accounts</p>
                </div>
                <span className="text-base font-extrabold text-[#A8E063]">₹50,000</span>
              </div>

              {/* Title & 1 Short Sentence */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">1. Real Accounts</h3>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Money starts in your real bank accounts or cash wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSlide(2)}
                className="w-full py-3 rounded-2xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                <span>Next: Envelopes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Slide 2: 50/30/20 Envelopes */}
          {slide === 2 && (
            <div className="space-y-5 animate-fade-up">
              {/* Graphic Mockup */}
              <div className="p-3.5 rounded-2xl bg-[#201E19] border border-white/5 space-y-2 shadow-inner">
                <div className="p-2 rounded-xl bg-[#181613] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">Needs (50%)</span>
                  </div>
                  <span className="font-bold text-emerald-400">₹25,000</span>
                </div>
                <div className="p-2 rounded-xl bg-[#181613] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="font-semibold text-white">Wants (30%)</span>
                  </div>
                  <span className="font-bold text-blue-400">₹15,000</span>
                </div>
                <div className="p-2 rounded-xl bg-[#181613] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="font-semibold text-white">Savings (20%)</span>
                  </div>
                  <span className="font-bold text-purple-400">₹10,000</span>
                </div>
              </div>

              {/* Title & 1 Short Sentence */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#A8E063]" />
                  <span>2. Dedicated Envelopes</span>
                </h3>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Income is divided into envelopes before you spend.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSlide(1)}
                  className="px-4 py-3 rounded-2xl bg-[#22201B] hover:bg-[#2A2722] text-white text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setSlide(3)}
                  className="flex-1 py-3 rounded-2xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Next: Spending</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Slide 3: Smart Borrowing */}
          {slide === 3 && (
            <div className="space-y-5 animate-fade-up">
              {/* Graphic Mockup */}
              <div className="p-4 rounded-2xl bg-[#201E19] border border-white/5 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Safe Rebalancing</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-2xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Protected</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#181613] flex items-center justify-between text-xs">
                  <span className="text-red-400 font-bold">Wants -₹1,500</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A8E063]" />
                  <span className="text-emerald-400 font-bold">Needs +₹1,500</span>
                </div>
              </div>

              {/* Title & 1 Short Sentence */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#A8E063]" />
                  <span>3. Spend &amp; Borrow Safely</span>
                </h3>
                <p className="text-xs text-[#A09C94] leading-relaxed">
                  Overspent? Borrow from Wants to protect your Savings.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSlide(2)}
                  className="px-4 py-3 rounded-2xl bg-[#22201B] hover:bg-[#2A2722] text-white text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="flex-1 py-3 rounded-2xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#4A622F]/30 transition-all active:scale-[0.98]"
                >
                  <span>Start Budgeting 🚀</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. CLEAN SIGN IN MODAL ── */}
      {stage === 'login_modal' && (
        <div className="relative w-full max-w-sm bg-[#161512] border border-white/10 rounded-[28px] shadow-2xl p-6 sm:p-7 space-y-4 animate-scale-in text-white">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
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
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue with Google</span>
          </button>
        </div>
      )}

    </div>
  );
}
