import { createServerClient as createSsrServerClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Server component/action client (must be called inside server context)
export function getServerSupabase() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-key'
  ) {
    throw new Error(
      'Supabase environment variables are missing or misconfigured. Please verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly configured (with https://) in your environment settings.'
    );
  }

  const cookieStore = cookies();
  return createSsrServerClient(supabaseUrl, supabaseAnonKey, cookieStore);
}
