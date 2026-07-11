import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const payload = await req.json();
    const { event_type, rfq_id, vendor_ids, rfq } = payload;

    // Handle RFQ creation events (triggering auto-quoting for each vendor)
    if (event_type === 'rfq_created' && rfq_id && vendor_ids) {
      console.log(`[RFQ_CREATED EVENT] RFQ: "${rfq?.title}" (ID: ${rfq_id}) created. Notifying ${vendor_ids.length} vendors.`);
      
      const storefrontUrl = Deno.env.get("STOREFRONT_URL") || "http://localhost:3000";
      
      // Async trigger auto-quoting for all matched vendors
      const quotePromises = vendor_ids.map((vendorId: string) => {
        const url = `${storefrontUrl}/api/vendor/agent/auto-quote`;
        console.log(`[RFQ_CREATED] Triggering auto-quote check for Vendor ${vendorId} via ${url}`);
        return fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rfqId: rfq_id, vendorId }),
        }).catch((err) => {
          console.error(`Failed to trigger auto-quote for vendor ${vendorId}:`, err);
        });
      });

      // Await promises to ensure they run and log
      await Promise.all(quotePromises);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Auto-quote triggers dispatched to ${vendor_ids.length} vendors.`
        }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Default notification behavior
    const { userId, title, message, type } = payload;

    if (!userId || !title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: userId, title, message or event_type" }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[NOTIFICATION DISPATCH] to User ${userId}:`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log(`Type: ${type || 'general'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        dispatched: true,
        recipient: userId,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 500 }
    );
  }
});

