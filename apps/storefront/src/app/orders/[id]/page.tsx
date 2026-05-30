'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Navigation, Award, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Order, DeliveryJob } from '@ababil/types';

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<DeliveryJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderAndDelivery = async () => {
    try {
      const res = await fetch(`/api/checkout/status?orderId=${orderId}`);
      const data = await res.json();

      if (data && data.success) {
        if (data.order) {
          setOrder(data.order);
        }
        if (data.delivery) {
          setDelivery(data.delivery);
        }
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndDelivery();

    if (delivery?.status === 'delivered') {
      return;
    }

    // Poll every 3 seconds to auto-update radar coordinates
    const trackingInterval = setInterval(() => {
      fetchOrderAndDelivery();
    }, 3000);

    return () => clearInterval(trackingInterval);
  }, [orderId, delivery?.status]);

  // Dev helper to manually trigger simulated delivery engine tick
  const handleTriggerDeliveryTick = async () => {
    setUpdating(true);
    try {
      if (!delivery || !order) return;

      const res = await fetch('/api/checkout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          action: 'tick'
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Simulated delivery advance tick failed.');
      }

      await fetchOrderAndDelivery();
    } catch (err) {
      console.error('Simulated delivery advance failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ CONNECTING TELEMETRY BEAM... ]
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-400 space-y-4">
        <p>[ ORDER LEDGER NOT FOUND ]</p>
        <Link href="/shop" className="text-primary underline">
          RETURN TO MARKETPLACE
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 max-w-5xl mx-auto font-mono">
      <div className="space-y-2">
        <span className="text-[10px] text-primary tracking-widest uppercase block">[ LIVE TELEMETRY ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">ORDER TRACKING</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RADAR SIMULATION TELEMETRY VIEW */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-card-border p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            {/* Cyber Grid pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {delivery?.status === 'delivered' ? (
              <div className="text-center space-y-4 relative z-10 py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center mx-auto text-primary shadow-neon-cyan mb-2">
                  <CheckCircle2 className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <h3 className="font-extrabold text-white text-lg uppercase tracking-wider">
                  DELIVERY COMPLETE
                </h3>
                <p className="text-xs text-gray-400 font-sans max-w-sm leading-relaxed">
                  Your assets have been successfully simulated and cleared. The delivery engine successfully completed all telemetry ticks.
                </p>
              </div>
            ) : (
              // ACTIVE RADAR SCREEN
              <div className="relative w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center mb-6 relative">
                {/* Radar sweep layer */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
                
                {/* Concentric rings */}
                <div className="absolute w-36 h-36 rounded-full border border-primary/10" />
                <div className="absolute w-24 h-24 rounded-full border border-primary/10" />
                <div className="absolute w-12 h-12 rounded-full border border-primary/10" />

                {/* Target alex location center */}
                <div className="absolute w-2.5 h-2.5 rounded-full bg-secondary shadow-neon-pink z-10 animate-ping" />
                <div className="absolute w-2 h-2 rounded-full bg-secondary z-10" />
                <span className="absolute text-[8px] text-secondary font-bold -mt-6">ALEX</span>

                {/* Drone Location indicator */}
                {delivery?.status === 'in_transit' && (
                  <div className="absolute animate-bounce" style={{
                    transform: `translate(${(40.7128 - delivery.latitude) * 500}px, ${(delivery.longitude - (-74.0060)) * 500}px)`
                  }}>
                    <div className="w-3 h-3 rounded-full bg-primary shadow-neon-cyan" />
                    <span className="absolute text-[8px] text-primary font-bold -mt-6 -ml-4 whitespace-nowrap">COURIER DRONE</span>
                  </div>
                )}
              </div>
            )}

            {/* Courier metrics */}
            {delivery && (
              <div className="w-full grid grid-cols-2 gap-4 border-t border-card-border/60 pt-4 text-[10px] text-gray-500 z-10 font-mono">
                <div>
                  COURIER CAPTAIN: <span className="text-white font-bold">{delivery.courierName?.toUpperCase() || 'SEARCHING...'}</span>
                </div>
                <div className="text-right">
                  STATUS: <span className="text-primary font-bold uppercase">{delivery.status}</span>
                </div>
                <div>
                  LATITUDE: <span className="text-white">{delivery.latitude?.toFixed(5) || '40.71280'}</span>
                </div>
                <div className="text-right">
                  LONGITUDE: <span className="text-white">{delivery.longitude?.toFixed(5) || '-74.00600'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ORDER SPECS SIDEBAR */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-card/40 border border-card-border p-6 rounded-3xl space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white border-b border-card-border pb-3">
              [ TELEMETRY STATS ]
            </h2>

            <div className="space-y-3 text-[11px] text-gray-400">
              <div className="flex justify-between">
                <span>ORDER TARGET ID:</span>
                <span className="text-white">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYMENT INTENT:</span>
                <span className="text-white">{(order.paymentIntentId || 'PENDING').slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL USDC:</span>
                <span className="text-white font-bold">{order.totalAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between border-t border-card-border/50 pt-3 text-white">
                <span>CURRENT STATE:</span>
                <span className="text-primary font-bold uppercase">{order.status}</span>
              </div>
            </div>

            {/* DEV TRIGGER BUTTON FOR SIMULATION ENGINE */}
            {delivery && delivery.status !== 'delivered' && (
              <div className="pt-4 border-t border-card-border/60 space-y-2">
                <span className="block text-[8px] text-gray-500 font-sans leading-relaxed">
                  Fast-forward simulated courier movement step-by-step in developer mode:
                </span>
                <button
                  onClick={handleTriggerDeliveryTick}
                  disabled={updating}
                  className="w-full py-3 bg-secondary/15 hover:bg-secondary/25 border border-secondary/35 hover:border-secondary text-secondary rounded-xl text-[10px] tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                  ADVANCE SIMULATED TICK
                </button>
              </div>
            )}

            <div className="flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed border-t border-card-border/60 pt-4 font-sans">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Simulated courier moves closer to Alex's Buyer Profile on every tick, logging location telemetry.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
