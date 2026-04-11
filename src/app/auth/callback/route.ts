import { getSafePostAuthDashboardPath, ROUTES } from '@/constants/routes';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

const EMAIL_EXISTS_ERROR = 'email_exists_use_password';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafePostAuthDashboardPath(
    searchParams.get('next') ?? ROUTES.DASHBOARD.MAIN
  );

  if (!code) {
    return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.url));
  }

  const user = data.user;
  if (!user?.email) {
    return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.url));
  }

  // If this user signed in with Google but an account with this email already
  // exists from email/password signup, block and ask them to use password.
  const admin = createSupabaseAdminClient();
  const { data: listData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const usersWithSameEmail = (listData?.users ?? []).filter(
    u => u.email?.toLowerCase() === user.email!.toLowerCase()
  );
  const hasExistingEmailAccount = usersWithSameEmail.some(
    u => u.id !== user.id && u.identities?.some(i => i.provider === 'email')
  );

  if (hasExistingEmailAccount) {
    await admin.auth.admin.deleteUser(user.id);
    const loginUrl = new URL(ROUTES.AUTH.LOGIN, request.url);
    loginUrl.searchParams.set('error', EMAIL_EXISTS_ERROR);
    return NextResponse.redirect(loginUrl);
  }

  // Ensure profile exists for OAuth users (new sign-ups won't have one)
  const { data: existingProfile } = await (supabase as any)
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  let isNewOAuthSignup = false;

  if (!existingProfile) {
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.user_metadata?.email ??
      null;
    await (supabase as any).from('profiles').insert({
      user_id: user.id,
      full_name: name,
    });
    isNewOAuthSignup = true;
  }

  const redirectUrl = new URL(next, request.url);

  // Mark new Google OAuth signups so dashboard can fire Meta CompleteRegistration once.
  if (isNewOAuthSignup) {
    redirectUrl.searchParams.set('sl_signup', '1');
  }

  return NextResponse.redirect(redirectUrl);
}
