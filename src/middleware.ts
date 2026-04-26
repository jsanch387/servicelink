import { AUTH_REQUIRED_PATH_PREFIXES, ROUTES } from '@/constants/routes';
import { isProAccess } from '@/features/pricing/utils/isProAccess';
import { createSupabaseMiddlewareClient } from '@/libs/supabase/server';
import type { User } from '@supabase/supabase-js';
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

  // Session refresh hits Supabase over the network; in the Edge sandbox this can
  // fail intermittently (DNS, IPv6, offline dev). Avoid throwing — Next would
  // print long AuthRetryableFetchError / "fetch failed" stacks for every request.
  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
    }
  } catch {
    // Treat as logged out; protected routes still redirect to login when needed.
  }

  // Define protected and public routes
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup';
  const pathname = request.nextUrl.pathname;
  const requiresAuth = AUTH_REQUIRED_PATH_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isDashboardRoute =
    pathname === ROUTES.DASHBOARD.MAIN ||
    pathname.startsWith(`${ROUTES.DASHBOARD.MAIN}/`);
  const isUpgradeRoute = pathname === ROUTES.DASHBOARD.UPGRADE;
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

  // Centralized app access gate:
  // - While onboarding is not complete, keep users on /dashboard (onboarding flow).
  // - After onboarding is complete:
  //   - Legacy free users (no Stripe billing history) keep access.
  //   - Trial/subscription users (have Stripe billing history) require active/trialing
  //     Pro access. Otherwise route to /dashboard/upgrade until they resubscribe.
  if (requiresAuth && user && isDashboardRoute) {
    type ProfileAccessRow = {
      onboarding_status?: string | null;
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRow } = await (supabase as any)
      .from('profiles')
      .select(
        'onboarding_status, subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    const profile = (profileRow as ProfileAccessRow | null) ?? null;
    const onboardingComplete = profile?.onboarding_status === 'completed';
    const hasStripeBillingHistory = Boolean(
      profile?.stripe_customer_id?.trim() ||
        profile?.stripe_subscription_id?.trim() ||
        profile?.subscription_status?.trim()
    );

    if (!onboardingComplete) {
      if (pathname !== ROUTES.DASHBOARD.MAIN) {
        return NextResponse.redirect(
          new URL(ROUTES.DASHBOARD.MAIN, request.url)
        );
      }
      return response;
    }

    if (hasStripeBillingHistory) {
      const hasAppAccess = isProAccess(
        profile?.subscription_tier,
        profile?.subscription_current_period_end,
        profile?.subscription_status,
        profile?.stripe_subscription_id,
        profile?.stripe_customer_id
      );

      if (!hasAppAccess && !isUpgradeRoute) {
        return NextResponse.redirect(
          new URL(ROUTES.DASHBOARD.UPGRADE, request.url)
        );
      }

      if (hasAppAccess && isUpgradeRoute) {
        return NextResponse.redirect(
          new URL(ROUTES.DASHBOARD.MAIN, request.url)
        );
      }
    }
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
