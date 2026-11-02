'use client';

import { Button, GoogleIcon } from '@/components/shared';
import { DashboardGlassCard } from '@/features/dashboard';
import React from 'react';
import {
  GOOGLE_CONNECT_CONNECTED_LEAD,
  GOOGLE_CONNECT_CONNECTED_STATUS,
  GOOGLE_CONNECT_CONNECTED_TITLE,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_TITLE,
} from '../../copy/googleConnectCopy';

type ReviewsGoogleConnectCardProps = {
  connected?: boolean;
  connectLoading?: boolean;
  connectError?: string | null;
  onConnect: () => void;
};

export const ReviewsGoogleConnectCard: React.FC<
  ReviewsGoogleConnectCardProps
> = ({
  connected = false,
  connectLoading = false,
  connectError = null,
  onConnect,
}) => {
  const title = connected
    ? GOOGLE_CONNECT_CONNECTED_TITLE
    : GOOGLE_CONNECT_TITLE;
  const lead = connected ? GOOGLE_CONNECT_CONNECTED_LEAD : GOOGLE_CONNECT_LEAD;

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
  ) : (
    <span
      className="inline-flex h-9 min-h-9 w-full cursor-default select-none items-center justify-center gap-2 rounded-lg bg-white px-3.5 text-sm font-medium text-black sm:w-auto"
      role="status"
      aria-label={GOOGLE_CONNECT_CONNECTED_STATUS}
    >
      <GoogleIcon className="h-4 w-4 shrink-0" />
      {GOOGLE_CONNECT_CONNECTED_STATUS}
    </span>
  );

  return (
    <DashboardGlassCard
      fillGridCell={false}
      padding="md"
      className="flex h-full w-full flex-col"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
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
          {connected ? (
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white"
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-black"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5.5 12.5 9.5 16.5 18.5 7.5"
                  stroke="currentColor"
                  strokeWidth="3.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
        </div>
        {action ? <div className="mt-auto shrink-0 pt-1">{action}</div> : null}
      </div>
    </DashboardGlassCard>
  );
};
