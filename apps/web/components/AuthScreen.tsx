'use client';

import React, { useState } from 'react';
import { Shield, Sparkles, Zap, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { authService } from '../app/store';

type AuthMode = 'signin' | 'signup' | 'forgot_password' | 'check_email';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      await authService.signInWithOAuth('google', redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        await authService.signUp(email, password, name || undefined);
        setMode('check_email');
      } else if (mode === 'signin') {
        await authService.signIn(email, password);
        // store's onAuthStateChange will handle the rest
      } else if (mode === 'forgot_password') {
        const redirectTo = `${window.location.origin}/auth/update-password`;
        await authService.resetPasswordForEmail(email, redirectTo);
        setMode('check_email');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-surfaceRaised border border-border focus:border-primary rounded-xl px-4 py-3 text-textPrimary placeholder-textMuted outline-none transition-all duration-150 text-sm focus-ring";

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-success/6 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-glow-lg animate-glow-pulse">
              <span className="font-display font-black text-2xl text-white">R</span>
            </div>
            <div className="absolute -inset-1.5 rounded-2xl border border-primary/30 animate-pulse-ring pointer-events-none" />
          </div>
          <h1 className="font-display font-black text-3xl text-gradient-primary tracking-tight">Richingness</h1>
          <p className="text-textSecondary text-sm mt-1.5">Financial Operating System</p>
        </div>

        {/* Card */}
        <div className="glass-heavy rounded-2xl border border-border shadow-2xl p-8">
          
          {mode === 'check_email' ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-display font-bold text-xl text-textPrimary">Check your email</h2>
              <p className="text-textSecondary text-sm">
                We've sent a link to {email}. Please check your inbox and spam folder.
              </p>
              <button
                onClick={() => setMode('signin')}
                className="text-primary text-sm hover:underline mt-4 inline-block"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-2">
                {mode !== 'signin' && (
                  <button onClick={() => setMode('signin')} className="text-textMuted hover:text-textPrimary transition-colors p-1">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="font-display font-bold text-xl text-textPrimary">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                </h2>
              </div>
              
              <p className="text-textSecondary text-sm mb-6">
                {mode === 'signin' ? 'Sign in to your workspace' : mode === 'signup' ? 'Join Richingness today' : 'Enter your email to receive a reset link'}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-semibold text-textSecondary uppercase tracking-widest">Display Name</label>
                    <input
                      type="text" value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-2xs font-semibold text-textSecondary uppercase tracking-widest">Email Address</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@richingness.com"
                    className={inputCls}
                  />
                </div>

                {mode !== 'forgot_password' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-2xs font-semibold text-textSecondary uppercase tracking-widest">Password</label>
                      {mode === 'signin' && (
                        <button type="button" onClick={() => setMode('forgot_password')} className="text-2xs text-primary hover:underline">
                          Forgot?
                        </button>
                      )}
                    </div>
                    <input
                      type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primaryLight text-white font-semibold py-3 rounded-xl transition-all shadow-glow hover:shadow-glow-lg text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'forgot_password' ? <Mail className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
                </button>
              </form>

              {mode !== 'forgot_password' && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-surface px-2 text-textMuted">Or continue with</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-surfaceRaised hover:bg-surfaceHover border border-border text-textPrimary font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>
                </>
              )}

              {mode === 'signin' && (
                <div className="mt-6 text-center text-sm text-textSecondary">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                    Sign up
                  </button>
                </div>
              )}
              {mode === 'signup' && (
                <div className="mt-6 text-center text-sm text-textSecondary">
                  Already have an account?{' '}
                  <button onClick={() => setMode('signin')} className="text-primary hover:underline font-medium">
                    Sign in
                  </button>
                </div>
              )}
            </>
          )}

          {/* Trust signals */}
          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-border/50">
            {[
              { icon: Shield, label: 'End-to-end encrypted' },
              { icon: Sparkles, label: 'Offline-first' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-2xs text-textMuted">
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-2xs text-textMuted mt-6">
          Richingness Platform · v2.0 · Phase 2.5
        </p>
      </div>
    </div>
  );
}
