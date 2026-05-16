/**
 * POST /api/onboarding-v2/complete
 *
 * Marks onboarding complete (Step 5 “Activate my link”) and sends the welcome-live
 * email when eligible. See `docs/contracts/mobile-onboarding-complete.md`.
 */

import { completeOnboardingV2WithWelcomeLiveEmail } from '@/features/onboarding-v2/server/completeOnboarding';
import {
  getOnboardingCompleteRequestId,
  logOnboardingActivate,
  logOnboardingActivateError,
} from '@/features/onboarding-v2/server/onboardingCompleteRouteLog';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextRequest, NextResponse } from 'next/server';

type CompleteOnboardingBody = {
  sendWelcomeEvenIfAlreadyCompleted?: boolean;
};

export async function POST(request: NextRequest) {
  const requestId = getOnboardingCompleteRequestId(request);

  try {
    logOnboardingActivate('complete request started');

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      logOnboardingActivateError('auth failed');
      return NextResponse.json(
        { success: false, error: auth.error, request_id: requestId },
        { status: auth.status }
      );
    }

    const { user, supabase } = auth;

    let sendWelcomeEvenIfAlreadyCompleted = false;
    try {
      const body = (await request.json()) as CompleteOnboardingBody;
      sendWelcomeEvenIfAlreadyCompleted =
        body?.sendWelcomeEvenIfAlreadyCompleted === true;
    } catch {
      // Web Step 5 may POST with no body.
    }

    const result = await completeOnboardingV2WithWelcomeLiveEmail(
      supabase,
      user.id,
      user.email,
      { sendWelcomeEvenIfAlreadyCompleted }
    );

    if (!result.success) {
      logOnboardingActivateError('complete failed');
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Failed to complete',
          request_id: requestId,
        },
        { status: 400 }
      );
    }

    const welcome = result.welcomeEmail;
    if (welcome?.attempted === true && welcome.sent === true) {
      logOnboardingActivate('welcome email sent');
    } else if (welcome?.attempted === true && welcome.sent === false) {
      logOnboardingActivateError('welcome email failed');
    } else if (welcome?.attempted === false) {
      logOnboardingActivate(`welcome email skipped (${welcome.reason})`);
    }

    logOnboardingActivate('complete succeeded');

    return NextResponse.json({
      success: true,
      request_id: requestId,
      welcome_email: result.welcomeEmail,
    });
  } catch {
    logOnboardingActivateError('unexpected error');
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
