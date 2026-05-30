import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Profile } from '@ababil/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((item) => item.productId === product.id);

        if (existing) {
          set({
            items: items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { productId: product.id, quantity, product }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, item) => {
          // If tiered pricing exists, calculate based on qty
          let price = item.product.priceUSD;
          if (item.product.tieredPricing && item.product.moq && item.quantity >= item.product.moq) {
            const tiers = item.product.tieredPricing;
            const applicableTier = [...tiers]
              .sort((a, b) => b.minQuantity - a.minQuantity)
              .find((t) => item.quantity >= t.minQuantity);
            if (applicableTier) {
              price = applicableTier.priceUSD;
            }
          }
          return sum + price * item.quantity;
        }, 0),
    }),
    {
      name: 'ababil-cart-storage',
    }
  )
);

interface AuthState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  logout: () => void;
  authModalOpen: boolean;
  redirectUrl: string;
  openAuthModal: (redirectUrl: string) => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  logout: () => set({ profile: null }),
  authModalOpen: false,
  redirectUrl: '/shop',
  openAuthModal: (redirectUrl) => set({ authModalOpen: true, redirectUrl }),
  closeAuthModal: () => set({ authModalOpen: false }),
}));
