import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found in database', details: orderError });
    }

    const intentId = order.payment_intent_id;
    if (!intentId) {
      return NextResponse.json({ error: 'No intentId found on order', order });
    }

    const ababilApiKey = process.env.ABABIL_API_KEY || '';
    const ababilResponse = await fetch(`https://testnetv1.ababilpay.xyz/api/v1/x402/intents/${intentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ababilApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseStatus = ababilResponse.status;
    const text = await ababilResponse.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (e) {}

    return NextResponse.json({
      success: ababilResponse.ok,
      responseStatus,
      order,
      ababilPayRawText: text,
      ababilPayJson: json
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
