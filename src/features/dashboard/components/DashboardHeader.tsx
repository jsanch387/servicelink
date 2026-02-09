'use client';

import { NotificationBell } from '@/features/notifications';
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/shared';
import type { DashboardHeaderProps } from '../types/dashboard';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
}) => {
  return (
    <header className="bg-[var(--dashboard-bg)] border-b border-[var(--dashboard-border)]">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <IconButton
          icon={<Bars3Icon />}
          onClick={onMenuClick}
          variant="ghost"
          className="lg:hidden"
          aria-label="Open sidebar"
        />

        {/* Empty space */}
        <div className="flex-1" />

        {/* Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
};
