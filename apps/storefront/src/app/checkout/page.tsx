'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useCartStore, useAuthStore } from '../../lib/store';
import CheckoutModal from '../../components/CheckoutModal';
import type { SettlementResult } from '../../lib/ababilpay';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { profile } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Shipping Form State ──────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');

  // ── CheckoutModal State ──────────────────────────────────────────────────
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutIntent, setCheckoutIntent] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    if (mounted && !profile) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    
    if (profile) {
      setFullName(profile.fullName || '');
    }
  }, [profile, mounted, router]);

  if (!mounted) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ SYNCHRONIZING SECURE TUNNEL... ]
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-400 space-y-4">
        <p>[ YOUR CART REGISTRY IS EMPTY ]</p>
        <Link href="/shop" className="text-primary underline">
          BROWSE CATALOG
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();

  const orderDescription = items.length === 1
    ? items[0].product.name
    : `${items.length} items from Ababil Shop`;

  // ── Handle Place Order ───────────────────────────────────────────────────

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName || !addressLine1 || !city || !state || !postalCode || !phone) {
      setError('Please populate all required clearance fields.');
      setLoading(false);
      return;
    }

    if (!profile) {
      setError('You must be logged in to clear assets. Please Sign Up or Login first.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        userId: profile.id,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          phone,
        },
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Clearance error occurred.');
      }

      // ── Open in-page CheckoutModal instead of redirecting ────────────────
      setCheckoutOrderId(data.orderId);
      setCheckoutAmount(subtotal);
      setCheckoutIntent(data.intent || null);
      // NOTE: clearCart() is intentionally NOT called here.
      // The cart is cleared only after payment is confirmed in handlePaymentSuccess.
      setIsCheckoutOpen(true);

    } catch (err: any) {
      setError(err.message || 'System failed to register clearance.');
    } finally {
      setLoading(false);
    }
  };

  // ── Payment Success Callback ─────────────────────────────────────────────

  const handlePaymentSuccess = async (result: SettlementResult, txHash: string, intentId?: string) => {
    console.log('✅ On-chain settlement confirmed:', txHash, result);
    clearCart(); // Only clear after confirmed on-chain payment
    setIsCheckoutOpen(false);

    try {
      const isSimulated = intentId?.startsWith('sim_intent_');

      // 1. Call secure server-side verification to automatically verify in the background
      const res = await fetch('/api/checkout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: checkoutOrderId, 
          action: isSimulated ? 'simulate' : 'verify',
          intentId
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn('Backend auto-verification check failed, redirecting to polling screen:', data.error);
        const url = `/checkout/success?orderId=${checkoutOrderId}` + (intentId ? `&intentId=${intentId}` : '');
        router.push(url);
        return;
      }

      // 2. Already verified, redirect directly to completed success screen
      router.push(`/checkout/success?orderId=${checkoutOrderId}`);
    } catch (err) {
      console.error('Backend auto-verification failed:', err);
      const url = `/checkout/success?orderId=${checkoutOrderId}` + (intentId ? `&intentId=${intentId}` : '');
      router.push(url);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="py-6 space-y-8 max-w-5xl mx-auto">
        <div className="space-y-2">
          <span className="font-mono text-[10px] text-primary tracking-widest uppercase block">[ SECURE CHECKOUT ]</span>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">ASSET CLEARANCE</h1>
        </div>

        {error && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 font-mono text-xs text-secondary">
            [ ERROR: {error.toUpperCase()} ]
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SHIPPING FORM */}
          <div className="lg:col-span-2 bg-card border border-card-border p-6 rounded-3xl space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono border-b border-card-border pb-3">
              [ 1. SHIPPING PROTOCOL ]
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="font-mono text-[10px] text-gray-400">FULL LEGAL NAME *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="font-mono text-[10px] text-gray-400">ADDRESS LINE 1 *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="42 Cyberpunk Ave"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="font-mono text-[10px] text-gray-400">ADDRESS LINE 2 (OPTIONAL)</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Suite 404"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-400">CITY *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="Neo York"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-400">STATE *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="NY"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-400">POSTAL ZIP CODE *</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="10001"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-400">PHONE DIRECTORY *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                  placeholder="+1 555 0199"
                />
              </div>
            </div>
          </div>

          {/* ORDER REVIEW & PAYMENT */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-card/40 border border-card-border p-6 rounded-3xl font-mono space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-card-border pb-3">
                [ 2. CLEARED ASSETS ]
              </h2>

              {/* Asset quick view list */}
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs py-1">
                    <span className="text-gray-400 truncate max-w-[150px]">
                      {item.product.name.toUpperCase()} (x{item.quantity})
                    </span>
                    <span className="text-white">
                      {(item.product.priceUSD * item.quantity).toFixed(2)} USDC
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-xs border-t border-card-border/60 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>SUBTOTAL:</span>
                  <span className="text-white">{subtotal.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-card-border/60 pt-3 text-white">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-secondary text-glow-pink">{subtotal.toFixed(2)} USDC</span>
                </div>
              </div>

              {loading ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 bg-card border border-card-border text-gray-500 rounded-xl font-mono text-xs tracking-wider flex items-center justify-center gap-2"
                >
                  [ CREATING SECURE INTENT LEDGER... ]
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-black font-black tracking-wider text-xs rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  PAY WITH USDC
                </button>
              )}

              <div className="flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed border-t border-card-border/60 pt-4 font-sans">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  In-page EIP-3009 gasless signing via AbabilPay Custom Integration. Connect MetaMask on Base Sepolia — no ETH gas fees required.
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* AbabilPay Custom Checkout Modal (Full Control) */}
      {isCheckoutOpen && checkoutIntent && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          amountUSDC={checkoutAmount}
          orderDescription={orderDescription}
          orderId={checkoutOrderId}
          initialIntent={checkoutIntent}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setIsCheckoutOpen(false)}
        />
      )}
    </>
  );
}
