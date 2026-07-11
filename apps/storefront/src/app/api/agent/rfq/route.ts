import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@ababil/supabase';
import { cookies } from 'next/headers';
import { isRateLimited } from '@/lib/rate-limit';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

// GET /api/agent/rfq — List user's RFQs with quote count
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);
    const supabaseAdmin = getAdminClient();

    let user: any = null;

    // Support Telegram Bot auth
    const telegramChatId = req.headers.get('x-telegram-chat-id');
    const telegramBotToken = req.headers.get('x-telegram-bot-token');

    if (telegramChatId && telegramBotToken && telegramBotToken === process.env.TELEGRAM_BOT_TOKEN) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('telegram_chat_id', String(telegramChatId))
        .single();
      
      if (profile) {
        user = { id: profile.id };
      }
    } else {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rfqs, error } = await supabaseAdmin
      .from('rfqs')
      .select(`
        id, title, description, rfq_type, category, quantity, budget_usdc,
        delivery_deadline, location, requirements, status, created_at, updated_at,
        vendor_quotes(id)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (rfqs || []).map((rfq: any) => ({
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
      updatedAt: rfq.updated_at,
      quoteCount: rfq.vendor_quotes?.length ?? 0,
    }));

    return NextResponse.json({ success: true, rfqs: mapped });
  } catch (err: any) {
    console.error('Error fetching RFQs:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/agent/rfq — Create a new RFQ manually
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

    // Apply rate limit per user IP / Profile ID
    const ip = req.headers.get('x-forwarded-for') || 'local';
    const limitKey = `rfq_${user.id}_${ip}`;
    if (isRateLimited(limitKey, 10, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many RFQ requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      rfqType,
      category,
      quantity,
      budgetUsdc,
      deliveryDeadline,
      location,
      requirements = {},
      conversationId,
    } = body;

    if (!title || !description || !rfqType || !category || !quantity || !budgetUsdc) {
      return NextResponse.json({ success: false, error: 'Missing required RFQ fields' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Insert RFQ
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .insert({
        buyer_id: user.id,
        title,
        description,
        rfq_type: rfqType,
        category,
        quantity,
        budget_usdc: budgetUsdc,
        delivery_deadline: deliveryDeadline || null,
        location: location || null,
        requirements,
        status: 'open',
        conversation_id: conversationId || null,
      })
      .select()
      .single();

    if (rfqError || !rfq) throw rfqError || new Error('Failed to create RFQ');

    // Notify vendors (matching by category)
    const { data: vendors } = await supabaseAdmin
      .from('vendor_rankings')
      .select('id')
      .limit(20);

    const vendorIds = (vendors || []).map((v: any) => v.id);

    if (vendorIds.length > 0) {
      const notifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notification-dispatch`;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          event_type: 'rfq_created',
          rfq_id: rfq.id,
          vendor_ids: vendorIds,
          rfq: {
            id: rfq.id,
            title: rfq.title,
            category: rfq.category,
            rfq_type: rfq.rfq_type,
            quantity: rfq.quantity,
            budget_usdc: rfq.budget_usdc,
            delivery_deadline: rfq.delivery_deadline,
            location: rfq.location,
            description: rfq.description,
          },
        }),
      }).catch(() => {/* non-critical */});
    }

    return NextResponse.json({
      success: true,
      rfq: {
        id: rfq.id,
        title: rfq.title,
        category: rfq.category,
        rfqType: rfq.rfq_type,
        quantity: rfq.quantity,
        budgetUsdc: parseFloat(rfq.budget_usdc),
        status: rfq.status,
        createdAt: rfq.created_at,
      },
      vendorsNotified: vendorIds.length,
    });
  } catch (err: any) {
    console.error('Error creating RFQ:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
