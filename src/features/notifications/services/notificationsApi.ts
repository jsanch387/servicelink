/**
 * Notifications API client (for use in hooks / client).
 * Calls the app's API routes; auth is via session cookie.
 */

import type { NotificationDisplay } from '../types/notification';
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
  }>;
  error?: string;
}

export async function fetchNotifications(): Promise<{
  success: boolean;
  data?: NotificationDisplay[];
  error?: string;
}> {
  const res = await fetch(API_BASE, { credentials: 'include' });
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

  return { success: true, data };
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
