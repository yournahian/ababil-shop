'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Trash2, ShieldCheck, Heart } from 'lucide-react';
import { useCartStore, useAuthStore } from '../../lib/store';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Avoid hydrations mismatch by mounting on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        [ DECRYPTING CART DATA... ]
      </div>
    );
  }

  const subtotal = getTotalPrice();

  return (
    <div className="py-6 space-y-8">
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-primary tracking-widest uppercase block">[ CART REGISTRY ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">YOUR SHOPPING BAG</h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-card/20 border border-dashed border-card-border rounded-3xl p-16 text-center space-y-6 max-w-2xl mx-auto mt-10">
          <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto animate-bounce" />
          <p className="font-mono text-sm text-gray-400">YOUR CART IS COMPLETELY VOID OF ASSETS.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-black tracking-wider text-xs rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300"
          >
            RESTOCK THE CART
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              const imageUrl = product.images?.[0] || (product as any).image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800';
              const moq = product.moq || 1;

              // Check if tiered pricing is active
              let activePrice = product.priceUSD;
              if (product.tieredPricing && product.moq && item.quantity >= product.moq) {
                const applicableTier = [...product.tieredPricing]
                  .sort((a, b) => b.minQuantity - a.minQuantity)
                  .find((t) => item.quantity >= t.minQuantity);
                if (applicableTier) {
                  activePrice = applicableTier.priceUSD;
                }
              }

              return (
                <div
                  key={item.productId}
                  className="bg-card border border-card-border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between hover:border-card-border/80 transition-all"
                >
                  <div className="flex gap-4 items-center w-full sm:w-auto">
                    <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-card-border flex-shrink-0">
                      <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="truncate">
                      <span className="block text-[8px] font-mono text-primary uppercase">
                        {product.category}
                      </span>
                      <h3 className="font-extrabold text-white text-sm truncate uppercase tracking-tight sm:max-w-xs">
                        {product.name}
                      </h3>
                      <span className="block text-[9px] font-mono text-gray-500 mt-0.5">
                        BY {product.vendor?.name?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity selectors */}
                    <div className="flex items-center bg-background border border-card-border rounded-xl px-2 py-1 h-9 justify-between w-24">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= moq}
                        className="text-gray-400 hover:text-white text-xs disabled:opacity-30 disabled:hover:text-gray-400 font-mono"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="text-gray-400 hover:text-white text-xs font-mono"
                      >
                        +
                      </button>
                    </div>

                    {/* Price and Delete CTA */}
                    <div className="text-right font-mono min-w-[80px]">
                      <span className="block text-[11px] text-white">
                        {(activePrice * item.quantity).toFixed(2)} USDC
                      </span>
                      <span className="block text-[9px] text-gray-500">
                        {activePrice.toFixed(2)} USDC/unit
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 border border-card-border hover:border-secondary/40 hover:text-secondary rounded-lg text-gray-500 transition-colors"
                      title="Remove asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout sidebar panel */}
          <div className="bg-card/40 border border-card-border p-6 rounded-3xl h-fit font-mono space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white border-b border-card-border pb-3">
              [ TRANSACTION LEDGER ]
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>SUBTOTAL:</span>
                <span className="text-white">{subtotal.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>SHIPPING:</span>
                <span className="text-primary font-bold">FREE SIMULATED</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-card-border/60 pt-3 text-white">
                <span>TOTAL AMOUNT:</span>
                <span className="text-secondary text-glow-pink">{subtotal.toFixed(2)} USDC</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!profile) {
                  router.push('/auth/login?redirect=/checkout');
                  return;
                }
                router.push('/checkout');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-black font-black tracking-wider text-xs rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              PROCEED TO CLEARANCE
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed border-t border-card-border/60 pt-4 font-sans">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                All checkout items are compiled into an EIP-3009 payment intent. Your transaction is signed on Base Sepolia.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
