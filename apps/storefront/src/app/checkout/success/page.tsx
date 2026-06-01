'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Trophy, Sparkles, Navigation, Flame, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Order } from '@ababil/types';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const simulated = searchParams.get('simulated') === 'true';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed'>('pending');

  useEffect(() => {
    if (!orderId) {
      router.push('/shop');
      return;
    }

    // 1. Fetch Order and Start Polling
    const checkOrder = async () => {
      try {
        const res = await fetch(`/api/checkout/status?orderId=${orderId}`);
        const data = await res.json();

        if (data && data.success && data.order) {
          const ord = data.order;
          setOrder(ord);
          setStatus(ord.paymentStatus);

          if (ord.paymentStatus === 'paid') {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
      }
    };

    checkOrder();
    
    if (status !== 'pending') {
      setLoading(false);
      return;
    }

    // Poll every 2 seconds if status is still pending
    const pollInterval = setInterval(() => {
      checkOrder();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [orderId, status, router]);

  // Dev-friendly helper to manually simulate payment success
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleSettleOrder = async (action: 'simulate' | 'verify') => {
    if (!orderId) return;
    setActionLoading(true);
    setActionError('');

    try {
      const intentIdParam = searchParams.get('intentId');
      const res = await fetch('/api/checkout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          action,
          intentId: intentIdParam || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to ${action} payment.`);
      }

      setStatus('paid');
      setLoading(false);
    } catch (err: any) {
      console.error(`Failed to ${action} checkout success:`, err);
      setActionError(err.message || `Failed to execute ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const intentIdParam = searchParams.get('intentId');

  useEffect(() => {
    if (status === 'pending' && intentIdParam && !actionLoading && !actionError) {
      if (intentIdParam.startsWith('sim_intent_')) {
        handleSettleOrder('simulate');
      } else {
        handleSettleOrder('verify');
      }
    }
  }, [status, intentIdParam, actionLoading, actionError]);

  return (
    <div className="py-12 max-w-xl mx-auto text-center space-y-8 font-mono">
      {status === 'pending' ? (
        // SCANNING PROTOCOL VIEW
        <div className="bg-card border border-card-border p-8 md:p-12 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-primary border-t-transparent animate-spin mx-auto flex items-center justify-center shadow-neon-cyan mb-2" />
          
          <span className="block text-[9px] tracking-widest text-primary font-bold">[ SCANNING BLOCKCHAIN PROTOCOL ]</span>
          <h2 className="text-xl font-bold uppercase text-white tracking-tight leading-relaxed">
            Awaiting Ledger Settlement...
          </h2>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            We are listening for the AbabilPay Hybrid payment confirmations on the Base Sepolia network. This usually resolves under 10 seconds.
          </p>

          <div className="bg-background/80 border border-card-border/80 p-4 rounded-xl text-left space-y-1 text-[10px] text-gray-500">
            <div>ORDER ID: <span className="text-white">{orderId}</span></div>
            {order?.paymentIntentId && (
              <div>INTENT ID: <span className="text-white">{order.paymentIntentId}</span></div>
            )}
            <div>CHAIN SYSTEM: <span className="text-primary font-bold">BASE-SEPOLIA</span></div>
          </div>

          {/* SIMULATE / VERIFY SUCCESS CTA FOR TESTNET FAUCET / LOCAL ENV */}
          <div className="pt-4 border-t border-card-border/60 space-y-3">
            <span className="block text-[8px] text-gray-500 font-sans">
              Local sandbox testing environment detected. Sync real testnet payments or bypass:
            </span>

            {actionError && (
              <div className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/50 p-2 rounded text-left">
                ⚠️ [ERROR] {actionError.toUpperCase()}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSettleOrder('verify')}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary text-primary rounded-lg text-[10px] tracking-widest font-bold uppercase transition-all duration-300 w-full disabled:opacity-50"
              >
                {actionLoading ? 'Verifying transaction...' : '✓ VERIFY REAL ON-CHAIN PAYMENT'}
              </button>
              
              <button
                onClick={() => handleSettleOrder('simulate')}
                disabled={actionLoading}
                className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 hover:border-secondary text-secondary rounded-lg text-[9px] tracking-widest uppercase transition-all duration-300 w-full disabled:opacity-50"
              >
                {actionLoading ? 'Simulating...' : 'SIMULATE BLOCKCHAIN SETTLEMENT SUCCESS'}
              </button>
            </div>
          </div>
        </div>
      ) : status === 'paid' ? (
        // TRANSACTION CONFIRMED SUCCESS VIEW
        <div className="bg-card border border-card-border p-8 md:p-12 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />
          
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center mx-auto text-primary shadow-neon-cyan mb-2">
            <CheckCircle2 className="w-8 h-8 text-primary animate-bounce" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/25 border border-primary/50 text-[10px] text-primary rounded-full uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> SETTLEMENT SUCCESSFUL
          </span>

          <h2 className="text-2xl font-black uppercase text-white tracking-tight leading-relaxed">
            ASSET CLEARANCE COMPLETE!
          </h2>

          <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-sm mx-auto">
            Order <span className="text-white">#{orderId?.slice(0, 8)}</span> has been confirmed on the ledger ledger. The simulated delivery engine has dispatched your assets!
          </p>

          {/* XP Achievements Block */}
          {order?.xpEarned && (
            <div className="bg-gradient-to-r from-primary/15 to-secondary/15 border border-card-border p-4 rounded-xl flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
                <div>
                  <span className="block text-xs font-bold text-white uppercase">+{order.xpEarned} SHOPPING XP!</span>
                  <span className="block text-[9px] text-gray-400 font-sans">Level metrics recalculated in database.</span>
                </div>
              </div>
              <Flame className="w-5 h-5 text-secondary animate-bounce" />
            </div>
          )}

          <div className="bg-background/85 border border-card-border p-4 rounded-xl text-left text-[10px] text-gray-400 space-y-1">
            <div>TX LEDGER HASH: <span className="text-white break-all text-[9px]">{order?.paymentTxHash || '0x45aef982...'}</span></div>
            <div>SHIPPING DESTINATION: <span className="text-white">{(order?.shippingAddress as any)?.addressLine1}, {(order?.shippingAddress as any)?.city}</span></div>
            <div>STATUS: <span className="text-primary font-bold uppercase">OUT FOR DELIVERY</span></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 font-mono text-[10px] tracking-wider uppercase">
            <Link
              href={`/orders/${orderId}`}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              TRACK LIVE COURIER
            </Link>
            <Link
              href="/shop"
              className="flex-1 py-3 bg-card border border-card-border hover:border-primary/40 text-gray-300 hover:text-primary rounded-xl transition-all duration-300"
            >
              [ BROWSE CATALOG ]
            </Link>
          </div>
        </div>
      ) : (
        // ERROR STATE VIEW
        <div className="bg-card border border-card-border p-8 md:p-12 rounded-3xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-secondary/15 border border-secondary/40 flex items-center justify-center mx-auto text-secondary shadow-neon-pink">
            X
          </div>
          <span className="block text-[9px] tracking-widest text-secondary font-bold">[ SETTLEMENT CRITICAL FAIL ]</span>
          <h2 className="text-xl font-bold uppercase text-white tracking-tight leading-relaxed">
            Payment Intent Failed
          </h2>
          <p className="text-xs text-gray-400 font-sans">
            The transaction signatures were rejected or timed out on-chain. Please verify testnet gas resources and try again.
          </p>
          <div className="pt-4 border-t border-card-border/60">
            <Link href="/cart" className="text-xs text-primary underline">
              RETURN TO SHOPPING BAG
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ LOADING TRANSACTION TELEMETRY... ]
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
