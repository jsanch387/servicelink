/**
 * GET/POST /api/webhooks/instagram
 *
 * Meta Graph API webhook for Instagram/Facebook messaging (ServiceLink AI automation).
 * - GET: verification handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`).
 * - POST: incoming Instagram DMs → OpenAI intent + reply → Meta send (async).
 *
 * Env: `OPENAI_API_KEY`, `META_PAGE_ACCESS_TOKEN` (fallback), `INSTAGRAM_MESSAGING_BUSINESS_ID` (fallback)
 * OAuth connect: `META_APP_ID`, `META_APP_SECRET` — see dashboard Automation
 * Optional: `INSTAGRAM_MESSAGING_ACCOUNT_ID` (webhook `entry[0].id` sanity check)
 *
 * Register this URL in Meta Developer Console. Middleware allows `/api/*` without auth.
 */

import { parseInstagramMessagingWebhook } from '@/services/meta/parseInstagramMessagingWebhook';
import { processInstagramIncomingDm } from '@/services/meta/processInstagramIncomingDm';
import { resolveInstagramTenant } from '@/services/meta/resolveInstagramTenant';
import { NextRequest, NextResponse } from 'next/server';

const META_VERIFY_TOKEN = 'servicelink_buddy_2026';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !token || !challenge) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (token !== META_VERIFY_TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const objectType =
      typeof body?.object === 'string' ? body.object : '(missing)';

    console.log(`📨 [meta-webhook] POST received | object=${objectType}`);

    const parsed = parseInstagramMessagingWebhook(body);

    if (parsed.kind === 'customer_dm') {
      const { instagramAccountId, senderId, messageText } = parsed.event;
      const tenantResult = await resolveInstagramTenant(instagramAccountId);

      if (!tenantResult.ok) {
        console.error(
          `[meta-webhook] Tenant resolution failed: ${tenantResult.reason}`
        );
        return NextResponse.json({ received: true });
      }

      const {
        businessId,
        instagramAccountId: igAccountId,
        pageAccessToken,
      } = tenantResult.tenant;
      console.log(
        `🏢 [tenant] business_id=${businessId} instagram_account_id=${igAccountId}`
      );
      console.log(
        `📥 [LIVE DM] From ID: ${senderId} | Message: "${messageText}"`
      );
      void processInstagramIncomingDm(businessId, senderId, messageText, {
        pageAccessToken,
      }).catch(error => {
        console.error(
          '[meta-webhook] DM pipeline failed:',
          error instanceof Error ? error.message : error
        );
      });
    } else if (parsed.kind === 'skip') {
      console.log(`⏭️ [meta-webhook] Skipped: ${parsed.reason}`);
    } else if (body?.object === 'instagram') {
      console.log(
        '[meta-webhook] instagram event (not a customer text DM)',
        JSON.stringify(body).slice(0, 1500)
      );
    } else if (process.env.NODE_ENV === 'development') {
      console.log(
        '[meta-webhook] unexpected object (dev dump):',
        JSON.stringify(body).slice(0, 1500)
      );
    }
  } catch (error) {
    console.warn('[meta-webhook:instagram] Failed to parse JSON body', error);
  }

  return NextResponse.json({ received: true });
}
