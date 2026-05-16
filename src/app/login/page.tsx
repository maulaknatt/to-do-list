"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Automatically login after signup
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
        setError(loginError.message);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg p-6">
      <div className="absolute top-0 -left-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-3xl font-black text-white shadow-xl shadow-primary/20">
            ✓
          </div>
          <h2 className="text-3xl font-black text-white">Welcome Back</h2>
          <p className="text-zinc-400">Login to manage your premium tasks</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-500/10 p-4 text-center text-sm font-bold text-rose-500 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-primary py-4 font-black text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
            <button 
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Register
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
