import { ROUTES } from '@/constants/routes';
import {
  buildSettingsEmailNoticeUrl,
  EMAIL_CHANGE_NOTICE_ERROR,
  EMAIL_CHANGE_NOTICE_PARAM,
  EMAIL_CHANGE_NOTICE_UPDATED,
} from '@/features/account/server/resolveAccountEmailChangeRedirectTo';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

const EMAIL_EXISTS_ERROR = 'email_exists_use_password';

function isSafeAppPath(next: string): boolean {
  return next.startsWith('/') && !next.startsWith('//');
}

function isEmailChangeFlow(
  searchParams: URLSearchParams,
  next: string
): boolean {
  const notice = searchParams.get(EMAIL_CHANGE_NOTICE_PARAM);
  if (
    notice === EMAIL_CHANGE_NOTICE_UPDATED ||
    notice === EMAIL_CHANGE_NOTICE_ERROR
  ) {
    return true;
  }
  return (
    next === ROUTES.DASHBOARD.SETTINGS ||
    next.startsWith(`${ROUTES.DASHBOARD.SETTINGS}?`)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? ROUTES.DASHBOARD.MAIN;
  const next = isSafeAppPath(rawNext) ? rawNext : ROUTES.DASHBOARD.MAIN;
  const emailChangeFlow = isEmailChangeFlow(searchParams, next);

  if (!code) {
    const err = searchParams.get('error');
    const errCode = searchParams.get('error_code');
    if (err || errCode) {
      if (emailChangeFlow) {
        console.warn('[auth/callback] email change confirm failed', {
          err,
          errCode,
        });
        return NextResponse.redirect(
          buildSettingsEmailNoticeUrl(request.url, EMAIL_CHANGE_NOTICE_ERROR)
        );
      }
      const recoveryNext =
        next.includes('reset-password') || next === ROUTES.AUTH.RESET_PASSWORD;
      if (recoveryNext) {
        const target = new URL(ROUTES.AUTH.RESET_PASSWORD, request.url);
        for (const key of ['error_description'] as const) {
          const v = searchParams.get(key);
          if (v) target.searchParams.set(key, v);
        }
        return NextResponse.redirect(target);
      }
    }
    console.warn('[auth/callback] missing code — redirecting to login', {
      next,
      queryKeys: [...searchParams.keys()],
    });
    if (emailChangeFlow) {
      return NextResponse.redirect(
        buildSettingsEmailNoticeUrl(request.url, EMAIL_CHANGE_NOTICE_ERROR)
      );
    }
    return NextResponse.redirect(
      new URL(
        `${ROUTES.AUTH.LOGIN}?notice=email_confirm_open_login`,
        request.url
      )
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error);
    if (emailChangeFlow) {
      return NextResponse.redirect(
        buildSettingsEmailNoticeUrl(request.url, EMAIL_CHANGE_NOTICE_ERROR)
      );
    }
    // Often: different browser/app than signup (missing PKCE cookie). Email may still be confirmed.
    return NextResponse.redirect(
      new URL(
        `${ROUTES.AUTH.LOGIN}?notice=email_confirm_open_login`,
        request.url
      )
    );
  }

  const user = data.user;
  if (!user?.email) {
    if (emailChangeFlow) {
      return NextResponse.redirect(
        buildSettingsEmailNoticeUrl(request.url, EMAIL_CHANGE_NOTICE_ERROR)
      );
    }
    return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.url));
  }

  // If this user signed in with Google but an account with this email already
  // exists from email/password signup, block and ask them to use password.
  // Skip for email-change confirmations — the user already owns this session.
  if (!emailChangeFlow) {
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
  }

  // Ensure profile exists (email confirmation has no client-side createProfile; OAuth needs this too)
  const { data: existingRows, error: profileLookupError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);
  const existingProfile = existingRows?.[0];

  if (profileLookupError) {
    console.error('[auth/callback] profile lookup failed:', profileLookupError);
  }

  if (!existingProfile) {
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.user_metadata?.email ??
      null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('profiles')
      .insert({
        user_id: user.id,
        full_name: name,
      });
    if (insertError) {
      console.error('[auth/callback] profile insert failed:', insertError);
    }
  }

  if (emailChangeFlow) {
    return NextResponse.redirect(
      buildSettingsEmailNoticeUrl(request.url, EMAIL_CHANGE_NOTICE_UPDATED)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
