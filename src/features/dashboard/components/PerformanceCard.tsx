/**
 * PerformanceCard - Shows profile analytics with views and last viewed time
 * Displays profile views count and last viewed timestamp
 */

import { ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface PerformanceCardProps {
  profileViews?: number;
  lastViewed?: string;
  loading?: boolean;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  profileViews = 0,
  lastViewed,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-neutral-800 p-4 sm:p-5 lg:p-6 rounded-2xl border border-neutral-700  h-full">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 bg-neutral-700 rounded mr-2"></div>
            <div className="h-6 bg-neutral-700 rounded w-32"></div>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-16 bg-neutral-700 rounded w-24 mx-auto mb-2"></div>
              <div className="h-4 bg-neutral-700 rounded w-20 mx-auto"></div>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2 border-t border-neutral-700">
              <div className="h-4 w-4 bg-neutral-700 rounded"></div>
              <div className="h-4 bg-neutral-700 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 p-4 sm:p-5 lg:p-6 rounded-2xl border border-neutral-700  h-full">
      {/* Header */}
      <div className="flex items-center mb-4 border-b border-neutral-700 pb-4">
        <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
          <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 flex-shrink-0" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white ml-3">
          Profile Analytics
        </h3>
      </div>

      <div className="space-y-4">
        {/* Profile Views */}
        <div className="text-center">
          <p className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-orange-400 mb-2">
            {profileViews.toLocaleString()}
          </p>
          <p className="text-sm sm:text-base text-gray-400">Total Views</p>
        </div>

        {/* Last Viewed */}
        {lastViewed && (
          <div className="flex items-center justify-center space-x-2 pt-2 border-t border-neutral-700">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Last viewed: {lastViewed}
            </span>
          </div>
        )}

        {/* Motivational Message */}
        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-orange-300 text-sm text-center">
            {profileViews > 0
              ? `Great! Your profile is getting attention. Keep sharing!`
              : `Share your profile link to start getting views!`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;
