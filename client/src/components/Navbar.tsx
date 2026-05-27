import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { cartCount, toggleCart, setSearchQuery, products } = useShop();
  const { isLoggedIn, user, logout } = useAuth();
  const [localSearch, setLocalSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(localSearch);
      setShowDropdown(false);
      navigate('/shop');
    }
  };

  const searchResults = localSearch.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(localSearch.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(localSearch.toLowerCase()))
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
    <nav className="fixed top-0 w-full z-50 glass px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-wider">
          ABABIL<span className="text-primary">.</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/shop" className="text-gray-300 hover:text-primary transition-colors">Marketplace</Link>
          {user?.role === 'buyer' && (
            <Link to="/dashboard" className="text-gray-300 hover:text-primary transition-colors">Buyer Dashboard</Link>
          )}
          {user?.role === 'seller' && (
            <Link to="/seller-dashboard" className="text-gray-300 hover:text-primary transition-colors">Seller Dashboard</Link>
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
                  <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
                    Suggestions
                  </div>
                  {searchResults.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setShowDropdown(false);
                        setLocalSearch('');
                        navigate(`/product/${product.id}`);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-md border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {highlightMatch(product.name, localSearch)}
                        </div>
                        <div className="text-xs text-primary uppercase tracking-wider truncate">
                          {product.category}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-white">
                        ${product.priceUSD.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-gray-400 text-center">
                  No matches found for "{localSearch}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {(!user || user.role === 'buyer') && (
            <button onClick={toggleCart} className="relative p-2 text-gray-300 hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black bg-primary rounded-full transform translate-x-1/4 -translate-y-1/4">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          
          {isLoggedIn && user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary bg-primary/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-blue-500"></div>
                <span className="text-primary font-mono text-sm hidden sm:inline-block">
                  {user.dummyWallet.slice(0, 4)}...{user.dummyWallet.slice(-4)}
                </span>
              </div>
              <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link 
                to="/signup"
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
};

export default Navbar;
