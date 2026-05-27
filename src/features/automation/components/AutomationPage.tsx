'use client';

import React from 'react';
import type { InstagramMessagingChannelPublic } from '@/features/automation/server/instagramMessagingChannelsQuery';
import { AutomationConnectExperience } from './AutomationConnectExperience';
import { AutomationConnectedCard } from './AutomationConnectedCard';
import { AutomationPageHeader } from './AutomationPageHeader';
import { AutomationShell } from './AutomationShell';

export type AutomationPageProps = {
  channel: InstagramMessagingChannelPublic | null;
  hasBookingLink: boolean;
  connectBanner?: { kind: 'success' | 'error'; message: string } | null;
};

export const AutomationPage: React.FC<AutomationPageProps> = ({
  channel,
  hasBookingLink,
  connectBanner = null,
}) => {
  const isConnected = channel != null;

  return (
    <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[var(--dashboard-bg)] lg:overflow-hidden">
      <AutomationShell>
        <AutomationPageHeader />

        {connectBanner ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-center text-sm ${
              connectBanner.kind === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                : 'border-red-500/25 bg-red-500/10 text-red-100'
            }`}
            role="status"
          >
            {connectBanner.message}
          </div>
        ) : null}

        {isConnected ? (
          <AutomationConnectedCard channel={channel} />
        ) : (
          <AutomationConnectExperience hasBookingLink={hasBookingLink} />
        )}
      </AutomationShell>
    </main>
  );
};
