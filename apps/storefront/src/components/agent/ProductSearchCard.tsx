import React, { useState } from 'react';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useCartStore } from '../../lib/store';
import { Product } from '@ababil/types';

interface ProductSearchCardProps {
  products: any[];
  found: boolean;
  message?: string;
}

export default function ProductSearchCard({ products, found, message }: ProductSearchCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [addedStates, setAddedStates] = useState<Record<string, boolean>>({});

  if (!found || products.length === 0) {
    return (
      <div className="p-4 bg-card/60 border border-card-border rounded-2xl text-xs text-gray-400 font-mono">
        {message || 'No products found matching the criteria.'}
      </div>
    );
  }

  const handleAddToCart = (product: any) => {
    // Map minimal product schema to types.Product
    const fullProduct: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      priceUSD: product.priceUsdc,
      priceCrypto: product.priceUsdc,
      currency: 'USDC',
      category: product.category || 'Tech Hardware',
      images: product.images || [],
      inStock: product.inStock !== false,
      inventory: product.inventory || 10,
      rating: product.rating || 5,
      numReviews: product.numReviews || 0,
      tags: [],
      status: 'active',
      vendorId: product.vendor?.id,
      createdAt: '',
      updatedAt: '',
    };

    addItem(fullProduct, product.moq || 1);
    setAddedStates((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedStates((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-3 w-full my-2">
      {message && (
        <p className="text-xs text-gray-300 font-sans">{message}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-card hover:bg-card-hover border border-card-border hover:border-primary/25 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              {p.images && p.images[0] && (
                <div className="w-full h-28 bg-black/40 rounded-xl overflow-hidden relative">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <span className="text-[8px] text-primary/80 uppercase font-mono tracking-wider">
                  {p.category}
                </span>
                <h4 className="text-xs font-bold text-white uppercase group-hover:text-primary transition-colors line-clamp-1">
                  {p.name}
                </h4>
                <p className="text-[10px] text-gray-400 font-sans line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[8px] text-gray-500 font-mono leading-none uppercase">Price</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {p.priceUsdc.toFixed(2)} <span className="text-[10px] text-primary font-bold">USDC</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-[8px] text-gray-500 font-mono leading-none uppercase">Rating</span>
                  <div className="flex items-center gap-0.5 text-secondary font-mono text-[10px] mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{p.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {p.moq && p.moq > 1 && (
                <div className="text-[9px] text-gray-500 font-mono">
                  MOQ: <span className="text-white">{p.moq} units</span>
                </div>
              )}

              <button
                onClick={() => handleAddToCart(p)}
                disabled={addedStates[p.id]}
                className={`w-full py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  addedStates[p.id]
                    ? 'bg-primary/20 border border-primary/40 text-primary'
                    : 'bg-primary text-black hover:shadow-neon-cyan active:scale-95'
                }`}
              >
                {addedStates[p.id] ? (
                  <>
                    <Check className="w-3 h-3" />
                    ADDED TO CART
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3 h-3" />
                    ADD TO CART {p.moq > 1 ? `(${p.moq}x)` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
