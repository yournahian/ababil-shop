import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer: React.FC = () => {
  const { isCartOpen, toggleCart, cartItems, removeFromCart, subtotalUSD, subtotalCrypto, checkoutCart, saveForLater } = useShop();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [checkoutState, setCheckoutState] = useState<'idle' | 'initiating' | 'locking' | 'success'>('idle');

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (!isLoggedIn || !user) {
      toggleCart();
      navigate('/login');
      return;
    }

    setCheckoutState('initiating');
    
    setTimeout(() => {
      setCheckoutState('locking');
      
      setTimeout(() => {
        setCheckoutState('success');
        
        setTimeout(() => {
          checkoutCart();
          setCheckoutState('idle');
          toggleCart();
          navigate('/dashboard'); // redirect to buyer dashboard
        }, 1500);
      }, 1500);
    }, 1000);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => checkoutState === 'idle' && toggleCart()}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] glass border-l border-primary/20 z-50 flex flex-col shadow-2xl transform transition-transform duration-300">
        
        {/* Modal Overlay during checkout */}
        {checkoutState !== 'idle' && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            {checkoutState === 'success' ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Transaction Successful!</h3>
                <p className="text-gray-400 text-sm">Escrow contract secured. Redirecting to your dashboard...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {checkoutState === 'initiating' && 'Initiating Smart Contract...'}
                  {checkoutState === 'locking' && 'Locking Funds in Escrow...'}
                </h3>
                <p className="text-gray-400 text-sm">Please do not close this window.</p>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Your Cart</h2>
          <button 
            onClick={toggleCart}
            disabled={checkoutState !== 'idle'}
            className="text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
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
                <span className="font-mono text-primary">{subtotalCrypto.toFixed(2)} ETH</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={checkoutState !== 'idle'}
              className="w-full py-4 rounded-xl bg-primary text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none"
            >
              Pay Now (Escrow)
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
