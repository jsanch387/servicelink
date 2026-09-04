'use client';

import { IconButton, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import React from 'react';
import type { DashboardSidebarProps } from '../types/dashboard';
import {
  getVisibleDashboardNavGroups,
  isDashboardNavItemActive,
} from '../utils/dashboardNav';
import { DashboardSidebarNavItem } from './DashboardSidebarNavItem';

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  open,
  setOpen,
  isOnboardingCompleted = false,
  showMembershipsNav = false,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const pathname = usePathname();
  const groups = getVisibleDashboardNavGroups({
    isOnboardingCompleted,
    showMembershipsNav,
  });
  const showSettings = isOnboardingCompleted;
  const settingsActive = pathname === ROUTES.DASHBOARD.SETTINGS;

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        </div>
      ) : null}

      <aside
        className={`dashboard-sidebar fixed top-0 left-0 z-50 h-screen border-r border-white/[0.06] bg-[var(--dashboard-bg)] transition-[transform,width] duration-300 ease-out lg:z-auto lg:translate-x-0 ${
          open
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none lg:pointer-events-auto'
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-0 h-48 w-48 rounded-full bg-white/[0.04] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        <div className="relative flex h-full flex-col pb-[max(5rem,env(safe-area-inset-bottom))] lg:pb-3">
          <div
            className={`relative flex h-16 shrink-0 items-center justify-between px-5 ${
              collapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
          >
            <div className={collapsed ? 'lg:hidden' : undefined}>
              <Logo size="md" variant="full" href={ROUTES.DASHBOARD.MAIN} />
            </div>
            {collapsed ? (
              <div className="hidden lg:flex">
                <Logo size="md" variant="logo" href={ROUTES.DASHBOARD.MAIN} />
              </div>
            ) : null}
            {onToggleCollapsed ? (
              <IconButton
                icon={collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                onClick={onToggleCollapsed}
                variant="ghost"
                size="sm"
                className={`hidden lg:inline-flex text-zinc-500 hover:text-white ${
                  collapsed
                    ? 'absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border border-white/[0.08] bg-[#161616] shadow-[0_8px_20px_rgba(0,0,0,0.35)]'
                    : ''
                }`}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              />
            ) : null}
            <IconButton
              icon={<XMarkIcon />}
              onClick={() => setOpen(false)}
              variant="ghost"
              className="lg:hidden"
              aria-label="Close sidebar"
            />
          </div>

          <nav
            className={`min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3 scrollbar-dark ${
              collapsed ? 'lg:px-2' : ''
            }`}
          >
            {groups.map(group => (
              <div key={group.id} className="space-y-1">
                {group.label ? (
                  <>
                    <p
                      className={`px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600 ${
                        collapsed ? 'lg:hidden' : ''
                      }`}
                    >
                      {group.label}
                    </p>
                    {collapsed ? (
                      <div
                        className="mx-auto hidden h-px w-6 bg-white/[0.06] lg:block"
                        aria-hidden
                      />
                    ) : null}
                  </>
                ) : null}
                {group.items.map(item => (
                  <DashboardSidebarNavItem
                    key={item.name}
                    name={item.name}
                    href={item.href}
                    icon={item.icon}
                    isActive={isDashboardNavItemActive(pathname, item)}
                    collapsed={collapsed}
                    onNavigate={() => setOpen(false)}
                    badge={item.badge}
                  />
                ))}
              </div>
            ))}
          </nav>

          <div
            className={`flex shrink-0 flex-col gap-1 border-t border-white/[0.06] px-3 pt-2 ${
              collapsed ? 'lg:px-2' : ''
            }`}
          >
            {showSettings ? (
              <DashboardSidebarNavItem
                name="Settings"
                href={ROUTES.DASHBOARD.SETTINGS}
                icon={AdjustmentsHorizontalIcon}
                isActive={settingsActive}
                collapsed={collapsed}
                onNavigate={() => setOpen(false)}
              />
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
};
