import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@ababil/supabase';
import { cookies } from 'next/headers';
import { isRateLimited } from '@/lib/rate-limit';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// POST /api/agent/rfq/[id]/accept — Accept a vendor quote
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: rfqId } = params;
    const { quoteId, shippingAddress, txHash } = await req.json();

    if (!quoteId) {
      return NextResponse.json({ success: false, error: 'Quote ID is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);
    const supabaseAdmin = getAdminClient();

    let user: any = null;

    // Support Telegram Bot auth via custom headers
    const telegramChatId = req.headers.get('x-telegram-chat-id');
    const telegramBotToken = req.headers.get('x-telegram-bot-token');

    if (telegramChatId && telegramBotToken && telegramBotToken === process.env.TELEGRAM_BOT_TOKEN) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('telegram_chat_id', String(telegramChatId))
        .single();
      
      if (profile) {
        user = { id: profile.id };
      }
    } else {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting per user / IP to prevent spamming
    const ip = req.headers.get('x-forwarded-for') || 'local';
    const limitKey = `accept_${user.id}_${ip}`;
    if (isRateLimited(limitKey, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many accept requests. Please wait a minute.' },
        { status: 429 }
      );
    }


    const orderAddress = shippingAddress || {
      fullName: 'Agent Procurement Buyer',
      addressLine1: 'RFQ Delivery Destination',
      addressLine2: 'Global Delivery',
    };

    // 1. Fetch chosen quote and verify status
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('vendor_quotes')
      .select(`
        id,
        total_price_usdc,
        status,
        vendor_id,
        vendors (
          id,
          name,
          wallet_address
        )
      `)
      .eq('id', quoteId)
      .eq('rfq_id', rfqId)
      .maybeSingle();

    if (quoteError || !quote) {
      return NextResponse.json({ success: false, error: 'Quote not found or invalid RFQ link.' }, { status: 400 });
    }

    if (quote.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Quote has already been processed.' }, { status: 400 });
    }

    // 2. Create Order in pending status
    const xpEarned = Math.floor(parseFloat(quote.total_price_usdc) * 10) + 20;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: user.id,
        vendor_id: quote.vendor_id,
        status: 'pending',
        shipping_address: orderAddress,
        payment_status: 'pending',
        total_amount: parseFloat(quote.total_price_usdc),
        shipping_cost: 0.00,
        xp_earned: xpEarned,
        delivery_engine_status: 'idle',
        agent_initiated: true,
        rfq_quote_id: quoteId
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order insertion failed:', orderError);
      return NextResponse.json({ success: false, error: 'Failed to insert pending order.' }, { status: 500 });
    }

    // 3. Create AbabilPay Payment Intent
    const ababilApiKey = process.env.ABABIL_API_KEY || '';
    const totalAmount = parseFloat(quote.total_price_usdc);
    const recipient = (quote.vendors as any)?.wallet_address || '0x2222222222222222222222222222222222222222';
    
    let intentObj: any;
    let simulated = false;
    
    try {
      const ababilResponse = await fetch('https://testnetv1.ababilpay.xyz/api/v1/x402/intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ababilApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_usdc: totalAmount,
          order_id: order.id,
          description: `Quote for ${rfqId.slice(0,8)} from ${(quote.vendors as any)?.name || 'Vendor'}`
        })
      });

      if (ababilResponse.ok) {
        const ababilData = await ababilResponse.json();
        intentObj = ababilData.data?.intent || ababilData.intent || ababilData.data || ababilData;
      } else {
        throw new Error('API response not OK');
      }
    } catch (e) {
      console.warn('[RFQ Accept] AbabilPay API error. Generating simulated intent.', e);
      simulated = true;
      const simIntentId = `sim_intent_${order.id.slice(0, 8)}`;
      intentObj = {
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
    }

    const realIntentId = intentObj?.intent_id || intentObj?.id || intentObj?.intentId || `sim_intent_${order.id.slice(0, 8)}`;

    // 4. Update order with payment intent ID
    await supabaseAdmin
      .from('orders')
      .update({ payment_intent_id: realIntentId })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      intentId: realIntentId,
      intent: {
        ...intentObj,
        intent_id: realIntentId
      },
      simulated
    });
  } catch (err: any) {
    console.error('Error accepting quote:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
