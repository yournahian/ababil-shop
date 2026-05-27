import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { mockProducts, Product } from '../data/mockProducts';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Star, Wallet, Globe, Zap } from 'lucide-react';
import DiscoveryTabs from '../components/DiscoveryTabs';
import FlashSaleBanner from '../components/FlashSaleBanner';

// --- Reusable Component for Rotating "Marquee/Swap" Effect ---
interface RotatingBentoCardProps {
  products: Product[];
  intervalMs: number;
  badgeText: string;
  badgeColorClass: string;
  className: string;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
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
      }, 500); // 500ms fade duration
    }, intervalMs);
    return () => clearInterval(timer);
  }, [products, intervalMs]);

  if (!products || products.length === 0) return null;

  const currentProduct = products[currentIndex];

  return (
    <Link 
      to={`/product/${currentProduct.id}`}
      className={`${className} bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(0,255,255,0.15)] flex flex-col`}
    >
      <div className="flex-[3] relative w-full overflow-hidden bg-black/50 border-b border-white/5 flex items-center justify-center">
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
        <h3 className={`text-base font-bold text-white line-clamp-1 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {currentProduct.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className={`text-lg font-bold ${currentProduct.category === 'NFTs' || currentProduct.category === 'Digital Assets' ? 'text-primary' : 'text-white'} transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {currentProduct.category === 'NFTs' || currentProduct.category === 'Digital Assets' 
              ? `${currentProduct.priceCrypto} ETH` 
              : `$${currentProduct.priceUSD}`}
          </div>
          <button 
            onClick={(e) => onAddToCart(e, currentProduct)}
            className="px-4 py-2 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary rounded-lg text-xs font-bold uppercase transition-all z-20"
          >
            Add
          </button>
        </div>
      </div>
    </Link>
  );
};

const Home: React.FC = () => {
  const { addToCart } = useShop();
  const { isLoggedIn, user } = useAuth();

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  // 1. Hero Product (Static)
  const heroProduct = mockProducts.find(p => p.name.includes('Deck')) || mockProducts[0];
  
  // 2. Personalized Item (Static based on user)
  const personalizedItem = mockProducts.find(p => p.category === 'Tech Hardware' && p.id !== heroProduct.id) || mockProducts[1];
  
  // 3. Flash Deals (Static 2-item Grid)
  const flashDeals = mockProducts.filter(p => p.category === 'Apparel').slice(0, 2);

  // --- Static Tall Lists (Top Sellers, Best Sellers) -> Expanded to 7 items! ---
  const trendingAssets = mockProducts.filter(p => p.category === 'NFTs' || p.category === 'Digital Assets').slice(0, 7);
  const apparelBestSellers = mockProducts.filter(p => p.category === 'Apparel').slice(0, 7);
  // Swapped Tech Hardware for Gifts category to add variety
  const giftsBestSellers = mockProducts.filter(p => p.category === 'Gifts').slice(0, 7);

  // --- Dynamic Rotating Categories (For the Marquee Swap effect) ---
  const budgetItems = [...mockProducts].filter(p => p.priceUSD < 50);
  const homeArrivals = mockProducts.filter(p => p.category === 'Home & Living');
  const giftsForMom = mockProducts.filter(p => p.category === 'Gifts');
  const topToys = mockProducts.filter(p => p.category === 'Toys');
  const internationalTrending = mockProducts.filter(p => p.category === 'Tech Hardware');
  const cyberpunkGear = mockProducts.filter(p => p.name.includes('Cyberpunk') || p.category === 'Apparel');
  const exclusiveNFTs = mockProducts.filter(p => p.category === 'NFTs');
  const metaverseExplore = mockProducts.filter(p => p.category === 'Digital Assets');

  return (
    <div className="flex flex-col min-h-screen bg-black selection:bg-primary/30 selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-24 px-6 max-w-[1400px] mx-auto w-full">
        
        {/* Slogan removed! Bento Grid is the immediate focal point */}

        {/* Discovery Tabs (Alibaba Style) */}
        <DiscoveryTabs />
        
        {/* Massive Flash Sale Hero Banner */}
        <FlashSaleBanner />
        
        {/* E-Commerce Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[340px]">
          
          {/* Row 1 & 2 */}

          {/* 1. Hero Product Card (2x2) */}
          <Link 
            to={`/product/${heroProduct.id}`}
            className="md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(0,255,255,0.15)] flex flex-col"
          >
             <div className="flex-[3] relative w-full overflow-hidden bg-white/5">
               <div className="absolute top-6 left-6 z-20 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
                 Deal of the Day
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
                    <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{heroProduct.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 font-bold text-white">{heroProduct.rating}</span>
                      </div>
                      <span>({heroProduct.reviewCount} reviews)</span>
                      <span>•</span>
                      <span className="uppercase text-primary">{heroProduct.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">${heroProduct.priceUSD}</div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleAddToCart(e, heroProduct)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
             </div>
          </Link>

          {/* 2. Top Sellers List (1x2) - 7 Items, compressed layout to fit exactly */}
          <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-br from-purple-900/40 via-[#0a0a0a] to-[#0a0a0a] border border-purple-500/30 rounded-[2rem] p-5 flex flex-col relative group transition-all duration-500 hover:border-purple-400 shadow-[inset_0_0_50px_rgba(168,85,247,0.1)]">
             <div className="mb-3">
               <h3 className="text-xl font-bold text-white tracking-tight">Top Sellers</h3>
               <p className="text-[10px] text-primary uppercase tracking-widest font-semibold mt-0.5">Digital Assets</p>
             </div>
             
             <div className="flex-1 flex flex-col justify-between gap-1">
                {trendingAssets.map((asset) => (
                   <Link 
                     to={`/product/${asset.id}`} 
                     key={asset.id} 
                     className="flex gap-3 items-center group/item hover:bg-white/5 p-1 -mx-1 rounded-xl transition-colors"
                   >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={asset.image} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold text-white line-clamp-1">{asset.name}</div>
                         <div className="text-gray-400 text-[10px] font-mono mt-0.5">{asset.priceCrypto} ETH</div>
                      </div>
                      <button 
                        onClick={(e) => handleAddToCart(e, asset)}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/item:bg-primary group-hover/item:text-black transition-colors shrink-0"
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </button>
                   </Link>
                ))}
             </div>
          </div>

          {/* 3. Budget Deal (1x1) - Rotating 4.5s */}
          <RotatingBentoCard 
            products={budgetItems} 
            intervalMs={4500} 
            badgeText="Under $50" 
            badgeColorClass="bg-red-500/20 text-red-500" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 4. Personalized Block (1x1) - Static */}
          <div className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] overflow-hidden relative group transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(0,255,255,0.15)] flex flex-col">
             {isLoggedIn && user ? (
                <Link to={`/product/${personalizedItem.id}`} className="flex flex-col w-full h-full">
                  <div className="flex-[3] relative w-full overflow-hidden bg-black/50 border-b border-white/5">
                    <div className="absolute top-4 left-4 z-20 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md">
                      For You
                    </div>
                    <img src={personalizedItem.image} alt={personalizedItem.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                  </div>
                  <div className="flex-[2] p-5 bg-[#0a0a0a] flex flex-col justify-between">
                    <h3 className="text-base font-bold text-white line-clamp-1">{personalizedItem.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-white">${personalizedItem.priceUSD}</div>
                      <button 
                        onClick={(e) => handleAddToCart(e, personalizedItem)}
                        className="px-4 py-2 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary rounded-lg text-xs font-bold uppercase transition-all z-20"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </Link>
             ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-4">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Login for Deals</h3>
                  <p className="text-xs text-gray-500 mb-4">Get personalized recommendations based on your wallet.</p>
                  <Link to="/login" className="px-6 py-2 border border-primary text-primary rounded-full text-xs font-bold uppercase hover:bg-primary hover:text-black transition-colors z-20">
                    Connect Wallet
                  </Link>
                </div>
             )}
          </div>

          {/* Row 3 & 4 */}

          {/* 5. Best Sellers Apparel (1x2) - 7 Items, compressed layout */}
          <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-5 flex flex-col relative group transition-all duration-500 hover:border-primary/20">
             <div className="mb-3">
               <h3 className="text-xl font-bold text-white tracking-tight leading-tight">Best Sellers</h3>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">Clothing & Shoes</p>
             </div>
             
             <div className="flex-1 flex flex-col justify-between gap-1">
                {apparelBestSellers.map((asset) => (
                   <Link 
                     to={`/product/${asset.id}`} 
                     key={asset.id} 
                     className="flex gap-3 items-center group/item hover:bg-white/5 p-1 -mx-1 rounded-xl transition-colors"
                   >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={asset.image} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold text-white line-clamp-1">{asset.name}</div>
                         <div className="text-gray-400 text-[10px] font-bold mt-0.5">${asset.priceUSD}</div>
                      </div>
                      <button 
                        onClick={(e) => handleAddToCart(e, asset)}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/item:bg-primary group-hover/item:text-black transition-colors shrink-0"
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </button>
                   </Link>
                ))}
             </div>
          </div>

          {/* 6. Flash Deals Grid (2x1) - Static 2 item grid */}
          <div className="md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1 bg-gradient-to-br from-red-900/40 via-orange-900/20 to-[#0a0a0a] border border-orange-500/30 rounded-[2rem] p-6 relative group transition-all duration-500 hover:border-orange-400 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)] flex flex-col">
             <div className="flex justify-between items-center mb-4 px-2">
               <div>
                 <h3 className="text-lg font-bold text-white">Flash Deals</h3>
               </div>
               <div className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
                 Ends Soon
               </div>
             </div>
             
             <div className="flex-1 grid grid-cols-2 gap-4">
                {flashDeals.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.id}`}
                    className="flex gap-4 items-center bg-white/5 border border-white/5 rounded-xl p-3 hover:border-primary/30 hover:bg-white/10 transition-all group/card"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white line-clamp-1 mb-1">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">${item.priceUSD}</span>
                      </div>
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

          {/* 7. Home Arrivals (1x1) - Rotating 6s */}
          <RotatingBentoCard 
            products={homeArrivals} 
            intervalMs={6000} 
            badgeText="New Home" 
            badgeColorClass="bg-white/10 text-white" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 8. Gifts for Mom (1x1) - Rotating 7.5s */}
          <RotatingBentoCard 
            products={giftsForMom} 
            intervalMs={7500} 
            badgeText="Gifts for Mom" 
            badgeColorClass="bg-pink-500/20 text-pink-400" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 9. Toys for You (1x1) - Rotating 5.5s */}
          <RotatingBentoCard 
            products={topToys} 
            intervalMs={5500} 
            badgeText="Top Toys" 
            badgeColorClass="bg-blue-500/20 text-blue-400" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 10. International Purchases (1x1) - Rotating 4s */}
          <RotatingBentoCard 
            products={internationalTrending} 
            intervalMs={4000} 
            badgeText="Trending Globally" 
            badgeColorClass="bg-white/5 border border-white/10 text-white" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
            icon={<Globe className="w-5 h-5 text-primary opacity-50" />}
          />

          {/* Row 5 & 6 */}

          {/* 11. Most Gifted Best Sellers (1x2) - 7 Items, compressed layout */}
          <div className="md:col-span-1 md:row-span-2 lg:col-span-1 lg:row-span-2 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-5 flex flex-col relative group transition-all duration-500 hover:border-primary/20">
             <div className="mb-3">
               <h3 className="text-xl font-bold text-white tracking-tight leading-tight">Most Gifted</h3>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">Luxury & Spa</p>
             </div>
             
             <div className="flex-1 flex flex-col justify-between gap-1">
                {giftsBestSellers.map((asset) => (
                   <Link 
                     to={`/product/${asset.id}`} 
                     key={asset.id} 
                     className="flex gap-3 items-center group/item hover:bg-white/5 p-1 -mx-1 rounded-xl transition-colors"
                   >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={asset.image} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold text-white line-clamp-1">{asset.name}</div>
                         <div className="text-gray-400 text-[10px] font-bold mt-0.5">${asset.priceUSD}</div>
                      </div>
                      <button 
                        onClick={(e) => handleAddToCart(e, asset)}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover/item:bg-primary group-hover/item:text-black transition-colors shrink-0"
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </button>
                   </Link>
                ))}
             </div>
          </div>

          {/* 12. Metaverse Explore (2x1) - Rotating 8s */}
          <div className="md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-6 relative group transition-all duration-500 hover:border-primary/20 flex flex-col">
             <div className="flex justify-between items-center mb-4 px-2">
               <div>
                 <h3 className="text-lg font-bold text-white">Explore the Metaverse</h3>
                 <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Virtual Real Estate & Assets</p>
               </div>
               <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 flex items-center gap-1">
                 <Zap className="w-3 h-3" /> Live
               </div>
             </div>
             
             <div className="flex-1 grid grid-cols-2 gap-4">
                {metaverseExplore.slice(0, 2).map(item => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.id}`}
                    className="flex gap-4 items-center bg-white/5 border border-white/5 rounded-xl p-3 hover:border-primary/30 hover:bg-white/10 transition-all group/card"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white line-clamp-1 mb-1">{item.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">{item.priceCrypto} ETH</span>
                      </div>
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

          {/* 13. Cyberpunk Gear (1x1) - Rotating 6.5s */}
          <RotatingBentoCard 
            products={cyberpunkGear} 
            intervalMs={6500} 
            badgeText="Cyberpunk" 
            badgeColorClass="bg-purple-500/20 text-purple-400" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 14. Exclusive NFT (1x1) - Rotating 5s */}
          <RotatingBentoCard 
            products={exclusiveNFTs} 
            intervalMs={5000} 
            badgeText="Rare Drop" 
            badgeColorClass="bg-yellow-500/20 text-yellow-500" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 15. Daily Deal Home (1x1) - Rotating 8.5s */}
          <RotatingBentoCard 
            products={homeArrivals.slice().reverse()} 
            intervalMs={8500} 
            badgeText="Daily Deal" 
            badgeColorClass="bg-orange-500/20 text-orange-400" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

          {/* 16. Best Toys (1x1) - Rotating 7s */}
          <RotatingBentoCard 
            products={topToys.slice().reverse()} 
            intervalMs={7000} 
            badgeText="Kids Choice" 
            badgeColorClass="bg-green-500/20 text-green-400" 
            className="md:col-span-1 md:row-span-1 lg:col-span-1 lg:row-span-1"
            onAddToCart={handleAddToCart}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
