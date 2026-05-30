import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  return NextResponse.json({
    success: !error,
    error: error?.message || null,
    errorCode: error?.status || null,
    hasSession: !!data?.session,
    hasUser: !!data?.user,
    userConfirmed: data?.user?.confirmed_at ? true : false,
    userEmail: data?.user?.email || null,
  });
}
