'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  ArrowRight,
  CheckCircle2,
  X,
  Wallet,
  FolderTree,
  ChevronRight,
  ShieldCheck,
  User,
  LogIn,
  UserPlus,
  ArrowLeft,
  Loader2,
  Shield
} from 'lucide-react';
import { authService } from '../app/store';

export type OnboardingStage =
  | 'loading'
  | 'welcome'
  | 'new_user_guide_prompt'
  | 'login_modal'
  | 'signup_modal'
  | 'guide_slides'
  | 'completed';

interface OnboardingFlowProps {
  onComplete?: () => void;
  onOpenSettings?: () => void;
}

export function OnboardingFlow({ onComplete, onOpenSettings: _onOpenSettings }: OnboardingFlowProps) {
  const [stage, setStage] = useState<OnboardingStage>('loading');
  const [guideSlide, setGuideSlide] = useState<number>(1);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Check initial onboarding state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('richingness_onboarding_completed');
      if (completed === 'true') {
        setStage('completed');
      } else {
        setStage('welcome');
      }
    }

    // Custom event to replay tour from Settings
    const handleReplay = () => {
      setGuideSlide(1);
      setStage('guide_slides');
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

  // Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      await authService.signInWithOAuth('google', redirectTo);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to connect with Google');
      setAuthLoading(false);
    }
  };

  // Email Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await authService.signIn(authEmail, authPassword);
      // Existing user signed in -> skip guide directly to dashboard
      finishOnboarding();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
      setAuthLoading(false);
    }
  };

  // Email Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await authService.signUp(authEmail, authPassword, authName || undefined);
      setAuthSuccessMsg('Account created! Please check your email to confirm, or start using your workspace.');
      setAuthLoading(false);
      // Offer the guide after sign up
      setTimeout(() => {
        setStage('new_user_guide_prompt');
      }, 1200);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      setAuthLoading(false);
    }
  };

  if (stage === 'loading' || stage === 'completed') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: CLEAR WELCOME - NEW USER VS EXISTING CUSTOMER                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {stage === 'welcome' && (
        <div className="relative w-full max-w-md bg-gradient-to-b from-[#1C1A17] to-[#131210] border border-white/[0.08] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 text-white space-y-6 overflow-hidden">
          {/* Subtle ambient glow halo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-24 bg-[#4A622F]/20 blur-3xl pointer-events-none rounded-full" />

          {/* Brand Header */}
          <div className="text-center space-y-2 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A622F]/20 border border-[#587437]/40 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#A8E063]" />
              <span>Financial OS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Welcome to Richingness
            </h2>
            <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed max-w-xs mx-auto">
              Intelligent envelope budgeting crafted to give every rupee a clear purpose.
            </p>
          </div>

          {/* Primary Two Choices: New vs Existing */}
          <div className="space-y-3.5 relative">
            
            {/* Option A: New Customer / First Time */}
            <button
              type="button"
              onClick={() => setStage('new_user_guide_prompt')}
              className="w-full p-4.5 rounded-2xl bg-gradient-to-r from-[#24211D] to-[#1C1A16] hover:from-[#2C2923] hover:to-[#221F1B] border border-[#4A622F]/70 hover:border-[#6B8D43] transition-all cursor-pointer group flex items-start gap-4 relative shadow-lg shadow-black/40 text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4A622F] to-[#384B23] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">
                    I&apos;m New to Richingness
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4A622F]/30 text-[#A8E063] text-[10px] font-bold uppercase tracking-wider">
                    First Visit
                  </span>
                </div>
                <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                  Start fresh with instant offline guest mode, or take a quick 1-minute visual tour.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8E063] absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Option B: Existing Customer / Already have account */}
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setStage('login_modal');
              }}
              className="w-full p-4.5 rounded-2xl bg-[#191714] hover:bg-[#201E1A] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer group flex items-start gap-4 text-left relative"
            >
              <div className="w-11 h-11 rounded-xl bg-white/[0.06] text-[#A09C94] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <LogIn className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white tracking-tight">
                    I Already Have an Account
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8E8A82] text-[10px] font-medium">
                    Sign In
                  </span>
                </div>
                <p className="text-xs text-[#8E8A82] mt-1 leading-relaxed">
                  Sign in with email or Google to restore your synced data. Tutorials will be skipped.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8A82] group-hover:text-white absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>

          {/* Quick Direct Link */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8E8A82]">
            <span className="flex items-center gap-1.5 text-2xs text-[#7A766E]">
              <Shield className="w-3.5 h-3.5 text-[#A8E063]" />
              <span>Private &amp; offline-first</span>
            </span>
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-[#A8E063] hover:underline font-medium cursor-pointer"
            >
              Skip directly to dashboard →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: FOR NEW USERS - WANT A GUIDE OR JUMP STRAIGHT IN?            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {stage === 'new_user_guide_prompt' && (
        <div className="relative w-full max-w-md bg-gradient-to-b from-[#1C1A17] to-[#131210] border border-white/[0.08] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 text-white space-y-6 overflow-hidden animate-fade-in">
          {/* Subtle ambient glow halo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#4A622F]/20 blur-3xl pointer-events-none rounded-full" />

          {/* Header */}
          <div className="text-center space-y-2 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A622F]/20 border border-[#587437]/40 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
              <Compass className="w-3 h-3 text-[#A8E063]" />
              <span>Getting Started</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Would you like a quick guide?
            </h2>
            <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed max-w-xs mx-auto">
              We can give you a 60-second visual walkthrough on how accounts, 50/30/20 envelopes, and smart rebalancing work.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 relative">
            
            {/* Option A: Yes, Show the Guide */}
            <button
              type="button"
              onClick={() => {
                setGuideSlide(1);
                setStage('guide_slides');
              }}
              className="w-full p-4.5 rounded-2xl bg-gradient-to-r from-[#24211D] to-[#1C1A16] hover:from-[#2C2923] hover:to-[#221F1B] border border-[#4A622F]/70 hover:border-[#6B8D43] transition-all cursor-pointer group flex items-start gap-4 relative shadow-lg shadow-black/40 text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4A622F] to-[#384B23] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">
                    Yes, Show Me the Guide
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4A622F]/30 text-[#A8E063] text-[10px] font-bold uppercase tracking-wider">
                    Recommended · 60s
                  </span>
                </div>
                <p className="text-xs text-[#A09C94] mt-1 leading-relaxed">
                  A visual overview of how to manage accounts and envelopes before entering the app.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8E063] absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Option B: No, Jump Straight to Dashboard (Guest Mode) */}
            <button
              type="button"
              onClick={finishOnboarding}
              className="w-full p-4 rounded-2xl bg-[#191714] hover:bg-[#201E1A] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer group flex items-start gap-4 text-left relative"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] text-[#A09C94] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <User className="w-5 h-5 text-[#8E8A82] group-hover:text-[#A8E063] transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-sm font-semibold text-white tracking-tight block">
                  No, Jump Straight into Guest Mode
                </span>
                <p className="text-xs text-[#8E8A82] mt-0.5 leading-relaxed">
                  Skip the guide and open the empty dashboard. (You can replay the guide anytime from Settings).
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8E8A82] group-hover:text-white absolute right-4 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8E8A82]">
            <button
              type="button"
              onClick={() => setStage('welcome')}
              className="text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setStage('signup_modal');
              }}
              className="text-[#A8E063] hover:underline font-medium cursor-pointer"
            >
              Create Cloud Account instead →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SIGN IN SUB-SCREEN (LOGIN)                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {stage === 'login_modal' && (
        <div className="relative w-full max-w-sm bg-[#1A1916] border border-white/[0.1] rounded-3xl shadow-2xl p-6 sm:p-7 text-white space-y-5 animate-scale-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <button
              type="button"
              onClick={() => setStage('welcome')}
              className="flex items-center gap-1.5 text-xs text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h3 className="font-bold text-sm text-white">Sign In to Cloud Sync</h3>
            <div className="w-8" />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#22201B] border border-white/[0.08] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:ring-1 focus:ring-[#4A622F]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#22201B] border border-white/[0.08] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:ring-1 focus:ring-[#4A622F]"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Sign In &amp; Enter Dashboard</span>
            </button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
            <div className="relative flex justify-center text-2xs"><span className="bg-[#1A1916] px-2 text-[#7A766E]">Or</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Continue with Google</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SIGN UP SUB-SCREEN (CREATE ACCOUNT)                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {stage === 'signup_modal' && (
        <div className="relative w-full max-w-sm bg-[#1A1916] border border-white/[0.1] rounded-3xl shadow-2xl p-6 sm:p-7 text-white space-y-5 animate-scale-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <button
              type="button"
              onClick={() => setStage('new_user_guide_prompt')}
              className="flex items-center gap-1.5 text-xs text-[#8E8A82] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h3 className="font-bold text-sm text-white">Create Cloud Account</h3>
            <div className="w-8" />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {authError}
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
              {authSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                value={authName}
                onChange={e => setAuthName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#22201B] border border-white/[0.08] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:ring-1 focus:ring-[#4A622F]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#22201B] border border-white/[0.08] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:ring-1 focus:ring-[#4A622F]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-2xs font-semibold text-[#8E8A82] uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#22201B] border border-white/[0.08] focus:border-[#4A622F] rounded-xl px-3.5 py-2.5 text-white placeholder-[#6E6A62] text-xs outline-none focus:ring-1 focus:ring-[#4A622F]"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Create Account &amp; Proceed</span>
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DEDICATED VISUAL GUIDE (SLIDES 1, 2, 3)                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {stage === 'guide_slides' && (
        <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1C1A17] to-[#131210] border border-white/[0.1] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] p-6 sm:p-8 text-white space-y-6 overflow-hidden animate-fade-in">
          
          {/* Top Bar with Step Indicators & Exit */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step === guideSlide
                        ? 'w-7 bg-[#A8E063]'
                        : step < guideSlide
                        ? 'w-3 bg-[#4A622F]'
                        : 'w-3 bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="text-2xs font-bold text-[#A8E063] uppercase tracking-wider ml-1">
                Guide · {guideSlide} of 3
              </span>
            </div>
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-xs text-[#8E8A82] hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <span>Skip Guide</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Slide 1: Real Accounts ── */}
          {guideSlide === 1 && (
            <div className="space-y-5 animate-fade-up">
              {/* Visual Card Mockup */}
              <div className="p-4 rounded-2xl bg-[#23201B] border border-white/[0.08] shadow-inner space-y-3">
                <div className="flex items-center justify-between text-xs text-[#A09C94]">
                  <span className="font-semibold text-white">Your Money Source</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4A622F]/30 text-[#A8E063] text-2xs font-bold uppercase">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#181613] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-[#4A622F]/30 text-[#A8E063] flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Primary Account</h4>
                    <p className="text-xs text-[#8E8A82]">Checking / Salary / Cash Wallet</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-sm font-extrabold text-white">₹50,000</span>
                  </div>
                </div>
              </div>

              {/* Slide Explanatory Text */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#A8E063]" />
                  <span>1. All budgeting starts with Accounts</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed">
                  Before organizing expenses, money lives in your real bank accounts, UPI wallets, or cash reserves. Richingness tracks your real balance so every rupee is accounted for.
                </p>
              </div>

              {/* Forward Navigation */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setGuideSlide(2)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#4A622F]/25 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>Next: How Categories Work</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Slide 2: 50/30/20 Envelopes ── */}
          {guideSlide === 2 && (
            <div className="space-y-5 animate-fade-up">
              {/* Visual Card Mockup */}
              <div className="p-4 rounded-2xl bg-[#23201B] border border-white/[0.08] shadow-inner space-y-2.5">
                <span className="text-xs font-semibold text-[#A09C94] block mb-1">Envelope Budgeting Distribution</span>
                
                {/* Needs 50% */}
                <div className="p-2.5 rounded-xl bg-[#181613] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="font-bold text-white">Needs (50%)</span>
                    <span className="text-2xs text-[#8E8A82]">Rent, bills, groceries</span>
                  </div>
                  <span className="font-bold text-[#10B981]">₹25,000</span>
                </div>

                {/* Wants 30% */}
                <div className="p-2.5 rounded-xl bg-[#181613] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                    <span className="font-bold text-white">Wants (30%)</span>
                    <span className="text-2xs text-[#8E8A82]">Dining, outings, shopping</span>
                  </div>
                  <span className="font-bold text-[#3B82F6]">₹15,000</span>
                </div>

                {/* Savings 20% */}
                <div className="p-2.5 rounded-xl bg-[#181613] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="font-bold text-white">Savings (20%)</span>
                    <span className="text-2xs text-[#8E8A82]">Emergency fund, growth</span>
                  </div>
                  <span className="font-bold text-[#8B5CF6]">₹10,000</span>
                </div>
              </div>

              {/* Slide Explanatory Text */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-[#A8E063]" />
                  <span>2. Assign each rupee a clear purpose</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed">
                  Instead of tracking where money went after it is gone, envelope budgeting gives every rupee a job in advance. You only spend what is inside the envelope!
                </p>
              </div>

              {/* Navigation */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setGuideSlide(1)}
                  className="px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs font-semibold text-white cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setGuideSlide(3)}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#4A622F]/25 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>Next: Spending &amp; Borrowing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Slide 3: Smart Borrowing ── */}
          {guideSlide === 3 && (
            <div className="space-y-5 animate-fade-up">
              {/* Visual Card Mockup */}
              <div className="p-4 rounded-2xl bg-[#23201B] border border-white/[0.08] shadow-inner space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Intelligent Rebalancing</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/40 text-[#A8E063] text-2xs font-bold uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#A8E063]" />
                    <span>Savings Protected</span>
                  </span>
                </div>
                
                <div className="p-3 rounded-xl bg-[#181613] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-2xs text-[#8E8A82] block">From Wants Pool</span>
                    <span className="font-bold text-red-400">- ₹1,500</span>
                  </div>
                  <div className="flex items-center gap-1 text-2xs text-[#A8E063] px-2 py-1 rounded bg-[#4A622F]/20">
                    <span>Borrow Flow</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xs text-[#8E8A82] block">To Needs Pool</span>
                    <span className="font-bold text-emerald-400">+ ₹1,500</span>
                  </div>
                </div>
              </div>

              {/* Slide Explanatory Text */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#A8E063]" />
                  <span>3. Overspent? Borrow without breaking savings</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed">
                  Life happens! When an expense exceeds an envelope, Richingness helps you borrow from flexible &apos;Wants&apos; before ever dipping into your emergency savings.
                </p>
              </div>

              {/* Finish Action */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setGuideSlide(2)}
                  className="px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs font-semibold text-white cursor-pointer transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4A622F] to-[#587437] hover:from-[#587437] hover:to-[#6B8D43] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-[#4A622F]/40 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#A8E063]" />
                  <span>Got it, Let&apos;s Enter Dashboard! 🚀</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
