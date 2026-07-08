'use client';

import { IconButton, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import {
  BanknotesIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  LinkIcon,
  MegaphoneIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  StarIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import type { DashboardSidebarProps } from '../types/dashboard';

const allNavigationItems = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD.MAIN,
    icon: Squares2X2Icon,
    requiresOnboarding: false,
  },
  {
    name: 'Booking link',
    href: ROUTES.DASHBOARD.BUSINESS_PROFILE,
    icon: LinkIcon,
    requiresOnboarding: true,
  },
  {
    name: 'Services',
    href: ROUTES.DASHBOARD.SERVICES,
    icon: RectangleStackIcon,
    requiresOnboarding: true,
  },
  {
    name: 'Bookings',
    href: ROUTES.DASHBOARD.BOOKINGS,
    icon: CalendarIcon,
    requiresOnboarding: true,
  },
  {
    name: 'Reviews',
    href: ROUTES.DASHBOARD.REVIEWS,
    icon: StarIcon,
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/reviews',
    isNew: true,
  },
  {
    name: 'Quotes',
    href: ROUTES.DASHBOARD.QUOTES,
    icon: ClipboardDocumentListIcon,
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/quotes',
  },
  {
    name: 'Customers',
    href: ROUTES.DASHBOARD.CUSTOMERS,
    icon: UserGroupIcon,
    requiresOnboarding: true,
  },
  {
    name: 'Payments',
    href: ROUTES.DASHBOARD.PAYMENTS,
    icon: BanknotesIcon,
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/payments',
  },
  {
    name: 'Marketing',
    href: ROUTES.DASHBOARD.MARKETING,
    icon: MegaphoneIcon,
    requiresOnboarding: true,
    activePathPrefix: '/dashboard/marketing',
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
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  open,
  setOpen,
  isOnboardingCompleted = false,
}) => {
  const pathname = usePathname();

  const navigation = allNavigationItems.filter(
    item => !item.requiresOnboarding || isOnboardingCompleted
  );
  const showSettings = isOnboardingCompleted;

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
        className={`dashboard-sidebar fixed top-0 left-0 z-50 h-screen w-64 border-r border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] transition-transform duration-300 ease-in-out lg:z-auto lg:translate-x-0 ${
          open
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none lg:pointer-events-auto'
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
              const isActive =
                'activePathPrefix' in item && item.activePathPrefix
                  ? pathname === item.href ||
                    pathname === item.activePathPrefix ||
                    pathname.startsWith(`${item.activePathPrefix}/`)
                  : pathname === item.href;
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
                  {item.isNew ? (
                    <span className="ml-2 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      New
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="mt-auto p-4 flex-shrink-0">
            {showSettings ? (
              <Link
                href={ROUTES.DASHBOARD.SETTINGS}
                onClick={() => setOpen(false)}
                className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  pathname === ROUTES.DASHBOARD.SETTINGS
                    ? 'bg-neutral-800 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                <AdjustmentsHorizontalIcon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    pathname === ROUTES.DASHBOARD.SETTINGS
                      ? 'text-gray-300'
                      : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                Settings
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};
