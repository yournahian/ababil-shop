import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, mockProducts as initialMockProducts } from '../data/mockProducts';

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: string;
  date: string;
  totalUSD: number;
  totalCrypto: number;
}

interface ShopContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotalUSD: number;
  subtotalCrypto: number;

  savedForLater: CartItem[];
  saveForLater: (item: CartItem) => void;
  moveToCart: (item: CartItem) => void;
  
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  isCartOpen: boolean;
  toggleCart: () => void;

  orderHistory: Order[];
  sellerTransactions: Order[];
  checkoutCart: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialMockProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerTransactions, setSellerTransactions] = useState<Order[]>([]);

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  const saveForLater = (item: CartItem) => {
    removeFromCart(item.id);
    setSavedForLater(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + item.quantity } : p);
      }
      return [...prev, item];
    });
  };

  const moveToCart = (item: CartItem) => {
    setSavedForLater(prev => prev.filter(p => p.id !== item.id));
    setCartItems(prev => {
      const existingItem = prev.find(p => p.id === item.id);
      if (existingItem) {
        return prev.map(p => 
          p.id === item.id ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotalUSD = cartItems.reduce((total, item) => total + (item.priceUSD * item.quantity), 0);
  const subtotalCrypto = cartItems.reduce((total, item) => total + (item.priceCrypto * item.quantity), 0);

  const checkoutCart = () => {
    if (cartItems.length === 0) return;
    
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`,
      items: [...cartItems],
      status: 'In Escrow',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      totalUSD: subtotalUSD,
      totalCrypto: subtotalCrypto
    };

    setOrderHistory(prev => [newOrder, ...prev]);
    setSellerTransactions(prev => [newOrder, ...prev]);
    clearCart();
  };

  return (
    <ShopContext.Provider value={{ 
      products, addProduct,
      cartItems, addToCart, removeFromCart, clearCart, cartCount, subtotalUSD, subtotalCrypto,
      savedForLater, saveForLater, moveToCart,
      wishlist, toggleWishlist,
      searchQuery, setSearchQuery,
      isCartOpen, toggleCart,
      orderHistory, sellerTransactions, checkoutCart
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
