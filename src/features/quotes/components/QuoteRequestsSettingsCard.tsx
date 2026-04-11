'use client';

import { Button, CrownIcon, GlassCard, Switch } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ProFeatureLabel } from '@/features/dashboard';
import { InboxIcon } from '@heroicons/react/24/outline';
import React from 'react';

export interface QuoteRequestsSettingsCardProps {
  /** When true, quote requests are a Pro-only feature — toggle is disabled and upgrade CTA is shown. */
  isFreeTier?: boolean;
  /** From `business_profiles.accept_quote_req`. */
  acceptQuoteRequests?: boolean;
}

/**
 * Dashboard card: opt-in copy for public “Request quote” on profile (Pro).
 * Toggle reflects DB when locked (free tier); Pro users use Quotes → Requests to change.
 */
export const QuoteRequestsSettingsCard: React.FC<
  QuoteRequestsSettingsCardProps
> = ({ isFreeTier = false, acceptQuoteRequests = false }) => {
  const locked = isFreeTier;

  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-violet-500"
      showBlur={true}
      className={`flex h-full flex-col ${locked ? 'opacity-95' : ''}`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2">
            <InboxIcon
              className="h-5 w-5 text-violet-400 sm:h-6 sm:w-6"
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                Quote requests
              </h3>
              {isFreeTier ? <ProFeatureLabel /> : null}
            </div>
          </div>
        </div>
        <Switch
          checked={acceptQuoteRequests}
          onCheckedChange={() => {}}
          disabled={locked}
          size="md"
          aria-label={
            locked
              ? 'Quote requests — upgrade to Pro to enable'
              : 'Accept quote requests on your public profile'
          }
          className="shrink-0"
        />
      </div>

      <p className="mb-4 flex-1 text-sm text-gray-400">
        Puts <span className="text-gray-300">Request quote</span> on your
        booking page. They ask for a price; you send the quote from Quotes.
      </p>

      {locked ? (
        <Button
          href={ROUTES.DASHBOARD.UPGRADE}
          variant="inverse"
          size="md"
          fullWidth
          icon={<CrownIcon className="h-4 w-4" />}
        >
          Upgrade to Pro
        </Button>
      ) : null}
    </GlassCard>
  );
};
