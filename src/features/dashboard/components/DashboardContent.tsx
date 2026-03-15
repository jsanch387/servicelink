/**
 * DashboardContent - Main dashboard with glass morphism cards
 * Link sharing, profile views, pending requests, quick actions
 */

'use client';

import { useAnalytics } from '@/features/analytics';
import {
  CreateLinkCard,
  LinkSharingCard,
  PendingRequestsCard,
  PerformanceCard,
  QuickActionsCard,
  UpcomingBookingsCard,
} from '@/features/dashboard';
import { ROUTES } from '@/constants/routes';
import { Button, GlassCard, Switch, WarningCallout } from '@/components/shared';
import { ClockIcon } from '@heroicons/react/24/outline';
import React from 'react';

/** Small crown icon for Pro CTAs (Heroicons has no crown). */
const CrownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
  </svg>
);

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
  /** Free plan: bookings used this month (0–5). Omit or leave 0 until API is ready. */
  freeBookingsUsed?: number;
  /** When true, show "Try Pro" CTA (post-onboarding invite for free users). */
  isFreeTier?: boolean;
}

interface DashboardContentProps {
  dashboardData: DashboardData;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  dashboardData,
}) => {
  const { businessProfile, slugData } = dashboardData;

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
          {dashboardData.isFreeTier && (
            <div className="mt-3">
              <Button
                href={ROUTES.DASHBOARD.UPGRADE}
                variant="ghost"
                size="xs"
                className="text-gray-400 hover:text-white border border-white/10 hover:border-white/20 text-xs font-medium"
                icon={<CrownIcon className="h-3.5 w-3.5" />}
              >
                Try Pro
              </Button>
            </div>
          )}
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
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
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
