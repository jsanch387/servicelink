/**
 * QuickActionsCard - Shortcuts related to your booking link
 */

'use client';

import { ROUTES } from '@/constants/routes';
import { DashboardGlassCard } from './DashboardGlassCard';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

const shortcutLinkClass =
  'flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 lg:py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white';

export const QuickActionsCard: React.FC = () => {
  return (
    <DashboardGlassCard>
      <p className="text-sm text-zinc-400 mb-3">Shortcuts</p>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Link
          href={`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=view`}
          className={shortcutLinkClass}
        >
          <EyeIcon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
          View booking link
        </Link>
        <Link
          href={`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?mode=edit`}
          className={shortcutLinkClass}
        >
          <PencilSquareIcon
            className="h-4 w-4 shrink-0 text-zinc-500"
            aria-hidden
          />
          Edit booking link
        </Link>
      </div>
    </DashboardGlassCard>
  );
};

export default QuickActionsCard;
