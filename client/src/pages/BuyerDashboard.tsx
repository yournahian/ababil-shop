import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { OrderTracking } from '../components/OrderTracking';

const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orderHistory, savedForLater, moveToCart } = useShop();

  const displayAddress = user?.dummyWallet || "0x71C...976F";
  const displayName = user?.name || "Anonymous Buyer";

  // Filter out NFTs to display in digital wallet. For mock purposes, just extract digital items from history
  const digitalAssets = orderHistory.flatMap(order => 
    order.items.filter(item => item.category === 'NFTs' || item.category === 'Digital Assets')
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-6 max-w-7xl mx-auto w-full">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12 glass p-8 rounded-2xl border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-blue-600 p-1 shrink-0 z-10">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              <span className="text-3xl font-bold uppercase">{displayName[0]}</span>
            </div>
          </div>
          
          <div className="z-10">
            <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
            <p className="text-gray-400 font-mono text-sm mb-3 break-all">{displayAddress}</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Wallet Connected
              </div>
              <span className="text-gray-500 text-sm font-mono">Base Network</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Order History */}
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Order History
              <span className="text-xs font-mono text-gray-500 tracking-wider">SECURE ESCROW</span>
            </h2>
            
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {orderHistory.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No orders yet. Start shopping!</p>
              ) : (
                orderHistory.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                    <div>
                      <div className="font-medium text-white mb-1">
                        {order.items.length === 1 ? order.items[0].name : `${order.items.length} Items`}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{order.id} • {order.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold mb-1">${order.totalUSD.toLocaleString()}</div>
                      <div className={`text-xs px-2 py-1 rounded-md inline-block ${order.status === 'Delivered' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Digital Wallet */}
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              Digital Wallet (NFTs)
              <span className="text-xs font-mono text-gray-500 tracking-wider">ERC-721</span>
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {digitalAssets.length === 0 ? (
                <p className="text-gray-500 text-sm col-span-2 text-center py-8">No digital assets collected yet.</p>
              ) : (
                digitalAssets.map((nft, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-white/10">
                    <img src={nft.image} alt={nft.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80"></div>
                    <div className="absolute bottom-0 left-0 w-full p-3">
                      <div className="text-xs font-bold text-primary mb-1">Qty: {nft.quantity}</div>
                      <div className="text-sm font-bold truncate">{nft.name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Live Order Tracking */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Live Order Tracking</h2>
          <OrderTracking />
        </div>

        {/* Stashed for Later */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">Stashed for Later</h2>
          <div className="glass rounded-3xl border border-white/10 p-8">
            {savedForLater.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">You have no items stashed for later.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedForLater.map(item => (
                  <div key={item.id} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden group flex flex-col">
                    <div className="relative h-40 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{item.category}</div>
                      </div>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.name}</h3>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-400 text-sm">Qty: {item.quantity}</span>
                          <span className="text-white font-bold">${item.priceUSD.toLocaleString()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => moveToCart(item)}
                        className="w-full py-2.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary hover:text-black hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Move to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default BuyerDashboard;
