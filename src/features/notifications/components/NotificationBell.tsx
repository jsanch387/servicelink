'use client';

import { IconButton } from '@/components/shared';
import { BellIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const {
    filter,
    setFilter,
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  const close = useCallback(() => setOpen(false), []);

  const toggleOpen = useCallback(() => {
    setOpen(prev => {
      const next = !prev;
      if (next) {
        void fetchNotifications('new');
      }
      return next;
    });
  }, [fetchNotifications]);

  return (
    <div className="relative">
      <IconButton
        icon={<BellIcon className="h-5 w-5" />}
        onClick={toggleOpen}
        onMouseDown={event => event.preventDefault()}
        variant="ghost"
        size="md"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notifications-panel"
        aria-label={
          open
            ? 'Close notifications'
            : `Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`
        }
      />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black"
          aria-hidden
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {open ? (
        <NotificationPanel
          notifications={notifications}
          filter={filter}
          unreadCount={unreadCount}
          hasMore={hasMore}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          onFilterChange={setFilter}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onLoadMore={() => void loadMore()}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
