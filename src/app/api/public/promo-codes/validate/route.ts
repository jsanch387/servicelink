/**
 * POST /api/public/promo-codes/validate
 *
 * Validates a promo code for the public booking checkout preview.
 * Does not write a redemption — that happens at job completion.
 */

import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import {
  normalizeEnteredPromoCode,
  resolveBookingPromoDiscountSnapshot,
} from '@/features/marketing/server/resolveBookingPromoDiscountSnapshot';
import { promoDiscountResolveErrorMessage } from '@/features/marketing/utils/promoDiscountResolveErrorMessage';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const businessSlug =
      typeof body.businessSlug === 'string' ? body.businessSlug.trim() : '';
    const promoCode = normalizeEnteredPromoCode(
      typeof body.promoCode === 'string' ? body.promoCode : ''
    );
    const serviceDateYmd =
      typeof body.serviceDate === 'string' ? body.serviceDate.trim() : '';
    const subtotalRaw = body.subtotalCents;
    const subtotalCents =
      typeof subtotalRaw === 'number' && Number.isFinite(subtotalRaw)
        ? Math.max(0, Math.round(subtotalRaw))
        : NaN;
    const customerPhone =
      typeof body.customerPhone === 'string' ? body.customerPhone : '';
    const customerEmail =
      typeof body.customerEmail === 'string' ? body.customerEmail : '';

    if (!businessSlug) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'invalid',
          error: 'Business is required.',
        },
        { status: 400 }
      );
    }
    if (!promoCode) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'invalid',
          error: promoDiscountResolveErrorMessage('invalid'),
        },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDateYmd)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'invalid',
          error: 'A valid appointment date is required.',
        },
        { status: 400 }
      );
    }
    if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'invalid',
          error: 'A valid booking total is required.',
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    if (!(await isPublicBusinessSlugVisible(supabase, businessSlug))) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'unavailable',
          error: promoDiscountResolveErrorMessage('unavailable'),
        },
        { status: 404 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, profile_id, free_bookings_count')
      .eq('business_slug', businessSlug)
      .maybeSingle();

    const profileRow = profile as {
      id?: string;
      profile_id?: string | null;
      free_bookings_count?: number | null;
    } | null;

    if (profileError || !profileRow?.id) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'unavailable',
          error: promoDiscountResolveErrorMessage('unavailable'),
        },
        { status: 404 }
      );
    }

    const profileId =
      typeof profileRow.profile_id === 'string' ? profileRow.profile_id : '';
    const { ownerHasPro } = await resolvePublicBookingFreeTierGate(supabase, {
      profileId,
      freeBookingsCount:
        typeof profileRow.free_bookings_count === 'number'
          ? profileRow.free_bookings_count
          : null,
    });

    const resolved = await resolveBookingPromoDiscountSnapshot(supabase, {
      businessId: profileRow.id,
      ownerHasPro,
      promoCode,
      serviceDateYmd,
      subtotalCents,
      customerPhone,
      customerEmail,
    });

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          errorCode: resolved.error,
          error: promoDiscountResolveErrorMessage(resolved.error),
        },
        { status: 400 }
      );
    }

    const { snapshot } = resolved;
    return NextResponse.json({
      success: true,
      promoCode,
      label: snapshot.discountLabel,
      discountCents: snapshot.discountCents,
      subtotalCents: snapshot.subtotalCents,
      estimatedTotalCents: Math.max(
        0,
        snapshot.subtotalCents - snapshot.discountCents
      ),
    });
  } catch (err) {
    console.error('[public/promo-codes/validate]', err);
    return NextResponse.json(
      {
        success: false,
        errorCode: 'unavailable',
        error: promoDiscountResolveErrorMessage('unavailable'),
      },
      { status: 500 }
    );
  }
}
