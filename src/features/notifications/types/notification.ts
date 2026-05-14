import type { Json } from '@/libs/supabase/client';

/**
 * Notification types aligned with public.notifications table.
 */

export type NotificationType =
  | 'booking_request'
  | 'availability_booking'
  | 'quote_request';

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
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    referenceId: row.reference_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
