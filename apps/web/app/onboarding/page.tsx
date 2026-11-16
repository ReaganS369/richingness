'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building,
  Coins,
  CreditCard,
  PieChart
} from 'lucide-react';
import { useAppStore } from '../store';
import { formatRupeesToPaise } from '@repo/shared';

const PRESET_ACCOUNTS = [
  { name: 'HDFC Bank', type: 'savings' as const, icon: Building },
  { name: 'State Bank of India', type: 'savings' as const, icon: Building },
  { name: 'ICICI Bank', type: 'savings' as const, icon: Building },
  { name: 'Cash Wallet', type: 'cash' as const, icon: Coins },
  { name: 'Salary Checking', type: 'checking' as const, icon: CreditCard }
];

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000];

export default function OnboardingPage() {
  const router = useRouter();
  const accounts = useAppStore(state => state.accounts);
  const addAccount = useAppStore(state => state.addAccount);
  const addTransaction = useAppStore(state => state.addTransaction);
  const initAuth = useAppStore(state => state.initAuth);

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account Setup Form
  const [acctName, setAcctName] = useState('HDFC Bank');
  const [acctType, setAcctType] = useState<'checking' | 'savings' | 'cash' | 'investment'>('savings');
  const [createdAccountId, setCreatedAccountId] = useState<string>('');

  // Step 2: Initial Funds & Allocation Form
  const [fundsAmount, setFundsAmount] = useState('10000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // If user already has accounts, select the existing one or proceed to step 2
  useEffect(() => {
    if (accounts.length > 0 && !createdAccountId) {
      setCreatedAccountId(accounts[0].id);
      setAcctName(accounts[0].name);
    }
  }, [accounts, createdAccountId]);

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('richingness_onboarding_completed', 'true');
    }
    router.push('/');
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acctName.trim()) return;

    if (accounts.length === 0) {
      await addAccount(acctName.trim(), acctType, 'INR');
    }
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundsAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsSubmitting(true);
    try {
      const targetAcc = accounts[0];
      const targetAccId = createdAccountId || (targetAcc ? targetAcc.id : '');

      if (targetAccId) {
        await addTransaction(
          targetAccId,
          'INCOME',
          formatRupeesToPaise(fundsAmount),
          'INR',
          'cat-default-buffer',
          'Opening Balance'
        );
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('richingness_onboarding_completed', 'true');
      }

      router.push('/');
    } catch (err) {
      console.error('Failed to fund account during onboarding:', err);
      setIsSubmitting(false);
    }
  };

  const parsedAmount = Math.max(0, parseFloat(fundsAmount) || 0);
  const needsAmount = Math.round(parsedAmount * 0.5);
  const wantsAmount = Math.round(parsedAmount * 0.3);
  const savingsAmount = Math.round(parsedAmount * 0.2);

  return (
    <div
      className="fixed inset-0 h-full w-full overflow-y-auto overflow-x-hidden bg-[#141310] text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* ── Top Navigation Bar ── */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-2 border-b border-[#26241E]/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4A622F] border border-[#64853E] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4 text-[#A8E063]" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">
              Richingness
            </span>
            <span className="text-[10px] text-[#8E8A82] uppercase tracking-wider font-semibold">
              New User Setup &amp; Tutorial
            </span>
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-[#8E8A82] hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
        >
          Skip Tutorial
        </button>
      </header>

      {/* ── Main Content Stepper Card ── */}
      <main className="max-w-xl mx-auto w-full py-4 sm:py-8 shrink-0">
        {/* Stepper Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#8E8A82] mb-2 px-1">
            <span className={step === 1 ? 'text-[#A8E063]' : 'text-white'}>
              Step 1: Money Account
            </span>
            <span className={step === 2 ? 'text-[#A8E063]' : 'text-[#8E8A82]'}>
              Step 2: Initial Funds &amp; Categories
            </span>
          </div>
          <div className="w-full bg-[#24211A] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#4A622F] h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* ── STEP 1: CREATE ACCOUNT ── */}
        {step === 1 && (
          <div className="bg-[#1C1A16] border border-[#2D2A24] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4A622F]/20 border border-[#587437]/40 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
                Step 1 of 2
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Where does your money live?
              </h1>
              <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed">
                In Richingness, every rupee comes from an Account (Bank, UPI Wallet, or Cash). Let’s set up your primary money source.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-2xs font-bold text-[#8E8A82] uppercase tracking-wider">
                Popular Bank / Wallet Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_ACCOUNTS.map(preset => {
                  const Icon = preset.icon;
                  const isSelected = acctName === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setAcctName(preset.name);
                        setAcctType(preset.type);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#4A622F]/30 border-[#A8E063] text-white shadow-md'
                          : 'bg-[#22201B] border-[#302C24] text-[#A09C94] hover:text-white hover:border-[#403B30]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#A8E063]' : 'text-[#8E8A82]'}`} />
                      <span className="text-xs font-semibold truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleStep1Submit} className="space-y-4 pt-1">
              <div>
                <label className="block text-2xs font-bold text-[#8E8A82] uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={acctName}
                    onChange={e => setAcctName(e.target.value)}
                    placeholder="e.g. HDFC Salary, SBI, Cash Wallet"
                    className="w-full bg-[#24211B] border border-[#332F26] focus:border-[#4A622F] rounded-xl px-4 py-3 text-sm text-white placeholder-[#8E8A82] outline-none transition-all"
                  />
                  <Wallet className="w-4 h-4 text-[#8E8A82] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8A82] uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={acctType}
                    onChange={e => setAcctType(e.target.value as typeof acctType)}
                    className="w-full bg-[#24211B] border border-[#332F26] focus:border-[#4A622F] rounded-xl px-3 py-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="checking">Checking / Current</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="investment">Investment / Trading</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8A82] uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <div className="w-full bg-[#24211B]/60 border border-[#332F26] rounded-xl px-4 py-3 text-sm text-white/80 font-mono">
                    INR (₹)
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] text-white text-sm font-bold shadow-lg shadow-[#4A622F]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 2: ADD FUNDS & CATEGORY TUTORIAL ── */}
        {step === 2 && (
          <div className="bg-[#1C1A16] border border-[#2D2A24] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4A622F]/20 border border-[#587437]/40 text-[#A8E063] text-2xs font-bold uppercase tracking-wider">
                Step 2 of 2
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Fund Your Account &amp; Understand Categories
              </h1>
              <p className="text-xs sm:text-sm text-[#A09C94] leading-relaxed">
                Deposit your opening balance or monthly salary into <strong className="text-white">{acctName}</strong>. See how Richingness divides it into envelopes.
              </p>
            </div>

            {/* Deposit Input */}
            <div className="space-y-2">
              <label className="block text-2xs font-bold text-[#8E8A82] uppercase tracking-wider">
                Deposit Amount (₹)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fundsAmount}
                  onChange={e => setFundsAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full bg-[#24211B] border border-[#332F26] focus:border-[#4A622F] rounded-xl px-4 py-3 text-lg font-mono font-bold text-white placeholder-[#8E8A82] outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A8E063]">
                  INR (₹)
                </span>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {PRESET_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFundsAmount(amt.toString())}
                    className="px-2.5 py-1 rounded-lg bg-[#24211B] border border-[#332F26] hover:border-[#4A622F] text-2xs font-semibold text-[#A09C94] hover:text-white transition-all cursor-pointer"
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* ── LIVE ENVELOPE / CATEGORY EXPLANATION ── */}
            <div className="bg-[#221F1A] border border-[#302C23] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-[#A8E063]" />
                  <span>The 50/30/20 Digital Envelope Rule</span>
                </span>
                <span className="text-[#A8E063] font-mono">
                  Total: ₹{parsedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-[#A09C94] leading-relaxed">
                Why Categories? Instead of one giant account balance where you guess if you have enough for rent, Richingness divides your money into dedicated envelopes:
              </p>

              {/* Visual 3-Column Split */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-[#171E14] border border-[#2E4522] rounded-lg p-2.5">
                  <span className="text-2xs text-[#A8E063] font-bold uppercase block">Needs 50%</span>
                  <p className="text-sm font-extrabold text-white mt-0.5 font-mono">
                    ₹{needsAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-[#8E8A82] mt-0.5">Rent, Bills, Food</p>
                </div>

                <div className="bg-[#1E1C12] border border-[#483B1E] rounded-lg p-2.5">
                  <span className="text-2xs text-[#E5A93C] font-bold uppercase block">Wants 30%</span>
                  <p className="text-sm font-extrabold text-white mt-0.5 font-mono">
                    ₹{wantsAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-[#8E8A82] mt-0.5">Dining, Hobbies</p>
                </div>

                <div className="bg-[#131922] border border-[#23354C] rounded-lg p-2.5">
                  <span className="text-2xs text-[#5B9DF8] font-bold uppercase block">Savings 20%</span>
                  <p className="text-sm font-extrabold text-white mt-0.5 font-mono">
                    ₹{savingsAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-[#8E8A82] mt-0.5">Investments, Goals</p>
                </div>
              </div>

              {/* Zero-Deficit Safeguard Note */}
              <div className="flex items-start gap-2 bg-[#1A1813] border border-[#302A1E] rounded-lg p-2.5 mt-2">
                <ShieldCheck className="w-4 h-4 text-[#A8E063] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#A09C94] leading-relaxed">
                  <strong>Zero-Deficit Protection:</strong> You spend straight from each envelope. If an envelope is empty, Richingness prompts you to borrow from another envelope before spending!
                </p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-[#332F26] text-xs font-bold text-[#A09C94] hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Submit}
                disabled={isSubmitting || parsedAmount <= 0}
                className="flex-1 py-3.5 rounded-xl bg-[#4A622F] hover:bg-[#587437] disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-[#4A622F]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Finalizing Setup…' : 'Enter Dashboard 🚀'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-2xs text-[#666] shrink-0">
        Richingness Financial Operating System · Bank-Grade Privacy &amp; Zero-Deficit Envelope Budgeting
      </footer>
    </div>
  );
}
