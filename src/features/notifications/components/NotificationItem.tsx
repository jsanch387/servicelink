'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import type { NotificationDisplay } from '../types/notification';

interface NotificationItemProps {
  notification: NotificationDisplay;
  // eslint-disable-next-line no-unused-vars -- param name is for type documentation
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;

  const handleClick = () => {
    onMarkAsRead(notification.id);
    onClose();
  };

  return (
    <Link
      href={ROUTES.DASHBOARD.BOOKINGS}
      onClick={handleClick}
      className={`block px-4 py-3 text-left transition-colors hover:bg-neutral-700/50 ${
        isUnread ? 'bg-neutral-800/80' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {isUnread && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white"
            aria-hidden
          />
        )}
        <div className={`min-w-0 flex-1 ${!isUnread ? 'pl-5' : ''}`}>
          <p className="text-sm font-medium text-white">{notification.title}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
