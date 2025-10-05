'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { IconButton } from '@/components/shared';
import type { DashboardProps } from '../types/dashboard';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';

export const Dashboard: React.FC<DashboardProps> = ({
  children,
  isOnboardingCompleted = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Routes that don't need the dashboard header
  const noHeaderRoutes = ['/dashboard/business-profile'];
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <div className="dashboard-container bg-neutral-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        isOnboardingCompleted={isOnboardingCompleted}
      />
      <div className="dashboard-content flex-1 flex flex-col lg:ml-64">
        {showHeader ? (
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        ) : (
          // Minimal mobile menu for routes without header
          <div className="lg:hidden bg-neutral-800 border-b border-neutral-700">
            <div className="flex h-16 items-center px-4">
              <IconButton
                icon={<Bars3Icon />}
                onClick={() => setSidebarOpen(true)}
                variant="ghost"
                aria-label="Open sidebar"
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
