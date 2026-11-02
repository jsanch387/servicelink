import { ROUTES } from '@/constants/routes';
import { bookingCardServiceTitle } from '@/features/availability/booking/dashboard/utils/bookingCardServiceTitle';
import { sendJobAssignedEmail } from '@/features/email/job-assigned/sendJobAssignedEmail';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import { notificationMinimalDisplayTitle } from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { shouldNotifyJobAssigned } from '../utils/shouldNotifyJobAssigned';
import { adminDb } from './adminDb';

function formatScheduleDate(ymd: string): string {
  const date = new Date(`${ymd.trim()}T12:00:00`);
  if (Number.isNaN(date.getTime())) return ymd.trim();
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatStartTime(timeStr: string): string {
  const part = timeStr.trim().slice(0, 5);
  const [hStr, mStr] = part.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h)) return timeStr.trim();
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  const min = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h12}${min} ${ampm}`;
}

/** Push and inbox body: service name only, without the price-option suffix. */
function jobAssignedNoticeBody(serviceName: string): string | null {
  const raw = serviceName.trim();
  if (!raw) return null;
  return bookingCardServiceTitle(raw);
}

/** Best-effort: inbox + push + email after someone else puts them on a job. */
export async function notifyAssigneeForJobAssigned(params: {
  admin: SupabaseClient<Database>;
  businessId: string;
  bookingId: string;
  actorUserId: string;
  previousAssignedUserId: string | null;
  nextAssignedUserId: string | null;
}): Promise<void> {
  if (
    !shouldNotifyJobAssigned({
      previousAssignedUserId: params.previousAssignedUserId,
      nextAssignedUserId: params.nextAssignedUserId,
      actorUserId: params.actorUserId,
    })
  ) {
    return;
  }

  const assignedUserId = params.nextAssignedUserId?.trim() ?? '';
  if (!assignedUserId) return;

  try {
    const db = adminDb(params.admin);
    const { data: booking } = await db
      .from('bookings')
      .select('customer_name, service_name, scheduled_date, start_time')
      .eq('id', params.bookingId)
      .eq('business_id', params.businessId)
      .maybeSingle();

    if (!booking) return;

    const { data: shop } = await db
      .from('business_profiles')
      .select('business_name')
      .eq('id', params.businessId)
      .maybeSingle();

    const customerName =
      typeof booking.customer_name === 'string' ? booking.customer_name : '';
    const serviceName =
      typeof booking.service_name === 'string' ? booking.service_name : '';
    const title = notificationMinimalDisplayTitle(
      'job_assigned',
      'booking',
      'Job assigned'
    );
    const bodyText = jobAssignedNoticeBody(serviceName);

    const { error: notifError } = await db.from('notifications').insert({
      user_id: assignedUserId,
      type: 'job_assigned',
      reference_type: 'booking',
      reference_id: params.bookingId,
      title,
      body: bodyText,
      metadata: {
        ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
        ...(serviceName.trim() ? { serviceName: serviceName.trim() } : {}),
      },
    });

    if (notifError) {
      console.warn('[team] job assigned notification insert failed', {
        bookingId: params.bookingId,
        assignedUserId,
        message: notifError.message,
      });
    }

    await sendExpoPushToUser(params.admin, {
      userId: assignedUserId,
      title,
      body: bodyText,
      data: {
        reference_type: 'booking',
        reference_id: params.bookingId,
      },
    });

    const { data: userData } =
      await params.admin.auth.admin.getUserById(assignedUserId);
    const to = userData?.user?.email?.trim() ?? '';
    if (!to) return;

    const result = await sendJobAssignedEmail(to, {
      businessName:
        typeof shop?.business_name === 'string' ? shop.business_name : '',
      customerName,
      serviceName,
      scheduledDateLabel: formatScheduleDate(
        String(booking.scheduled_date ?? '')
      ),
      startTimeLabel: formatStartTime(String(booking.start_time ?? '')),
      bookingsUrl: `${getAppBaseUrl()}${ROUTES.DASHBOARD.BOOKINGS}`,
    });

    if (!result.sent) {
      console.error('[team] job assigned email skipped', result.error);
    }
  } catch (error) {
    console.error('[team] job assigned notify failed', error);
  }
}
