'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchNotifications,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  markNotificationAsRead as apiMarkAsRead,
} from '../services/notificationsApi';
import type { NotificationDisplay } from '../types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const fetchNotificationsList = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchNotifications();
    setIsLoading(false);
    if (result.success && result.data) {
      setNotifications(result.data);
    } else {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    fetchNotificationsList();
  }, [fetchNotificationsList]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const result = await apiMarkAsRead(notificationId);
    if (result.success) {
      // Remove from list so the bar doesn’t accumulate; they’ve acted on it
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const result = await apiMarkAllAsRead();
    if (result.success) {
      setNotifications([]);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications: fetchNotificationsList,
    markAsRead,
    markAllAsRead,
  };
}
