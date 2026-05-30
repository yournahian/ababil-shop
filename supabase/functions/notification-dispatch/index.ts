import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const { userId, title, message, type } = await req.json();

    if (!userId || !title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: userId, title, message" }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 400 }
      );
    }

    // In a real-world production system, this would integrate with Twilio, SendGrid, or Firebase Cloud Messaging.
    // For testnet and local simulation, we log this to the console and return success.
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
