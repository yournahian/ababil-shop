import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, action, intentId: clientIntentId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId' },
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

    // Fetch the order
    const { data: order, error: orderFetchError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderFetchError || !order) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found.` },
        { status: 404 }
      );
    }

    if (action === 'tick') {
      const { data: delivery, error: delError } = await adminSupabase
        .from('delivery_jobs')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (delError || !delivery) {
        return NextResponse.json({ success: false, error: 'Delivery job not found' }, { status: 404 });
      }

      let nextStatus = delivery.status;
      let nextLat = parseFloat(delivery.latitude);
      let nextLon = parseFloat(delivery.longitude);
      let courier = delivery.courier_name;

      if (delivery.status === 'preparing') {
        nextStatus = 'in_transit';
        courier = 'Ababil Drone Courier #09';
        nextLat = 40.7328;
        nextLon = -74.0260;

        await adminSupabase
          .from('orders')
          .update({ delivery_engine_status: 'in_transit', status: 'shipped' })
          .eq('id', orderId);
      } else if (delivery.status === 'in_transit') {
        const destLat = 40.7128;
        const destLon = -74.0060;
        const dLat = destLat - nextLat;
        const dLon = destLon - nextLon;

        nextLat += dLat * 0.4;
        nextLon += dLon * 0.4;

        const distance = Math.sqrt((destLat - nextLat)**2 + (destLon - nextLon)**2);
        if (distance < 0.01) {
          nextStatus = 'delivered';
          nextLat = destLat;
          nextLon = destLon;

          await adminSupabase
            .from('orders')
            .update({ delivery_engine_status: 'delivered', status: 'delivered' })
            .eq('id', orderId);

          await adminSupabase.from('xp_transactions').insert({
            user_id: order.customer_id,
            amount: order.xp_earned || 50,
            source: 'delivery_streak',
            description: `Delivery engine simulated complete. XP rewarded!`
          });
        }
      }

      const { error: updateDelError } = await adminSupabase
        .from('delivery_jobs')
        .update({
          status: nextStatus,
          latitude: nextLat,
          longitude: nextLon,
          courier_name: courier
        })
        .eq('id', delivery.id);

      if (updateDelError) {
        return NextResponse.json({ success: false, error: updateDelError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    let txHash = order.payment_tx_hash || '';
    let intentId = order.payment_intent_id;

    // If client supplied a real intent ID, update it in the database
    if (clientIntentId && clientIntentId !== intentId) {
      const { error: updateIntentError } = await adminSupabase
        .from('orders')
        .update({ payment_intent_id: clientIntentId })
        .eq('id', orderId);
      
      if (!updateIntentError) {
        intentId = clientIntentId;
      } else {
        console.error("Failed to update order with real client intentId:", updateIntentError);
      }
    }

    if (action === 'verify') {
      if (!intentId) {
        return NextResponse.json(
          { success: false, error: 'No payment intent associated with this order.' },
          { status: 400 }
        );
      }

      // Check if it is a simulated intent
      if (intentId.startsWith('sim_intent_')) {
        console.warn('Verify called on simulated intent. Automatically falling back to simulation success.');
        txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      } else {
        // Fetch intent status from AbabilPay API
        const ababilApiKey = process.env.ABABIL_API_KEY || '';
        const ababilResponse = await fetch(`https://testnetv1.ababilpay.xyz/api/v1/x402/intents/${intentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ababilApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!ababilResponse.ok) {
          const errorData = await ababilResponse.json().catch(() => ({}));
          return NextResponse.json(
            { success: false, error: errorData?.error?.message || errorData?.message || `Failed to fetch intent from AbabilPay: HTTP ${ababilResponse.status}` },
            { status: 400 }
          );
        }

        const ababilData = await ababilResponse.json();
        const intent = ababilData.data?.intent || ababilData.intent || ababilData.data || ababilData;
        const status = intent.status;
        txHash = intent.tx_hash || intent.transactionHash || '';

        if (status !== 'paid' && status !== 'succeeded') {
          return NextResponse.json(
            { success: false, error: `Payment status is currently '${status}'. It has not been marked as paid on the Base Sepolia network yet.` },
            { status: 400 }
          );
        }
      }
    } else {
      // Simulate action
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    // Update order status in DB (bypass RLS completely via admin client!)
    const { error: orderError } = await adminSupabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        payment_tx_hash: txHash,
        delivery_engine_status: 'preparing'
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // Spawn Delivery Job (bypass RLS)
    const estDelivery = new Date();
    estDelivery.setMinutes(estDelivery.getMinutes() + 15);

    const { error: deliveryError } = await adminSupabase
      .from('delivery_jobs')
      .insert({
        order_id: orderId,
        courier_name: 'Ababil Drone Courier #09',
        status: 'preparing',
        latitude: 40.7128000,
        longitude: -74.0060000,
        estimated_delivery_at: estDelivery.toISOString()
      });

    if (deliveryError) {
      console.error("Simulated/Verified delivery spawn failed:", deliveryError);
    }

    // Award XP (bypass RLS)
    const xpEarned = order.xp_earned || 50;
    const { error: xpError } = await adminSupabase.from('xp_transactions').insert({
      user_id: order.customer_id,
      amount: xpEarned,
      source: 'purchase',
      description: action === 'verify' 
        ? `USDC payment verified on-chain. Awarded ${xpEarned} purchase XP!`
        : `Simulated USDC payment completed. Awarded ${xpEarned} purchase XP!`
    });

    if (xpError) {
      console.error("Failed to award XP:", xpError);
    }

    return NextResponse.json({
      success: true,
      message: action === 'verify' ? 'Transaction verified and settled!' : 'Payment simulated successfully!',
      txHash
    });

  } catch (err: any) {
    console.error('Error settling order:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
