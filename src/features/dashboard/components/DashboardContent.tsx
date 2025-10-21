/**
 * DashboardContent - Main dashboard component with clean, organized layout
 * Uses modular components for different sections of the dashboard
 */

'use client';

import { Button } from '@/components/shared';
import { useAnalytics } from '@/features/analytics';
import {
  LinkSharingCard,
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
}

interface DashboardContentProps {
  dashboardData: DashboardData;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  dashboardData,
}) => {
  const { businessProfile, slugData } = dashboardData;

  // Use analytics hook to fetch real-time data
  const { dashboardAnalytics, loading: analyticsLoading } = useAnalytics(
    businessProfile.id
  );

  // Constants
  const APP_DOMAIN = 'myservicelink.app';

  return (
    <main className="flex-1 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-neutral-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-2 tracking-tight">
            Welcome to your <span className="text-orange-400">Dashboard</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 font-light">
            {slugData?.hasSlug
              ? `Everything looks great, ${businessProfile.business_name}. Start sharing your ServiceLink!`
              : `Your profile is ready, ${businessProfile.business_name}! Now create your public link to start getting customers.`}
          </p>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="space-y-6 sm:space-y-8">
          {/* Primary Focus: Link Sharing */}
          {slugData?.hasSlug ? (
            <LinkSharingCard
              fullLink={slugData.fullLink || ''}
              slug={slugData.slug || ''}
              appDomain={APP_DOMAIN}
            />
          ) : (
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-400/5 p-6 sm:p-8 lg:p-10 rounded-2xl border-2 border-orange-400/40 shadow-lg">
              {/* Header with icon and emphasis */}
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-400/30 flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      Create Your Public Link
                    </h2>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded border border-orange-400/30">
                      Required
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Your profile is ready, but you need a public link to start
                    sharing with customers.
                  </p>
                </div>
              </div>

              {/* Benefits section */}
              <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Why you need this link:
                </h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    Share your profile with customers via text, email, or social
                    media
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    Get professional business inquiries and leads
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    Showcase your services and portfolio to potential clients
                  </li>
                </ul>
              </div>

              {/* Call to action */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  onClick={() => (window.location.href = '/dashboard/settings')}
                  variant="primary"
                  size="lg"
                  className="flex-1 sm:flex-none sm:min-w-[200px]"
                >
                  Create Your Link Now
                </Button>
                <div className="text-center sm:text-left">
                  <p className="text-gray-400 text-sm">
                    Takes less than 30 seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Section: Analytics and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Analytics Card - Only show if user has a slug */}
            {slugData?.hasSlug && (
              <PerformanceCard
                profileViews={dashboardAnalytics?.profileViews || 0}
                lastViewed={dashboardAnalytics?.lastViewedFormatted}
                loading={analyticsLoading}
              />
            )}

            {/* Quick Actions Card */}
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardContent;
