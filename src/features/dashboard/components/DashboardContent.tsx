/**
 * DashboardContent - Main dashboard with glass morphism cards
 * Link sharing, profile views, pending requests, quick actions
 */

'use client';

import { Button, GlassCard } from '@/components/shared';
import { useAnalytics } from '@/features/analytics';
import {
  LinkSharingCard,
  PendingRequestsCard,
  PerformanceCard,
  QuickActionsCard,
} from '@/features/dashboard';
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
    <main className="flex-1 pt-6 pb-24 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen">
      <div className="max-w-6xl mx-auto">
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

        <div className="space-y-6 sm:space-y-8">
          {/* Link card or Create link CTA */}
          {slugData?.hasSlug ? (
            <LinkSharingCard
              fullLink={slugData.fullLink || ''}
              slug={slugData.slug || ''}
              appDomain={APP_DOMAIN}
            />
          ) : (
            <GlassCard
              padding="lg"
              rounded="rounded-2xl"
              blurColor="bg-orange-500"
              showBlur={true}
              className="text-left"
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                Create your link
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Share it anywhere—people who click it see your profile.
              </p>
              <Button
                href="/dashboard/settings"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Create your link
              </Button>
            </GlassCard>
          )}

          {/* Stats + actions grid: Profile views (if slug), Pending requests, Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {slugData?.hasSlug && (
              <PerformanceCard
                profileViews={dashboardAnalytics?.profileViews ?? 0}
                lastViewed={dashboardAnalytics?.lastViewedFormatted}
                loading={analyticsLoading}
              />
            )}
            <PendingRequestsCard
              pendingCount={dashboardData.pendingRequestsCount}
            />
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
