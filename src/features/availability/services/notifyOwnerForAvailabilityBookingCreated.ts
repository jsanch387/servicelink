/**
 * In-app notification + owner email for a new V2 availability booking.
 * Best-effort; failures are swallowed so the booking request can still succeed.
 */

import {
  sendAvailabilityBookingNotificationEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function notifyOwnerForAvailabilityBookingCreated(
  supabase: SupabaseClient<Database>,
  params: {
    profileId: string | null;
    bookingId: string;
    customerName: string;
    /** Shown in notification body, e.g. full service label including option text. */
    serviceSummaryLine: string | null;
    scheduledDate: string;
    emailPayload: AvailabilityBookingNotificationPayload;
  }
): Promise<void> {
  const {
    profileId,
    bookingId,
    customerName,
    serviceSummaryLine,
    scheduledDate,
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

  if (!profileId) {
    return;
  }

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
        params.emailPayload
      );
    }
  } catch {
    // Best-effort
  }
}
