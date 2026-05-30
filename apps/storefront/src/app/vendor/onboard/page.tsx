'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShieldCheck, Award, Heart, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/store';

export default function VendorOnboardPage() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Autofill wallet address if metamask is connected or mock
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: any) => {
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
        }
      });
    }
  }, []);

  if (!mounted) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ PREPARING REGISTRY PROTOCOL... ]
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-400 space-y-4">
        <p>[ YOU MUST ESTABLISH SECURE LINK FIRST ]</p>
        <Link href="/auth/login" className="text-primary underline">
          LOGIN NOW
        </Link>
      </div>
    );
  }

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name || !walletAddress) {
      setError('Please populate Name and Wallet address.');
      setLoading(false);
      return;
    }

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // 1. Insert into public.vendors
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          id: profile.id,
          name,
          slug,
          description: description || null,
          banner_url: bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
          logo_url: logoUrl || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=200',
          wallet_address: walletAddress,
          verified: false,
          xp: 1500, // Onboarding starter XP!
          level: 4
        });

      if (vendorError) throw vendorError;

      // 2. Update profiles.role to 'vendor'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 3. Award XP transaction
      await supabase.from('xp_transactions').insert({
        user_id: profile.id,
        amount: 1500,
        source: 'vendor_onboard',
        description: 'Provisioned as high-prestige vendor account. Welcome XP bonus unlocked!'
      });

      // Update local Zustand auth state
      setProfile({
        ...profile,
        role: 'vendor',
        xp: profile.xp + 1500,
        level: Math.floor(1 + Math.sqrt((profile.xp + 1500) / 100))
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Onboarding registration timed out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-xl mx-auto space-y-6 font-mono">
      <div className="text-center space-y-2">
        <span className="text-[10px] text-secondary tracking-widest uppercase block">[ VENDOR REGISTRY ]</span>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">ONBOARD PROTOCOL VENDOR</h1>
        <p className="text-[11px] text-gray-500 font-sans">
          Register your shop, receive Base USDC payments, and earn prestige vendor level points.
        </p>
      </div>

      {error && (
        <div className="bg-secondary/15 border border-secondary/35 rounded-xl p-4 text-xs text-secondary flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>[ REGISTRY TIMEOUT: {error.toUpperCase()} ]</span>
        </div>
      )}

      {success ? (
        <div className="bg-card border border-card-border p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-secondary animate-pulse" />
          
          <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/40 flex items-center justify-center mx-auto text-secondary shadow-neon-pink mb-2">
            ✓
          </div>
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/25 border border-secondary/50 text-[10px] text-secondary rounded-full uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> ONBOARD COMPLETE
          </span>

          <h2 className="text-xl font-black uppercase text-white tracking-tight">SHOP PROFILE PROVISIONED!</h2>
          <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-sm mx-auto">
            Welcome to the vendor registry, <span className="text-white font-bold">{name}</span>! A bonus of <span className="text-secondary font-bold">1,500 Vendor XP</span> has been logged to your ledger.
          </p>

          <div className="bg-gradient-to-r from-secondary/15 to-primary/15 border border-card-border p-4 rounded-xl flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-secondary animate-bounce" />
              <div>
                <span className="block text-xs font-bold text-white uppercase">+1,500 WELCOME BONUS XP</span>
                <span className="block text-[9px] text-gray-400 font-sans">You have scaled to Vendor Level 4.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border/60">
            <Link
              href="http://localhost:3001"
              target="_blank"
              className="w-full py-3 bg-gradient-to-r from-secondary to-secondary-light text-black font-black text-xs tracking-wider rounded-xl hover:shadow-neon-pink transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              LAUNCH VENDOR DASHBOARD
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleOnboard} className="bg-card border border-card-border p-6 rounded-3xl space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] text-gray-400">ORGANIZATION / SHOP NAME *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
              placeholder="CyberCore Tech"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] text-gray-400">SHOP DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans h-20 resize-none"
              placeholder="Premium metaverse hardware..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] text-gray-400">SETTLEMENT WALLET ADDRESS *</label>
            <input
              type="text"
              required
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
              placeholder="0x..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] text-gray-400">LOGO BRANDING URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
              placeholder="https://images.unsplash.com/photo..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] text-gray-400">BANNER BRANDING URL</label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-sans"
              placeholder="https://images.unsplash.com/photo..."
            />
          </div>

          <div className="flex items-center gap-2 bg-background/60 border border-card-border p-3.5 rounded-xl text-[10px] text-gray-400 font-sans">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <span>
              Onboarding grants you level-4 status directly and synchronizes your store with the global search directory.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-secondary to-secondary-light text-black font-black text-xs tracking-wider rounded-xl hover:shadow-neon-pink transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40"
          >
            {loading ? 'ONBOARDING BRAND...' : 'INITIALIZE PROTOCOL'}
          </button>
        </form>
      )}
    </div>
  );
}

// Inline fallback Link helper if next/link imports aren't loaded correctly
function Link({ href, children, ...props }: any) {
  return <a href={href} {...props}>{children}</a>;
}
