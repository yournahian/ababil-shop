'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

import { useAuthStore } from '../../../lib/store';

function AbabilLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/shop';
  const { profile } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically redirect if already logged in
  useEffect(() => {
    if (profile) {
      router.push(redirect);
      router.refresh();
    }
  }, [profile, router, redirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured) {
      setError('Supabase environment variables are missing or misconfigured. Please verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly configured (with https://) in your Vercel project settings.');
      setLoading(false);
      return;
    }

    try {
      console.log('[Login] Starting signInWithPassword...');

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      console.log('[Login] signInWithPassword returned. Error:', authError);

      if (authError) throw authError;

      // Auth confirmed working (HTTP 200). Navigate without router.refresh() —
      // calling both push() + refresh() together cancels the navigation.
      // The Navbar's onAuthStateChange handles profile state, and the
      // middleware reads the new session cookie on the next request.
      console.log('[Login] Success — navigating to:', redirect);
      router.push(redirect);
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err.message || 'Failed to authenticate user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto space-y-6 font-mono">
      <div className="text-center space-y-2">
        <span className="text-[10px] text-primary tracking-widest uppercase block">[ AUTH SECURE ACCESS ]</span>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">LOG INTO PROFILE</h1>
        <p className="text-[11px] text-gray-500 font-sans">
          Access your Web3 shopping ledger and unlock accumulated XP assets.
        </p>
      </div>

      {error && (
        <div className="bg-secondary/15 border border-secondary/35 rounded-xl p-4 text-xs text-secondary flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>[ ACCESS DENIED: {error.toUpperCase()} ]</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="bg-card border border-card-border p-6 rounded-3xl space-y-4">
        <div className="space-y-2">
          <label className="text-[9px] text-gray-400">SECURE USER EMAIL</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
              placeholder="buyer@ababilpay.xyz"
            />
            <Mail className="w-4 h-4 text-gray-600 absolute left-3.5 top-3" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] text-gray-400">ACCESS KEY PASSWORD</label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
              placeholder="••••••••••••"
            />
            <Lock className="w-4 h-4 text-gray-600 absolute left-3.5 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold text-xs tracking-wider rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40"
        >
          {loading ? 'AUTHENTICATING CORRIDOR...' : 'ESTABLISH LINK'}
        </button>

        <div className="text-center text-[10px] text-gray-500 font-sans pt-2">
          New customer?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-mono">
            SIGN UP NOW
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ SECURING CORRIDOR LINK... ]
      </div>
    }>
      <AbabilLoginForm />
    </Suspense>
  );
}
