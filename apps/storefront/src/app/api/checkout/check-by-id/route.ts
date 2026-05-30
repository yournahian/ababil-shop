import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@ababil/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      id,
      order,
      orderError
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
