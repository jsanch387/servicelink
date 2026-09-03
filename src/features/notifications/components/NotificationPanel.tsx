'use client';

import { Button, FilterPills } from '@/components/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
  NotificationDisplay,
  NotificationInboxFilter,
} from '../types/notification';
import { NotificationItem } from './NotificationItem';

const INBOX_FILTERS: { id: NotificationInboxFilter; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'recent', label: 'Recent' },
];

interface NotificationPanelProps {
  notifications: NotificationDisplay[];
  filter: NotificationInboxFilter;
  unreadCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onFilterChange: (filter: NotificationInboxFilter) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onLoadMore: () => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  filter,
  unreadCount,
  hasMore,
  isLoading,
  isLoadingMore,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onLoadMore,
  onClose,
}: NotificationPanelProps) {
  const hasUnread = unreadCount > 0;

  useLayoutEffect(() => {
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const prevBodyOverflow = document.body.style.overflow;

    html.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      document.body.style.overflow = prevBodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const emptyTitle =
    filter === 'recent' ? 'No recent notifications' : "You're all caught up";
  const emptyBody =
    filter === 'recent'
      ? 'Notifications you have already read will show up here.'
      : 'New appointments and updates will show up here.';

  const panel = (
    <>
      <div
        className="fixed inset-0 z-[60] cursor-pointer bg-black/30 md:bg-black/40 md:backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        id="notifications-panel"
        className="fixed inset-0 z-[70] flex min-h-0 min-w-0 flex-col overscroll-none bg-[#0f0f0f] animate-in slide-in-from-right duration-200 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:border-l md:border-white/5 md:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-panel-title"
      >
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/10 p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 -ml-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close notifications"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2
            id="notifications-panel-title"
            className="min-w-0 flex-1 truncate text-lg font-bold text-white"
          >
            Notifications
          </h2>
          {hasUnread ? (
            <button
              type="button"
              onClick={() => onMarkAllAsRead()}
              className="cursor-pointer shrink-0 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain scrollbar-dark px-4 pb-4 pt-3 sm:px-5 sm:pb-5 [-webkit-overflow-scrolling:touch]">
          <FilterPills
            options={INBOX_FILTERS}
            value={filter}
            onChange={onFilterChange}
            ariaLabel="Notification filters"
            size="sm"
          />
          {isLoading ? (
            <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="px-2 py-12 text-center">
              <p className="text-sm font-medium text-white">{emptyTitle}</p>
              <p className="mt-1 text-sm text-zinc-500">{emptyBody}</p>
            </div>
          ) : (
            <>
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onClose={onClose}
                />
              ))}
              {hasMore ? (
                <div className="pt-1">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => onLoadMore()}
                    loading={isLoadingMore}
                    disabled={isLoadingMore}
                  >
                    Load more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
