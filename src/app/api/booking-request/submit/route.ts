/**
 * API Route: Submit Booking Request
 *
 * POST /api/booking-request/submit
 *
 * Creates a new booking request in the database.
 * This is a public endpoint (no authentication required) as customers
 * submit booking requests without being logged in.
 */

import { BookingRequestService } from '@/features/booking-request/services/bookingRequestService';
import { BookingRequestFormData } from '@/features/booking-request/types/bookingRequest';
import {
  sendBookingNotificationEmail,
  type BookingNotificationPayload,
} from '@/features/email';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Database } from '@/libs/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Request body for booking request submission
 */
interface SubmitBookingRequestBody {
  businessId: string;
  businessSlug: string;
  serviceName?: string;
  servicePrice?: number;
  formData: BookingRequestFormData;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SubmitBookingRequestBody = await request.json();

    // Validate required fields
    if (!body.businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (!body.businessSlug) {
      return NextResponse.json(
        { success: false, error: 'Business slug is required' },
        { status: 400 }
      );
    }

    if (!body.formData) {
      return NextResponse.json(
        { success: false, error: 'Form data is required' },
        { status: 400 }
      );
    }

    // Validate form data
    const { formData } = body;
    if (!formData.name || formData.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!formData.phone || formData.phone.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!formData.preferredDate) {
      return NextResponse.json(
        { success: false, error: 'Preferred date is required' },
        { status: 400 }
      );
    }

    if (!formData.preferredTimeWindow) {
      return NextResponse.json(
        { success: false, error: 'Preferred time window is required' },
        { status: 400 }
      );
    }

    if (!formData.service || formData.service.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Service is required' },
        { status: 400 }
      );
    }

    // Verify business exists (use admin so RLS doesn't block unauthenticated requests)
    const admin = createSupabaseAdminClient();
    const { data: businessProfile, error: businessError } = await admin
      .from('business_profiles')
      .select('id, business_slug, profile_id')
      .eq('id', body.businessId)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // If a service name is provided, try to find the service ID
    let serviceId: string | undefined;
    if (body.serviceName && body.serviceName !== 'General Inquiry') {
      const { data: service } = await admin
        .from('business_services')
        .select('id')
        .eq('business_id', body.businessId)
        .eq('name', body.serviceName)
        .eq('is_active', true)
        .single();

      if (service) {
        serviceId = (service as { id: string }).id;
      }
    }

    // Extract metadata from request
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent') || null;
    const referrerUrl = request.headers.get('referer') || null;

    // Convert preferred date from form format (MM/DD/YYYY) to database format (YYYY-MM-DD)
    let preferredDateDb: string;
    try {
      const dateParts = formData.preferredDate.split('/');
      if (dateParts.length === 3) {
        // MM/DD/YYYY format
        const [month, day, year] = dateParts;
        preferredDateDb = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // Assume it's already in YYYY-MM-DD format
        preferredDateDb = formData.preferredDate;
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Create booking request
    const result = await BookingRequestService.createBookingRequest({
      businessId: body.businessId,
      businessSlug: body.businessSlug,
      serviceId,
      serviceName: formData.service,
      servicePriceCents: body.servicePrice || null, // Already in cents from the database
      customerName: formData.name,
      customerPhone: formData.phone,
      preferredDate: preferredDateDb,
      preferredTimeWindow: formData.preferredTimeWindow as
        | 'morning'
        | 'afternoon'
        | 'evening',
      message: formData.message,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      referrerUrl: referrerUrl || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Create in-app notification for the business owner (profile_id = user who receives it)
    const profileId =
      (businessProfile as { profile_id?: string }).profile_id ?? null;
    const bookingId = result.data?.id ?? null;

    if (profileId && bookingId) {
      try {
        const notificationRow: Database['public']['Tables']['notifications']['Insert'] =
          {
            user_id: profileId,
            type: 'booking_request',
            reference_type: 'booking_request',
            reference_id: bookingId,
            title: `New booking request from ${formData.name}`,
            body: formData.service
              ? `Service: ${formData.service} · ${formData.preferredDate}`
              : null,
          };
        await admin.from('notifications').insert(notificationRow as never);
      } catch {
        // Do not fail the request; booking was already created
      }

      await sendExpoPushToUser(admin, {
        userId: profileId,
        title: `New booking request from ${formData.name}`,
        body: formData.service
          ? `Service: ${formData.service} · ${formData.preferredDate}`
          : null,
        data: {
          reference_type: 'booking_request',
          reference_id: bookingId,
        },
      });
    }

    // Send email only after booking was created successfully (we only reach here when result.success)
    try {
      let ownerEmail: string | null = null;
      if (profileId) {
        try {
          const {
            data: { user },
          } = await admin.auth.admin.getUserById(profileId);
          ownerEmail = user?.email?.trim() ?? null;
        } catch {
          // Owner email unavailable from auth
        }
      }

      if (ownerEmail) {
        const payload: BookingNotificationPayload = {
          customerName: formData.name,
          serviceName: formData.service,
          preferredDate: formData.preferredDate,
          preferredTimeWindow: formData.preferredTimeWindow,
        };
        const emailResult = await sendBookingNotificationEmail(
          ownerEmail,
          payload
        );
        if (emailResult.sent && bookingId) {
          try {
            await admin
              .from('booking_requests')
              .update({
                notification_sent: true,
                notification_sent_at: new Date().toISOString(),
              } as never)
              .eq('id', bookingId);
          } catch {
            // Best-effort: notification_sent update failed
          }
        }
      }
    } catch {
      // Email/notification_sent failure must not affect response; booking was already created
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.data?.id,
          message: 'Booking request submitted successfully',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
