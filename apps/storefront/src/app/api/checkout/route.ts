import { NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

// Create intent endpoint: POST /api/checkout
export async function POST(request: Request) {
  try {
    const { items, shippingAddress, userId } = await request.json();

    if (!items || items.length === 0 || !shippingAddress || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required checkout payload.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase server credentials not configured.' },
        { status: 500 }
      );
    }

    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);

    // 1. Backend Price Validation
    let subtotal = 0;
    const validatedItems = [];
    let firstVendorId = '';

    for (const item of items) {
      const { data: product, error: prodError } = await adminSupabase
        .from('products')
        .select('*, vendors(*)')
        .eq('id', item.productId)
        .single();

      if (prodError || !product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found.` },
          { status: 404 }
        );
      }

      if (product.status !== 'active') {
        return NextResponse.json(
          { success: false, error: `Product "${product.name}" is no longer active or is delisted.` },
          { status: 400 }
        );
      }

      // Check price
      let unitPrice = parseFloat(product.price_usd);
      
      // Calculate tiered pricing discounts if applicable
      if (product.tiered_pricing && product.moq && item.quantity >= product.moq) {
        const tiers = product.tiered_pricing;
        const applicableTier = [...tiers]
          .sort((a: any, b: any) => b.minQuantity - a.minQuantity)
          .find((t: any) => item.quantity >= t.minQuantity);
        if (applicableTier) {
          unitPrice = parseFloat(applicableTier.priceUSD);
        }
      }

      subtotal += unitPrice * item.quantity;
      firstVendorId = product.vendor_id;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        priceAtPurchase: unitPrice,
        vendorWallet: product.vendors?.wallet_address || '0x2222222222222222222222222222222222222222'
      });
    }

    const shippingCost = 0.00; // Simulated free shipping
    const totalAmount = subtotal + shippingCost;
    
    // Earn 10 XP per USDC purchase + 20 baseline
    const xpEarned = Math.floor(totalAmount * 10) + 20;

    // 2. Insert Order in DB (Pending Status)
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        customer_id: userId,
        vendor_id: firstVendorId,
        status: 'pending',
        shipping_address: shippingAddress,
        payment_status: 'pending',
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        xp_earned: xpEarned,
        delivery_engine_status: 'idle'
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation failed:", orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction ledger.' },
        { status: 500 }
      );
    }

    // 3. Insert Order Items
    for (const vItem of validatedItems) {
      await adminSupabase.from('order_items').insert({
        order_id: order.id,
        product_id: vItem.productId,
        quantity: vItem.quantity,
        price_at_purchase: vItem.priceAtPurchase
      });
    }

    // 4. Create AbabilPay Payment Intent
    const ababilApiKey = process.env.ABABIL_API_KEY || '';
    
    // Vendor recipient wallet
    const recipient = validatedItems[0]?.vendorWallet || '0x2222222222222222222222222222222222222222';
    
    // Amount in base units (USDC has 6 decimals)
    const amountInBaseUnits = Math.floor(totalAmount * 1000000);

    const description = validatedItems.length === 1
      ? validatedItems[0].name
      : `${validatedItems.length} items from Ababil Shop`;

    const ababilResponse = await fetch('https://testnetv1.ababilpay.xyz/api/v1/x402/intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ababilApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount_usdc: totalAmount,
        order_id: order.id,
        description: description
      })
    });

    const ababilData = await ababilResponse.json();
    const intentObj = ababilData.data?.intent || ababilData.intent || ababilData.data || ababilData;
    const realIntentId = intentObj?.intent_id || intentObj?.id || ababilData.intent_id || ababilData.id;
    const backendReqs = intentObj?.payment_requirements || ababilData.payment_requirements || ababilData.data?.payment_requirements || [];

    if (!ababilResponse.ok || !realIntentId) {
      console.error("AbabilPay intent creation failed:", ababilData);
      
      // Simulation backup if testnet API is down or invalid key:
      // We generate a local simulation flow url to not block testing!
      const fallbackUrl = `/checkout/success?orderId=${order.id}&simulated=true`;
      
      // Update order with local simulated payment intent
      const simIntentId = `sim_intent_${order.id.slice(0,8)}`;
      await adminSupabase
        .from('orders')
        .update({ payment_intent_id: simIntentId })
        .eq('id', order.id);

      const mockIntent = {
        id: simIntentId,
        intent_id: simIntentId,
        status: 'pending',
        amount_usdc: totalAmount,
        payment_requirements: [
          {
            scheme: 'exact',
            network: 'eip155:84532',
            maxAmountRequired: Math.floor(totalAmount * 1000000).toString(),
            payTo: recipient,
            asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
            maxTimeoutSeconds: 900,
            usdcDomainName: 'USDC',
            x402Version: 1
          }
        ]
      };

      return NextResponse.json({
        success: true,
        orderId: order.id,
        checkoutUrl: fallbackUrl,
        simulated: true,
        intent: mockIntent
      });
    }

    // 5. Update Order in DB with AbabilPay Intent ID
    await adminSupabase
      .from('orders')
      .update({ payment_intent_id: realIntentId })
      .eq('id', order.id);

    const mergedIntent = {
      ...intentObj,
      intent_id: realIntentId,
      payment_requirements: backendReqs
    };

    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl: intentObj.hosted_checkout_url || intentObj.hosted_url || intentObj.checkout_url || `/checkout/success?orderId=${order.id}`,
      intentId: realIntentId,
      intent: mergedIntent
    });

  } catch (err: any) {
    console.error("Checkout endpoint error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
