import { createClient as createBrowserSupabaseClient } from '@ababil/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Browser-safe client
export const supabase = createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey);
