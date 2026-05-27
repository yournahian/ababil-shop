import React from 'react';
import { useShop } from '../context/ShopContext';

export interface ProductCardProps {
  id: number;
  title: string;
  image: string;
  price: string;
  isWeb3: boolean;
  rating: number;
  reviewCount: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, image, price, isWeb3, rating, reviewCount }) => {
  const { wishlist, toggleWishlist } = useShop();
  const isWishlisted = wishlist.includes(id);

  return (
    <div className="bento-item group relative h-full flex flex-col p-4 cursor-pointer">
      {/* Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-black">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        
        {/* Wishlist Heart */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(id);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-primary transition-colors"
        >
          <svg 
            className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-primary fill-primary' : 'text-white/70 hover:text-white'}`} 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            fill={isWishlisted ? "currentColor" : "none"}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Web3 Badge */}
        {isWeb3 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-primary/50 rounded text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
            </svg>
            NFT Match
          </div>
        )}
        
        {!isWeb3 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/20 rounded text-[10px] font-bold text-white uppercase tracking-wider">
            Physical
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <svg className="w-3 h-3 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium text-gray-300">{rating}</span>
            <span>({reviewCount})</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-medium text-gray-300">
            {price}
          </span>
          <button 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
