"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      // Sign out to clear the temporary reset session
      await supabase.auth.signOut();
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-3xl font-black">✓</div>
          <h2 className="text-3xl font-black text-white">New Password</h2>
          <p className="text-zinc-400">Set your new premium password</p>
        </div>

        {error && <div className="rounded-2xl bg-rose-500/10 p-4 text-center text-rose-500 border border-rose-500/20">{error}</div>}
        {message && <div className="rounded-2xl bg-emerald-500/10 p-4 text-center text-emerald-500 border border-emerald-500/20">{message}</div>}

        {!message && (
          <form onSubmit={handleReset} className="space-y-6">
            <input 
              type="password" required placeholder="New Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-white outline-none focus:border-primary/50"
            />
            <button disabled={loading} className="w-full rounded-2xl bg-primary py-4 font-black text-white shadow-lg disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="hover:text-white transition-colors">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
