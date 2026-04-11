import { AUTH_REQUIRED_PATH_PREFIXES, ROUTES } from '@/constants/routes';
import { createSupabaseMiddlewareClient } from '@/libs/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // MVP LAUNCH MODE: All routes enabled
  const supabase = createSupabaseMiddlewareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      get: (name: string) => {
        return request.cookies.get(name)?.value;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (name: string, value: string, options: any) => {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remove: (name: string, options: any) => {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected and public routes
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup';
  const pathname = request.nextUrl.pathname;
  const requiresAuth = AUTH_REQUIRED_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isPublicProfileRoute = request.nextUrl.pathname.startsWith('/profile');
  const isWaitlistRoute = request.nextUrl.pathname.startsWith('/waitlist');
  const isHomeRoute = request.nextUrl.pathname === '/';

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD.MAIN, request.url));
  }

  // Redirect unauthenticated users to login from protected routes
  if (requiresAuth && !user) {
    return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.url));
  }

  // Allow all public routes (home, auth, waitlist, profile, API routes, static files)
  if (
    isHomeRoute ||
    isAuthRoute ||
    isWaitlistRoute ||
    isPublicProfileRoute ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
