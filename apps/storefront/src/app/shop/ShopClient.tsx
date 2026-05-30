'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Star, Filter, ArrowUpDown } from 'lucide-react';
import { useCartStore, useAuthStore } from '../../lib/store';
import { Product } from '@ababil/types';

interface ShopClientProps {
  initialProducts: Product[];
}

const CATEGORIES = [
  'All',
  'Tech Hardware',
  'Apparel',
  'Digital Assets',
  'NFTs',
  'Home & Living',
  'Gifts',
  'Toys'
];

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const router = useRouter();
  const { profile, openAuthModal } = useAuthStore();
  const [products] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'priceAsc' | 'priceDesc'>('rating');
  const addItem = useCartStore((state) => state.addItem);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aPrice = a.priceUSD ?? (a as any).price_usd ?? 0;
        const bPrice = b.priceUSD ?? (b as any).price_usd ?? 0;
        const aRating = a.rating ?? 5.00;
        const bRating = b.rating ?? 5.00;
        
        if (sortBy === 'priceAsc') return aPrice - bPrice;
        if (sortBy === 'priceDesc') return bPrice - aPrice;
        return bRating - aRating;
      });
  }, [products, search, selectedCategory, sortBy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* SIDEBAR FILTERS (Desktop) */}
      <div className="space-y-6 lg:col-span-1 bg-card/40 border border-card-border p-6 rounded-2xl h-fit font-mono">
        <div className="flex items-center gap-2 border-b border-card-border pb-3 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-white uppercase">[ FILTERS ]</span>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400">SEARCH REGISTRY</label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all font-sans"
            />
            <Search className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] text-gray-400 block mb-1">CATEGORIES</label>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                  selectedCategory === cat
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-gray-400 hover:text-white hover:bg-card-hover border border-transparent'
                }`}
              >
                <span>{cat.toUpperCase()}</span>
                {selectedCategory === cat && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sort options */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] text-gray-400 block mb-1">SORT REGISTRY</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-background border border-card-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-all cursor-pointer font-sans"
            >
              <option value="rating">HIGHEST RATING</option>
              <option value="priceAsc">PRICE: LOW TO HIGH</option>
              <option value="priceDesc">PRICE: HIGH TO LOW</option>
            </select>
            <ArrowUpDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* PRODUCTS CATALOG GRID */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between font-mono text-[10px] text-gray-400 px-2">
          <span>SHOWING {filteredProducts.length} listings</span>
          <span>SYSTEM ONLINE</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-card/20 border border-dashed border-card-border rounded-2xl p-12 text-center text-gray-400 font-mono">
            [ NO PRODUCTS FOUND IN CATALOG ]
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const priceUSD = p.priceUSD ?? (p as any).price_usd ?? 0;
              const imageUrl = p.images?.[0] || (p as any).image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800';

              return (
                <div
                  key={p.id}
                  className="group bg-card border border-card-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 flex flex-col justify-between hover:shadow-neon-cyan relative"
                >
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-background/80 border border-card-border font-mono text-[8px] text-primary uppercase">
                    {p.category}
                  </span>

                  {/* Thumbnail */}
                  <Link href={`/shop/${p.slug}`} className="aspect-video relative overflow-hidden bg-card-border block">
                    <Image
                      src={imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-w-7xl) 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Body details */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="block text-[9px] font-mono text-gray-400 mb-1">
                        BY{' '}
                        <span className="text-primary hover:underline">
                          {p.vendor?.name?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </span>
                      <Link href={`/shop/${p.slug}`} className="block">
                        <h3 className="font-extrabold text-white group-hover:text-primary transition-colors text-sm truncate uppercase tracking-tight">
                          {p.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-card-border/60">
                      {/* Price & Rating */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{(p.rating ?? 5).toFixed(1)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-mono text-gray-500 leading-none">PRICE</span>
                          <span className="font-mono font-black text-secondary text-sm">
                            {priceUSD.toFixed(2)} USDC
                          </span>
                        </div>
                      </div>

                      {/* CTA Add to Cart */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!profile) {
                            openAuthModal('/shop');
                            return;
                          }
                          addItem(p);
                        }}
                        className="w-full py-2.5 bg-card-hover border border-card-border hover:border-primary/40 hover:bg-primary/5 text-white hover:text-primary rounded-xl font-mono text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-card-hover/90"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
