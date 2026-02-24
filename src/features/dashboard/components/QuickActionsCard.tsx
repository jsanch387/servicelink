/**
 * QuickActionsCard - Quick profile actions in a glass morphism card
 */

'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const QuickActionsCard: React.FC = () => {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <PencilSquareIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Quick Actions
        </h3>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 mt-auto">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          href={`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=view`}
          icon={<EyeIcon className="h-4 w-4" />}
        >
          View Your Profile
        </Button>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          href={`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit`}
          icon={<PencilSquareIcon className="h-4 w-4" />}
        >
          Edit Business Details
        </Button>
      </div>
    </GlassCard>
  );
};

export default QuickActionsCard;
