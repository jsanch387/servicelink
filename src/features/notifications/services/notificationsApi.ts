/**
 * Notifications API client (for use in hooks / client).
 * Calls the app's API routes; auth is via session cookie.
 */

import { NOTIFICATIONS_PAGE_SIZE } from '../constants';
import type { Json } from '@/libs/supabase/client';
import type {
  NotificationDisplay,
  NotificationInboxFilter,
} from '../types/notification';
import { notificationToDisplay } from '../types/notification';

const API_BASE = '/api/notifications';

export interface NotificationsListResponse {
  success: boolean;
  data?: Array<{
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
  }>;
  unreadCount?: number;
  hasMore?: boolean;
  error?: string;
}

export async function fetchNotifications(options?: {
  limit?: number;
  offset?: number;
  filter?: NotificationInboxFilter;
}): Promise<{
  success: boolean;
  data?: NotificationDisplay[];
  unreadCount?: number;
  hasMore?: boolean;
  error?: string;
}> {
  const limit = options?.limit ?? NOTIFICATIONS_PAGE_SIZE;
  const offset = options?.offset ?? 0;
  const filter = options?.filter ?? 'new';
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    filter,
  });

  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    credentials: 'include',
  });
  const json: NotificationsListResponse = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: json.error || 'Failed to fetch notifications',
    };
  }

  if (!json.success || !json.data) {
    return { success: false, error: json.error || 'Invalid response' };
  }

  const data = json.data.map(row => notificationToDisplay(row));

  return {
    success: true,
    data,
    unreadCount: json.unreadCount ?? data.filter(n => !n.readAt).length,
    hasMore: json.hasMore ?? false,
  };
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ notificationId }),
  });

  const json = await res.json();
  if (!res.ok) {
    return {
      success: false,
      error: json.error || 'Failed to mark as read',
    };
  }
  return { success: true };
}

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ markAll: true }),
  });

  const json = await res.json();
  if (!res.ok) {
    return {
      success: false,
      error: json.error || 'Failed to mark all as read',
    };
  }
  return { success: true };
}
