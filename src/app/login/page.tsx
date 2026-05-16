"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); } 
    else { router.push('/dashboard'); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); } 
    else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(loginError.message); setLoading(false); } 
      else { router.push('/dashboard'); }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setError(error.message); } 
    else { setResetMessage('Reset link sent! Check your email.'); }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg p-6">
      <div className="absolute top-0 -left-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-3xl font-black text-white shadow-xl shadow-primary/20">✓</div>
          <h2 className="text-3xl font-black text-white">Welcome Back</h2>
          <p className="text-zinc-400">Manage your premium tasks with ease</p>
        </div>

        {error && <div className="rounded-2xl bg-rose-500/10 p-4 text-center text-sm font-bold text-rose-500 border border-rose-500/20">{error}</div>}

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none focus:border-primary/50" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
              <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-bold text-primary hover:underline">Forgot Password?</button>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none focus:border-primary/50" />
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={handleLogin} disabled={loading} className="flex-1 rounded-2xl bg-primary py-4 font-black text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50">Login</button>
            <button onClick={handleSignUp} disabled={loading} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50">Register</button>
          </div>
        </form>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">← Back to Home</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-zinc-900 p-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Reset Password</h3>
              <button onClick={() => { setIsForgotModalOpen(false); setResetMessage(null); }} className="text-zinc-500 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <p className="text-sm text-zinc-400">Enter your email and we'll send you a link to reset your password.</p>
            {resetMessage ? (
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-center text-emerald-500 border border-emerald-500/20">{resetMessage}</div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full rounded-2xl border border-white/5 bg-white/10 p-4 text-white outline-none focus:border-primary/50" />
                <button disabled={loading} className="w-full rounded-2xl bg-primary py-4 font-black text-white shadow-lg disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
