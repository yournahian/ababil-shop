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
  // Agent commerce additions (nullable — populated on first use)
  telegramChatId?: string | null;
  arcWalletAddress?: string | null; // Arc future field
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
  arcWalletAddress?: string | null; // Arc future field
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
  // Agent commerce additions
  agentInitiated?: boolean;
  rfqQuoteId?: string | null;
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

// ─── AGENTIC COMMERCE TYPES ───────────────────────────────────────────────────

/** Procurement categories — covers both physical goods and services */
export type RFQCategory =
  | 'Merchandise'
  | 'Printing'
  | 'Software Development'
  | 'Design'
  | 'Marketing'
  | 'Logistics';

/** Whether this RFQ is for a physical product or a service */
export type RFQType = 'product' | 'service';

export type RFQStatus = 'open' | 'quoted' | 'accepted' | 'fulfilled' | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/**
 * Simulated escrow status. Arc-ready: in MVP these are DB-tracked values.
 * In production, 'locked' / 'released' correspond to on-chain contract states.
 */
export type EscrowStatus = 'none' | 'locked' | 'released' | 'refunded';

/** Channel that originated the agent conversation */
export type AgentSource = 'web' | 'telegram' | 'discord' | 'api';

/** One chat session between a user and the Buyer Agent */
export interface AgentConversation {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'archived';
  source: AgentSource;
  externalChatId?: string | null; // Telegram chat_id / Discord channel_id
  createdAt: string;
  updatedAt: string;
}

/** A single turn inside an agent conversation */
export interface AgentMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool';
  content: unknown;       // string for user/assistant; structured for tool results
  toolName?: string | null;
  toolCallId?: string | null;
  createdAt: string;
}

/**
 * Request for Quotation — the core procurement object.
 * Supports both product procurement and service procurement.
 */
export interface RFQ {
  id: string;
  buyerId: string;

  // Identity
  title: string;
  description: string;
  rfqType: RFQType;
  category: RFQCategory;

  // RFQ Wizard fields (collected by agent before submission)
  quantity: number;
  budgetUsdc: number;
  deliveryDeadline: string | null;
  location: string | null;      // preferred supplier location/region
  requirements: Record<string, unknown>;

  // Lifecycle
  status: RFQStatus;
  conversationId: string | null;

  // Arc future fields (nullable, unused in MVP)
  arcJobId: string | null;
  arcTxHash: string | null;

  createdAt: string;
  updatedAt: string;

  // Relations
  quotes?: VendorQuote[];
  buyer?: Partial<Profile>;
}

/** A vendor's response to an RFQ, including simulated escrow state */
export interface VendorQuote {
  id: string;
  rfqId: string;
  vendorId: string;

  // Pricing
  unitPriceUsdc: number;
  totalPriceUsdc: number;
  deliveryDays: number;
  notes: string | null;
  autoGenerated: boolean;

  // Lifecycle
  status: QuoteStatus;

  // Simulated escrow (Arc-ready)
  escrowStatus: EscrowStatus;
  escrowLockedAt: string | null;
  escrowReleasedAt: string | null;

  // Arc future fields (nullable, unused in MVP)
  arcJobId: string | null;
  arcTxHash: string | null;
  arcWalletAddress: string | null;

  // Set when accepted → order created
  orderId: string | null;

  createdAt: string;
  updatedAt: string;

  // Relations
  vendor?: Partial<Vendor>;
  rfq?: Partial<RFQ>;
}

/** Per-vendor AI configuration for the Vendor Agent */
export interface VendorAgentSettings {
  vendorId: string;
  autoReplyEnabled: boolean;
  maxDiscountPct: number;        // 0–100
  minMarginPct: number;          // 0–100
  preferredDeliveryDays: number;
  autoQuoteCategories: RFQCategory[] | null; // null = all categories
  agentPersonaNotes: string | null;
  avgResponseHours: number | null; // auto-updated by trigger
  updatedAt: string;
}

/**
 * Vendor ranking result from the vendor_rankings view.
 * Used by the search_vendors() agent tool.
 */
export interface VendorRanking extends Vendor {
  completedOrders: number;
  totalOrders: number;
  deliverySuccessRate: number;   // 0.0–1.0
  avgResponseHours: number | null;
  autoReplyEnabled: boolean;
  maxDiscountPct: number | null;
  preferredDeliveryDays: number | null;
  autoQuoteCategories: RFQCategory[] | null;
  searchScore: number;           // 0–100 composite ranking score
}

