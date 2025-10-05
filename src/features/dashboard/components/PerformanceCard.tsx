/**
 * PerformanceCard - Shows analytics and performance metrics
 * Displays profile views, completeness, and other key metrics
 */

import { EyeIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface PerformanceCardProps {
  profileViews?: number;
  profileCompleteness: number;
  servicesCount: number;
  imagesCount: number;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  profileViews = 0,
  profileCompleteness,
  servicesCount,
  imagesCount,
}) => {
  return (
    <div className="bg-neutral-800 p-4 sm:p-5 lg:p-6 rounded-2xl border border-neutral-700 shadow-xl h-full">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center space-x-2">
        <EyeIcon className="h-5 w-5 sm:h-6 w-6 text-green-400 flex-shrink-0" />
        <span>Profile Analytics</span>
      </h3>

      <div className="space-y-3 sm:space-y-4">
        {/* Profile Views */}
        <div className="flex items-end justify-between border-b border-neutral-700 pb-3 sm:pb-4">
          <div className="flex flex-col">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-green-400">
              {profileViews.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Profile Views
            </p>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 bg-neutral-700 rounded-full px-2 sm:px-3 py-1">
            Total
          </span>
        </div>

        {/* Profile Completeness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-300">
              Profile Completeness
            </span>
            <span className="text-orange-400 font-bold text-base sm:text-lg">
              {profileCompleteness}%
            </span>
          </div>
          <div className="w-full bg-neutral-600 rounded-full h-2">
            <div
              className="bg-orange-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-400">
              {servicesCount}
            </p>
            <p className="text-xs text-gray-500">Services</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-400">
              {imagesCount}
            </p>
            <p className="text-xs text-gray-500">Images</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;
