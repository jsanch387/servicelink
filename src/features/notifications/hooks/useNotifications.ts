'use client';

import { useCallback, useEffect, useState } from 'react';
import { NOTIFICATIONS_PAGE_SIZE } from '../constants';
import {
  markAllNotificationsAsRead as apiMarkAllAsRead,
  markNotificationAsRead as apiMarkAsRead,
  fetchNotifications,
} from '../services/notificationsApi';
import type {
  NotificationDisplay,
  NotificationInboxFilter,
} from '../types/notification';

interface TabCache {
  notifications: NotificationDisplay[];
  hasMore: boolean;
}

interface NotificationsCache {
  unreadCount: number;
  tabs: Record<NotificationInboxFilter, TabCache | null>;
}

const EMPTY_TAB: TabCache = { notifications: [], hasMore: false };

let sharedCache: NotificationsCache | null = null;
const inFlight: Partial<
  Record<NotificationInboxFilter, Promise<TabCache & { unreadCount: number }>>
> = {};

function emptyCache(): NotificationsCache {
  return { unreadCount: 0, tabs: { new: null, recent: null } };
}

export function useNotifications() {
  const [filter, setFilterState] = useState<NotificationInboxFilter>('new');
  const [cache, setCache] = useState<NotificationsCache>(
    () => sharedCache ?? emptyCache()
  );
  const [isLoading, setIsLoading] = useState(
    () => sharedCache?.tabs.new == null
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const applyCache = useCallback((next: NotificationsCache) => {
    sharedCache = next;
    setCache(next);
  }, []);

  const loadTab = useCallback(
    async (
      nextFilter: NotificationInboxFilter,
      options?: { refresh?: boolean }
    ) => {
      const refresh = options?.refresh ?? false;
      const existing = sharedCache?.tabs[nextFilter];
      if (existing && !refresh) {
        setIsLoading(false);
        return;
      }

      if (!refresh && inFlight[nextFilter]) {
        await inFlight[nextFilter];
        setIsLoading(sharedCache?.tabs[nextFilter] == null);
        if (sharedCache) setCache(sharedCache);
        return;
      }

      if (existing == null) {
        setIsLoading(true);
      }

      inFlight[nextFilter] = (async () => {
        const result = await fetchNotifications({
          limit: NOTIFICATIONS_PAGE_SIZE,
          offset: 0,
          filter: nextFilter,
        });
        const tab: TabCache =
          result.success && result.data
            ? {
                notifications: result.data,
                hasMore: result.hasMore ?? false,
              }
            : (sharedCache?.tabs[nextFilter] ?? EMPTY_TAB);
        const unreadCount =
          result.success && typeof result.unreadCount === 'number'
            ? result.unreadCount
            : (sharedCache?.unreadCount ?? 0);
        const next: NotificationsCache = {
          unreadCount,
          tabs: {
            ...(sharedCache?.tabs ?? { new: null, recent: null }),
            [nextFilter]: tab,
          },
        };
        applyCache(next);
        setIsLoading(false);
        delete inFlight[nextFilter];
        return { ...tab, unreadCount };
      })();

      await inFlight[nextFilter];
    },
    [applyCache]
  );

  useEffect(() => {
    if (sharedCache?.tabs.new != null) {
      applyCache(sharedCache);
      setIsLoading(false);
      return;
    }
    void loadTab('new');
  }, [applyCache, loadTab]);

  const setFilter = useCallback(
    (nextFilter: NotificationInboxFilter) => {
      setFilterState(nextFilter);
      void loadTab(nextFilter);
    },
    [loadTab]
  );

  const loadMore = useCallback(async () => {
    const tab = cache.tabs[filter];
    if (isLoadingMore || !tab?.hasMore) return;
    setIsLoadingMore(true);
    const result = await fetchNotifications({
      limit: NOTIFICATIONS_PAGE_SIZE,
      offset: tab.notifications.length,
      filter,
    });
    if (result.success && result.data) {
      const existingIds = new Set(tab.notifications.map(n => n.id));
      const appended = result.data.filter(n => !existingIds.has(n.id));
      applyCache({
        unreadCount: result.unreadCount ?? cache.unreadCount,
        tabs: {
          ...cache.tabs,
          [filter]: {
            notifications: [...tab.notifications, ...appended],
            hasMore: result.hasMore ?? false,
          },
        },
      });
    }
    setIsLoadingMore(false);
  }, [applyCache, cache, filter, isLoadingMore]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const newTab = cache.tabs.new;
      const current = newTab?.notifications.find(n => n.id === notificationId);
      if (!current || current.readAt) return;

      const result = await apiMarkAsRead(notificationId);
      if (!result.success) return;

      const readAt = new Date().toISOString();
      const readItem = { ...current, readAt };
      const recentTab = cache.tabs.recent;

      applyCache({
        unreadCount: Math.max(0, cache.unreadCount - 1),
        tabs: {
          new: newTab
            ? {
                ...newTab,
                notifications: newTab.notifications.filter(
                  n => n.id !== notificationId
                ),
              }
            : null,
          recent: recentTab
            ? {
                ...recentTab,
                notifications: [
                  readItem,
                  ...recentTab.notifications.filter(
                    n => n.id !== notificationId
                  ),
                ],
              }
            : recentTab,
        },
      });
    },
    [applyCache, cache]
  );

  const markAllAsRead = useCallback(async () => {
    const result = await apiMarkAllAsRead();
    if (!result.success) return;

    const readAt = new Date().toISOString();
    const moved = (cache.tabs.new?.notifications ?? []).map(n =>
      n.readAt ? n : { ...n, readAt }
    );
    const recentTab = cache.tabs.recent;

    applyCache({
      unreadCount: 0,
      tabs: {
        new: { notifications: [], hasMore: false },
        recent: recentTab
          ? {
              ...recentTab,
              notifications: [
                ...moved,
                ...recentTab.notifications.filter(
                  n => !moved.some(m => m.id === n.id)
                ),
              ],
            }
          : null,
      },
    });
  }, [applyCache, cache.tabs.new, cache.tabs.recent]);

  const refresh = useCallback(
    (nextFilter?: NotificationInboxFilter) => {
      if (nextFilter) setFilterState(nextFilter);
      return loadTab(nextFilter ?? filter, { refresh: true });
    },
    [filter, loadTab]
  );

  const activeTab = cache.tabs[filter] ?? EMPTY_TAB;

  return {
    filter,
    setFilter,
    notifications: activeTab.notifications,
    unreadCount: cache.unreadCount,
    hasMore: activeTab.hasMore,
    isLoading,
    isLoadingMore,
    fetchNotifications: refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
