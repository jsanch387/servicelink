import { ROUTES } from '@/constants/routes';
import { buildGoogleReviewsMobileBridgeHtml } from '@/features/reviews/google-connect/server/buildGoogleReviewsMobileBridgeHtml';
import { googleReviewsMobileDeepLink } from '@/features/reviews/google-connect/server/googleConnectReturnPath';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const google = request.nextUrl.searchParams.get('google');
  const notice = google === 'connected' ? 'connected' : 'error';
  const deepLink = googleReviewsMobileDeepLink(notice);
  const webFallback = `${request.nextUrl.origin}${ROUTES.DASHBOARD.REVIEWS}?google=${notice}`;

  return new NextResponse(
    buildGoogleReviewsMobileBridgeHtml({
      deepLinkUrl: deepLink,
      webFallbackUrl: webFallback,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    }
  );
}
