'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  markAllNotificationsAsRead as apiMarkAllAsRead,
  markNotificationAsRead as apiMarkAsRead,
  fetchNotifications,
} from '../services/notificationsApi';
import type { NotificationDisplay } from '../types/notification';

/** Shared cache so we only make one request (avoids duplicate from Strict Mode or multiple consumers). */
let sharedPromise: Promise<NotificationDisplay[]> | null = null;
let sharedCache: NotificationDisplay[] | null = null;

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationDisplay[]>(
    () => sharedCache ?? []
  );
  const [isLoading, setIsLoading] = useState(() => sharedCache === null);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const fetchNotificationsList = useCallback(async (bypassCache = false) => {
    if (bypassCache) {
      sharedCache = null;
      sharedPromise = null;
    }
    if (sharedPromise && !bypassCache) {
      const data = await sharedPromise;
      setNotifications(data);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    sharedPromise = (async () => {
      const result = await fetchNotifications();
      const data = result.success && result.data ? result.data : [];
      sharedCache = data;
      setNotifications(data);
      setIsLoading(false);
      sharedPromise = null;
      return data;
    })();
    await sharedPromise;
  }, []);

  useEffect(() => {
    if (sharedCache !== null) {
      setNotifications(sharedCache);
      setIsLoading(false);
      return;
    }
    fetchNotificationsList();
  }, [fetchNotificationsList]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const result = await apiMarkAsRead(notificationId);
    if (result.success) {
      // Remove from list so the bar doesn’t accumulate; they’ve acted on it
      const next = (prev: NotificationDisplay[]) =>
        prev.filter(n => n.id !== notificationId);
      setNotifications(next);
      if (sharedCache) sharedCache = next(sharedCache);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const result = await apiMarkAllAsRead();
    if (result.success) {
      setNotifications([]);
      sharedCache = [];
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications: () => fetchNotificationsList(true),
    markAsRead,
    markAllAsRead,
  };
}
