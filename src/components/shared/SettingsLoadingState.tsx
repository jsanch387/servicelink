/**
 * SettingsLoadingState - Loading component for settings page
 * Shows skeleton loading while fetching settings data
 */

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const SettingsLoadingState: React.FC = () => {
  return (
    <main className="flex-1 py-10 px-4 sm:px-8 lg:px-12 overflow-y-auto bg-neutral-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header Section Skeleton */}
        <div className="mb-12 text-center">
          <div className="h-12 bg-neutral-800 rounded-lg mb-4 mx-auto max-w-md animate-pulse" />
          <div className="h-6 bg-neutral-800 rounded-lg mb-2 mx-auto max-w-lg animate-pulse" />
          <div className="h-5 bg-neutral-800 rounded-lg mx-auto max-w-2xl animate-pulse" />
        </div>

        {/* Main Settings Card Skeleton */}
        <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 shadow-2xl">
          {/* Card Header Skeleton */}
          <div className="mb-8 border-b border-neutral-700 pb-4">
            <div className="h-8 bg-neutral-700 rounded-lg w-64 animate-pulse" />
          </div>

          {/* Status Banner Skeleton */}
          <div className="p-4 rounded-xl mb-6 bg-neutral-700 animate-pulse">
            <div className="h-6 w-6 bg-neutral-600 rounded-full mb-2" />
            <div className="h-4 bg-neutral-600 rounded w-3/4 animate-pulse" />
          </div>

          {/* Input Section Skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-neutral-700 rounded w-32 animate-pulse" />
            <div className="flex rounded-xl overflow-hidden border border-neutral-600">
              <div className="py-3 px-4 bg-neutral-900 w-32 h-12 animate-pulse" />
              <div className="flex-1 px-4 py-3 bg-neutral-700 h-12 animate-pulse" />
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="flex gap-4 pt-6 mt-4 border-t border-neutral-700">
            <div className="flex-1 h-12 bg-neutral-700 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="mt-8 flex justify-center">
          <LoadingSpinner size="lg" text="Loading your settings..." />
        </div>
      </div>
    </main>
  );
};

export default SettingsLoadingState;
