import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Fetch top 50 users based on XP
    const { data: topUsers, error: userError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, xp, level, role")
      .order("xp", { ascending: false })
      .limit(50);

    if (userError) throw userError;

    // Fetch top 50 vendors based on XP
    const { data: topVendors, error: vendorError } = await supabase
      .from("vendors")
      .select("id, name, slug, logo_url, xp, level, rating")
      .order("xp", { ascending: false })
      .limit(50);

    if (vendorError) throw vendorError;

    // Add explicit rank
    const userLeaderboard = (topUsers || []).map((user, idx) => ({
      ...user,
      rank: idx + 1
    }));

    const vendorLeaderboard = (topVendors || []).map((vendor, idx) => ({
      ...vendor,
      rank: idx + 1
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: userLeaderboard, 
        vendors: vendorLeaderboard,
        refreshedAt: new Date().toISOString()
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
