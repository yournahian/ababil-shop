import { NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// POST /api/agent/cart — Validate stock and price for a product addition
export async function POST(req: Request) {
  try {
    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: product, error } = await supabaseAdmin
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
      return NextResponse.json({ success: false, error: 'Product not found or inactive' }, { status: 404 });
    }

    if (!product.in_stock || product.inventory < quantity) {
      return NextResponse.json({
        success: false,
        error: `Insufficient stock. Only ${product.inventory} unit(s) available.`,
      }, { status: 400 });
    }

    if (product.moq && quantity < product.moq) {
      return NextResponse.json({
        success: false,
        error: `Minimum order quantity for this product is ${product.moq} units.`,
      }, { status: 400 });
    }

    // Calculate effective price
    let effectivePriceUsdc = parseFloat(product.price_usd);
    if (Array.isArray(product.tiered_pricing) && product.moq && quantity >= product.moq) {
      const sorted = [...product.tiered_pricing].sort(
        (a: any, b: any) => b.minQuantity - a.minQuantity
      );
      const tier = sorted.find((t: any) => quantity >= t.minQuantity);
      if (tier) effectivePriceUsdc = parseFloat(tier.priceUSD);
    }

    return NextResponse.json({
      success: true,
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
        vendorId: (product.vendors as any)?.id,
        vendor: product.vendors,
      },
      quantity,
      lineTotal: effectivePriceUsdc * quantity,
    });
  } catch (err: any) {
    console.error('Error in agent cart route:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
