/**
 * DashboardContent - Main dashboard component with clean, organized layout
 * Uses modular components for different sections of the dashboard
 */

'use client';

import { Button } from '@/components/shared';
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
  const { businessProfile, slugData, analytics } = dashboardData;

  // Constants
  const APP_DOMAIN = 'myservicelink.app';
  const profileViews = 0; // TODO: Add profile views when analytics are implemented

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
              : `Let's get your profile ready to go live, ${businessProfile.business_name}.`}
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
            <div className="bg-neutral-800 p-4 sm:p-6 lg:p-8 rounded-2xl border-2 border-orange-500/30 shadow-xl">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
                Create Your Public Link
              </h2>
              <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                Your profile is ready, but you need to create a public link
                first.
              </p>
              <Button
                onClick={() => (window.location.href = '/dashboard/settings')}
                variant="primary"
                size="lg"
                fullWidth
              >
                Create Your Link Now
              </Button>
            </div>
          )}

          {/* Secondary Section: Analytics and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Analytics Card - Only show if user has a slug */}
            {slugData?.hasSlug && (
              <PerformanceCard
                profileViews={profileViews}
                profileCompleteness={analytics.profileCompleteness}
                servicesCount={analytics.servicesCount}
                imagesCount={analytics.imagesCount}
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
