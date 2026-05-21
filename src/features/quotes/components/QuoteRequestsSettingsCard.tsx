'use client';

import { Button, CrownIcon, Switch } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { DashboardGlassCard, ProFeatureLabel } from '@/features/dashboard';
import Link from 'next/link';
import React from 'react';

export interface QuoteRequestsSettingsCardProps {
  isFreeTier?: boolean;
  acceptQuoteRequests?: boolean;
}

/**
 * Dashboard card: opt-in for public “Request quote” on booking link (Pro).
 */
export const QuoteRequestsSettingsCard: React.FC<
  QuoteRequestsSettingsCardProps
> = ({ isFreeTier = false, acceptQuoteRequests = false }) => {
  const locked = isFreeTier;

  return (
    <DashboardGlassCard className={locked ? 'opacity-95' : ''}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-400">Quote requests</p>
            {isFreeTier ? <ProFeatureLabel /> : null}
          </div>
          <p className="mt-2 text-xs leading-snug text-zinc-500">
            Let customers request a price from your booking link
          </p>
        </div>
        <Switch
          checked={acceptQuoteRequests}
          onCheckedChange={() => {}}
          disabled={locked}
          size="md"
          aria-label={
            locked
              ? 'Quote requests — upgrade to Pro to enable'
              : 'Accept quote requests on your booking link'
          }
          className="shrink-0"
        />
      </div>

      <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-500">
        Adds <span className="text-zinc-300">Request quote</span> — you respond
        from Quotes.
      </p>

      {locked ? (
        <Button
          href={ROUTES.DASHBOARD.UPGRADE}
          variant="inverse"
          size="md"
          fullWidth
          className="mt-3"
          icon={<CrownIcon className="h-4 w-4" />}
        >
          Upgrade to Pro
        </Button>
      ) : (
        <Link
          href={ROUTES.DASHBOARD.QUOTES}
          className="mt-3 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          Manage in Quotes →
        </Link>
      )}
    </DashboardGlassCard>
  );
};
