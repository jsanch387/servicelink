/**
 * QuickActionsCard - Shortcuts related to your booking link
 */

'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { dashboardCardButtonClass } from '../utils/dashboardCardStyles';
import { DashboardGlassCard } from './DashboardGlassCard';

export const QuickActionsCard: React.FC = () => {
  return (
    <DashboardGlassCard>
      <p className="text-sm text-zinc-400 mb-3">Shortcuts</p>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Button
          href={`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=view`}
          variant="ghost"
          fullWidth
          className={`justify-start ${dashboardCardButtonClass}`}
          icon={<EyeIcon className="h-4 w-4 text-zinc-400" aria-hidden />}
        >
          View booking link
        </Button>
        <Button
          href={`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit`}
          variant="ghost"
          fullWidth
          className={`justify-start ${dashboardCardButtonClass}`}
          icon={
            <PencilSquareIcon className="h-4 w-4 text-zinc-400" aria-hidden />
          }
        >
          Edit booking link
        </Button>
      </div>
    </DashboardGlassCard>
  );
};

export default QuickActionsCard;
