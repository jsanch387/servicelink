import {
  deriveSignupChannel,
  type SignupAttributionPayload,
} from '@/features/analytics/signupAttribution';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

function parseBody(raw: unknown): SignupAttributionPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const str = (k: string) =>
    typeof o[k] === 'string' && (o[k] as string).trim()
      ? (o[k] as string).trim()
      : null;

  return {
    utm_source: str('utm_source'),
    utm_medium: str('utm_medium'),
    utm_campaign: str('utm_campaign'),
    utm_content: str('utm_content'),
    utm_term: str('utm_term'),
    referrer: str('referrer'),
    landing_path: str('landing_path'),
    captured_at:
      typeof o.captured_at === 'string' && o.captured_at.trim()
        ? o.captured_at.trim()
        : new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = parseBody(await request.json());
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid attribution payload' },
        { status: 400 }
      );
    }

    const channel = deriveSignupChannel(body);
    const admin = createSupabaseAdminClient();

    const { data: existing, error: readError } = await admin
      .from('profiles')
      .select('signup_attribution')
      .eq('user_id', user.id)
      .maybeSingle();

    if (readError) {
      const missingColumn =
        readError.message?.includes('signup_attribution') ||
        readError.code === '42703';
      if (missingColumn) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Database migration required: add profiles.signup_attribution (see docs/supabase/migrations/20260519_profiles_signup_attribution.sql)',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: readError.message },
        { status: 500 }
      );
    }

    if (
      existing &&
      (existing as { signup_attribution?: unknown }).signup_attribution != null
    ) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from('profiles')
      .update({
        signup_attribution: body,
        signup_channel: channel,
      })
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, channel });
  } catch (err) {
    console.error('[API] POST /api/profile/signup-attribution:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save attribution' },
      { status: 500 }
    );
  }
}
