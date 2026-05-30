import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, cookieStore);

    const { data: { user }, error } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      user,
      error
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
