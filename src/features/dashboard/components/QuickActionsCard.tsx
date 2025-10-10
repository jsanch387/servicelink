/**
 * QuickActionsCard - Provides quick access to profile management actions
 * Contains buttons for viewing and editing the business profile
 */

'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const QuickActionsCard: React.FC = () => {
  return (
    <div className="bg-neutral-800 p-4 sm:p-5 lg:p-6 rounded-2xl border border-neutral-700 h-full flex flex-col">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center space-x-2">
        <PencilIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" />
        <span>Quick Profile Actions</span>
      </h3>

      <div className="space-y-2 sm:space-y-3 mt-auto">
        <Button
          variant="outline"
          fullWidth
          icon={<EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
          onClick={() =>
            (window.location.href = `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=view`)
          }
        >
          View Live Profile
        </Button>
        <Button
          variant="secondary"
          fullWidth
          icon={<PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
          onClick={() =>
            (window.location.href = `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit`)
          }
        >
          Edit Business Details
        </Button>
      </div>
    </div>
  );
};

export default QuickActionsCard;
