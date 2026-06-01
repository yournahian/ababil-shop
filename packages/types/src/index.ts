export type UserRole = 'customer' | 'vendor' | 'admin';

export interface Profile {
  id: string; // UUID from Supabase Auth
  username: string | null;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  xp: number;
  level: number;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string; // UUID (usually maps to Profile ID when single-owner)
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  rating: number;
  numReviews: number;
  walletAddress: string;
  verified: boolean;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'Tech Hardware'
  | 'Apparel'
  | 'Digital Assets'
  | 'NFTs'
  | 'Home & Living'
  | 'Gifts'
  | 'Toys';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface TieredPrice {
  minQuantity: number;
  maxQuantity: number | null;
  priceUSD: number;
  priceCrypto: number;
}

export interface Product {
  id: string; // UUID
  vendorId: string; // UUID
  name: string;
  slug: string;
  description: string;
  priceUSD: number; // Max 5 USDC as per requirements
  priceCrypto: number; // Max 5 USDC, usually 1:1 pegged
  currency: 'USDC';
  category: ProductCategory;
  images: string[];
  inStock: boolean;
  inventory: number;
  rating: number;
  numReviews: number;
  tags: string[];
  status: ProductStatus;
  moq?: number;
  tieredPricing?: TieredPrice[];
  seoTitle?: string;
  seoDesc?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: Partial<Vendor>;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string; // UUID
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: Partial<Product>;
}

export interface Order {
  id: string; // UUID
  customerId: string; // UUID
  vendorId: string; // UUID
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentStatus: PaymentStatus;
  paymentIntentId: string | null;
  paymentTxHash: string | null;
  totalAmount: number; // total in USDC
  shippingCost: number;
  xpEarned: number;
  deliveryEngineStatus: 'preparing' | 'in_transit' | 'delivered' | 'failed' | 'idle';
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  customer?: Partial<Profile>;
  vendor?: Partial<Vendor>;
}

export interface Review {
  id: string; // UUID
  productId: string;
  customerId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  customer?: Partial<Profile>;
}

export interface WishlistItem {
  id: string; // UUID
  customerId: string;
  productId: string;
  createdAt: string;
  product?: Product;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export type XpSourceType =
  | 'purchase'
  | 'review'
  | 'vendor_onboard'
  | 'delivery_streak'
  | 'admin_grant';

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  source: XpSourceType;
  description: string | null;
  createdAt: string;
  created_at?: string;
}

export interface DeliveryJob {
  id: string;
  orderId: string;
  courierName: string;
  status: 'preparing' | 'in_transit' | 'delivered' | 'failed';
  latitude: number;
  longitude: number;
  estimatedDeliveryAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string; // User/Vendor Profile ID
  name: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  role: UserRole;
  rank: number;
}
