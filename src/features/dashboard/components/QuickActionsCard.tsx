/**
 * QuickActionsCard - Shortcuts related to your booking link
 */

'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useNewAppointmentAction } from '@/features/availability/booking/dashboard/hooks/useNewAppointmentAction';
import {
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { dashboardCardButtonClass } from '../utils/dashboardCardStyles';
import { DashboardGlassCard } from './DashboardGlassCard';

interface QuickActionsCardProps {
  hasPublicPageSlug: boolean;
  atFreeBookingCap: boolean;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  hasPublicPageSlug,
  atFreeBookingCap,
}) => {
  const newAppointment = useNewAppointmentAction({
    hasPublicPageSlug,
    atFreeBookingCap,
  });

  return (
    <DashboardGlassCard>
      <p className="text-sm text-zinc-400 mb-3">Shortcuts</p>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Button
          href={newAppointment.enabled ? newAppointment.href : undefined}
          onClick={
            newAppointment.enabled ? undefined : newAppointment.onBlockedClick
          }
          variant="ghost"
          fullWidth
          className={`justify-start ${dashboardCardButtonClass}`}
          icon={<PlusIcon className="h-4 w-4 text-zinc-400" aria-hidden />}
          title={newAppointment.title}
          aria-label={newAppointment.ariaLabel}
        >
          New appointment
        </Button>
        {newAppointment.notice ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs leading-relaxed text-zinc-300"
          >
            <p>{newAppointment.notice}</p>
            {atFreeBookingCap ? (
              <a
                href={ROUTES.DASHBOARD.UPGRADE}
                className="mt-1.5 inline-flex cursor-pointer text-xs font-semibold text-white underline-offset-2 hover:underline"
              >
                Upgrade to Pro
              </a>
            ) : null}
          </div>
        ) : null}
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
