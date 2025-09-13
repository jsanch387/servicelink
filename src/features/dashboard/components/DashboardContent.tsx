'use client';

import React from 'react';
import { OnboardingFlow } from '@/features/onboarding/components/OnboardingFlow';
import { OnboardingCompleteCard } from './OnboardingCompleteCard';
import { ShareProfileCard } from './ShareProfileCard';
import { EditProfileCard } from './EditProfileCard';
import { Card } from '@/components/shared';
interface DashboardContentProps {
  businessProfile: {
    id: string;
    business_name: string;
    profile_id: string;
  };
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  businessProfile,
}) => {
  // Show completed dashboard with sharing and editing options
  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto bg-neutral-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-400">
            Your business profile is live and ready to share with customers.
          </p>
        </div>

        {/* Completion Congratulations */}
        <OnboardingCompleteCard />

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Share Profile Card */}
          <ShareProfileCard />

          {/* Edit Profile Card */}
          <EditProfileCard />
        </div>
      </div>
    </main>
  );
};
