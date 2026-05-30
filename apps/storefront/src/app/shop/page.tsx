import React from 'react';
import { createAdminClient } from '@ababil/supabase';
import ShopClient from './ShopClient';

export const dynamic = 'force-dynamic'; // Force dynamic rendering to bypass caching for instant catalog updates
export const fetchCache = 'force-no-store'; // Force fetch cache to no-store to bypass Next.js data caching for Supabase queries

// High-fidelity local fallback items
const STATIC_PRODUCTS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    vendor_id: '22222222-2222-2222-2222-222222222222',
    name: 'Quantum Headset Spacer',
    slug: 'quantum-headset-spacer',
    description: 'Ergonomic spacer made with nano-gel, providing max comfort during prolonged VR session.',
    price_usd: 2.50,
    price_crypto: 2.50,
    currency: 'USDC',
    category: 'Tech Hardware',
    images: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=800'],
    in_stock: true,
    inventory: 150,
    rating: 4.90,
    num_reviews: 12,
    tags: ['tech', 'comfort', 'vr'],
    status: 'active',
    moq: 10,
    tiered_pricing: [
      { minQuantity: 10, maxQuantity: 49, priceUSD: 2.25, priceCrypto: 2.25 },
      { minQuantity: 50, maxQuantity: null, priceUSD: 2.00, priceCrypto: 2.00 }
    ],
    vendor: { name: 'CyberCore Tech', slug: 'cybercore-tech' }
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    vendor_id: '22222222-2222-2222-2222-222222222222',
    name: 'Haptic Finger Cot',
    slug: 'haptic-finger-cot',
    description: 'Ultra-thin fingertip sensors mapping micro-movements to digital realms.',
    price_usd: 4.20,
    price_crypto: 4.20,
    currency: 'USDC',
    category: 'Tech Hardware',
    images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800'],
    in_stock: true,
    inventory: 80,
    rating: 4.80,
    num_reviews: 24,
    tags: ['haptic', 'sensors', 'tech'],
    status: 'active',
    moq: 5,
    tiered_pricing: [
      { minQuantity: 5, maxQuantity: 19, priceUSD: 4.00, priceCrypto: 4.00 },
      { minQuantity: 20, maxQuantity: null, priceUSD: 3.70, priceCrypto: 3.70 }
    ],
    vendor: { name: 'CyberCore Tech', slug: 'cybercore-tech' }
  },
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    vendor_id: '33333333-3333-3333-3333-333333333333',
    name: 'Reflective Laces (Neon)',
    slug: 'reflective-laces-neon',
    description: 'High-visibility glowing fiber-optic shoelaces, standard length.',
    price_usd: 3.00,
    price_crypto: 3.00,
    currency: 'USDC',
    category: 'Apparel',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'],
    in_stock: true,
    inventory: 200,
    rating: 4.70,
    num_reviews: 18,
    tags: ['streetwear', 'neon', 'apparel'],
    status: 'active',
    moq: 20,
    tiered_pricing: [
      { minQuantity: 20, maxQuantity: 99, priceUSD: 2.70, priceCrypto: 2.70 },
      { minQuantity: 100, maxQuantity: null, priceUSD: 2.40, priceCrypto: 2.40 }
    ],
    vendor: { name: 'Neon Threads', slug: 'neon-threads' }
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    vendor_id: '33333333-3333-3333-3333-333333333333',
    name: 'Base Network Swallow NFT',
    slug: 'base-network-swallow-nft',
    description: 'Collectible Genesis Swallow art series on Base Sepolia.',
    price_usd: 4.99,
    price_crypto: 4.99,
    currency: 'USDC',
    category: 'NFTs',
    images: ['https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800'],
    in_stock: true,
    inventory: 50,
    rating: 4.95,
    num_reviews: 9,
    tags: ['nft', 'art', 'swallow'],
    status: 'active',
    vendor: { name: 'Neon Threads', slug: 'neon-threads' }
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    vendor_id: '33333333-3333-3333-3333-333333333333',
    name: 'Cyber Glow Coaster',
    slug: 'cyber-glow-coaster',
    description: 'Glow-in-the-dark premium silicon coaster with futuristic circuits design.',
    price_usd: 1.50,
    price_crypto: 1.50,
    currency: 'USDC',
    category: 'Home & Living',
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'],
    in_stock: true,
    inventory: 500,
    rating: 4.50,
    num_reviews: 3,
    tags: ['coaster', 'home', 'glow'],
    status: 'active',
    vendor: { name: 'Neon Threads', slug: 'neon-threads' }
  }
];

export default async function ShopPage() {
  let products: any[] = [];
  let isDbConnected = false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);
      isDbConnected = true;
      
      // Select products joining with vendor
      const { data, error } = await adminSupabase
        .from('products')
        .select(`
          *,
          vendor:vendors (
            name,
            slug
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        // Map database fields to snake_case -> CamelCase where appropriate
        products = data.map((p) => ({
          id: p.id,
          vendorId: p.vendor_id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          priceUSD: parseFloat(p.price_usd),
          priceCrypto: parseFloat(p.price_crypto),
          currency: p.currency,
          category: p.category,
          images: p.images || [],
          inStock: p.in_stock,
          inventory: p.inventory,
          rating: parseFloat(p.rating),
          numReviews: p.num_reviews,
          tags: p.tags || [],
          status: p.status,
          moq: p.moq,
          tieredPricing: p.tiered_pricing,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          vendor: p.vendor ? { name: p.vendor.name, slug: p.vendor.slug } : undefined
        })) as any;
      }
    }
  } catch (error) {
    console.error("Failed to query live products, using fallback list:", error);
    products = STATIC_PRODUCTS;
  }

  if (!isDbConnected) {
    products = STATIC_PRODUCTS;
  }

  return (
    <div className="py-6">
      <div className="space-y-2 mb-10">
        <span className="font-mono text-[10px] text-primary tracking-widest uppercase block">[ CATALOG ]</span>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-glow-cyan text-white">
          DECENTRALIZED CATALOG
        </h1>
        <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
          Filter through premium Web3 listings from onboarded vendors. All items are verified and priced below <span className="text-secondary font-bold">5 USDC</span>.
        </p>
      </div>
      
      <ShopClient initialProducts={products as any} />
    </div>
  );
}
