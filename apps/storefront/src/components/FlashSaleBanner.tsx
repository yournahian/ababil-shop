'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Zap } from 'lucide-react';

const MOCK_BANNER_PRODUCTS = [
  { id: '1', name: 'Base Swallow genesis NFT', category: 'NFTs', priceCrypto: 4.99, image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Quantum Headset Space', category: 'Tech Hardware', priceCrypto: 2.50, image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Reflective Laces (Neon)', category: 'Apparel', priceCrypto: 3.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' }
];

export default function FlashSaleBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const banners = [
    {
      id: 0,
      badgeText: "LIMITED EDITION",
      title1: "CYBER",
      title2: "DROP",
      subtitle: "Discover the most exclusive digital assets and next-gen hardware curated for the Ababil ecosystem.",
      orb1: "bg-cyan-500",
      orb2: "bg-blue-600",
      textGradient: "from-cyan-400 to-blue-500",
      bgText: "CYBER DROP • EXCLUSIVE EVENT • LIMITED MINT • ",
      btnHover: "hover:bg-cyan-400",
      pulseColor: "bg-cyan-400",
      products: MOCK_BANNER_PRODUCTS,
    },
    {
      id: 1,
      badgeText: "SAVE UP TO $200",
      title1: "HARDWARE",
      title2: "VAULT",
      subtitle: "Upgrade your rig with premium computing hardware, exclusively discounted for a limited time.",
      orb1: "bg-purple-500",
      orb2: "bg-pink-600",
      textGradient: "from-purple-400 to-pink-500",
      bgText: "HARDWARE VAULT • TECH DISCOUNTS • NEW GEAR • ",
      btnHover: "hover:bg-purple-400",
      pulseColor: "bg-purple-400",
      products: MOCK_BANNER_PRODUCTS,
    },
    {
      id: 2,
      badgeText: "MEMBER EXCLUSIVE",
      title1: "PREMIUM",
      title2: "ASSETS",
      subtitle: "Unlock high-end fashion, luxury goods, and rare collectibles sourced globally.",
      orb1: "bg-orange-500",
      orb2: "bg-yellow-500",
      textGradient: "from-orange-400 to-yellow-500",
      bgText: "PREMIUM ASSETS • LUXURY DROPS • VERIFIED • ",
      btnHover: "hover:bg-orange-400",
      pulseColor: "bg-orange-400",
      products: MOCK_BANNER_PRODUCTS,
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="w-full mb-12 relative overflow-hidden rounded-[2rem] bg-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/[0.08] min-h-[500px] flex flex-col group font-sans">
      
      {/* Global CSS for this component */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-20px) rotate(-4deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(8deg); }
          50% { transform: translateY(-15px) rotate(10deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
        }
        @keyframes scroll-massive {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-massive {
          animation: scroll-massive 40s linear infinite;
        }
        .float-card-1 { animation: float-slow 6s ease-in-out infinite; }
        .float-card-2 { animation: float-medium 7s ease-in-out infinite 0.5s; }
        .float-card-3 { animation: float-fast 5s ease-in-out infinite 1s; }
      `}</style>

      {/* Container for sliding banners */}
      <div 
        className="absolute top-0 left-0 h-full w-full flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => {
          const massiveBgText = [...Array(4)].fill(banner.bgText).join("");

          return (
            <div 
              key={banner.id} 
              className="w-full h-full flex-shrink-0 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Massive Ambient Orbs */}
              <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] ${banner.orb1} rounded-full blur-[150px] opacity-40 mix-blend-screen pointer-events-none`}></div>
              <div className={`absolute -bottom-40 -right-40 w-[800px] h-[800px] ${banner.orb2} rounded-full blur-[180px] opacity-30 mix-blend-screen pointer-events-none`}></div>

              {/* Massive Background Marquee */}
              <div className="absolute top-1/2 left-0 w-max -translate-y-1/2 z-0 opacity-[0.03] flex pointer-events-none">
                 <h1 className="text-[16rem] font-black whitespace-nowrap animate-scroll-massive leading-none tracking-tighter text-white">
                    {massiveBgText}
                 </h1>
              </div>

              <div className="absolute inset-0 z-10 flex px-10 md:px-16 py-12">
                {/* Left Side Content */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-start z-20">
                   <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 text-xs font-bold tracking-widest text-white flex items-center gap-3 shadow-xl">
                      <span className={`w-2 h-2 rounded-full ${banner.pulseColor} animate-pulse shadow-[0_0_10px_currentColor]`}></span> 
                      {banner.badgeText}
                   </div>

                   <h2 className="text-[5rem] md:text-[6rem] lg:text-[7rem] font-black leading-[0.85] tracking-tighter text-white mb-6">
                      <span className="block drop-shadow-2xl">{banner.title1}</span>
                      <span className={`text-transparent bg-clip-text bg-gradient-to-r ${banner.textGradient} drop-shadow-lg`}>
                        {banner.title2}
                      </span>
                   </h2>

                   <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed font-medium">
                      {banner.subtitle}
                   </p>

                   <a href="/shop" className={`px-10 py-5 rounded-2xl bg-white text-black font-black tracking-widest uppercase ${banner.btnHover} hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-3`}>
                      Explore Collection
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                   </a>
                </div>

                {/* Right Side Floating Glass Cards */}
                <div className="hidden lg:flex w-1/2 h-full relative z-10 items-center justify-center">
                   {/* Card 1 (Back Left) */}
                   {banner.products[0] && (
                     <div className="absolute left-10 top-16 w-64 p-3 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] float-card-1 z-10 hover:z-40 transition-z">
                        <div className="w-full h-56 rounded-2xl overflow-hidden mb-4 relative">
                          <img src={banner.products[0].image} className="w-full h-full object-cover" alt={banner.products[0].name} />
                        </div>
                        <div className="px-2 pb-2">
                           <div className="font-bold text-white text-base truncate mb-1">{banner.products[0].name}</div>
                           <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                              {`${banner.products[0].priceCrypto.toFixed(2)} USDC`}
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Card 2 (Front Center) */}
                   {banner.products[1] && (
                     <div className="absolute left-1/4 top-32 w-72 p-4 rounded-3xl bg-white/[0.08] border border-white/20 backdrop-blur-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] float-card-2 z-30 hover:z-40 transition-z">
                        <div className="w-full h-64 rounded-2xl overflow-hidden mb-4 relative">
                          <img src={banner.products[1].image} className="w-full h-full object-cover" alt={banner.products[1].name} />
                        </div>
                        <div className="px-2 pb-2">
                           <div className="font-black text-white text-lg truncate mb-1">{banner.products[1].name}</div>
                           <div className="flex items-center justify-between">
                              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">{banner.products[1].category}</div>
                              <div className={`text-base font-black text-transparent bg-clip-text bg-gradient-to-r ${banner.textGradient}`}>
                                  {`${banner.products[1].priceCrypto.toFixed(2)} USDC`}
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Card 3 (Back Right) */}
                   {banner.products[2] && (
                     <div className="absolute right-10 top-12 w-60 p-3 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] float-card-3 z-20 hover:z-40 transition-z">
                        <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 relative">
                          <img src={banner.products[2].image} className="w-full h-full object-cover" alt={banner.products[2].name} />
                        </div>
                        <div className="px-2 pb-2">
                           <div className="font-bold text-white text-base truncate mb-1">{banner.products[2].name}</div>
                           <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                              {`${banner.products[2].priceCrypto.toFixed(2)} USDC`}
                           </div>
                        </div>
                     </div>
                   )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Carousel Indicators */}
      <div className="absolute bottom-0 left-0 w-full flex justify-center pb-8 gap-3 z-40">
        {banners.map((_, idx) => (
          <div 
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="w-16 h-1.5 rounded-full cursor-pointer transition-all duration-500 overflow-hidden bg-white/20"
          >
             <div 
               className="h-full bg-white rounded-full transition-all duration-[7000ms] ease-linear"
               style={{ 
                 width: currentIndex === idx ? '100%' : '0%',
                 opacity: currentIndex === idx ? 1 : 0
               }}
             />
          </div>
        ))}
      </div>
    </div>
  );
}
