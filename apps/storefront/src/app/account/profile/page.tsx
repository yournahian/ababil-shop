'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Award, Shield, Trophy, History, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/store';
import { XpTransaction } from '@ababil/types';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchXpHistory = async () => {
      try {
        let user = null;

        // 1. Check Zustand store first
        if (profile) {
          user = { id: profile.id };
        } else {
          // 2. Check getSession
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            user = session.user;
          } else {
            // 3. Fallback to getUser
            const { data: { user: authUser } } = await supabase.auth.getUser();
            user = authUser;
          }
        }

        // 4. If still null, wait a tiny bit for Supabase client-side hydration restore tick
        if (!user) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession?.user) {
            user = retrySession.user;
          } else {
            const { data: { user: retryUser } } = await supabase.auth.getUser();
            user = retryUser;
          }
        }

        if (!user) {
          router.push('/auth/login?redirect=/account/profile');
          return;
        }

        // Fetch profile directly to avoid race conditions
        const { data: profileResult } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileResult) {
          const formattedProfile = {
            id: profileResult.id,
            username: profileResult.username,
            email: profileResult.email,
            fullName: profileResult.full_name,
            avatarUrl: profileResult.avatar_url,
            walletAddress: profileResult.wallet_address,
            xp: profileResult.xp,
            level: profileResult.level,
            role: profileResult.role,
            createdAt: profileResult.created_at,
            updatedAt: profileResult.updated_at,
          };
          setProfileData(formattedProfile);
          setProfile(formattedProfile);
        }

        const { data } = await supabase
          .from('xp_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setTransactions(data);
        }

        // Fetch user order settlement history securely from API
        const ordRes = await fetch(`/api/checkout/list-orders?userId=${user.id}`);
        const ordData = await ordRes.json();
        if (ordData && ordData.success && ordData.orders) {
          setOrders(ordData.orders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchXpHistory();
  }, [router, setProfile]);

  const activeProfile = profile || profileData;

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ SYNCHRONIZING PROFILE Telemetry... ]
      </div>
    );
  }

  if (!activeProfile) return null;

  return (
    <div className="py-6 space-y-8 max-w-4xl mx-auto font-mono">
      <div className="space-y-2">
        <span className="text-[10px] text-primary tracking-widest uppercase block">[ ACCOUNT PROFILE ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">YOUR PROFILE METRICS</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* STATS OVERVIEW PANEL */}
        <div className="bg-card border border-card-border p-6 rounded-3xl space-y-6 md:col-span-1 h-fit">
          <div className="text-center space-y-3">
            {activeProfile.avatarUrl ? (
              <img src={activeProfile.avatarUrl} alt="avatar" className="w-20 h-20 rounded-2xl mx-auto object-cover border border-card-border shadow-2xl" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-card-border flex items-center justify-center font-black text-2xl text-primary mx-auto">
                {activeProfile.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 className="font-extrabold text-white text-sm uppercase">{activeProfile.fullName || 'Anonymous User'}</h2>
              <span className="text-[10px] text-gray-500">@{activeProfile.username}</span>
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] text-primary uppercase font-bold">
              {activeProfile.role.toUpperCase()} ACCOUNT
            </span>
          </div>

          <div className="border-t border-card-border/60 pt-4 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">XP LEDGER:</span>
              <span className="text-primary font-bold">{activeProfile.xp} XP</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">LEVEL RATIO:</span>
              <span className="text-white font-bold">LVL {activeProfile.level}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Prestige Badge:</span>
              <span className="text-secondary font-bold">GOLD BUYER</span>
            </div>
          </div>
        </div>

        {/* DETAILS/LOGS PANELS */}
        <div className="md:col-span-2 space-y-8">
          {/* ORDER HISTORY PANEL */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-card-border pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> [ ORDER SETTLEMENT LOG ]
            </h2>

            {orders.length === 0 ? (
              <div className="bg-card/20 border border-dashed border-card-border rounded-2xl p-8 text-center text-xs text-gray-500">
                NO ORDERS RECORDED IN YOUR SECURE SETTLEMENT LOG.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div key={ord.id} className="bg-card border border-card-border p-4 rounded-xl flex items-center justify-between hover:border-primary/20 transition-all">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase">ORDER #{ord.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${
                          ord.payment_status === 'paid'
                            ? 'bg-primary/10 border border-primary/20 text-primary'
                            : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                        }`}>
                          {ord.payment_status === 'paid' ? 'SETTLED' : 'PENDING'}
                        </span>
                      </div>
                      <span className="block text-[8px] text-gray-500 uppercase font-mono">
                        Cleared: {new Date(ord.created_at).toLocaleDateString()} • {ord.delivery_engine_status === 'delivered' ? 'DELIVERED' : 'IN PROGRESS'}
                      </span>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <span className="block font-mono text-xs font-black text-secondary text-glow-pink">
                        {parseFloat(ord.total_amount).toFixed(2)} USDC
                      </span>
                      <Link
                        href={ord.payment_status === 'paid' ? `/orders/${ord.id}` : `/checkout/success?orderId=${ord.id}`}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary text-primary rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 whitespace-nowrap"
                      >
                        {ord.payment_status === 'paid' ? 'TRACK COURIER' : 'COMPLETE PAY'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TRANSACTIONS HISTORY PANEL */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-card-border pb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> [ XP HISTORY LEDGER ]
            </h2>

            {transactions.length === 0 ? (
              <div className="bg-card/20 border border-dashed border-card-border rounded-2xl p-8 text-center text-xs text-gray-500">
                NO XP TRANSACTIONS RECORDED IN THE CURRENT LEVEL.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-card border border-card-border p-4 rounded-xl flex items-center justify-between hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-white uppercase">{tx.description || 'XP Reward'}</span>
                      <span className="block text-[8px] text-gray-500 uppercase font-mono">
                        Source: {tx.source} • {new Date(tx.created_at || (tx as any).createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-black text-primary">
                        +{tx.amount} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
