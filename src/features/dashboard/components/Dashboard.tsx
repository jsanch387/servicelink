'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

import { IconButton } from '@/components/shared';
import { useDashboardSidebarCollapsed } from '../hooks/useDashboardSidebarCollapsed';
import type { DashboardProps } from '../types/dashboard';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';

export const Dashboard: React.FC<DashboardProps> = ({
  children,
  isOnboardingCompleted = false,
  showMembershipsNav = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { collapsed, setCollapsed } = useDashboardSidebarCollapsed();
  const pathname = usePathname();

  const noHeaderRoutes = ['/dashboard/business-profile'];
  const showHeader = !noHeaderRoutes.includes(pathname);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '[') return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }
      event.preventDefault();
      setCollapsed(current => !current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCollapsed]);

  return (
    <div className="dashboard-container min-h-screen flex bg-[var(--dashboard-bg)]">
      <DashboardSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        isOnboardingCompleted={isOnboardingCompleted}
        showMembershipsNav={showMembershipsNav}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(current => !current)}
      />
      <div className="dashboard-content flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-50 bg-[var(--dashboard-bg)] lg:z-30">
          {showHeader ? (
            <DashboardHeader
              onMenuClick={() => setSidebarOpen(open => !open)}
              sidebarOpen={sidebarOpen}
              showNotifications={isOnboardingCompleted}
            />
          ) : (
            <div className="lg:hidden bg-[var(--dashboard-bg)] border-b border-white/[0.06]">
              <div className="flex h-16 items-center px-4">
                <IconButton
                  icon={<Bars3Icon />}
                  onClick={() => setSidebarOpen(open => !open)}
                  variant="ghost"
                  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
};
