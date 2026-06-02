/**
 * In-app notification + owner email for a new V2 availability booking.
 * Best-effort; failures are swallowed so the booking request can still succeed.
 */

import { logAvailabilityOwnerNotify } from '@/features/availability/server/availabilityOwnerNotifyLog';
import {
  sendAvailabilityBookingNotificationEmail,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import {
  notificationInboxSubtitleFromCustomer,
  notificationMinimalDisplayTitle,
} from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { Database } from '@/libs/supabase/client';
import { supabaseErrorForLogs } from '@/server/logging/structuredLog';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function notifyOwnerForAvailabilityBookingCreated(
  supabase: SupabaseClient<Database>,
  params: {
    /** Optional HTTP request id for log correlation (e.g. public booking POST). */
    correlationId?: string | null;
    profileId: string | null;
    bookingId: string;
    customerName: string;
    /** Shown in notification body, e.g. full service label including option text. */
    serviceSummaryLine: string | null;
    scheduledDate: string;
    emailPayload: AvailabilityBookingNotificationPayload;
  }
): Promise<void> {
  const { correlationId, profileId, bookingId, customerName } = params;

  if (!profileId) {
    logAvailabilityOwnerNotify(
      correlationId ?? undefined,

      'warn',
      'skip_no_owner_profile',
      {
        bookingId,
      }
    );
    return;
  }

  const title = notificationMinimalDisplayTitle(
    'availability_booking',
    'booking',
    ''
  );
  const bodyText = notificationInboxSubtitleFromCustomer(customerName);

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: profileId,
    type: 'availability_booking',
    reference_type: 'booking',
    reference_id: bookingId,
    title,
    body: bodyText,
  } as never);

  if (notifError) {
    logAvailabilityOwnerNotify(
      correlationId ?? undefined,
      'warn',
      'notification_insert_failed',
      { bookingId, profileId, ...supabaseErrorForLogs(notifError) }
    );
  }

  await sendExpoPushToUser(supabase, {
    userId: profileId,
    title,
    body: bodyText,
    data: { reference_type: 'booking', reference_id: bookingId },
  });

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
  } catch (e) {
    logAvailabilityOwnerNotify(
      correlationId ?? undefined,
      'warn',
      'owner_email_failed',
      {
        bookingId,
        profileId,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e),
      }
    );
  }
}
