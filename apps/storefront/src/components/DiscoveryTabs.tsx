'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, RefreshCw, Truck, Headset, ArrowRight, Search, Medal, Target, Menu } from 'lucide-react';

type Tab = 'categories' | 'verified' | 'protections';
type ProductCategory = 'Tech Hardware' | 'Apparel' | 'Digital Assets' | 'NFTs' | 'Home & Living' | 'Gifts' | 'Toys';

// Mock list matching original exactly for rendering mega menu
const MOCK_PRODUCTS = [
  { id: '1', name: 'Quantum Headset', category: 'Tech Hardware', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Cyber Deck V2', category: 'Tech Hardware', image: 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Reflective Laces (Neon)', category: 'Apparel', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Ababil 3D Coin Asset', category: 'Digital Assets', image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Base Swallow genesis NFT', category: 'NFTs', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Cyber Glow Coaster', category: 'Home & Living', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400' }
];

export default function DiscoveryTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('Tech Hardware');
  const [isOpen, setIsOpen] = useState(false);

  const categories: ProductCategory[] = ['Tech Hardware', 'Apparel', 'Digital Assets', 'NFTs', 'Home & Living', 'Gifts', 'Toys'];
  const categoryProducts = MOCK_PRODUCTS.filter(p => p.category === activeCategory).slice(0, 12);

  return (
    <div 
      className="mb-8 relative z-50 font-sans"
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* The Visible Tabs Trigger Row */}
      <div className="flex items-center gap-8 mb-2 px-2">
        <button 
          onMouseEnter={() => { setActiveTab('categories'); setIsOpen(true); }}
          className={`flex items-center gap-2 pb-2 text-sm font-bold transition-colors relative ${isOpen && activeTab === 'categories' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
        >
          <Menu className="w-5 h-5 text-primary" /> All categories
          {isOpen && activeTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#00ffff]" />}
        </button>
        <button 
          onMouseEnter={() => { setActiveTab('verified'); setIsOpen(true); }}
          className={`pb-2 text-sm font-bold transition-colors relative ${isOpen && activeTab === 'verified' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
        >
          Verified sellers
          {isOpen && activeTab === 'verified' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#00ffff]" />}
        </button>
        <button 
          onMouseEnter={() => { setActiveTab('protections'); setIsOpen(true); }}
          className={`pb-2 text-sm font-bold transition-colors relative ${isOpen && activeTab === 'protections' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
        >
          Order protections
          {isOpen && activeTab === 'protections' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#00ffff]" />}
        </button>
      </div>

      {/* Mega Menu Dropdown */}
      <div className={`absolute top-full left-0 w-full bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-300 origin-top overflow-hidden ${isOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible pointer-events-none'}`}>
        
        {/* Tab Content Area */}
        <div className="min-h-[400px]">
        
        {/* TAB 1: ALL CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="flex h-full min-h-[400px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-2 overflow-y-auto bg-white/[0.02]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {/* Grid Area */}
            <div className="flex-1 p-8">
              <h3 className="text-xl font-bold text-white mb-6">Categories for you: <span className="text-primary">{activeCategory}</span></h3>
              <div className="grid grid-cols-4 lg:grid-cols-6 gap-y-8 gap-x-4">
                {categoryProducts.map((product) => (
                  <div key={product.id} className="flex flex-col items-center gap-3 group cursor-pointer">
                    <div className="w-20 h-20 rounded-full border border-white/10 overflow-hidden relative group-hover:border-primary/50 transition-colors">
                       <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300" />
                    </div>
                    <span className="text-xs text-gray-300 text-center font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFIED SELLERS */}
        {activeTab === 'verified' && (
          <div className="flex h-full min-h-[400px]">
            {/* Left Banner */}
            <div className="w-1/3 bg-gradient-to-br from-primary/20 to-black p-10 flex flex-col justify-center border-r border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-6 relative z-10">
                Your shortcut to <br/><span className="text-primary flex items-center gap-2 mt-2"><CheckCircle className="w-8 h-8" /> Verified sellers</span>
              </h2>
              <div className="flex gap-6 mb-8 relative z-10">
                <div>
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Verified<br/>Sellers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Escrow<br/>Ready</div>
                </div>
              </div>
              <button className="bg-primary text-black font-bold px-6 py-3 rounded-full w-fit hover:shadow-[0_0_20px_#00ffff] transition-shadow relative z-10">
                Explore now
              </button>
            </div>

            {/* Middle Cards */}
            <div className="w-1/2 p-8 grid grid-cols-2 gap-6 bg-[#0a0a0a]">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between group cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden">
                <Search className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold text-white">Smart contract search</h3>
                <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between group cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden">
                <Medal className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold text-white">Top seller rankings</h3>
                <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-primary/10 to-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors">
                <div>
                  <Target className="w-8 h-8 text-primary mb-2" />
                  <h3 className="text-lg font-bold text-white">Direct-to-Buyer drops</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Right Links */}
            <div className="w-1/6 border-l border-white/5 p-8 bg-white/[0.02] flex flex-col justify-center gap-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Other Selections</h4>
              <button className="text-left text-sm text-gray-400 hover:text-primary transition-colors">Dropshipping center</button>
              <button className="text-left text-sm text-gray-400 hover:text-primary transition-colors">Sample center</button>
              <button className="text-left text-sm text-gray-400 hover:text-primary transition-colors">Fast customization</button>
            </div>
          </div>
        )}

        {/* TAB 3: ORDER PROTECTIONS */}
        {activeTab === 'protections' && (
          <div className="flex h-full min-h-[400px]">
            {/* Left Title */}
            <div className="w-5/12 p-12 flex flex-col justify-center border-r border-white/5 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <ShieldCheck className="w-10 h-10 text-primary" />
                <h2 className="text-2xl font-bold text-white">Ababil Escrow</h2>
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight mb-8 relative z-10">
                Enjoy protection from <br/>crypto payment to delivery
              </h1>
              <button className="bg-primary text-black font-bold px-8 py-3 rounded-full w-fit hover:shadow-[0_0_20px_#00ffff] transition-shadow relative z-10">
                Learn more
              </button>
            </div>

            {/* Right Grid */}
            <div className="w-7/12 p-8 grid grid-cols-2 gap-6 bg-[#0a0a0a]">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">Safe & easy crypto payments</h3>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">Cryptographic refund policy</h3>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">Global shipping & logistics</h3>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 group hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Headset className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">After-sales dispute resolution</h3>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
