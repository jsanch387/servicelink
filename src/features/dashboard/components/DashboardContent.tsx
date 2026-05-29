/**
 * DashboardContent - Main dashboard with glass morphism cards
 * Link sharing, profile views, pending requests, quick actions
 */

'use client';

import { Button, CrownIcon } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  DEFAULT_ANALYTICS_PERIOD,
  useAnalytics,
  type DashboardLinkViewsPeriod,
} from '@/features/analytics';
import {
  CreateLinkCard,
  IosAppLiveBanner,
  LinkSharingCard,
  PendingRequestsCard,
  PerformanceCard,
  QuickActionsCard,
  UpcomingBookingsCard,
} from '@/features/dashboard';
import { FREE_BOOKINGS_LIMIT } from '@/features/pricing';
import { ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface DashboardData {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  slugData: {
    hasSlug: boolean;
    slug?: string;
    fullLink?: string;
    createdAt?: string;
  } | null;
  analytics: {
    servicesCount: number;
    imagesCount: number;
    profileCompleteness: number;
  };
  nextSteps: {
    needsSlug: boolean;
    needsServices: boolean;
    needsImages: boolean;
    needsBio: boolean;
    readyToShare: boolean;
  };
  pendingRequestsCount: number;
  legacyRequestBookingEnabled: boolean;
  useAvailabilityBooking: boolean;
  upcomingBookingsCount: number;
  /** Free plan: public bookings used toward lifetime cap (shown on dashboard + from `free_bookings_count`). */
  freeBookingsUsed?: number;
  /** When true, show free-tier upgrade CTA. */
  isFreeTier?: boolean;
}

interface DashboardContentProps {
  dashboardData: DashboardData;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  dashboardData,
}) => {
  const { businessProfile, slugData } = dashboardData;
  const freeBookingsUsed = dashboardData.freeBookingsUsed ?? 0;
  const atFreeBookingCap =
    dashboardData.isFreeTier === true &&
    freeBookingsUsed >= FREE_BOOKINGS_LIMIT;

  const isFreeTier = dashboardData.isFreeTier === true;

  const [linkViewsPeriod, setLinkViewsPeriod] =
    useState<DashboardLinkViewsPeriod>(DEFAULT_ANALYTICS_PERIOD);

  useEffect(() => {
    if (isFreeTier && linkViewsPeriod !== '24h') {
      setLinkViewsPeriod('24h');
    }
  }, [isFreeTier, linkViewsPeriod]);

  const { dashboardAnalytics, loading: analyticsLoading } = useAnalytics(
    businessProfile.id,
    linkViewsPeriod
  );

  return (
    <main className="flex-1 pt-5 pb-24 sm:pt-6 sm:pb-8 lg:pt-8 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
            {businessProfile.business_name}
          </h1>
          {!slugData?.hasSlug ? (
            <p className="text-sm text-zinc-500 mt-0.5">
              Set up your booking link to get started
            </p>
          ) : null}
        </div>

        <IosAppLiveBanner />

        {dashboardData.isFreeTier ? (
          <div
            className={`mb-5 sm:mb-6 rounded-2xl border px-4 py-3 ${
              atFreeBookingCap
                ? 'border-amber-500/30 bg-amber-500/[0.07]'
                : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm leading-snug text-zinc-400">
                {atFreeBookingCap ? (
                  <>
                    <span className="font-medium text-zinc-200">
                      You&apos;ve used all {FREE_BOOKINGS_LIMIT} free bookings
                      on your plan.
                    </span>{' '}
                    Upgrade to Pro for unlimited bookings and the rest of our
                    Pro tools.
                  </>
                ) : (
                  <>
                    You&apos;re on the Free plan.{' '}
                    <span className="text-zinc-200">
                      Upgrade to Pro for unlimited bookings and more.
                    </span>
                  </>
                )}
              </p>
              <Link
                href={ROUTES.DASHBOARD.UPGRADE}
                className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  atFreeBookingCap
                    ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                    : 'bg-white text-zinc-950 hover:bg-zinc-200'
                }`}
              >
                <CrownIcon className="h-4 w-4 shrink-0" aria-hidden />
                Upgrade to Pro
              </Link>
            </div>
          </div>
        ) : null}

        <div className="space-y-5 sm:space-y-6 w-full min-w-0">
          {/* Link card or Create link CTA */}
          {slugData?.hasSlug ? (
            <LinkSharingCard fullLink={slugData.fullLink || ''} />
          ) : (
            <CreateLinkCard businessProfileId={businessProfile.id} />
          )}

          {/* Nudge: availability booking is off – set schedule so customers can book */}
          {!dashboardData.useAvailabilityBooking && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <ClockIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    Online booking is off
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                    Set your schedule so customers can pick a time from your
                    calendar.
                  </p>
                </div>
              </div>
              <Button
                href={ROUTES.DASHBOARD.AVAILABILITY}
                variant="inverse"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
              >
                Set availability
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 min-w-0">
            {slugData?.hasSlug && (
              <PerformanceCard
                views={dashboardAnalytics?.views ?? 0}
                period={linkViewsPeriod}
                onPeriodChange={setLinkViewsPeriod}
                lastViewed={dashboardAnalytics?.lastViewedFormatted}
                loading={analyticsLoading}
                isFreeTier={isFreeTier}
              />
            )}
            {dashboardData.useAvailabilityBooking ||
            !dashboardData.legacyRequestBookingEnabled ? (
              <UpcomingBookingsCard
                upcomingCount={dashboardData.upcomingBookingsCount}
              />
            ) : (
              <PendingRequestsCard
                pendingCount={dashboardData.pendingRequestsCount}
              />
            )}
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
