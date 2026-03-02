'use client';

import { IconButton, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth';
import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import {
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  HomeIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import type { DashboardSidebarProps } from '../types/dashboard';

const allNavigationItems = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD.MAIN,
    icon: HomeIcon,
    requiresOnboarding: false,
  },
  {
    name: 'Business Profile',
    href: ROUTES.DASHBOARD.BUSINESS_PROFILE,
    icon: UserIcon,
    requiresOnboarding: true,
  },
  {
    name: 'Bookings',
    href: ROUTES.DASHBOARD.BOOKINGS,
    icon: CalendarIcon,
    requiresOnboarding: true,
  },
  ...(AVAILABILITY_FEATURE_ENABLED
    ? [
        {
          name: 'Availability',
          href: ROUTES.DASHBOARD.AVAILABILITY,
          icon: ClockIcon,
          requiresOnboarding: true,
        },
      ]
    : []),
  {
    name: 'Settings',
    href: ROUTES.DASHBOARD.SETTINGS,
    icon: CogIcon,
    requiresOnboarding: true,
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  open,
  setOpen,
  isOnboardingCompleted = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const navigation = allNavigationItems.filter(
    item => !item.requiresOnboarding || isOnboardingCompleted
  );

  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result.success) router.push('/');
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-neutral-900/80"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`dashboard-sidebar fixed lg:fixed top-0 left-0 z-50 lg:z-auto w-64 h-screen bg-[var(--dashboard-bg)] border-r border-[var(--dashboard-border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto pb-24 lg:pb-6">
          {/* Logo and close button */}
          <div className="flex h-16 items-center justify-between px-6">
            <Logo size="md" href="/" />
            <IconButton
              icon={<XMarkIcon />}
              onClick={() => setOpen(false)}
              variant="ghost"
              className="lg:hidden"
              aria-label="Close sidebar"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)} // Auto-hide sidebar on mobile when link is clicked
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-gray-300'
                        : 'text-gray-400 group-hover:text-white'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout - extra bottom padding keeps it above mobile browser UI */}
          <div className="mt-auto p-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-xl hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
