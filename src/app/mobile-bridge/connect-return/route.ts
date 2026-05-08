import { ROUTES } from '@/constants/routes';
import { buildMobileConnectBridgeHtml } from '@/features/payments/utils/buildMobileConnectBridgeHtml';
import { NextRequest, NextResponse } from 'next/server';

const LOG = '[mobile-connect-bridge]';

function resolveReturnDeepLink(): string {
  return (
    process.env.STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL?.trim() ||
    'servicelinkmobile://payments/connect?connect=return'
  );
}

export async function GET(request: NextRequest) {
  const deepLink = resolveReturnDeepLink();
  const webFallback = `${request.nextUrl.origin}${ROUTES.DASHBOARD.PAYMENTS}?connect=return`;
  console.info(`${LOG} return`, {
    hasQuery: request.nextUrl.searchParams.toString().length > 0,
    deepLinkConfigured: Boolean(
      process.env.STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL?.trim()
    ),
  });

  return new NextResponse(
    buildMobileConnectBridgeHtml({
      kind: 'return',
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
