'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, Star, ExternalLink, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order } from '@ababil/types';

export default function OrdersIndexPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            vendor:vendors (
              name
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setOrders(data.map((o) => ({
            id: o.id,
            customerId: o.customer_id,
            vendorId: o.vendor_id,
            status: o.status,
            shippingAddress: o.shipping_address,
            paymentStatus: o.payment_status,
            paymentIntentId: o.payment_intent_id,
            paymentTxHash: o.payment_tx_hash,
            totalAmount: parseFloat(o.total_amount),
            shippingCost: parseFloat(o.shipping_cost),
            xpEarned: o.xp_earned,
            deliveryEngineStatus: o.delivery_engine_status,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            vendor: o.vendor ? { name: o.vendor.name } : undefined
          })));
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ RETRIEVING TRANSACTION LEDGER... ]
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 max-w-4xl mx-auto font-mono">
      <div className="space-y-2">
        <span className="text-[10px] text-primary tracking-widest uppercase block">[ LEDGER INDEX ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">YOUR ORDERS</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card/20 border border-dashed border-card-border rounded-3xl p-16 text-center space-y-6">
          <Package className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
          <p className="text-xs text-gray-400">NO TRANSACTION ENTRIES RECORDED FOR THIS ACCOUNT YET.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-black tracking-wider text-xs rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300"
          >
            BROWSE PRODUCTS
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-card border border-card-border rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="space-y-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase">ORDER #{o.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    o.paymentStatus === 'paid'
                      ? 'bg-primary/10 border border-primary/20 text-primary'
                      : 'bg-secondary/10 border border-secondary/20 text-secondary'
                  }`}>
                    {o.paymentStatus}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-sans">
                  Placed on {new Date(o.createdAt).toLocaleDateString()} • Vendor: {o.vendor?.name || 'Unknown'}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto font-mono text-xs">
                <div>
                  <span className="block text-[8px] text-gray-500 leading-none">TOTAL</span>
                  <span className="text-white font-bold">{o.totalAmount.toFixed(2)} USDC</span>
                </div>

                <div className="text-right">
                  <span className="block text-[8px] text-gray-500 leading-none">DELIVERY</span>
                  <span className="text-primary font-bold uppercase">{o.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/orders/${o.id}`}
                    className="px-4 py-2 bg-card-hover border border-card-border hover:border-primary/40 hover:text-primary rounded-xl text-[10px] tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    TRACK
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
