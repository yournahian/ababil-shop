import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase.ts";

const COURIER_NAMES = [
  "Ababil Drone Unit-9",
  "Base Courier Alpha",
  "Sonic Courier X",
  "Hyperloop Express",
  "Metaverse Logistics"
];

// Target coordinates (Alex Buyer) - e.g., default NYC area
const TARGET_LAT = 40.7128;
const TARGET_LON = -74.0060;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Fetch all active delivery jobs
    const { data: jobs, error: fetchError } = await supabase
      .from("delivery_jobs")
      .select(`
        *,
        orders (
          id,
          customer_id,
          total_amount
        )
      `)
      .in("status", ["preparing", "in_transit"]);

    if (fetchError) throw fetchError;

    const updates = [];

    for (const job of jobs || []) {
      let nextStatus = job.status;
      let nextLat = parseFloat(job.latitude);
      let nextLon = parseFloat(job.longitude);
      let courierName = job.courierName || job.courier_name;

      if (job.status === "preparing") {
        // Transition to in_transit and pick a courier name
        nextStatus = "in_transit";
        courierName = COURIER_NAMES[Math.floor(Math.random() * COURIER_NAMES.length)];
        
        // Random starting coordinates nearby NYC
        nextLat = TARGET_LAT + (Math.random() - 0.5) * 0.1;
        nextLon = TARGET_LON + (Math.random() - 0.5) * 0.1;
      } else if (job.status === "in_transit") {
        // Move coordinates slightly closer to ALEX's location
        const step = 0.02; // step size
        const dLat = TARGET_LAT - nextLat;
        const dLon = TARGET_LON - nextLon;
        const distance = Math.sqrt(dLat * dLat + dLon * dLon);

        if (distance < step || Math.random() < 0.25) {
          // Delivered!
          nextStatus = "delivered";
          nextLat = TARGET_LAT;
          nextLon = TARGET_LON;

          // Update order status in public.orders
          await supabase
            .from("orders")
            .update({ 
              status: "delivered", 
              delivery_engine_status: "delivered" 
            })
            .eq("id", job.order_id);

          // Add XP reward to user!
          const xpAmount = Math.floor(parseFloat(job.orders.total_amount) * 10) + 15; // 10 XP per USDC + 15 baseline
          await supabase
            .from("xp_transactions")
            .insert({
              user_id: job.orders.customer_id,
              amount: xpAmount,
              source: "delivery_streak",
              description: `Order delivery successfully simulated. XP earned!`
            });
        } else {
          // Move 30% closer
          nextLat += dLat * 0.3;
          nextLon += dLon * 0.3;
        }
      }

      const { error: updateError } = await supabase
        .from("delivery_jobs")
        .update({
          status: nextStatus,
          latitude: nextLat,
          longitude: nextLon,
          courier_name: courierName,
          updated_at: new Date().toISOString()
        })
        .eq("id", job.id);

      if (updateError) console.error(`Failed to update job ${job.id}:`, updateError);
      
      updates.push({
        jobId: job.id,
        orderId: job.order_id,
        courier: courierName,
        prevStatus: job.status,
        nextStatus
      });
    }

    return new Response(
      JSON.stringify({ success: true, processedCount: updates.length, updates }),
      { 
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { 
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
