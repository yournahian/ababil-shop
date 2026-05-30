import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';
import { SettlementResult } from '../lib/ababilpay';

const Cart: React.FC = () => {
  const { cartItems, removeFromCart, subtotalUSD, subtotalCrypto, checkoutCart } = useShop();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCheckoutClick = () => {
    if (!isLoggedIn || !user) {
      navigate('/login');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (result: SettlementResult, txHash: string) => {
    console.log('✅ Payment settled on-chain:', txHash, result);
    setIsCheckoutOpen(false);
    checkoutCart();
    navigate('/dashboard');
  };

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const orderDesc = cartItems.length === 1
    ? cartItems[0].name
    : `${cartItems.length} items from Ababil Shop`;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-6 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl border border-white/10">
            <div className="text-gray-400 text-lg mb-6">Your cart is completely empty.</div>
            <Link to="/shop" className="px-8 py-3 rounded-full border border-primary text-primary font-medium hover:bg-primary hover:text-black transition-all">
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 p-4 glass rounded-xl border border-white/10">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-black">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-lg font-bold">{item.name}</h3>
                    <div className="text-primary text-sm uppercase tracking-wider mb-2">{item.category}</div>
                    <div className="text-gray-400">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${(item.priceUSD * item.quantity).toLocaleString()}</div>
                    <div className="text-sm font-mono text-gray-500">{(item.priceCrypto * item.quantity).toFixed(2)} USDC</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl border border-white/10 p-6 h-fit sticky top-28">
              <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Subtotal (Fiat)</span>
                  <span className="font-bold text-white">${subtotalUSD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Subtotal (Crypto)</span>
                  <span className="font-mono text-primary">{subtotalCrypto.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 text-sm">
                  <span>Network Fee</span>
                  <span className="text-green-400 font-semibold">Free (gasless)</span>
                </div>
              </div>

              <button
                id="cart-checkout-btn"
                onClick={handleCheckoutClick}
                className="w-full py-4 rounded-xl bg-primary text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pay with USDC
              </button>

              <div className="mt-3 text-center text-xs text-gray-600">
                Powered by <span className="text-gray-500 font-medium">AbabilPay x402</span>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* AbabilPay Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        amountUSDC={parseFloat(subtotalCrypto.toFixed(2))}
        orderDescription={orderDesc}
        orderId={orderId}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
};

export default Cart;
