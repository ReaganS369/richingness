'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, KeyRound } from 'lucide-react';
import { authService } from '../../store';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Optional: check if there's actually an active session or a recovery token
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.updatePassword(password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-surfaceRaised border border-border focus:border-primary rounded-xl px-4 py-3 text-textPrimary placeholder-textMuted outline-none transition-all duration-150 text-sm focus-ring";

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-success/6 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="glass-heavy rounded-2xl border border-border shadow-2xl p-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl text-textPrimary text-center mb-1">Set New Password</h2>
          <p className="text-textSecondary text-sm text-center mb-6">Enter your new secure password</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-2xs font-semibold text-textSecondary uppercase tracking-widest">New Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 6}
              className="w-full bg-primary hover:bg-primaryLight text-white font-semibold py-3 rounded-xl transition-all shadow-glow hover:shadow-glow-lg text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
