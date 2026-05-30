import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Securely query associated delivery job on the server side
    const { data: delData } = await adminSupabase
      .from('delivery_jobs')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        customerId: order.customer_id,
        vendorId: order.vendor_id,
        status: order.status,
        shippingAddress: order.shipping_address,
        paymentStatus: order.payment_status,
        paymentIntentId: order.payment_intent_id,
        paymentTxHash: order.payment_tx_hash,
        totalAmount: parseFloat(order.total_amount),
        shippingCost: parseFloat(order.shipping_cost),
        xpEarned: order.xp_earned,
        deliveryEngineStatus: order.delivery_engine_status,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      },
      delivery: delData ? {
        id: delData.id,
        orderId: delData.order_id,
        courierName: delData.courier_name,
        status: delData.status,
        latitude: parseFloat(delData.latitude),
        longitude: parseFloat(delData.longitude),
        estimatedDeliveryAt: delData.estimated_delivery_at,
        updatedAt: delData.updated_at
      } : null
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
