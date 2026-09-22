import type { Json } from '@/libs/supabase/client';
import { jobAssignedNotificationDisplay } from '../utils/jobAssignedNotificationDisplay';

/**
 * Notification types aligned with public.notifications table.
 */

/** Inbox tabs in the browser notifications drawer. */
export type NotificationInboxFilter = 'new' | 'recent';

export type NotificationType =
  | 'booking_request'
  | 'availability_booking'
  | 'booking_reminder'
  | 'job_assigned'
  | 'quote_request'
  | 'quote_request_followup'
  | 'review_submitted'
  | 'membership_subscriber'
  | 'membership_visit_needed';

/** Row from notifications table (API/DB) */
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  reference_type: string;
  reference_id: string;
  title: string;
  body: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Json | null;
  dedupe_key: string | null;
}

/** For list display in the UI */
export interface NotificationDisplay {
  id: string;
  type: NotificationType;
  title: string;
  /** Subtitle (e.g. `From {customer}`); shown with timestamp in the bell. */
  body: string | null;
  referenceId: string;
  readAt: string | null;
  createdAt: string;
}

export function notificationToDisplay(row: Notification): NotificationDisplay {
  const jobAssigned =
    row.type === 'job_assigned'
      ? jobAssignedNotificationDisplay({
          body: row.body,
          metadata: row.metadata,
        })
      : null;

  return {
    id: row.id,
    type: row.type as NotificationType,
    title: jobAssigned?.title ?? row.title,
    body: jobAssigned ? jobAssigned.body : row.body,
    referenceId: row.reference_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
