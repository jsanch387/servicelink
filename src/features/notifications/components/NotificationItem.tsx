'use client';

import {
  BellIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import type {
  NotificationDisplay,
  NotificationType,
} from '../types/notification';
import { formatNotificationTime } from '../utils/formatNotificationTime';
import { notificationHref } from '../utils/notificationHref';

const TYPE_ICONS: Record<
  NotificationType,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  booking_request: CalendarDaysIcon,
  availability_booking: CalendarDaysIcon,
  booking_reminder: ClockIcon,
  quote_request: DocumentTextIcon,
  quote_request_followup: DocumentTextIcon,
  review_submitted: StarIcon,
  membership_subscriber: RectangleStackIcon,
  membership_visit_needed: RectangleStackIcon,
};

interface NotificationItemProps {
  notification: NotificationDisplay;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const Icon = TYPE_ICONS[notification.type] ?? BellIcon;
  const timeLabel = formatNotificationTime(notification.createdAt);
  const body = notification.body?.trim() ?? '';

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  return (
    <Link
      href={notificationHref(notification)}
      onClick={handleClick}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-colors ${
        isUnread
          ? 'border-white/12 bg-white/[0.07] hover:bg-white/[0.11]'
          : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUnread ? 'bg-white/15 text-white' : 'bg-white/[0.08] text-zinc-400'
        }`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              isUnread
                ? 'font-semibold text-white'
                : 'font-medium text-zinc-300'
            }`}
          >
            {notification.title}
          </p>
          {isUnread ? (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500"
              aria-hidden
            />
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-zinc-500">
          {body && timeLabel ? `${body} · ${timeLabel}` : body || timeLabel}
        </p>
      </div>
    </Link>
  );
}
