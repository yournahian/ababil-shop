'use client';

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore } from '../../../lib/store';
import { Product } from '@ababil/types';

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { profile, openAuthModal } = useAuthStore();
  const moq = product.moq || 1;
  const [qty, setQty] = useState(moq);
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    if (!profile) {
      openAuthModal(`/shop/${product.slug}`);
      return;
    }
    addItem(product, qty);
  };

  const handleQtyChange = (val: number) => {
    if (val < moq) return;
    setQty(val);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-card-border/60">
      {/* Qty and Add to Cart Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center bg-card border border-card-border rounded-xl px-2 py-1.5 h-12 w-full sm:w-32 justify-between">
          <button
            onClick={() => handleQtyChange(qty - 1)}
            disabled={qty <= moq}
            className="w-8 h-8 rounded-lg bg-card-hover border border-card-border text-white text-xs hover:border-primary/50 disabled:opacity-40 disabled:hover:border-card-border transition-colors font-mono"
          >
            -
          </button>
          <span className="font-mono font-bold text-sm text-white">{qty}</span>
          <button
            onClick={() => handleQtyChange(qty + 1)}
            className="w-8 h-8 rounded-lg bg-card-hover border border-card-border text-white text-xs hover:border-primary/50 transition-colors font-mono"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          className="w-full h-12 py-3 bg-gradient-to-r from-primary to-primary-dark text-black font-extrabold font-mono tracking-wider text-xs rounded-xl hover:shadow-neon-cyan transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          ADD TO CART
        </button>
      </div>

      {product.moq && (
        <span className="block text-[9px] font-mono text-secondary tracking-wider text-center sm:text-left">
          * MINIMUM ORDER QUANTITY (MOQ) IS {product.moq} UNITS FOR THIS LISTING.
        </span>
      )}
    </div>
  );
}
