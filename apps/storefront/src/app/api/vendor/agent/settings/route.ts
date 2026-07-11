import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// GET /api/vendor/agent/settings — Get vendor agent settings
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Verify user is a vendor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'vendor') {
      return NextResponse.json({ error: 'Access denied. Vendor role required.' }, { status: 403 });
    }

    // Fetch settings
    let { data: settings, error: settingsError } = await supabaseAdmin
      .from('vendor_agent_settings')
      .select('*')
      .eq('vendor_id', user.id)
      .maybeSingle();

    if (settingsError) throw settingsError;

    // Create default settings if not exists
    if (!settings) {
      const { data: defaultSettings, error: insertError } = await supabaseAdmin
        .from('vendor_agent_settings')
        .insert({
          vendor_id: user.id,
          auto_reply_enabled: false,
          max_discount_pct: 10.00,
          min_margin_pct: 20.00,
          preferred_delivery_days: 7,
          auto_quote_categories: null,
          agent_persona_notes: 'Standard marketplace auto-replies.',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      settings = defaultSettings;
    }

    const mapped = {
      vendorId: settings.vendor_id,
      autoReplyEnabled: settings.auto_reply_enabled,
      maxDiscountPct: parseFloat(settings.max_discount_pct),
      minMarginPct: parseFloat(settings.min_margin_pct),
      preferredDeliveryDays: settings.preferred_delivery_days,
      autoQuoteCategories: settings.auto_quote_categories || [],
      agentPersonaNotes: settings.agent_persona_notes,
      updatedAt: settings.updated_at,
    };

    return NextResponse.json({ success: true, settings: mapped });
  } catch (err: any) {
    console.error('Error fetching vendor settings:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/vendor/agent/settings — Update vendor settings
export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Verify user is a vendor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'vendor') {
      return NextResponse.json({ error: 'Access denied. Vendor role required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      autoReplyEnabled,
      maxDiscountPct,
      minMarginPct,
      preferredDeliveryDays,
      autoQuoteCategories,
      agentPersonaNotes,
    } = body;

    const { data: settings, error: updateError } = await supabaseAdmin
      .from('vendor_agent_settings')
      .upsert({
        vendor_id: user.id,
        auto_reply_enabled: autoReplyEnabled ?? false,
        max_discount_pct: maxDiscountPct ?? 10.00,
        min_margin_pct: minMarginPct ?? 20.00,
        preferred_delivery_days: preferredDeliveryDays ?? 7,
        auto_quote_categories: autoQuoteCategories || null,
        agent_persona_notes: agentPersonaNotes || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) throw updateError;

    const mapped = {
      vendorId: settings.vendor_id,
      autoReplyEnabled: settings.auto_reply_enabled,
      maxDiscountPct: parseFloat(settings.max_discount_pct),
      minMarginPct: parseFloat(settings.min_margin_pct),
      preferredDeliveryDays: settings.preferred_delivery_days,
      autoQuoteCategories: settings.auto_quote_categories || [],
      agentPersonaNotes: settings.agent_persona_notes,
      updatedAt: settings.updated_at,
    };

    return NextResponse.json({ success: true, settings: mapped });
  } catch (err: any) {
    console.error('Error updating vendor settings:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
