import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CheckoutModal from './CheckoutModal';
import { SettlementResult } from '../lib/ababilpay';

const CartDrawer: React.FC = () => {
  const { isCartOpen, toggleCart, cartItems, removeFromCart, subtotalUSD, subtotalCrypto, checkoutCart, saveForLater } = useShop();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const handlePayNow = () => {
    if (!isLoggedIn || !user) {
      toggleCart();
      navigate('/login');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (result: SettlementResult, txHash: string) => {
    console.log('✅ Payment settled on-chain:', txHash, result);
    setIsCheckoutOpen(false);
    checkoutCart(); // record order in local state
    toggleCart();
    navigate('/dashboard'); // redirect to buyer dashboard
  };

  const handlePaymentCancel = () => {
    setIsCheckoutOpen(false);
  };

  // Generate a short order ID from cart contents
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const orderDesc = cartItems.length === 1
    ? cartItems[0].name
    : `${cartItems.length} items from Ababil Shop`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => !isCheckoutOpen && toggleCart()}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] glass border-l border-primary/20 z-50 flex flex-col shadow-2xl transform transition-transform duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Your Cart</h2>
          <button
            onClick={toggleCart}
            className="text-gray-400 hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              Your cart is empty.
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-black border border-white/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white truncate pr-4">{item.name}</h3>
                  <div className="text-xs text-primary uppercase tracking-wider mb-1">{item.category}</div>
                  <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-white">${(item.priceUSD * item.quantity).toLocaleString()}</div>
                  <div className="flex flex-col items-end gap-1 mt-1">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => saveForLater(item)}
                      className="text-xs text-gray-400 hover:text-primary uppercase tracking-widest transition-colors"
                    >
                      Stash for later
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/40">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-gray-300">
                <span>Subtotal (Fiat)</span>
                <span className="font-bold text-white">${subtotalUSD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-300">
                <span>Subtotal (Crypto)</span>
                <span className="font-mono text-primary">{subtotalCrypto.toFixed(2)} USDC</span>
              </div>
            </div>

            <button
              id="pay-now-btn"
              onClick={handlePayNow}
              className="w-full py-4 rounded-xl bg-primary text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Pay with USDC
            </button>

            <div className="mt-3 text-center text-xs text-gray-600">
              Powered by <span className="text-gray-500 font-medium">AbabilPay x402</span> · Gasless EIP-3009
            </div>
          </div>
        )}
      </div>

      {/* AbabilPay Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        amountUSDC={parseFloat(subtotalCrypto.toFixed(2))}
        orderDescription={orderDesc}
        orderId={orderId}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </>
  );
};

export default CartDrawer;
