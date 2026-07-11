import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// GET /api/vendor/agent/rfq — List open RFQs for vendor
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

    // Verify vendor role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'vendor') {
      return NextResponse.json({ error: 'Access denied. Vendor role required.' }, { status: 403 });
    }

    // Fetch open RFQs, and include quotes from THIS vendor
    const { data: rfqs, error } = await supabaseAdmin
      .from('rfqs')
      .select(`
        id, title, description, rfq_type, category, quantity, budget_usdc,
        delivery_deadline, location, requirements, status, created_at,
        vendor_quotes(id, unit_price_usdc, total_price_usdc, delivery_days, notes, status, created_at)
      `)
      .in('status', ['open', 'quoted'])
      .eq('vendor_quotes.vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (rfqs || []).map((rfq: any) => {
      const myQuote = rfq.vendor_quotes?.[0] || null;
      return {
        id: rfq.id,
        title: rfq.title,
        description: rfq.description,
        rfqType: rfq.rfq_type,
        category: rfq.category,
        quantity: rfq.quantity,
        budgetUsdc: parseFloat(rfq.budget_usdc),
        deliveryDeadline: rfq.delivery_deadline,
        location: rfq.location,
        requirements: rfq.requirements,
        status: rfq.status,
        createdAt: rfq.created_at,
        myQuote: myQuote ? {
          id: myQuote.id,
          unitPriceUsdc: parseFloat(myQuote.unit_price_usdc),
          totalPriceUsdc: parseFloat(myQuote.total_price_usdc),
          deliveryDays: myQuote.delivery_days,
          notes: myQuote.notes,
          status: myQuote.status,
          submittedAt: myQuote.created_at,
        } : null,
      };
    });

    return NextResponse.json({ success: true, rfqs: mapped });
  } catch (err: any) {
    console.error('Error listing vendor RFQs:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/vendor/agent/rfq — Submit a quote manually
export async function POST(req: Request) {
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

    // Verify vendor role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'vendor') {
      return NextResponse.json({ error: 'Access denied. Vendor role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { rfqId, unitPriceUsdc, deliveryDays, notes } = body;

    if (!rfqId || !unitPriceUsdc || !deliveryDays) {
      return NextResponse.json({ success: false, error: 'Missing quote parameters' }, { status: 400 });
    }

    // 1. Fetch RFQ to get quantity and verify status
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('status, quantity, budget_usdc')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ success: false, error: 'RFQ not found' }, { status: 404 });
    }

    if (rfq.status !== 'open' && rfq.status !== 'quoted') {
      return NextResponse.json({ success: false, error: 'RFQ is closed for quoting' }, { status: 400 });
    }

    const totalPriceUsdc = parseFloat(unitPriceUsdc) * rfq.quantity;

    // 2. Insert Quote
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('vendor_quotes')
      .insert({
        rfq_id: rfqId,
        vendor_id: user.id,
        unit_price_usdc: parseFloat(unitPriceUsdc),
        total_price_usdc: totalPriceUsdc,
        delivery_days: parseInt(deliveryDays),
        notes: notes || null,
        auto_generated: false,
        status: 'pending',
        escrow_status: 'none',
      })
      .select()
      .single();

    if (quoteError) {
      if (quoteError.code === '23505') {
        return NextResponse.json({ success: false, error: 'You have already submitted a quote for this RFQ' }, { status: 409 });
      }
      throw quoteError;
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        unitPriceUsdc: parseFloat(quote.unit_price_usdc),
        totalPriceUsdc: parseFloat(quote.total_price_usdc),
        deliveryDays: quote.delivery_days,
        status: quote.status,
      },
    });
  } catch (err: any) {
    console.error('Error submitting vendor quote:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
