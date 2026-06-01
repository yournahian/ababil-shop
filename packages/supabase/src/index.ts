import { createBrowserClient, createServerClient as createSsrServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

// Browser-based client
export function createClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server-based client (for RSC, Actions, Route Handlers)
export function createServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookieStore: {
    getAll: () => { name: string; value: string }[] | any;
    set: (name: string, value: string, options: any) => void;
  }
) {
  return createSsrServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Admin / Service Role client (only call on backend, server-side!)
export function createAdminClient(supabaseUrl: string, supabaseServiceRoleKey: string) {
  return createSupabaseJsClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
