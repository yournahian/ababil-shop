'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { useCartStore, useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';

// Mock listings for search box suggestions dropdown
const SEARCH_SUGGESTIONS = [
  { id: 'quantum-headset-spacer', name: 'Quantum Headset Spacer', priceUSD: 2.50, category: 'Tech Hardware', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=400' },
  { id: 'haptic-finger-cot', name: 'Haptic Finger Cot', priceUSD: 4.20, category: 'Tech Hardware', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400' },
  { id: 'reflective-laces-neon', name: 'Reflective Laces (Neon)', priceUSD: 3.00, category: 'Apparel', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
  { id: 'base-network-swallow-nft', name: 'Base Network Swallow NFT', priceUSD: 4.99, category: 'NFTs', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400' },
  { id: 'cyber-glow-coaster', name: 'Cyber Glow Coaster', priceUSD: 1.50, category: 'Home & Living', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400' }
];

export default function Navbar() {
  const { profile, setProfile, logout } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const clearCart = useCartStore((state) => state.clearCart);
  const [localSearch, setLocalSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Click outside listener for search suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Auth subscription — filter by event type to avoid redundant DB round-trips
    // on TOKEN_REFRESHED / INITIAL_SESSION when profile is already loaded.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Always fetch on explicit sign-in or profile update; skip silent token refreshes
        const shouldFetch = event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION';
        if (!shouldFetch) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) {
          setProfile({
            id: data.id,
            username: data.username,
            email: data.email,
            fullName: data.full_name,
            avatarUrl: data.avatar_url,
            walletAddress: data.wallet_address,
            xp: data.xp,
            level: data.level,
            role: data.role,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      subscription.unsubscribe();
    };
  }, [setProfile]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowDropdown(false);
      router.push(`/shop?q=${encodeURIComponent(localSearch)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out network error, proceeding with client-side cleanup:", err);
    } finally {
      logout();
      clearCart();
      router.push('/auth/login');
    }
  };

  const searchResults = localSearch.trim() === '' 
    ? [] 
    : SEARCH_SUGGESTIONS.filter(p => 
        p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(localSearch.toLowerCase())
      ).slice(0, 5);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={index} className="text-primary font-bold">{part}</span> 
        : part
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 glass px-6 py-4 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo matching exact original logo */}
        <Link href="/" className="text-xl font-bold tracking-wider text-white hover:text-primary transition-all">
          ABABIL<span className="text-primary">.</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className="text-gray-300 hover:text-primary transition-colors">Marketplace</Link>
          <Link href="/leaderboard" className="text-gray-300 hover:text-primary transition-colors">Leaderboard</Link>
          {profile?.role === 'vendor' && (
            <Link href="http://localhost:3001" target="_blank" className="text-secondary hover:text-secondary-light transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" /> Seller Dashboard
            </Link>
          )}
        </div>

        {/* Search Bar with Smart Dropdown */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Search marketplace..." 
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleSearchSubmit}
              className="w-full bg-card/50 border border-white/20 rounded-full py-2 px-6 text-sm focus:outline-none focus:border-primary transition-colors text-white placeholder-gray-400"
            />
            <svg 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Smart Search Dropdown */}
          {showDropdown && localSearch.trim() !== '' && (
            <div className="absolute top-full left-0 w-full mt-2 glass rounded-2xl border border-primary/50 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 font-mono">
                    Suggestions
                  </div>
                  {searchResults.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setShowDropdown(false);
                        setLocalSearch('');
                        router.push(`/shop/${product.id}`);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors text-left"
                    >
                      <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-md border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate font-bold">
                          {highlightMatch(product.name, localSearch)}
                        </div>
                        <div className="text-xs text-primary uppercase tracking-wider truncate font-mono">
                          {product.category}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {product.priceUSD.toFixed(2)} USDC
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-gray-400 text-center">
                  No matches found for &quot;{localSearch}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* User / Actions widgets */}
        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative p-2 text-gray-300 hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {mounted && totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black bg-primary rounded-full transform translate-x-1/4 -translate-y-1/4">
                {totalItems}
              </span>
            )}
          </Link>

          {profile ? (
            <div className="flex items-center gap-4">
              <Link href="/account/profile" className="text-xs text-gray-400 hover:text-white uppercase font-mono">
                [ PROFILE ]
              </Link>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 uppercase font-mono">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link 
                href="/auth/signup"
                className="px-6 py-2 rounded-full border border-primary text-primary font-medium text-sm transition-all duration-300 hover:bg-primary hover:text-black hover:shadow-[0_0_15px_rgba(0,255,255,0.5)]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
