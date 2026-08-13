/**
 * POST /api/public/memberships/customer-snapshot
 *
 * Silent CRM lookup for subscribe / visit UX: match phone (then email) at this
 * business and return address + vehicle when present.
 */

import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { resolveMembershipCustomerServiceSnapshot } from '@/features/subscriptions/server/resolveMembershipCustomerServiceSnapshot';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';
import { assertPublicMembershipCheckoutRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestId = getMembershipsRequestId(req);
  try {
    const raw: unknown = await req.json().catch(() => null);
    const body =
      raw && typeof raw === 'object'
        ? (raw as {
            businessSlug?: unknown;
            phone?: unknown;
            email?: unknown;
          })
        : null;

    const businessSlug =
      typeof body?.businessSlug === 'string'
        ? body.businessSlug.trim().toLowerCase()
        : '';
    const phoneRaw = typeof body?.phone === 'string' ? body.phone : '';
    const emailRaw = typeof body?.email === 'string' ? body.email.trim() : '';
    const phone = normalizeUsPhoneDigits(phoneRaw);

    const rateLimited = await assertPublicMembershipCheckoutRateLimits(
      req,
      businessSlug || 'missing'
    );
    if (rateLimited) return rateLimited;

    if (!businessSlug || (!phone && !emailRaw)) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Phone or email is required.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Business not found.' },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('business_slug', businessSlug)
      .maybeSingle();
    const businessId = String(
      (profile as { id?: string } | null)?.id ?? ''
    ).trim();
    if (!businessId) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Business not found.' },
        { status: 404 }
      );
    }

    const snapshot = await resolveMembershipCustomerServiceSnapshot(supabase, {
      businessId,
      phone: phone || null,
      email: emailRaw || null,
    });

    return membershipsJsonResponse(requestId, {
      success: true,
      matched: Boolean(snapshot.customerId),
      hasUsableAddress: snapshot.hasUsableAddress,
      hasVehicle: snapshot.hasVehicle,
      address: snapshot.hasUsableAddress ? snapshot.address : null,
      vehicle: snapshot.hasVehicle ? snapshot.vehicle : null,
    });
  } catch (error) {
    logMemberships(requestId, 'error', 'customer_snapshot.unhandled', {
      reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Could not look up details.' },
      { status: 500 }
    );
  }
}
