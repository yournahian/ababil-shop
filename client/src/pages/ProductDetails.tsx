import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { mockProducts, Product } from '../data/mockProducts';
import { useShop } from '../context/ShopContext';
import { ReviewSection } from '../components/ReviewSection';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, wishlist, toggleWishlist } = useShop();

  useEffect(() => {
    if (id) {
      const foundProduct = mockProducts.find(p => p.id === parseInt(id));
      if (foundProduct) {
        setProduct(foundProduct);
        if (foundProduct.moq) {
          setQuantity(foundProduct.moq);
        }
        
        // Generate Synergy Bundle items
        const others = mockProducts.filter(p => p.id !== foundProduct.id);
        const bundle1 = others[(foundProduct.id + 1) % others.length];
        const bundle2 = others[(foundProduct.id + 2) % others.length];
        setBundleItems([bundle1, bundle2]);
      }
    }
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-primary animate-pulse">Loading Asset...</div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const isDigital = product.category === 'NFTs' || product.category === 'Digital Assets';
  const isB2B = !!product.moq;

  // Calculate current price based on quantity tiers
  let currentPriceUSD = product.priceUSD;
  let currentPriceCrypto = product.priceCrypto;

  if (isB2B && product.tieredPricing) {
    const matchedTier = product.tieredPricing.find(t => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity));
    if (matchedTier) {
      currentPriceUSD = matchedTier.priceUSD;
      currentPriceCrypto = matchedTier.priceCrypto;
    } else if (quantity >= (product.moq || 1)) {
      const lastTier = product.tieredPricing[product.tieredPricing.length - 1];
      currentPriceUSD = lastTier.priceUSD;
      currentPriceCrypto = lastTier.priceCrypto;
    }
  }

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleAddBundle = () => {
    addToCart(product);
    bundleItems.forEach(item => addToCart(item));
  };

  const bundleOriginalUSD = product.priceUSD + bundleItems.reduce((acc, item) => acc + item.priceUSD, 0);
  const bundleDiscountedUSD = bundleOriginalUSD * 0.9;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-6 max-w-7xl mx-auto w-full">
        <Link to="/shop" className="text-primary hover:underline mb-8 inline-block">&larr; Back to Shop</Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Area */}
          <div className="relative rounded-2xl overflow-hidden glass aspect-square border border-white/10 group flex items-center justify-center">
            <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            
            {/* Wishlist Button Overlay */}
            <button 
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-6 right-6 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:border-primary transition-all"
            >
              <svg 
                className={`w-6 h-6 transition-colors ${isWishlisted ? 'text-primary fill-primary' : 'text-white hover:text-primary'}`} 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                fill={isWishlisted ? "currentColor" : "none"}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {isDigital && (
              <div className="absolute top-6 left-6 bg-primary text-black text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                Web3 Verified
              </div>
            )}
          </div>

          {/* Details Area */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="uppercase tracking-widest text-primary text-sm font-bold">
                {product.category}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                <svg className="w-4 h-4 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-white">{product.rating}</span>
                <span>({product.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>

            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* B2B Tiered Pricing Table */}
            {isB2B && product.tieredPricing && (
              <div className="mb-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-white/5 font-semibold text-sm border-b border-white/10">Pricing Tiers (MOQ: {product.moq})</div>
                <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  
                  {/* Retail Tier (Below MOQ) */}
                  <button 
                    onClick={() => setQuantity(1)}
                    className={`p-2 rounded-lg border text-center transition-all ${quantity < (product.moq || 1) ? 'border-primary bg-primary/10' : 'border-transparent bg-black/20 hover:border-white/20'}`}
                  >
                    <div className="text-xs text-gray-400 mb-1">1 - {(product.moq || 1) - 1} units</div>
                    <div className="font-bold text-white">${product.priceUSD}</div>
                  </button>

                  {/* Wholesale Tiers */}
                  {product.tieredPricing.map((tier, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setQuantity(tier.minQuantity)}
                      className={`p-2 rounded-lg border text-center transition-all ${quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity) ? 'border-primary bg-primary/10' : 'border-transparent bg-black/20 hover:border-white/20'}`}
                    >
                      <div className="text-xs text-gray-400 mb-1">{tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} units</div>
                      <div className="font-bold text-white">${tier.priceUSD}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6 mb-8 bg-black/40 p-6 rounded-2xl border border-white/5">
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Unit Price (USD)</div>
                  <div className="text-4xl font-bold">${currentPriceUSD.toLocaleString()}</div>
                </div>
                <div className="pb-1">
                  <div className="text-sm text-gray-500 mb-1">Crypto Price</div>
                  <div className="text-2xl text-primary font-mono">{currentPriceCrypto} ETH</div>
                </div>
              </div>

              {/* Quantity Selector */}
              {(!isDigital || isB2B) && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-sm text-gray-400">Quantity:</div>
                  <div className="flex items-center border border-white/20 rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                    >-</button>
                    <input 
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                         const val = parseInt(e.target.value);
                         setQuantity(isNaN(val) || val < 1 ? 1 : val);
                      }}
                      className="px-2 py-2 bg-black/50 w-20 text-center text-white focus:outline-none font-mono"
                    />
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                    >+</button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-wide ${product.inStock ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {product.inStock ? 'Available for Purchase' : 'Out of Stock / Fully Minted'}
              </span>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 py-4 rounded-xl bg-primary text-black font-bold text-lg hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none uppercase tracking-wider"
              >
                Buy Now
              </button>
              {isB2B && (
                <button 
                  className="flex-1 py-4 rounded-xl bg-transparent border border-primary text-primary font-bold text-lg hover:bg-primary/10 transition-all duration-300 uppercase tracking-wider"
                >
                  Request Quote
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Synergy Bundles Section */}
        {bundleItems.length === 2 && (
          <div className="mb-16 glass rounded-3xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Synergy Bundles</h2>
            <p className="text-gray-400 mb-8">Frequently bought together. Get 10% off when you buy all three.</p>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              
              {/* Items Row */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-primary/50 shrink-0 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="text-primary font-bold text-2xl animate-pulse">+</div>
                
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-white/10 shrink-0">
                  <img src={bundleItems[0].image} alt={bundleItems[0].name} className="w-full h-full object-cover" />
                </div>
                
                <div className="text-primary font-bold text-2xl animate-pulse">+</div>
                
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-white/10 shrink-0">
                  <img src={bundleItems[1].image} alt={bundleItems[1].name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex flex-col items-center md:items-end min-w-[200px] mt-6 md:mt-0">
                <div className="text-gray-500 line-through text-sm mb-1">
                  ${bundleOriginalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-3xl font-bold text-white mb-4">
                  ${bundleDiscountedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <button 
                  onClick={handleAddBundle}
                  className="w-full py-3 px-6 rounded-xl bg-primary text-black font-bold hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all uppercase tracking-wider text-sm"
                >
                  Add Bundle to Cart
                </button>
              </div>

            </div>
          </div>
        )}

        <ReviewSection />
        
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;
