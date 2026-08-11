/**
 * GET /api/public/memberships/portal?token=...
 * Signed manage link → Stripe Connect Customer Portal (customer cancel / update card).
 */

import { createMembershipBillingPortalSession } from '@/features/subscriptions/server/createMembershipBillingPortalSession';
import { verifyMembershipManageToken } from '@/features/subscriptions/server/membershipManageToken';
import {
  getMembershipsRequestId,
  logMemberships,
  shortIdForLog,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertPublicMembershipPortalRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = getMembershipsRequestId(request);
  const token = request.nextUrl.searchParams.get('token')?.trim() ?? '';

  const rateLimited = await assertPublicMembershipPortalRateLimits(
    request,
    token || 'missing'
  );
  if (rateLimited) return rateLimited;

  const membershipId = token ? verifyMembershipManageToken(token) : null;

  if (!membershipId) {
    logMemberships(requestId, 'warn', 'portal.invalid_token', {
      reason: 'Missing or invalid manage token',
    });
    return NextResponse.json(
      { error: 'This manage link is invalid or expired.' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const portal = await createMembershipBillingPortalSession(supabase, {
    membershipId,
    request,
  });

  if (!portal.ok) {
    logMemberships(requestId, 'error', 'portal.redirect_failed', {
      membershipId: shortIdForLog(membershipId),
      reason: portal.error,
    });
    return NextResponse.json(
      { error: portal.error },
      { status: portal.status }
    );
  }

  return NextResponse.redirect(portal.url, 303);
}
