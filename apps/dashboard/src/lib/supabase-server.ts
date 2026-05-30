import { createServerClient as createSsrServerClient } from '@ababil/supabase';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Server component/action client (must be called inside server context)
export function getServerSupabase() {
  const cookieStore = cookies();
  return createSsrServerClient(supabaseUrl, supabaseAnonKey, cookieStore);
}
