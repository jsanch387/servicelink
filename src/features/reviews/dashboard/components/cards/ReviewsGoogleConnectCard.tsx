'use client';

import { Button, GoogleIcon } from '@/components/shared';
import { DashboardGlassCard } from '@/features/dashboard';
import { GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE } from '@/features/reviews/google-connect/googleReviewPullCooldown';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React from 'react';
import {
  GOOGLE_CONNECT_CONNECTED_LEAD,
  GOOGLE_CONNECT_CONNECTED_TITLE,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_REFRESH_CTA,
  GOOGLE_CONNECT_PULLED_LEAD,
  GOOGLE_CONNECT_TITLE,
} from '../../copy/googleConnectCopy';

type ReviewsGoogleConnectCardProps = {
  connected?: boolean;
  importedCount?: number | null;
  connectLoading?: boolean;
  pullLoading?: boolean;
  refreshCoolingDown?: boolean;
  connectError?: string | null;
  onConnect: () => void;
  onPullReviews?: () => void;
};

export const ReviewsGoogleConnectCard: React.FC<
  ReviewsGoogleConnectCardProps
> = ({
  connected = false,
  importedCount = null,
  connectLoading = false,
  pullLoading = false,
  refreshCoolingDown = false,
  connectError = null,
  onConnect,
  onPullReviews,
}) => {
  const title = connected
    ? GOOGLE_CONNECT_CONNECTED_TITLE
    : GOOGLE_CONNECT_TITLE;
  const lead = !connected
    ? GOOGLE_CONNECT_LEAD
    : importedCount !== null
      ? GOOGLE_CONNECT_PULLED_LEAD(importedCount)
      : GOOGLE_CONNECT_CONNECTED_LEAD;

  const action = !connected ? (
    <Button
      type="button"
      variant="inverse"
      size="sm"
      className="w-full sm:w-auto"
      icon={<GoogleIcon className="h-4 w-4" />}
      loading={connectLoading}
      disabled={connectLoading}
      onClick={onConnect}
    >
      {GOOGLE_CONNECT_CTA}
    </Button>
  ) : onPullReviews ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full sm:w-auto"
      icon={<ArrowPathIcon className="h-4 w-4" aria-hidden />}
      loading={pullLoading}
      disabled={pullLoading || refreshCoolingDown}
      title={
        refreshCoolingDown ? GOOGLE_REVIEW_PULL_COOLDOWN_MESSAGE : undefined
      }
      onClick={onPullReviews}
    >
      {GOOGLE_CONNECT_REFRESH_CTA}
    </Button>
  ) : null;

  return (
    <DashboardGlassCard
      fillGridCell={false}
      padding="md"
      className="flex h-full w-full flex-col"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-white/15"
            aria-hidden
          >
            <GoogleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-tight tracking-tight text-white sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-zinc-400">{lead}</p>
            {connectError ? (
              <p
                className="mt-3 text-xs leading-relaxed text-red-300"
                role="alert"
              >
                {connectError}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="mt-auto shrink-0 pt-1">{action}</div> : null}
      </div>
    </DashboardGlassCard>
  );
};
