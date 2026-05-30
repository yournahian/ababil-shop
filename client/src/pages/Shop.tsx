import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { mockProducts, Product, ProductCategory } from '../data/mockProducts';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

type SortOption = 'Price: Low to High' | 'Price: High to Low' | 'Highest Rated';

const Shop: React.FC = () => {
  const [filter, setFilter] = useState<ProductCategory | 'All'>('All');
  const [sortOption, setSortOption] = useState<SortOption>('Highest Rated');
  const { searchQuery } = useShop();

  const filteredAndSortedProducts = useMemo(() => {
    let result = mockProducts;

    // 1. Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some(t => t.toLowerCase().includes(lowerQuery))
      );
    }

    // 2. Filter by Category
    if (filter !== 'All') {
      result = result.filter(p => p.category === filter);
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      // Use USD price for sorting simplicity across all items
      if (sortOption === 'Price: Low to High') {
        return a.priceUSD - b.priceUSD;
      }
      if (sortOption === 'Price: High to Low') {
        return b.priceUSD - a.priceUSD;
      }
      if (sortOption === 'Highest Rated') {
        return b.rating - a.rating;
      }
      return 0;
    });

    return result;
  }, [filter, sortOption, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-bold">
            {searchQuery ? `Search Results: "${searchQuery}"` : 'Marketplace'}
          </h1>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="appearance-none bg-black/50 border border-white/20 text-white py-2 pl-4 pr-10 rounded-full focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="Highest Rated">Highest Rated</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['All', 'Tech Hardware', 'Apparel', 'Digital Assets', 'NFTs'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
                filter === f 
                ? 'border-primary bg-primary text-black font-bold shadow-[0_0_10px_rgba(0,255,255,0.3)]' 
                : 'border-white/20 text-gray-300 hover:border-primary hover:text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl border border-white/10">
            <div className="text-gray-400 text-lg">No products found matching your criteria.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id}>
                <ProductCard 
                  id={product.id}
                  title={product.name}
                  image={product.image}
                  price={`${product.priceCrypto.toFixed(2)} USDC`}
                  isWeb3={product.category === 'NFTs' || product.category === 'Digital Assets'}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
