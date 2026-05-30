import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);

    const { data: allOrders, error } = await adminSupabase
      .from('orders')
      .select('id, created_at, payment_status, payment_intent_id');

    return NextResponse.json({
      success: true,
      allOrders,
      error
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
