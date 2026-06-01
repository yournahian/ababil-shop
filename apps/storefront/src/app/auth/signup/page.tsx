'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, ShieldAlert, Award } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

import { useAuthStore } from '../../../lib/store';

export default function SignupPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Automatically redirect if user gets logged in (e.g. after successful signup when email confirmation is disabled)
  useEffect(() => {
    if (profile) {
      router.push('/shop');
    }
  }, [profile, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured) {
      setError('Supabase environment variables are missing or misconfigured. Please verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly configured (with https://) in your Vercel project settings.');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize account profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto space-y-6 font-mono">
      <div className="text-center space-y-2">
        <span className="text-[10px] text-primary tracking-widest uppercase block">[ ACCOUNT CREATION ]</span>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">CREATE BUYER ACCOUNT</h1>
        <p className="text-[11px] text-gray-500 font-sans">
          Register on the e-commerce marketplace. Claim <span className="text-secondary font-bold">+50 XP Welcome bonus</span>.
        </p>
      </div>

      {error && (
        <div className="bg-secondary/15 border border-secondary/35 rounded-xl p-4 text-xs text-secondary flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>[ REGISTRY REJECTED: {error.toUpperCase()} ]</span>
        </div>
      )}

      {success ? (
        <div className="bg-card border border-card-border p-6 rounded-3xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center mx-auto text-primary shadow-neon-cyan">
            ✓
          </div>
          <h2 className="font-bold text-white text-sm uppercase">[ CREATION COMPLETE ]</h2>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            A secure authentication link has been sent to <span className="text-white font-bold">{email}</span>. Please authorize the email token, then proceed to sign in.
          </p>
          <div className="pt-2 border-t border-card-border/60">
            <Link href="/auth/login" className="text-xs text-primary underline">
              GO TO LOGIN
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="bg-card border border-card-border p-6 rounded-3xl space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] text-gray-400">LEGAL USER SIGNATURE</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
                placeholder="Alex Buyer"
              />
              <User className="w-4 h-4 text-gray-600 absolute left-3.5 top-3" />
            </div>
          </div>

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

          <div className="flex items-center gap-2 bg-background/60 border border-card-border p-3.5 rounded-xl text-[10px] text-gray-400 font-sans">
            <Award className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
            <span>
              By signing up, you authorize the database triggers to create a level-1 profile. Claim XP on confirmation!
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-black text-xs tracking-wider rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>

          <div className="text-center text-[10px] text-gray-500 font-sans pt-2">
            Already have an active account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-mono">
              LOG IN NOW
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
