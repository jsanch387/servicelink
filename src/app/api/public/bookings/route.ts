/**
 * POST /api/public/bookings
 *
 * Creates a V2 (availability) booking. Public endpoint; no auth.
 * Resolves business by slug, then inserts one row into bookings via feature service.
 */

import type { CreateBookingRequest } from '@/features/availability/booking/types';
import { createBooking } from '@/features/availability/services/bookingService';
import { sendAvailabilityBookingNotificationEmail } from '@/features/email';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateBookingRequest;

    if (!body.businessSlug?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Business slug is required' },
        { status: 400 }
      );
    }
    if (!body.serviceName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }
    if (
      !body.scheduledDate?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid scheduled date (YYYY-MM-DD) is required',
        },
        { status: 400 }
      );
    }
    if (!body.startTime?.trim() || !/^\d{1,2}:\d{2}$/.test(body.startTime)) {
      return NextResponse.json(
        { success: false, error: 'Valid start time (HH:mm) is required' },
        { status: 400 }
      );
    }
    if (typeof body.durationMinutes !== 'number' || body.durationMinutes < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration is required' },
        { status: 400 }
      );
    }
    const customer = body.customer;
    if (!customer?.fullName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }
    if (!customer?.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, business_slug, profile_id')
      .eq('business_slug', body.businessSlug.trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const p = profile as {
      id: string;
      business_slug: string | null;
      profile_id: string | null;
    };
    const businessId = p.id;
    const businessSlug = p.business_slug ?? body.businessSlug.trim();

    const result = await createBooking(supabase, {
      businessId,
      businessSlug,
      serviceId: body.serviceId,
      serviceName: body.serviceName.trim(),
      servicePriceCents: body.servicePriceCents,
      selectedAddOns: body.selectedAddOns,
      durationMinutes: body.durationMinutes,
      scheduledDate: body.scheduledDate,
      startTime: body.startTime.trim(),
      customer: body.customer,
    });

    // In-app notification for the business owner (V2 availability booking)
    const profileId = p.profile_id ?? null;
    if (profileId && result?.id) {
      const customerName = body.customer?.fullName?.trim() ?? 'A customer';
      const title = `New appointment from ${customerName}`;
      const bodyText = body.serviceName?.trim()
        ? `Service: ${body.serviceName.trim()} · ${body.scheduledDate}`
        : null;
      try {
        await supabase.from('notifications').insert({
          user_id: profileId,
          type: 'availability_booking',
          reference_type: 'booking',
          reference_id: result.id,
          title,
          body: bodyText,
        } as never);
      } catch {
        // Do not fail the request; booking was already created
      }
    }

    // Email notification for the business owner (V2 availability booking)
    if (profileId) {
      try {
        let ownerEmail: string | null = null;
        try {
          const {
            data: { user },
          } = await supabase.auth.admin.getUserById(profileId);
          ownerEmail = user?.email?.trim() ?? null;
        } catch {
          // Owner email unavailable from auth
        }
        if (ownerEmail) {
          const customerName = body.customer?.fullName?.trim() ?? 'A customer';
          const customerEmail = body.customer?.email?.trim() ?? '';
          const selectedAddOns = body.selectedAddOns ?? [];
          const basePrice = body.servicePriceCents ?? 0;
          const addOnTotal = selectedAddOns.reduce(
            (s, a) => s + a.priceCents,
            0
          );
          const totalPriceCents = basePrice + addOnTotal;
          await sendAvailabilityBookingNotificationEmail(ownerEmail, {
            customerName,
            customerEmail,
            serviceName: body.serviceName.trim(),
            scheduledDate: body.scheduledDate,
            startTime: body.startTime.trim(),
            durationMinutes: body.durationMinutes,
            servicePriceCents: body.servicePriceCents,
            selectedAddOns,
            totalPriceCents,
          });
        }
      } catch {
        // Do not fail the request; booking was already created
      }
    }

    return NextResponse.json(
      { success: true, data: { id: result.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API] POST /api/public/bookings:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create booking',
      },
      { status: 500 }
    );
  }
}
