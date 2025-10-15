'use client';

import { IconButton, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth';
import {
  ArrowRightOnRectangleIcon,
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

  // Filter navigation items based on onboarding completion
  const navigation = allNavigationItems.filter(
    item => !item.requiresOnboarding || isOnboardingCompleted
  );

  const handleLogout = async () => {
    try {
      const result = await signOut();

      if (result.success) {
        // Redirect to home page after successful logout
        router.push('/');
      } else if (result.error) {
        console.error('Logout failed:', result.error);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Logout failed:', error);
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
        className={`dashboard-sidebar fixed lg:fixed top-0 left-0 z-50 lg:z-auto w-64 h-screen bg-neutral-800 border-r border-neutral-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
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
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-white'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-neutral-700 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
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
