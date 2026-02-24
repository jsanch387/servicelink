/**
 * PerformanceCard - Profile views and last viewed in a glass morphism card
 */

import { GlassCard } from '@/components/shared';
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
      <GlassCard
        padding="md"
        rounded="rounded-2xl"
        showBlur={false}
        className="h-full"
      >
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10" />
            <div className="h-5 bg-white/10 rounded w-32" />
          </div>
          <div className="h-12 bg-white/10 rounded w-20 mb-2" />
          <div className="h-4 bg-white/10 rounded w-24 mb-4" />
          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.08]">
            <div className="h-4 w-4 bg-white/10 rounded" />
            <div className="h-4 bg-white/10 rounded w-28" />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Profile Views
        </h3>
      </div>

      <div className="flex-1">
        <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
          {profileViews.toLocaleString()}
        </p>
        <p className="text-sm text-gray-400 mb-4">Total views</p>

        {lastViewed && (
          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.08]">
            <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-400">
              Last viewed {lastViewed}
            </span>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          {profileViews > 0
            ? 'Keep sharing your link to get more views.'
            : 'Share your profile link to start getting views.'}
        </p>
      </div>
    </GlassCard>
  );
};

export default PerformanceCard;
