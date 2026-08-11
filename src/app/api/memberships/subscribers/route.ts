/**
 * GET /api/memberships/subscribers
 * Owner: list customer memberships for the current business.
 */

import { assertMembershipsReady } from '@/features/subscriptions/server/assertMembershipsReady';
import { listOwnerCustomerMemberships } from '@/features/subscriptions/server/listOwnerCustomerMemberships';
import {
  getMembershipsRequestId,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';

export async function GET(req: Request) {
  const requestId = getMembershipsRequestId(req);
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolved = await resolveCurrentBusinessId(supabase);
    if (!resolved.ok) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const ready = await assertMembershipsReady(
      supabase,
      user.id,
      resolved.businessId,
      user.email
    );
    if (!ready.ok) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: ready.error, gate: ready.gate },
        { status: ready.status }
      );
    }

    const url = new URL(req.url);
    const planId = url.searchParams.get('planId');
    const result = await listOwnerCustomerMemberships(
      supabase,
      resolved.businessId,
      { planId }
    );

    if (!result.ok) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return membershipsJsonResponse(requestId, {
      success: true,
      subscribers: result.subscribers,
    });
  } catch {
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
