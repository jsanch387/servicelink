/**
 * Single entry point for V2 availability booking: in-app owner notification,
 * owner transactional email, and optional customer confirmation (Resend).
 * Used by POST /api/webhooks/supabase/bookings when BOOKING_EMAIL_WEBHOOK_ENABLED=true,
 * and by legacy API paths when the flag is false.
 */

import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  sendAvailabilityBookingNotificationEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function dispatchNewAvailabilityBookingNotifications(
  supabase: SupabaseClient<Database>,
  params: {
    profileId: string | null;
    bookingId: string;
    customerName: string;
    serviceSummaryLine: string | null;
    scheduledDate: string;
    emailPayload: AvailabilityBookingNotificationPayload;
    sendCustomerConfirmation: boolean;
    businessDisplayName: string;
  }
): Promise<void> {
  const {
    profileId,
    bookingId,
    customerName,
    serviceSummaryLine,
    scheduledDate,
    emailPayload,
    sendCustomerConfirmation,
    businessDisplayName,
  } = params;

  if (profileId) {
    const title = `New appointment from ${customerName}`;
    const bodyText = serviceSummaryLine
      ? `Service: ${serviceSummaryLine} · ${scheduledDate}`
      : null;
    try {
      await supabase.from('notifications').insert({
        user_id: profileId,
        type: 'availability_booking',
        reference_type: 'booking',
        reference_id: bookingId,
        title,
        body: bodyText,
      } as never);
    } catch {
      // Booking already created; notification is optional
    }
  }

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
        await sendAvailabilityBookingNotificationEmail(
          ownerEmail,
          emailPayload
        );
      }
    } catch {
      // Best-effort
    }
  }

  if (!sendCustomerConfirmation) {
    return;
  }

  const to = emailPayload.customerEmail?.trim();
  if (!to) {
    return;
  }

  try {
    await sendAvailabilityBookingCustomerConfirmationEmail(
      to,
      businessDisplayName,
      emailPayload
    );
  } catch {
    // Best-effort customer confirmation
  }
}
