import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, ArrowLeft, ShieldCheck, Flame, ShoppingCart, Award, Truck, BadgePercent } from 'lucide-react';
import { createAdminClient } from '@ababil/supabase';
import ProductActions from './ProductActions';

export const dynamic = 'force-dynamic'; // Force dynamic rendering so that inactive/delisted products are instantly blocked
export const fetchCache = 'force-no-store'; // Force fetch cache to no-store to bypass Next.js data caching for Supabase queries

// Static fallback products by slug
const STATIC_PRODUCTS: Record<string, any> = {
  'quantum-headset-spacer': {
    id: 'a1111111-1111-1111-1111-111111111111',
    vendor_id: '22222222-2222-2222-2222-222222222222',
    name: 'Quantum Headset Spacer',
    slug: 'quantum-headset-spacer',
    description: 'Ergonomic spacer made with nano-gel, providing max comfort during prolonged VR session. Designed to reduce sweat buildup and align perfect screen spacing for visual enhancement.',
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
    vendor: { name: 'CyberCore Tech', slug: 'cybercore-tech', rating: 4.9, verified: true }
  },
  'reflective-laces-neon': {
    id: 'b1111111-1111-1111-1111-111111111111',
    vendor_id: '33333333-3333-3333-3333-333333333333',
    name: 'Reflective Laces (Neon)',
    slug: 'reflective-laces-neon',
    description: 'High-visibility glowing fiber-optic shoelaces, standard length. Waterproof and highly durable for extreme streetwear visual presentation.',
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
    vendor: { name: 'Neon Threads', slug: 'neon-threads', rating: 4.8, verified: false }
  }
};

interface ProductDetailPageProps {
  params: { slug: string };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params;
  let product = null;
  let isDbConnected = false;
  let reviews: any[] = [];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      isDbConnected = true;
      const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error } = await adminSupabase
        .from('products')
        .select(`
          *,
          vendor:vendors (
            name,
            slug,
            rating,
            verified
          )
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        product = {
          id: data.id,
          vendorId: data.vendor_id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          priceUSD: parseFloat(data.price_usd),
          priceCrypto: parseFloat(data.price_crypto),
          currency: data.currency,
          category: data.category,
          images: data.images || [],
          inStock: data.in_stock,
          inventory: data.inventory,
          rating: parseFloat(data.rating),
          numReviews: data.num_reviews,
          tags: data.tags || [],
          status: data.status,
          moq: data.moq,
          tieredPricing: data.tiered_pricing,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          vendor: data.vendor ? {
            name: data.vendor.name,
            slug: data.vendor.slug,
            rating: parseFloat(data.vendor.rating),
            verified: data.vendor.verified
          } : undefined
        };

        // Fetch reviews
        const { data: reviewsData } = await adminSupabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            customer:profiles (
              username,
              avatar_url
            )
          `)
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          reviews = reviewsData;
        }
      }
    }
  } catch (error) {
    console.error("Failed to query live product details:", error);
    product = STATIC_PRODUCTS[slug] || null;
  }

  if (!isDbConnected && !product) {
    product = STATIC_PRODUCTS[slug] || null;
  }

  if (isDbConnected && !product) {
    notFound();
  }

  if (!product) {
    notFound();
  }

  // Calculate purchase XP reward
  const price = product.priceUSD || product.price_usd;
  const xpReward = Math.floor(price * 10) + 20;

  return (
    <div className="py-6 space-y-12">
      {/* Go Back CTA */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 font-mono text-xs text-gray-400 hover:text-primary transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> [ BACK TO REGISTRY ]
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT COLUMN: Large Media Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-3xl overflow-hidden border border-card-border bg-card shadow-2xl">
            <Image
              src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'}
              alt={product.name}
              fill
              priority
              sizes="(max-w-7xl) 50vw"
              className="object-cover"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="w-20 h-20 relative rounded-xl overflow-hidden border border-primary/30 bg-card">
              <Image
                src={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800'}
                alt={product.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Technical specs and Add To Cart */}
        <div className="space-y-6">
          {/* Category Pill and Level tag */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-primary/10 border border-primary/20 font-mono text-[9px] text-primary uppercase">
              {product.category}
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-secondary">
              <Award className="w-3.5 h-3.5 animate-pulse" />
              <span>+{xpReward} SHOPPING XP</span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white leading-none">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono">
              <span className="text-gray-400">
                VENDOR:{' '}
                <Link href={`/vendor/${product.vendor?.slug}`} className="text-primary hover:underline font-bold">
                  {product.vendor?.name?.toUpperCase() || 'UNKNOWN'}
                </Link>
              </span>
              {product.vendor?.verified && (
                <span className="flex items-center gap-1 text-[9px] text-primary/80 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED VENDOR
                </span>
              )}
            </div>
          </div>

          <div className="bg-card/40 border border-card-border p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs text-gray-400">PRICE IN USDC</span>
              <span className="text-3xl font-black font-mono text-secondary text-glow-pink">
                {price.toFixed(2)} USDC
              </span>
            </div>

            {/* Inventory indicator */}
            <div className="flex items-center justify-between text-xs font-mono border-t border-card-border/60 pt-4">
              <span className="text-gray-400">STOCK AVAILABILITY</span>
              {product.inStock && (product.inventory > 0) ? (
                <span className="text-primary font-bold">{product.inventory} UNITS SECURED</span>
              ) : (
                <span className="text-secondary font-bold">TEMPORARILY OUT OF SYNC</span>
              )}
            </div>
          </div>

          {/* Volume tiered discounts */}
          {product.tieredPricing && product.tieredPricing.length > 0 && (
            <div className="bg-card-hover border border-card-border/80 p-5 rounded-xl font-mono text-xs space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                <BadgePercent className="w-4 h-4 text-primary" />
                <span>[ VOLUME TIERED B2B DISCOUNTS ]</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 border-b border-card-border/50 pb-2 font-bold">
                <span>ORDER RANGE</span>
                <span className="text-right">DISCOUNTED PRICE</span>
              </div>
              {product.tieredPricing.map((tier: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px] text-gray-300">
                  <span>
                    {tier.minQuantity}
                    {tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'} UNITS
                  </span>
                  <span className="font-bold text-white">
                    {parseFloat(tier.priceUSD).toFixed(2)} USDC
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Interactive client Actions (Qty, Add to Cart) */}
          <ProductActions product={product as any} />

          {/* Simulated Fast Delivery Engine banner */}
          <div className="flex items-start gap-3 bg-card/20 border border-card-border p-4 rounded-xl font-mono text-[10px] leading-relaxed text-gray-400">
            <Truck className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="block font-bold text-white mb-0.5">SIMULATED DELIVERY ENGINE</span>
              Orders placed are simulated in real-time. Courier dispatch, geo-coordinate updates, and automatic delivery completions can be monitored on your tracking console!
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS & WISHLIST CONTAINER */}
      <section className="space-y-6 pt-6 border-t border-card-border">
        <h2 className="text-2xl font-extrabold uppercase text-white font-mono tracking-tight flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          [ REVIEWS ({product.numReviews}) ]
        </h2>

        {reviews.length === 0 ? (
          <div className="bg-card/20 border border-dashed border-card-border rounded-xl p-8 text-center text-xs font-mono text-gray-500">
            NO TRANSACTION RATINGS LOGGED FOR THIS ITEM YET.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-card/40 border border-card-border p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-card-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    {rev.customer?.avatar_url ? (
                      <img src={rev.customer.avatar_url} alt="avatar" className="w-6 h-6 rounded object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-card-border flex items-center justify-center font-bold text-[10px] text-primary">
                        {rev.customer?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="font-mono text-xs text-white">
                      {rev.customer?.username || 'Alex Buyer'}
                    </span>
                  </div>
                  <div className="flex text-yellow-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-current' : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
