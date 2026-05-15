/**
 * DashboardContent - Main dashboard with glass morphism cards
 * Link sharing, profile views, pending requests, quick actions
 */

'use client';

import { Button, CrownIcon, GlassCard, Switch, WarningCallout } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAnalytics } from '@/features/analytics';
import {
  CreateLinkCard,
  LinkSharingCard,
  PendingRequestsCard,
  PerformanceCard,
  QuickActionsCard,
  UpcomingBookingsCard,
} from '@/features/dashboard';
import { FREE_BOOKINGS_LIMIT } from '@/features/pricing';
import { QuoteRequestsSettingsCard } from '@/features/quotes';
import { ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

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
  /** When true, show free-tier upgrade CTA (and quote card in grid). */
  isFreeTier?: boolean;
  /** From `business_profiles.accept_quote_req` (quote-requests card when free). */
  acceptQuoteRequests?: boolean;
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

  const { dashboardAnalytics, loading: analyticsLoading } = useAnalytics(
    businessProfile.id
  );

  const APP_DOMAIN = 'myservicelink.app';

  return (
    <main className="flex-1 pt-6 pb-24 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Welcome, {businessProfile.business_name}
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            {slugData?.hasSlug
              ? 'Manage your link, views, and bookings in one place.'
              : 'Create your public link to start sharing with customers.'}
          </p>
        </div>

        {dashboardData.isFreeTier ? (
          <div
            className={`mb-6 sm:mb-8 rounded-xl border px-4 py-3 sm:px-5 sm:py-3.5 ${
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
                      You&apos;ve used all {FREE_BOOKINGS_LIMIT} free bookings on
                      your plan.
                    </span>{' '}
                    Upgrade to Pro for unlimited bookings and the rest of our Pro
                    tools.
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

        <div className="space-y-6 sm:space-y-8 w-full min-w-0">
          {/* Link card or Create link CTA */}
          {slugData?.hasSlug ? (
            <LinkSharingCard
              fullLink={slugData.fullLink || ''}
              slug={slugData.slug || ''}
              appDomain={APP_DOMAIN}
            />
          ) : (
            <CreateLinkCard businessProfileId={businessProfile.id} />
          )}

          {/* Nudge: availability booking is off – set schedule so customers can book */}
          {!dashboardData.useAvailabilityBooking && (
            <GlassCard
              padding="none"
              rounded="rounded-2xl"
              blurColor="bg-amber-500"
              showBlur={true}
              className="w-full min-w-0 p-4 text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-2 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  Availability booking is off
                </h2>
                <Switch
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled
                  size="md"
                  aria-label="Availability booking is off"
                  className="flex-shrink-0"
                />
              </div>
              <div className="mt-3 mb-4 min-w-0">
                <WarningCallout>
                  Set your schedule and turn on availability so customers can
                  book appointments directly. Until then, they can&apos;t pick a
                  time from your calendar.
                </WarningCallout>
              </div>
              <Button
                href={ROUTES.DASHBOARD.AVAILABILITY}
                variant="inverse"
                className="w-full sm:w-auto"
                icon={<ClockIcon className="h-4 w-4" />}
              >
                Set availability
              </Button>
            </GlassCard>
          )}

          {/* Stats + actions grid: Profile views (if slug), V1 pending requests or V2 upcoming, Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 min-w-0">
            {slugData?.hasSlug && (
              <PerformanceCard
                profileViews={dashboardAnalytics?.profileViews ?? 0}
                lastViewed={dashboardAnalytics?.lastViewedFormatted}
                loading={analyticsLoading}
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
            {dashboardData.isFreeTier ? (
              <QuoteRequestsSettingsCard
                isFreeTier
                acceptQuoteRequests={dashboardData.acceptQuoteRequests ?? false}
              />
            ) : null}
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
