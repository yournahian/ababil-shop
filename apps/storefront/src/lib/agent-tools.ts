/**
 * Ababil Agent — Tool Definitions
 *
 * All 6 MVP tools available to the Buyer Agent.
 * Channel-agnostic: same tools used by web chat, Telegram, Discord, and API.
 *
 * Tools are pure server-side functions — they query Supabase directly via
 * the service-role client (bypasses RLS since we authenticate the user at
 * the route level before calling streamText).
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createAdminClient } from '@ababil/supabase';
import { debugLog } from './provider-router';

// ─── Supabase admin client factory ───────────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// ─── RFQ Category enum (mirrors DB enum) ─────────────────────────────────────

const RFQ_CATEGORIES = [
  'Merchandise',
  'Printing',
  'Software Development',
  'Design',
  'Marketing',
  'Logistics',
] as const;

// ─── 1. search_products ───────────────────────────────────────────────────────

export const searchProductsTool = tool({
  description:
    'Search the Ababil Shop marketplace for products using natural language. ' +
    'Returns up to 5 matching products with pricing, ratings, and vendor info. ' +
    'Use this when the user wants to find or browse specific products.',
  parameters: z.object({
    query: z
      .string()
      .describe('Natural language search query, e.g. "gaming mouse" or "wireless keyboard"'),
    category: z
      .enum([
        'Tech Hardware', 'Apparel', 'Digital Assets',
        'NFTs', 'Home & Living', 'Gifts', 'Toys',
      ])
      .optional()
      .describe('Filter by product category'),
    maxPriceUsdc: z.coerce
      .number()
      .positive()
      .optional()
      .describe('Maximum price in USDC'),
    minRating: z.coerce
      .number()
      .optional()
      .describe('Minimum product rating (1-5)'),
    inStockOnly: z
      .boolean()
      .optional()
      .default(true)
      .describe('Only return in-stock products (default: true)'),
  }),
  execute: async ({ query, category, maxPriceUsdc, minRating, inStockOnly }) => {
    try {
      const supabase = getAdminClient();

      let q = supabase
        .from('products')
        .select(`
          id, name, slug, description, price_usd, price_crypto, currency,
          category, images, in_stock, inventory, rating, num_reviews, tags,
          moq, tiered_pricing, status,
          vendors!inner(id, name, slug, logo_url, rating, verified)
        `)
        .eq('status', 'active')
        .or(
          `name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
        )
        .order('rating', { ascending: false })
        .limit(5);

      let rating = minRating;
      if (rating !== undefined) {
        rating = Math.max(1, Math.min(5, rating));
      }

      if (category) q = q.eq('category', category);
      if (maxPriceUsdc) q = q.lte('price_usd', maxPriceUsdc);
      if (rating) q = q.gte('rating', rating);
      if (inStockOnly) q = q.eq('in_stock', true);

      const { data, error } = await q;

      if (error) throw error;
      if (!data || data.length === 0) {
        return { found: false, products: [], message: `No products found matching "${query}".` };
      }

      const products = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceUsdc: parseFloat(p.price_usd),
        category: p.category,
        images: p.images?.slice(0, 1) ?? [],
        inStock: p.in_stock,
        inventory: p.inventory,
        rating: parseFloat(p.rating),
        numReviews: p.num_reviews,
        moq: p.moq ?? null,
        vendor: {
          id: p.vendors?.id,
          name: p.vendors?.name,
          slug: p.vendors?.slug,
          logoUrl: p.vendors?.logo_url,
          rating: parseFloat(p.vendors?.rating ?? '0'),
          verified: p.vendors?.verified,
        },
        description: p.description?.slice(0, 120) + (p.description?.length > 120 ? '…' : ''),
      }));

      return { found: true, products, count: products.length };
    } catch (err: any) {
      return { found: false, products: [], error: err.message };
    }
  },
});

// ─── 2. compare_products ──────────────────────────────────────────────────────

export const compareProductsTool = tool({
  description:
    'Compare 2 to 5 products side-by-side on price, rating, stock, MOQ, and vendor. ' +
    'IMPORTANT WORKFLOW: You MUST call search_products FIRST to get real product UUIDs, ' +
    'then pass those exact UUIDs here. Never invent or guess product IDs. ' +
    'If you do not have UUIDs from a previous search_products result, call search_products first.',
  parameters: z.object({
    productIds: z
      .array(z.string())
      .min(2).max(5)
      .describe('Array of 2-5 real product UUIDs (retrieved via search_products) to compare'),
  }),
  execute: async ({ productIds }) => {
    try {
      const supabase = getAdminClient();

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = productIds.filter(id => !uuidRegex.test(id));

      if (invalidIds.length > 0) {
        // Fetch up to 5 active products to guide the LLM
        const { data: suggestionData } = await supabase
          .from('products')
          .select('id, name')
          .eq('status', 'active')
          .limit(5);

        const suggestionList = (suggestionData || [])
          .map(p => `- Name: "${p.name}", UUID: "${p.id}"`)
          .join('\n');

        return {
          found: false,
          error: `Invalid product UUIDs provided: ${invalidIds.join(', ')}. ` +
            `You used placeholder IDs. You MUST use real UUIDs from the database. ` +
            `If you do not have the real UUIDs, search for them first using search_products. ` +
            `Here are some active products currently in the database that you can use:\n${suggestionList}\n\n` +
            `Please call search_products first to find matching products, or call compare_products using the exact real UUIDs above.`
        };
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, price_usd, price_crypto, currency, category,
          images, in_stock, inventory, rating, num_reviews, moq, tiered_pricing,
          vendors!inner(id, name, slug, rating, verified, wallet_address)
        `)
        .in('id', productIds)
        .eq('status', 'active');

      if (error) throw error;

      const products = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceUsdc: parseFloat(p.price_usd),
        category: p.category,
        image: p.images?.[0] ?? null,
        inStock: p.in_stock,
        inventory: p.inventory,
        rating: parseFloat(p.rating),
        numReviews: p.num_reviews,
        moq: p.moq ?? null,
        hasTieredPricing: Array.isArray(p.tiered_pricing) && p.tiered_pricing.length > 0,
        vendor: {
          id: p.vendors?.id,
          name: p.vendors?.name,
          slug: p.vendors?.slug,
          rating: parseFloat(p.vendors?.rating ?? '0'),
          verified: p.vendors?.verified,
        },
      }));

      // Sort by rating desc, then price asc — best value first
      const ranked = products.sort((a, b) => b.rating - a.rating || a.priceUsdc - b.priceUsdc);

      return {
        found: true,
        products: ranked,
        recommendation: ranked[0]
          ? `Based on rating and price, **${ranked[0].name}** at **${ranked[0].priceUsdc.toFixed(2)} USDC** is the best choice.`
          : null,
      };
    } catch (err: any) {
      return { found: false, products: [], error: err.message };
    }
  },
});

// ─── 3. search_vendors ────────────────────────────────────────────────────────

export const searchVendorsTool = tool({
  description:
    'Search for vendors/suppliers on Ababil Shop by procurement category, optional query keywords, and optional location. ' +
    'Returns vendors ranked by relevance to your query and search score. ' +
    'Use this for procurement requests and when the user asks for suppliers, vendors, or service providers.',
  parameters: z.object({
    category: z
      .enum(RFQ_CATEGORIES)
      .describe('Procurement category to find vendors for'),
    query: z
      .string()
      .optional()
      .describe('Optional search query or product keywords, e.g. "hoodie" or "pcb assembly"'),
    location: z
      .string()
      .optional()
      .describe('Preferred location or region, e.g. "Bangladesh", "USA", "Europe"'),
    minRating: z.coerce
      .number()
      .optional()
      .describe('Minimum vendor rating (1-5)'),
    maxDeliveryDays: z.coerce
      .number().positive()
      .optional()
      .describe('Maximum preferred delivery days'),
    limit: z.coerce
      .number()
      .default(5)
      .describe('Number of vendors to return (max 10)'),
  }),
  execute: async ({ category, query, location, minRating, maxDeliveryDays, limit }) => {
    debugLog('[searchVendorsTool] Execute parameters:', { category, query, location, minRating, maxDeliveryDays, limit });
    try {
      const supabase = getAdminClient();

      let rating = minRating;
      if (rating !== undefined) {
        rating = Math.max(1, Math.min(5, rating));
      }
      let resolvedLimit = limit;
      if (resolvedLimit !== undefined) {
        resolvedLimit = Math.max(1, Math.min(10, resolvedLimit));
      } else {
        resolvedLimit = 5;
      }

      // Query the vendor_rankings view and filter by category
      let q = supabase
        .from('vendor_rankings')
        .select('*')
        .contains('auto_quote_categories', [category]);

      if (rating) q = q.gte('rating', rating);
      if (maxDeliveryDays) {
        q = q.lte('preferred_delivery_days', maxDeliveryDays);
      }


      debugLog('[searchVendorsTool] Executing Supabase query against vendor_rankings with filters...');
      const { data, error } = await q;

      if (error) {
        debugLog('[searchVendorsTool] Supabase query error:', error);
        throw error;
      }

      debugLog('[searchVendorsTool] Raw vendor records returned from DB:', data);

      let vendors = data ?? [];

      // 1. Map keywords in query to product categories
      const categoryMapping: Record<string, string[]> = {
        'Apparel': ['hoodie', 'hoodies', 'streetwear', 'clothing', 'apparel', 'shirt', 'shirts', 't-shirt', 'tshirts', 'wear', 'laces', 'garment', 'garments', 'fashion'],
        'Tech Hardware': ['hardware', 'chips', 'haptic', 'vr', 'metaverse', 'pcb', 'sensors', 'tech', 'device', 'devices', 'computer', 'computers', 'electronics', 'chip', 'board', 'circuit'],
        'Digital Assets': ['digital', 'asset', 'software', 'code', '3d', 'model', 'asset'],
        'NFTs': ['nft', 'nfts', 'art', 'collectible', 'collectibles'],
      };

      let matchedCategories: string[] = [];
      if (query) {
        const qLower = query.toLowerCase();
        for (const [prodCat, keywords] of Object.entries(categoryMapping)) {
          if (keywords.some(keyword => qLower.includes(keyword))) {
            matchedCategories.push(prodCat);
          }
        }
      }

      // 2. Fetch all products to group categories by vendor
      const { data: allProducts } = await supabase.from('products').select('vendor_id, category');
      const vendorProductCategories: Record<string, Set<string>> = {};
      for (const p of (allProducts ?? [])) {
        if (!vendorProductCategories[p.vendor_id]) {
          vendorProductCategories[p.vendor_id] = new Set();
        }
        vendorProductCategories[p.vendor_id].add(p.category);
      }

      // 3. Product relevance search
      let productVendorIds: string[] = [];
      if (query && query.trim().length > 0) {
        const cleanQuery = query.trim().toLowerCase();
        let filterStr = `name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`;
        if (matchedCategories.length > 0) {
          const catFilters = matchedCategories.map(cat => `category.eq.${cat}`).join(',');
          filterStr += `,${catFilters}`;
        }
        const { data: matchedProducts } = await supabase
          .from('products')
          .select('vendor_id')
          .or(filterStr);
        
        productVendorIds = Array.from(new Set((matchedProducts || []).map((p: any) => p.vendor_id)));
      }

      // 4. Check query intent types
      const isApparelQuery = query && ['hoodie', 'hoodies', 'streetwear', 'clothing', 'apparel', 'shirt', 'shirts', 't-shirt', 'tshirts', 'wear', 'laces', 'garment', 'garments', 'fashion'].some(kw => query.toLowerCase().includes(kw));
      const isElectronicsQuery = query && ['hardware', 'chips', 'haptic', 'vr', 'metaverse', 'pcb', 'sensors', 'tech', 'device', 'devices', 'computer', 'computers', 'electronics', 'chip', 'board', 'circuit'].some(kw => query.toLowerCase().includes(kw));

      // 5. Score and sort vendors by product relevance + category alignment + specializations + description completeness + database score
      const scoredVendors = vendors.map((v: any) => {
        let scoreBoost = 0;

        // Resolve specializations list: either from the DB column or fall back to scanning description/name
        let specs: string[] = [];
        if (Array.isArray(v.specializations) && v.specializations.length > 0) {
          specs = v.specializations.map((s: string) => s.toLowerCase());
        } else {
          // Dynamic client-side fallback based on known keywords in description/name
          const textToScan = `${v.name ?? ''} ${v.description ?? ''}`.toLowerCase();
          const candidateSpecs = ['hoodies', 'streetwear', 'custom apparel', 'clothing', 'apparel', 'merchandise', 'hardware', 'chips', 'haptic', 'vr', 'metaverse', 'sensors', 'electronics'];
          specs = candidateSpecs.filter(spec => textToScan.includes(spec));
        }
        
        // Boost if vendor has products matching the query keyword or mapped categories
        if (productVendorIds.includes(v.id)) {
          scoreBoost += 50;
        }

        // Boost if query matches vendor name or description
        if (query) {
          const qLower = query.toLowerCase();
          if (v.name?.toLowerCase().includes(qLower) || v.description?.toLowerCase().includes(qLower)) {
            scoreBoost += 30;
          }
        }

        // Boost based on specializations matching the query keywords
        if (query && specs.length > 0) {
          const qLower = query.toLowerCase();
          let specMatches = 0;
          for (const spec of specs) {
            if (qLower.includes(spec) || spec.includes(qLower) || (qLower.includes('hoodie') && spec === 'hoodies')) {
              specMatches++;
            }
          }
          if (specMatches > 0) {
            scoreBoost += specMatches * 40;
          }
        }

        // Apply apparel/electronics intent-based boosts and penalties
        if (isApparelQuery) {
          if (vendorProductCategories[v.id]?.has('Apparel')) {
            scoreBoost += 60;
          }
          const nameDesc = `${v.name ?? ''} ${v.description ?? ''}`.toLowerCase();
          if (['streetwear', 'apparel', 'clothing', 'hoodies', 'fashion', 'wear'].some(kw => nameDesc.includes(kw))) {
            scoreBoost += 40;
          }
          if (vendorProductCategories[v.id]?.has('Tech Hardware')) {
            scoreBoost -= 50;
          }
          if (['hardware', 'chips', 'electronics', 'haptic', 'circuits', 'sensors'].some(kw => nameDesc.includes(kw))) {
            scoreBoost -= 30;
          }
        }

        if (isElectronicsQuery) {
          if (vendorProductCategories[v.id]?.has('Tech Hardware')) {
            scoreBoost += 60;
          }
          const nameDesc = `${v.name ?? ''} ${v.description ?? ''}`.toLowerCase();
          if (['hardware', 'chips', 'electronics', 'haptic', 'circuits', 'sensors'].some(kw => nameDesc.includes(kw))) {
            scoreBoost += 40;
          }
          if (vendorProductCategories[v.id]?.has('Apparel')) {
            scoreBoost -= 50;
          }
          if (['streetwear', 'apparel', 'clothing', 'hoodies', 'fashion', 'wear'].some(kw => nameDesc.includes(kw))) {
            scoreBoost -= 30;
          }
        }

        // Penalize if description is missing or extremely short (insufficient profile data, e.g. "csd")
        if (!v.description || v.description.trim().length < 15) {
          scoreBoost -= 100;
        }

        const finalScore = (parseFloat(v.search_score ?? '0')) + scoreBoost;
        return { ...v, finalScore };
      });

      // Apply filters
      const rawCount = vendors.length;

      const filteredVendors = scoredVendors.filter((v: any) => {
        // Strict category match (client-side verification)
        const matchesCategory = Array.isArray(v.auto_quote_categories) && v.auto_quote_categories.includes(category);
        
        // Ignore placeholders (like csd or containing placeholder)
        const isPlaceholder = 
          v.slug === 'csd' || 
          v.name?.toLowerCase() === 'csd' || 
          v.description?.toLowerCase() === 'scds' ||
          (v.name?.toLowerCase().includes('placeholder') || v.description?.toLowerCase().includes('placeholder'));

        // Strict final score >= 0
        const hasPositiveScore = v.finalScore >= 0;

        return matchesCategory && !isPlaceholder && hasPositiveScore;
      });

      const filteredCount = filteredVendors.length;

      // Sort by finalScore desc
      let sortedVendors = filteredVendors.sort((a: any, b: any) => b.finalScore - a.finalScore);

      // Filter by location if provided (client-side text match since location is free-form)
      if (location && sortedVendors.length > 0) {
        const loc = location.toLowerCase();
        const locationFiltered = sortedVendors.filter((v: any) =>
          v.description?.toLowerCase().includes(loc) ||
          v.name?.toLowerCase().includes(loc)
        );
        if (locationFiltered.length > 0) sortedVendors = locationFiltered;
      }

      // Limit results
      const finalVendors = sortedVendors.slice(0, resolvedLimit);
      const finalCount = finalVendors.length;

      debugLog('[searchVendorsTool] Counts:', {
        category,
        rawCount,
        filteredCount,
        finalCount
      });

      const result = finalVendors.map((v: any) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        description: v.description?.slice(0, 150) ?? null,
        logoUrl: v.logo_url ?? null,
        verified: v.verified,
        rating: parseFloat(v.rating ?? '0'),
        completedOrders: v.completed_orders ?? 0,
        deliverySuccessRate: parseFloat(v.delivery_success_rate ?? '0'),
        avgResponseHours: v.avg_response_hours ? parseFloat(v.avg_response_hours) : null,
        autoReplyEnabled: v.auto_reply_enabled ?? false,
        preferredDeliveryDays: v.preferred_delivery_days ?? null,
        searchScore: parseFloat(v.search_score ?? '0'),
        finalScore: v.finalScore,
        scoreBreakdown: {
          rating: `${v.rating}/5`,
          completedOrders: v.completed_orders ?? 0,
          deliverySuccess: `${Math.round(parseFloat(v.delivery_success_rate ?? '0') * 100)}%`,
          avgResponseTime: v.avg_response_hours
            ? `${parseFloat(v.avg_response_hours).toFixed(1)}h`
            : 'No data',
        },
      }));

      if (result.length === 0) {
        debugLog('[searchVendorsTool] No vendors left after filtering. Returning empty fallback message.');
        return {
          found: false,
          vendors: [],
          message: "No matching suppliers found.",
        };
      }

      debugLog('[searchVendorsTool] Scored and sorted vendors:', sortedVendors.map((v: any) => ({ name: v.name, finalScore: v.finalScore, specializations: v.specializations, rating: v.rating })));
      debugLog('[searchVendorsTool] Final mapped vendors output:', result);

      return {
        found: true,
        vendors: result,
        category,
        query: query ?? null,
        location: location ?? null,
        count: result.length,
      };
    } catch (err: any) {
      debugLog('[searchVendorsTool] Error caught:', err.message || err);
      return { found: false, vendors: [], error: err.message };
    }
  },
});

// ─── 4. add_to_cart ───────────────────────────────────────────────────────────

export const addToCartTool = tool({
  description:
    'Add a product to the user\'s shopping cart. ' +
    'Validates the product exists, is active, and has sufficient stock. ' +
    'Returns product details that the client UI will use to update the cart. ' +
    'Use this when the user says "add to cart", "buy this", or "I want this".',
  parameters: z.object({
    productId: z
      .string().uuid()
      .describe('Product UUID to add to cart'),
    quantity: z.coerce
      .number().int().positive()
      .default(1)
      .describe('Quantity to add'),
  }),
  execute: async ({ productId, quantity }) => {
    try {
      const supabase = getAdminClient();

      const { data: product, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, price_usd, price_crypto, currency, category,
          images, in_stock, inventory, rating, num_reviews, moq, tiered_pricing,
          vendors!inner(id, name, slug)
        `)
        .eq('id', productId)
        .eq('status', 'active')
        .single();

      if (error || !product) {
        return { success: false, error: 'Product not found or no longer available.' };
      }

      if (!product.in_stock || product.inventory < quantity) {
        return {
          success: false,
          error: `Insufficient stock. Only ${product.inventory} unit(s) available.`,
        };
      }

      // Check MOQ
      if (product.moq && quantity < product.moq) {
        return {
          success: false,
          error: `Minimum order quantity for this product is ${product.moq} units.`,
        };
      }

      // Calculate effective price (tiered pricing if applicable)
      let effectivePriceUsdc = parseFloat(product.price_usd);
      if (Array.isArray(product.tiered_pricing) && product.moq && quantity >= product.moq) {
        const sorted = [...product.tiered_pricing].sort(
          (a: any, b: any) => b.minQuantity - a.minQuantity
        );
        const tier = sorted.find((t: any) => quantity >= t.minQuantity);
        if (tier) effectivePriceUsdc = parseFloat(tier.priceUSD);
      }

      return {
        success: true,
        action: 'add_to_cart', // Client UI intercepts this action type
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          priceUSD: effectivePriceUsdc,
          priceCrypto: effectivePriceUsdc,
          currency: 'USDC',
          category: product.category,
          images: product.images ?? [],
          inStock: product.in_stock,
          inventory: product.inventory,
          rating: parseFloat(product.rating),
          numReviews: product.num_reviews,
          moq: product.moq ?? undefined,
          tieredPricing: product.tiered_pricing ?? undefined,
          tags: [],
          status: 'active',
          vendorId: (product.vendors as any)?.id,
          vendor: product.vendors,
          createdAt: '',
          updatedAt: '',
        },
        quantity,
        lineTotal: effectivePriceUsdc * quantity,
        message: `✅ Added ${quantity}× **${product.name}** to your cart for **${(effectivePriceUsdc * quantity).toFixed(2)} USDC**.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});

// ─── 5. create_rfq ────────────────────────────────────────────────────────────

export const createRfqTool = tool({
  description:
    'Create a Request for Quotation (RFQ) for bulk or custom procurement. ' +
    'Use this for orders that need vendor quotes — bulk products, custom merchandise, services, etc. ' +
    'IMPORTANT: Before calling this tool, collect ALL required fields from the user via conversation: ' +
    'title, description, type (product or service), category, quantity, budget, delivery deadline, and location. ' +
    'The RFQ will be sent to all matching vendors who can submit quotes.',
  parameters: z.object({
    buyerId: z
      .string().uuid()
      .describe('Authenticated buyer user ID'),
    title: z
      .string().min(3).max(200)
      .describe('Short descriptive title, e.g. "500 Custom Hoodies"'),
    description: z
      .string().min(5).max(2000)
      .describe(
        'Detailed description of what is needed. If this is shorter than 20 characters, it will be automatically ' +
        'enriched to synthesize a detailed description (incorporating title, quantity, budget, location).'
      ),
    rfqType: z
      .enum(['product', 'service'])
      .describe('"product" for physical goods, "service" for services like design or software dev'),
    category: z
      .enum(RFQ_CATEGORIES)
      .describe('Procurement category'),
    quantity: z.coerce
      .number().int().positive()
      .describe('Quantity needed (units for products, hours/deliverables for services)'),
    budgetUsdc: z.coerce
      .number().positive()
      .describe('Maximum budget in USDC'),
    deliveryDeadline: z
      .string().datetime()
      .optional()
      .describe('ISO 8601 deadline, e.g. "2024-08-01T00:00:00Z"'),
    location: z
      .string().optional()
      .describe('Preferred supplier location or region'),
    requirements: z
      .record(z.unknown())
      .optional()
      .default({})
      .describe('Additional structured requirements as key-value pairs'),
    conversationId: z
      .string().uuid().optional()
      .describe('Agent conversation ID for audit trail'),
  }),
  execute: async ({
    buyerId, title, description, rfqType, category, quantity,
    budgetUsdc, deliveryDeadline, location, requirements, conversationId,
  }) => {
    try {
      const supabase = getAdminClient();

      let resolvedDescription = description;
      if (resolvedDescription.length < 20) {
        resolvedDescription = `Need ${quantity}x ${title} for delivery${location ? ` in ${location}` : ''}. Detailed requirements: ${description}. Budget: ${budgetUsdc} USDC.`;
      }

      // 1. Create the RFQ
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .insert({
          buyer_id: buyerId,
          title,
          description: resolvedDescription,
          rfq_type: rfqType,
          category,
          quantity,
          budget_usdc: budgetUsdc,
          delivery_deadline: deliveryDeadline ?? null,
          location: location ?? null,
          requirements: requirements ?? {},
          status: 'open',
          conversation_id: conversationId ?? null,
        })
        .select()
        .single();

      if (rfqError || !rfq) throw rfqError ?? new Error('Failed to create RFQ');

      // 2. Find matching vendors for this category
      const { data: vendors } = await supabase
        .from('vendor_rankings')
        .select('id, name, auto_reply_enabled, auto_quote_categories')
        .order('search_score', { ascending: false })
        .limit(20);

      const matchingVendors = (vendors ?? []).filter((v: any) => {
        if (!v.auto_quote_categories || v.auto_quote_categories.length === 0) return true;
        return v.auto_quote_categories.includes(category);
      });

      const vendorIds = matchingVendors.map((v: any) => v.id);

      // 3. Dispatch notifications to vendors (fire-and-forget)
      if (vendorIds.length > 0) {
        const notifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notification-dispatch`;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

        fetch(notifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            event_type: 'rfq_created',
            rfq_id: rfq.id,
            vendor_ids: vendorIds,
            rfq: {
              id: rfq.id,
              title: rfq.title,
              category: rfq.category,
              rfq_type: rfq.rfq_type,
              quantity: rfq.quantity,
              budget_usdc: rfq.budget_usdc,
              delivery_deadline: rfq.delivery_deadline,
              location: rfq.location,
              description: rfq.description,
            },
          }),
        }).catch(() => {/* non-critical — RFQ is already created */});
      }

      return {
        success: true,
        rfq: {
          id: rfq.id,
          title: rfq.title,
          category: rfq.category,
          rfqType: rfq.rfq_type,
          quantity: rfq.quantity,
          budgetUsdc: parseFloat(rfq.budget_usdc),
          status: rfq.status,
          deliveryDeadline: rfq.delivery_deadline,
          location: rfq.location,
          createdAt: rfq.created_at,
        },
        vendorsNotified: vendorIds.length,
        message: `✅ RFQ created! **${vendorIds.length} vendor(s)** have been notified and can now submit quotes. I'll let you know when quotes arrive.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});

// ─── 6. get_rfq_status ────────────────────────────────────────────────────────

export const getRfqStatusTool = tool({
  description:
    'Get the current status of an RFQ including all vendor quotes received. ' +
    'Returns quotes sorted by total price (cheapest first) with vendor details. ' +
    'Use this when the user asks to see quotes, check RFQ status, or compare vendor offers.',
  parameters: z.object({
    rfqId: z
      .string().uuid().optional()
      .describe('Specific RFQ UUID. If not provided, returns the user\'s most recent open RFQ.'),
    buyerId: z
      .string().uuid()
      .describe('Authenticated buyer user ID'),
  }),
  execute: async ({ rfqId, buyerId }) => {
    try {
      const supabase = getAdminClient();

      // Resolve which RFQ to show
      let resolvedRfqId = rfqId;
      if (!resolvedRfqId) {
        const { data: recent } = await supabase
          .from('rfqs')
          .select('id')
          .eq('buyer_id', buyerId)
          .in('status', ['open', 'quoted'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        resolvedRfqId = recent?.id;
      }

      if (!resolvedRfqId) {
        return {
          found: false,
          message: 'No open RFQs found. Create a new procurement request to receive quotes.',
        };
      }

      // Fetch RFQ + all quotes
      const { data: rfq, error } = await supabase
        .from('rfqs')
        .select(`
          id, title, description, rfq_type, category, quantity, budget_usdc,
          delivery_deadline, location, status, created_at,
          vendor_quotes(
            id, unit_price_usdc, total_price_usdc, delivery_days, notes,
            auto_generated, status, escrow_status, escrow_locked_at, created_at, order_id,
            vendors(id, name, slug, logo_url, rating, verified)
          )
        `)
        .eq('id', resolvedRfqId)
        .eq('buyer_id', buyerId)
        .single();

      if (error || !rfq) {
        return { found: false, message: 'RFQ not found or you do not have access.' };
      }

      // Sort quotes by total price ascending (cheapest first)
      const quotes = ((rfq.vendor_quotes as any[]) ?? [])
        .filter((q) => q.status === 'pending')
        .sort((a, b) => parseFloat(a.total_price_usdc) - parseFloat(b.total_price_usdc))
        .map((q, i) => ({
          id: q.id,
          rank: i + 1,
          vendorId: (q.vendors as any)?.id,
          vendorName: (q.vendors as any)?.name,
          vendorSlug: (q.vendors as any)?.slug,
          vendorLogoUrl: (q.vendors as any)?.logo_url ?? null,
          vendorRating: parseFloat((q.vendors as any)?.rating ?? '0'),
          vendorVerified: (q.vendors as any)?.verified ?? false,
          unitPriceUsdc: parseFloat(q.unit_price_usdc),
          totalPriceUsdc: parseFloat(q.total_price_usdc),
          deliveryDays: q.delivery_days,
          notes: q.notes,
          autoGenerated: q.auto_generated,
          escrowStatus: q.escrow_status,
          submittedAt: q.created_at,
          withinBudget: parseFloat(q.total_price_usdc) <= parseFloat(rfq.budget_usdc),
        }));

      const recommendation =
        quotes.length > 0 && quotes[0].withinBudget
          ? `**Recommended: ${quotes[0].vendorName}** — cheapest quote at **${quotes[0].totalPriceUsdc.toFixed(2)} USDC** with ${quotes[0].deliveryDays}-day delivery.`
          : quotes.length > 0
          ? `**Lowest quote: ${quotes[0].vendorName}** at **${quotes[0].totalPriceUsdc.toFixed(2)} USDC**, but it exceeds your budget of ${parseFloat(rfq.budget_usdc).toFixed(2)} USDC.`
          : null;

      return {
        found: true,
        rfq: {
          id: rfq.id,
          title: rfq.title,
          category: rfq.category,
          rfqType: rfq.rfq_type,
          quantity: rfq.quantity,
          budgetUsdc: parseFloat(rfq.budget_usdc),
          status: rfq.status,
          deliveryDeadline: rfq.delivery_deadline,
          location: rfq.location,
          createdAt: rfq.created_at,
        },
        quotes,
        quoteCount: quotes.length,
        recommendation,
        message:
          quotes.length === 0
            ? `Your RFQ **"${rfq.title}"** is open and awaiting vendor quotes.`
            : `**${quotes.length} quote(s)** received for **"${rfq.title}"**. ${recommendation ?? ''}`,
      };
    } catch (err: any) {
      return { found: false, error: err.message };
    }
  },
});

// ─── 7. compare_top_products ──────────────────────────────────────────────────
// A one-shot tool that searches AND compares in a single invocation.
// This avoids the two-step UUID plumbing that small LLMs struggle with.

export const compareTopProductsTool = tool({
  description:
    'Search for and compare the top products matching a query in a single step. ' +
    'Use this when the user asks to compare products (e.g. "compare top 3 tech products"). ' +
    'This is the preferred tool for comparison requests — it searches and compares automatically.',
  parameters: z.object({
    query: z
      .string()
      .describe('What to search for, e.g. "tech products", "gaming keyboards", "wireless headphones"'),
    category: z
      .enum([
        'Tech Hardware', 'Apparel', 'Digital Assets',
        'NFTs', 'Home & Living', 'Gifts', 'Toys',
      ])
      .optional()
      .describe('Optional category filter'),
    limit: z
      .number()
      .int()
      .min(2)
      .max(5)
      .default(3)
      .describe('Number of products to compare (default 3)'),
  }),
  execute: async ({ query, category, limit = 3 }) => {
    try {
      const supabase = getAdminClient();

      let q = supabase
        .from('products')
        .select(`
          id, name, slug, description, price_usd, price_crypto, currency,
          category, images, in_stock, inventory, rating, num_reviews, tags,
          moq, tiered_pricing, status,
          vendors!inner(id, name, slug, logo_url, rating, verified)
        `)
        .eq('status', 'active')
        .eq('in_stock', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (query) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
      }
      if (category) {
        q = q.eq('category', category);
      }

      const { data, error } = await q;

      if (error) throw error;
      if (!data || data.length === 0) {
        // Fallback: return top-rated products regardless of query
        const { data: fallback } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, price_usd, price_crypto, currency,
            category, images, in_stock, inventory, rating, num_reviews, tags,
            moq, tiered_pricing, status,
            vendors!inner(id, name, slug, logo_url, rating, verified)
          `)
          .eq('status', 'active')
          .eq('in_stock', true)
          .order('rating', { ascending: false })
          .limit(limit);

        if (!fallback || fallback.length === 0) {
          return { found: false, products: [], message: `No products found matching "${query}".` };
        }
        data?.push(...(fallback ?? []));
      }

      const products = (data ?? []).slice(0, limit).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceUsdc: parseFloat(p.price_usd),
        category: p.category,
        images: p.images?.slice(0, 1) ?? [],
        inStock: p.in_stock,
        inventory: p.inventory,
        rating: parseFloat(p.rating),
        numReviews: p.num_reviews,
        moq: p.moq ?? null,
        vendor: {
          id: p.vendors?.id,
          name: p.vendors?.name,
          slug: p.vendors?.slug,
          logoUrl: p.vendors?.logo_url,
          rating: parseFloat(p.vendors?.rating ?? '0'),
          verified: p.vendors?.verified,
        },
        description: p.description?.slice(0, 120) + (p.description?.length > 120 ? '…' : ''),
      }));

      const ranked = products.sort(
        (a: any, b: any) => b.rating - a.rating || a.priceUsdc - b.priceUsdc
      );

      return {
        found: true,
        products: ranked,
        count: ranked.length,
        recommendation: ranked[0]
          ? `Based on rating and price, **${ranked[0].name}** at **${ranked[0].priceUsdc.toFixed(2)} USDC** is the best choice.`
          : null,
      };
    } catch (err: any) {
      return { found: false, products: [], error: err.message };
    }
  },
});

// ─── Exported tool registry ───────────────────────────────────────────────────

export const agentTools = {
  search_products: searchProductsTool,
  compare_products: compareProductsTool,
  compare_top_products: compareTopProductsTool,
  search_vendors: searchVendorsTool,
  add_to_cart: addToCartTool,
  create_rfq: createRfqTool,
  get_rfq_status: getRfqStatusTool,
} as const;

export type AgentToolName = keyof typeof agentTools;
