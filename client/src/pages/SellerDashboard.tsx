import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Package, DollarSign, Eye, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductCategory } from '../data/mockProducts';

const salesData = [
  { name: 'Mon', usd: 4000, crypto: 2400 },
  { name: 'Tue', usd: 3000, crypto: 1398 },
  { name: 'Wed', usd: 2000, crypto: 9800 },
  { name: 'Thu', usd: 2780, crypto: 3908 },
  { name: 'Fri', usd: 1890, crypto: 4800 },
  { name: 'Sat', usd: 2390, crypto: 3800 },
  { name: 'Sun', usd: 3490, crypto: 4300 },
];

const viewsData = [
  { name: 'Week 1', views: 12000 },
  { name: 'Week 2', views: 19000 },
  { name: 'Week 3', views: 15000 },
  { name: 'Week 4', views: 22000 },
];

const SellerDashboard: React.FC = () => {
  const [listingType, setListingType] = useState<'standard' | 'b2b' | 'nft'>('standard');
  const { sellerTransactions, addProduct } = useShop();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Tech Hardware');
  const [description, setDescription] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [priceCrypto, setPriceCrypto] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handlePriceUSDChange = (val: string) => {
    setPriceUSD(val);
    if (val && !isNaN(Number(val))) {
      // USDC is 1:1 with USD
      setPriceCrypto(parseFloat(val).toFixed(2));
    } else {
      setPriceCrypto('');
    }
  };

  const handlePriceCryptoChange = (val: string) => {
    setPriceCrypto(val);
    if (val && !isNaN(Number(val))) {
      // USDC is 1:1 with USD
      setPriceUSD(parseFloat(val).toFixed(2));
    } else {
      setPriceUSD('');
    }
  };

  const totalSalesUSD = sellerTransactions.reduce((sum, tx) => sum + tx.totalUSD, 0) + 24592; // added base dummy to make it look active
  const totalSalesCrypto = sellerTransactions.reduce((sum, tx) => sum + tx.totalCrypto, 0) + 8.42;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !priceUSD || !priceCrypto) return;

    addProduct({
      id: Math.floor(Math.random() * 100000),
      name: productName,
      priceUSD: parseFloat(priceUSD),
      priceCrypto: parseFloat(priceCrypto),
      category,
      image: imageUrl || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', // Default mock image
      description: description || 'New product added by seller.',
      inStock: true,
      rating: 5.0,
      reviewCount: 0,
      tags: ['new', 'seller-added']
    });

    // Reset
    setProductName('');
    setPriceUSD('');
    setPriceCrypto('');
    setImageUrl('');
    setDescription('');
    alert('Product listed successfully!');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-6 max-w-7xl mx-auto w-full">
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">Seller Central</h1>
          <p className="text-gray-400 mt-2">Manage your listings, analyze store performance, and track escrow contracts.</p>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+14%</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sales (USD)</p>
              <h3 className="text-3xl font-bold text-white mt-1">${totalSalesUSD.toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+8%</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sales (Crypto)</p>
              <h3 className="text-3xl font-bold text-white mt-1">{totalSalesCrypto.toFixed(2)} USDC</h3>
            </div>
          </div>

          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+22%</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Store Views</p>
              <h3 className="text-3xl font-bold text-white mt-1">68,000</h3>
            </div>
          </div>

          <div className="bg-card/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Escrow Contracts</p>
              <h3 className="text-3xl font-bold text-white mt-1">{14 + sellerTransactions.length}</h3>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Revenue Trend</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                  <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="usd" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="USD ($)" />
                  <Line type="monotone" dataKey="crypto" stroke="#00ffff" strokeWidth={3} dot={{ r: 4, fill: '#00ffff' }} activeDot={{ r: 6 }} name="Crypto (Eq. USD)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Store Traffic</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                  <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="views" fill="#a855f7" radius={[4, 4, 0, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* List New Product Form */}
        <div className="bg-black/60 border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">List New Product</h2>
              <p className="text-sm text-gray-400">Add a new item to your store inventory.</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handlePublish}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Listing Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setListingType('standard')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    listingType === 'standard' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-white/10 bg-card hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <div className="font-bold mb-1">Standard B2C</div>
                  <div className="text-xs opacity-70">Physical Good (1 unit)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('b2b')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    listingType === 'b2b' 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                      : 'border-white/10 bg-card hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <div className="font-bold mb-1">Wholesale B2B</div>
                  <div className="text-xs opacity-70">Bulk, MOQ, Tiered Pricing</div>
                </button>
                <button
                  type="button"
                  onClick={() => setListingType('nft')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    listingType === 'nft' 
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                      : 'border-white/10 bg-card hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <div className="font-bold mb-1">Mint as NFT</div>
                  <div className="text-xs opacity-70">Digital Asset / Phygital</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Product Name</label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                  placeholder="e.g. Neon Synchronizer" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="Tech Hardware">Tech Hardware</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Digital Assets">Digital Assets</option>
                  <option value="NFTs">NFTs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Product Image URL</label>
              <input 
                type="text" 
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                placeholder="https://example.com/image.jpg" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea 
                rows={4} 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none" 
                placeholder="Describe the product..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Base Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input 
                    type="number" 
                    value={priceUSD}
                    onChange={e => handlePriceUSDChange(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Crypto Price (USDC)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">$</span>
                  <input 
                    type="number" 
                    step="0.0001" 
                    value={priceCrypto}
                    onChange={e => handlePriceCryptoChange(e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                    placeholder="0.0000" 
                  />
                </div>
              </div>
            </div>

            {listingType === 'b2b' && (
              <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                <h4 className="font-bold text-blue-400">B2B Wholesale Settings</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Order Quantity (MOQ)</label>
                  <input type="number" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. 50" />
                </div>
                <div className="p-4 rounded-xl border border-dashed border-blue-500/30 text-center">
                  <p className="text-sm text-blue-400/70 mb-2">Configure Tiered Pricing Table</p>
                  <button type="button" className="text-sm font-bold text-blue-400 hover:text-blue-300">+ Add Quantity Tier</button>
                </div>
              </div>
            )}

            {listingType === 'nft' && (
              <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-4">
                <h4 className="font-bold text-purple-400">Smart Contract Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Total Supply</label>
                    <input type="number" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. 1000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Creator Royalty (%)</label>
                    <input type="number" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. 5" />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
              <button type="button" className="px-6 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors">
                Save Draft
              </button>
              <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-black font-bold hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
                Publish Listing
              </button>
            </div>
          </form>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
