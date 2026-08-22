'use client';

import { Button, GoogleIcon } from '@/components/shared';
import { DashboardGlassCard } from '@/features/dashboard';
import React from 'react';
import {
  GOOGLE_CONNECT_CONNECTED_LEAD,
  GOOGLE_CONNECT_CONNECTED_TITLE,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_PULL_CTA,
  GOOGLE_CONNECT_PULLED_LEAD,
  GOOGLE_CONNECT_TITLE,
} from '../../copy/googleConnectCopy';

type ReviewsGoogleConnectCardProps = {
  connected?: boolean;
  importedCount?: number | null;
  connectLoading?: boolean;
  pullLoading?: boolean;
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

  return (
    <DashboardGlassCard fillGridCell={false} padding="md" className="w-full">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-white/15"
          aria-hidden
        >
          <GoogleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">
            {title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{lead}</p>
          {!connected ? (
            <div className="mt-4">
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
            </div>
          ) : onPullReviews ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="inverse"
                size="sm"
                className="w-full sm:w-auto"
                loading={pullLoading}
                disabled={pullLoading}
                onClick={onPullReviews}
              >
                {GOOGLE_CONNECT_PULL_CTA}
              </Button>
            </div>
          ) : null}
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
    </DashboardGlassCard>
  );
};
