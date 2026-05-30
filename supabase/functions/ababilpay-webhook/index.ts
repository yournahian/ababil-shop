import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Parse webhook payload
    const body = await req.json();
    const { id: eventId, type: eventType, data } = body;

    if (!eventId || !eventType || !data) {
      return new Response(
        JSON.stringify({ success: false, error: "Malformed payload. Required fields: id, type, data" }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Log webhook for auditing
    const { error: logError } = await supabase
      .from("ababilpay_webhooks")
      .insert({
        event_id: eventId,
        event_type: eventType,
        payload: body,
        processed: false
      });

    if (logError) {
      console.warn("Failed to audit webhook payload:", logError);
    }

    const intent = data.intent || data;
    const intentId = intent.id;
    const paymentStatus = intent.status;
    const txHash = intent.tx_hash || intent.transactionHash || "";
    // AbabilPay hosted checkout returns original orderId as externalId or metadata
    const orderId = intent.external_id || (intent.metadata && intent.metadata.orderId);

    if (!intentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing intent ID in event data" }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Fetch order to verify
    let orderQuery = supabase.from("orders").select("*");
    if (orderId) {
      orderQuery = orderQuery.eq("id", orderId);
    } else {
      orderQuery = orderQuery.eq("payment_intent_id", intentId);
    }

    const { data: order, error: orderFetchError } = await orderQuery.maybeSingle();

    if (orderFetchError || !order) {
      console.error(`Order not found for intent ${intentId} / orderId ${orderId}`);
      // Return 200 so AbabilPay doesn't keep retrying, but mark log as errored
      await supabase
        .from("ababilpay_webhooks")
        .update({ 
          processed: true, 
          error_message: `Order not found for intent ${intentId} / order ${orderId}` 
        })
        .eq("event_id", eventId);

      return new Response(
        JSON.stringify({ success: false, warning: "Order not found, logged event." }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 3. Process events
    if (eventType === "intent.succeeded" || paymentStatus === "succeeded") {
      // Transition Order to paid and processing
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          payment_tx_hash: txHash,
          payment_intent_id: intentId, // Ensure it's populated
          delivery_engine_status: "preparing"
        })
        .eq("id", order.id);

      if (orderUpdateError) throw orderUpdateError;

      // Create simulated Delivery Job
      const estDelivery = new Date();
      estDelivery.setMinutes(estDelivery.getMinutes() + 15); // Simulated ETA: 15 mins

      const { error: deliveryError } = await supabase
        .from("delivery_jobs")
        .insert({
          order_id: order.id,
          courier_name: "Awaiting Dispatch",
          status: "preparing",
          latitude: 40.7128000,
          longitude: -74.0060000,
          estimated_delivery_at: estDelivery.toISOString()
        });

      if (deliveryError) {
        console.error("Failed to spawn delivery job:", deliveryError);
      }

      // Reward Buyer with purchase XP (10 XP per USDC purchase + 20 baseline)
      const buyerXp = Math.floor(parseFloat(order.total_amount) * 10) + 20;
      await supabase.from("xp_transactions").insert({
        user_id: order.customer_id,
        amount: buyerXp,
        source: "purchase",
        description: `Earned ${buyerXp} XP for buying products in Order #${order.id.slice(0,8)}`
      });

      // Reward Vendor with sell XP (50 XP standard)
      if (order.vendor_id) {
        await supabase.from("xp_transactions").insert({
          user_id: order.vendor_id,
          amount: 50,
          source: "purchase",
          description: `Earned 50 XP for selling products in Order #${order.id.slice(0,8)}`
        });
      }

    } else if (eventType === "intent.failed" || paymentStatus === "failed") {
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled"
        })
        .eq("id", order.id);
    }

    // 4. Mark webhook as processed
    await supabase
      .from("ababilpay_webhooks")
      .update({ processed: true })
      .eq("event_id", eventId);

    return new Response(
      JSON.stringify({ success: true, orderId: order.id }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 500 }
    );
  }
});
