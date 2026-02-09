'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import type { NotificationDisplay } from '../types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  notifications: NotificationDisplay[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isLoading: boolean;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading,
  onClose,
}: NotificationDropdownProps) {
  const hasUnread = notifications.some(n => !n.readAt);

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-lg border border-neutral-600 bg-neutral-800 shadow-xl"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        {hasUnread && (
          <button
            type="button"
            onClick={() => {
              onMarkAllAsRead();
            }}
            className="text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            Nothing new
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onClose={onClose}
            />
          ))
        )}
      </div>
      <div className="border-t border-neutral-700 px-4 py-2">
        <Link
          href={ROUTES.DASHBOARD.BOOKINGS}
          onClick={onClose}
          className="block text-center text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors py-2"
        >
          View all bookings
        </Link>
      </div>
    </div>
  );
}
