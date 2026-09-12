import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (
    !supabaseUrl || 
    !supabaseAnonKey || 
    supabaseUrl === 'https://placeholder.supabase.co' || 
    !supabaseUrl.startsWith('https://') ||
    supabaseAnonKey === 'placeholder-key'
  ) {
    return response;
  }

  // Fast path: If the visitor has no Supabase auth cookies, skip remote network call entirely.
  // This ensures guest page views load in <5ms and avoids unnecessary Supabase edge calls.
  const hasAuthCookie = request.cookies.getAll().some((cookie) => 
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  if (!hasAuthCookie) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Guard against Vercel MIDDLEWARE_INVOCATION_TIMEOUT:
    // Next.js Edge Middleware on Vercel has a hard ~10s execution limit.
    // If Supabase is paused, slow, or unreachable, race with a strict 2.5s timeout
    // so the middleware never blocks Vercel or throws a 504 Gateway Timeout.
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase auth.getUser() timed out after 2500ms')), 2500)
      ),
    ]);
  } catch (err) {
    console.warn('[Middleware] Supabase auth refresh skipped or timed out:', err);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static asset extensions (.svg, .png, .jpg, .css, .js, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff|woff2)$).*)',
  ],
};
