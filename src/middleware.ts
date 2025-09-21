import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // PRE-LAUNCH MODE: Block dashboard and auth routes
  // Comment out the section below when ready to launch MVP

  // Define routes that should be accessible during pre-launch
  const allowedRoutes = [
    '/', // Landing page
    '/waitlist', // Waitlist page
  ];

  // Define routes that should be blocked during pre-launch
  const blockedRoutes = [
    '/auth', // All auth routes
    '/dashboard', // All dashboard routes
    '/profile', // Profile routes
  ];

  const currentPath = request.nextUrl.pathname;

  // Check if the current path should be blocked
  const isBlockedRoute = blockedRoutes.some(route =>
    currentPath.startsWith(route)
  );

  // Check if the current path is allowed
  const isAllowedRoute = allowedRoutes.some(route =>
    currentPath.startsWith(route)
  );

  // Block access to restricted routes during pre-launch
  if (isBlockedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow all other routes (like API routes, static files, etc.)
  if (
    isAllowedRoute ||
    currentPath.startsWith('/_next') ||
    currentPath.startsWith('/api')
  ) {
    return response;
  }

  // For any other routes, redirect to home
  return NextResponse.redirect(new URL('/', request.url));

  // =============================================================================
  // MVP LAUNCH MODE: Uncomment the section below when ready to launch MVP
  // =============================================================================

  /*
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
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
        remove(name: string, options: any) {
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
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected and public routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isPublicProfileRoute = request.nextUrl.pathname.startsWith('/profile');

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login from protected routes
  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Allow public profile routes and other public routes
  if (isPublicProfileRoute || request.nextUrl.pathname === '/') {
    return response;
  }

  return response;
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
