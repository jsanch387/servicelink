'use client';

import { IconButton } from '@/components/shared';
import { BellIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <IconButton
        icon={<BellIcon className="h-5 w-5" />}
        onClick={() => setOpen(prev => !prev)}
        variant="ghost"
        size="md"
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
      {open && (
        <NotificationDropdown
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          isLoading={isLoading}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
