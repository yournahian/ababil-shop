'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Star, Wallet, Globe, Zap, Award } from 'lucide-react';
import DiscoveryTabs from '../components/DiscoveryTabs';
import FlashSaleBanner from '../components/FlashSaleBanner';
import { useCartStore, useAuthStore } from '../lib/store';

// Legacy mock products adapted to strict USDC price structures under 5 USDC!
const MOCK_PRODUCTS = [
  { id: '1', name: 'Quantum Headset Spacer', priceUSD: 2.50, priceCrypto: 2.50, category: 'Tech Hardware', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=400', rating: 4.9, reviewCount: 12 },
  { id: '2', name: 'Haptic Finger Cot', priceUSD: 4.20, priceCrypto: 4.20, category: 'Tech Hardware', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400', rating: 4.8, reviewCount: 24 },
  { id: '3', name: 'Reflective Laces (Neon)', priceUSD: 3.00, priceCrypto: 3.00, category: 'Apparel', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400', rating: 4.7, reviewCount: 18 },
  { id: '4', name: 'Base Network Swallow NFT', priceUSD: 4.99, priceCrypto: 4.99, category: 'NFTs', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400', rating: 4.95, reviewCount: 9 },
  { id: '5', name: 'Cyber Glow Coaster', priceUSD: 1.50, priceCrypto: 1.50, category: 'Home & Living', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400', rating: 4.5, reviewCount: 3 },
  { id: '6', name: 'Ababil 3D Coin Asset', priceUSD: 1.99, priceCrypto: 1.99, category: 'Digital Assets', image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=400', rating: 5.0, reviewCount: 45 },
  { id: '7', name: 'Ultrasonic Humidifier', priceUSD: 3.80, priceCrypto: 3.80, category: 'Home & Living', image: 'https://images.unsplash.com/photo-1540932239986-30128078f3ea?auto=format&fit=crop&q=80&w=400', rating: 4.6, reviewCount: 15 },
  { id: '8', name: 'Cyber Genesis Tech Tee', priceUSD: 2.99, priceCrypto: 2.99, category: 'Apparel', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400', rating: 4.8, reviewCount: 33 }
];

// --- Reusable Component for Rotating "Marquee/Swap" Effect ---
interface RotatingBentoCardProps {
  products: typeof MOCK_PRODUCTS;
  intervalMs: number;
  badgeText: string;
  badgeColorClass: string;
  className: string;
  onAddToCart: (e: React.MouseEvent, product: any) => void;
  icon?: React.ReactNode;
}

const RotatingBentoCard: React.FC<RotatingBentoCardProps> = ({ products, intervalMs, badgeText, badgeColorClass, className, onAddToCart, icon }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!products || products.length <= 1) return;
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
        setIsAnimating(false);
      }, 500);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [products, intervalMs]);

  if (!products || products.length === 0) return null;

  const currentProduct = products[currentIndex];

  return (
    <Link 
      href={`/shop/${currentProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      className={`${className} bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(0,255,255,0.15)] flex flex-col`}
    >
      <div className="flex-[3] relative w-full overflow-hidden bg-black/50 border-b border-white/5 flex items-center justify-center min-h-[160px]">
        {icon && (
          <div className="absolute top-4 right-4 z-20">
            {icon}
          </div>
        )}
        <div className={`absolute top-4 left-4 z-20 px-2 py-1 ${badgeColorClass} text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md`}>
          {badgeText}
        </div>
        <img 
          src={currentProduct.image} 
          alt={currentProduct.name} 
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} 
          style={{ transition: 'opacity 0.5s ease, transform 0.7s ease' }}
        />
      </div>
      <div className="flex-[2] p-5 bg-[#0a0a0a] flex flex-col justify-between relative z-10">
        <h3 className={`text-sm font-bold text-white line-clamp-1 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {currentProduct.name.toUpperCase()}
        </h3>
        <div className="flex items-center justify-between">
          <div className={`text-sm font-bold text-primary transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {`${currentProduct.priceCrypto.toFixed(2)} USDC`}
          </div>
          <button 
            onClick={(e) => onAddToCart(e, currentProduct)}
            className="px-4 py-1.5 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary rounded-lg text-[10px] font-bold uppercase transition-all z-20"
          >
            ADD
          </button>
        </div>
      </div>
    </Link>
  );
};

export default function HomePage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { profile, openAuthModal } = useAuthStore();

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!profile) {
      openAuthModal('/');
      return;
    }
    
    // Adapt to standard schema product structure
    addItem({
      id: product.id,
      vendorId: '1',
      name: product.name,
      slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: 'Futuristic asset.',
      priceUSD: product.priceUSD,
      priceCrypto: product.priceCrypto,
      currency: 'USDC',
      category: product.category,
      images: [product.image],
      inStock: true,
      inventory: 100,
      rating: product.rating,
      numReviews: product.reviewCount,
      tags: [],
      status: 'active',
      createdAt: '',
      updatedAt: ''
    });
  };

  const heroProduct = MOCK_PRODUCTS[0];
  const personalizedItem = MOCK_PRODUCTS[1];
  const flashDeals = MOCK_PRODUCTS.filter(p => p.category === 'Apparel').slice(0, 2);

  const trendingAssets = MOCK_PRODUCTS.filter(p => p.category === 'NFTs' || p.category === 'Digital Assets').slice(0, 7);
  const apparelBestSellers = MOCK_PRODUCTS.filter(p => p.category === 'Apparel').slice(0, 7);
  const homeBestSellers = MOCK_PRODUCTS.filter(p => p.category === 'Home & Living').slice(0, 7);

  return (
    <div className="flex flex-col min-h-screen bg-black selection:bg-primary/30 selection:text-white pb-24 font-sans">
      {/* Discovery Tabs */}
      <DiscoveryTabs />
      
      {/* Massive Flash Sale Hero Banner */}
      <FlashSaleBanner />
      
      {/* E-Commerce Bento Grid matching original exactly */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[340px] mt-6">
        
        {/* 1. Hero Product Card (2x2) */}
        <Link 
          href={`/shop/${heroProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(0,255,255,0.15)] flex flex-col"
        >
           <div className="flex-[3] relative w-full overflow-hidden bg-white/5 min-h-[220px]">
             <div className="absolute top-6 left-6 z-20 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
               DEAL OF THE DAY
             </div>
             <img 
               src={heroProduct.image} 
               alt={heroProduct.name} 
               className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
           </div>
           
           <div className="flex-[2] p-8 bg-[#0a0a0a] relative z-10 flex flex-col justify-end">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 leading-tight uppercase">{heroProduct.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 font-bold text-white">{heroProduct.rating}</span>
                    </div>
                    <span>({heroProduct.reviewCount} REVIEWS)</span>
                    <span>•</span>
                    <span className="uppercase text-primary">{heroProduct.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white font-mono">{heroProduct.priceUSD.toFixed(2)} USDC</div>
                </div>
              </div>
              
              <button 
                onClick={(e) => handleAddToCart(e, heroProduct)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
              >
                <ShoppingCart className="w-5 h-5" /> ADD TO CART
              </button>
           </div>
        </Link>

        {/* 2. Top Sellers List (1x2) */}
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-br from-purple-900/40 via-[#0a0a0a] to-[#0a0a0a] border border-purple-500/30 rounded-[2rem] p-5 flex flex-col relative group transition-all duration-500 hover:border-purple-400 shadow-[inset_0_0_50px_rgba(168,85,247,0.1)]">
           <div className="mb-3 font-mono">
             <h3 className="text-lg font-bold text-white tracking-tight uppercase">[ Top Sellers ]</h3>
             <p className="text-[10px] text-primary uppercase tracking-widest font-bold mt-0.5">Digital Assets</p>
           </div>
           
           <div className="flex-grow flex flex-col justify-between gap-1 overflow-y-auto">
              {trendingAssets.map((asset) => (
                 <Link 
                   href={`/shop/${asset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
                   key={asset.id} 
                   className="flex gap-3 items-center group/item hover:bg-white/5 p-1 -mx-1 rounded-xl transition-colors"
                 >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                      <img src={asset.image} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                       <div className="text-xs font-bold text-white line-clamp-1">{asset.name.toUpperCase()}</div>
                       <div className="text-gray-400 text-[10px] font-mono mt-0.5">{asset.priceCrypto.toFixed(2)} USDC</div>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, asset)}
                      className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/item:bg-primary group-hover/item:text-black transition-colors shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                 </Link>
              ))}
           </div>
        </div>

        {/* 3. Budget Deal (1x1) - Under $50 */}
        <RotatingBentoCard 
          products={MOCK_PRODUCTS.filter(p => p.priceUSD < 5.0)} 
          intervalMs={4500} 
          badgeText="Under 5 USDC" 
          badgeColorClass="bg-red-500/20 text-red-500" 
          className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
          onAddToCart={handleAddToCart}
        />

        {/* 4. Personalized Block (1x1) */}
        <div className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(0,255,255,0.15)] flex flex-col">
           {profile ? (
              <Link href={`/shop/${personalizedItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex flex-col w-full h-full">
                <div className="flex-[3] relative w-full overflow-hidden bg-black/50 border-b border-white/5 min-h-[160px]">
                  <div className="absolute top-4 left-4 z-20 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md">
                    For You
                  </div>
                  <img src={personalizedItem.image} alt={personalizedItem.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                </div>
                <div className="flex-[2] p-5 bg-[#0a0a0a] flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white line-clamp-1 uppercase">{personalizedItem.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white font-mono">${personalizedItem.priceUSD.toFixed(2)}</div>
                    <button 
                      onClick={(e) => handleAddToCart(e, personalizedItem)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary rounded-lg text-[10px] font-bold uppercase transition-all z-20"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </Link>
           ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center font-mono">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-3 animate-pulse">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1 uppercase">[ Personalize ]</h3>
                <p className="text-[10px] text-gray-500 mb-4 leading-normal font-sans">Connect wallet profile to unlock recommendations.</p>
                <Link href="/auth/login" className="px-6 py-2 border border-primary text-primary rounded-full text-[10px] font-bold uppercase hover:bg-primary hover:text-black transition-all z-20">
                  Connect Wallet
                </Link>
              </div>
           )}
        </div>

        {/* 5. Best Sellers Apparel (1x2) */}
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-5 flex flex-col relative group transition-all duration-500 hover:border-primary/20">
           <div className="mb-3 font-mono">
             <h3 className="text-lg font-bold text-white tracking-tight uppercase">[ Best Sellers ]</h3>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Clothing & Shoes</p>
           </div>
           
           <div className="flex-grow flex flex-col justify-between gap-1 overflow-y-auto">
              {apparelBestSellers.map((asset) => (
                 <Link 
                   href={`/shop/${asset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
                   key={asset.id} 
                   className="flex gap-3 items-center group/item hover:bg-white/5 p-1 -mx-1 rounded-xl transition-colors"
                 >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                      <img src={asset.image} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                       <div className="text-xs font-bold text-white line-clamp-1">{asset.name.toUpperCase()}</div>
                       <div className="text-gray-400 text-[10px] font-mono mt-0.5">${asset.priceUSD.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, asset)}
                      className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/item:bg-primary group-hover/item:text-black transition-colors shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                 </Link>
              ))}
           </div>
        </div>

        {/* 6. Flash Deals Grid (2x1) */}
        <div className="md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1 bg-gradient-to-br from-red-900/40 via-orange-900/20 to-[#0a0a0a] border border-orange-500/30 rounded-[2rem] p-6 relative group transition-all duration-500 hover:border-orange-400 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)] flex flex-col">
           <div className="flex justify-between items-center mb-4 px-2 font-mono">
             <div>
               <h3 className="text-base font-bold text-white uppercase">[ Flash Deals ]</h3>
             </div>
             <div className="px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-bold rounded-full border border-red-500/20 uppercase tracking-widest">
               ENDS SOON
             </div>
           </div>
           
           <div className="flex-1 grid grid-cols-2 gap-4">
              {flashDeals.map(item => (
                <Link 
                  key={item.id} 
                  href={`/shop/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="flex gap-4 items-center bg-white/5 border border-white/5 rounded-xl p-3 hover:border-primary/30 hover:bg-white/10 transition-all group/card"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 font-sans">
                    <div className="text-xs font-bold text-white line-clamp-1 mb-1">{item.name.toUpperCase()}</div>
                    <span className="text-primary font-bold text-xs font-mono">${item.priceUSD.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(e, item)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/card:bg-primary group-hover/card:text-black transition-colors shrink-0 z-20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </Link>
              ))}
           </div>
        </div>

        {/* 7. Home Arrivals (1x1) */}
        <RotatingBentoCard 
          products={MOCK_PRODUCTS.filter(p => p.category === 'Home & Living')} 
          intervalMs={6000} 
          badgeText="New Home" 
          badgeColorClass="bg-white/10 text-white" 
          className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
          onAddToCart={handleAddToCart}
        />

        {/* 8. Home Best Sellers (1x2) */}
        <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-5 flex flex-col relative group transition-all duration-500 hover:border-primary/20">
           <div className="mb-3 font-mono">
             <h3 className="text-lg font-bold text-white tracking-tight uppercase">[ Home Arrivals ]</h3>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Luxury Living</p>
           </div>
           
           <div className="flex-grow flex flex-col justify-between gap-1 overflow-y-auto">
              {homeBestSellers.map((asset) => (
                 <Link 
                   href={`/shop/${asset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
                   key={asset.id} 
                   className="flex gap-3 items-center group/item hover:bg-white/5 p-1 -mx-1 rounded-xl transition-colors"
                 >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                      <img src={asset.image} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 font-sans">
                       <div className="text-xs font-bold text-white line-clamp-1">{asset.name.toUpperCase()}</div>
                       <div className="text-gray-400 text-[10px] font-mono mt-0.5">${asset.priceUSD.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, asset)}
                      className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/item:bg-primary group-hover/item:text-black transition-colors shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                 </Link>
              ))}
           </div>
        </div>

        {/* 9. Metaverse Explore (2x1) */}
        <div className="md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-6 relative group transition-all duration-500 hover:border-primary/20 flex flex-col">
           <div className="flex justify-between items-center mb-4 px-2 font-mono">
             <div>
               <h3 className="text-base font-bold text-white uppercase">[ Explore the Metaverse ]</h3>
               <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-sans">Virtual Assets & Collectibles</p>
             </div>
             <div className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-bold rounded-full border border-primary/20 flex items-center gap-1">
               <Zap className="w-3.5 h-3.5 animate-pulse" /> LIVE
             </div>
           </div>
           
           <div className="flex-1 grid grid-cols-2 gap-4">
              {MOCK_PRODUCTS.filter(p => p.category === 'Digital Assets' || p.category === 'NFTs').slice(0, 2).map(item => (
                <Link 
                  key={item.id} 
                  href={`/shop/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="flex gap-4 items-center bg-white/5 border border-white/5 rounded-xl p-3 hover:border-primary/30 hover:bg-white/10 transition-all group/card"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 font-sans">
                    <div className="text-xs font-bold text-white line-clamp-1 mb-1">{item.name.toUpperCase()}</div>
                    <span className="text-primary font-bold text-xs font-mono">{item.priceCrypto.toFixed(2)} USDC</span>
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(e, item)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/card:bg-primary group-hover/card:text-black transition-colors shrink-0 z-20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </Link>
              ))}
           </div>
        </div>

        {/* 10. Cyberpunk Gear (1x1) */}
        <RotatingBentoCard 
          products={MOCK_PRODUCTS.filter(p => p.name.includes('Quantum') || p.category === 'NFTs')} 
          intervalMs={6500} 
          badgeText="Cyber Drop" 
          badgeColorClass="bg-purple-500/20 text-purple-400" 
          className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
          onAddToCart={handleAddToCart}
        />

        {/* 11. Exclusive NFT (1x1) */}
        <RotatingBentoCard 
          products={MOCK_PRODUCTS.filter(p => p.category === 'NFTs')} 
          intervalMs={5000} 
          badgeText="Rare drop" 
          badgeColorClass="bg-yellow-500/20 text-yellow-500" 
          className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
          onAddToCart={handleAddToCart}
        />

      </div>
    </div>
  );
}
