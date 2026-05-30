import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Parse input parameters
    const { userId, amount, source, description } = await req.json();

    if (!userId || !amount || !source) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required params: userId, amount, source" }),
        { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Insert XP transaction
    const { data, error } = await supabase
      .from("xp_transactions")
      .insert({
        user_id: userId,
        amount: parseInt(amount, 10),
        source,
        description: description || `XP rewarded via Secure Engine`
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, transaction: data }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" }, status: 500 }
    );
  }
});
