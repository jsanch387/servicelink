'use client';

import { NotificationBell } from '@/features/notifications';
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/shared';
import { usePathname } from 'next/navigation';
import type { DashboardHeaderProps } from '../types/dashboard';
import { getDashboardPageTitle } from '../utils/dashboardNav';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
  sidebarOpen = false,
  showNotifications = true,
}) => {
  const pathname = usePathname();
  const pageTitle = getDashboardPageTitle(pathname);

  return (
    <header className="border-b border-white/[0.06] bg-[var(--dashboard-bg)]/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <IconButton
          icon={<Bars3Icon />}
          onClick={onMenuClick}
          variant="ghost"
          className="lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        />

        {pageTitle ? (
          <p className="hidden min-w-0 truncate text-sm font-medium tracking-tight text-zinc-300 sm:block">
            {pageTitle}
          </p>
        ) : null}

        <div className="flex-1" />

        {showNotifications ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <NotificationBell />
          </div>
        ) : null}
      </div>
    </header>
  );
};
