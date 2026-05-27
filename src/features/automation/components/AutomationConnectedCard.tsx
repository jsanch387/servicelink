'use client';

import { Button, GlassCard } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import type { InstagramMessagingChannelPublic } from '@/features/automation/server/instagramMessagingChannelsQuery';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useState } from 'react';
import {
  AUTOMATION_CONNECTED_LEAD,
  AUTOMATION_CONNECTED_TEST_TIP,
  AUTOMATION_CONNECTED_TITLE,
  AUTOMATION_DISCONNECT_CTA,
} from '../automationCopy';

export type AutomationConnectedCardProps = {
  channel: InstagramMessagingChannelPublic;
};

function formatConnectedLabel(
  channel: InstagramMessagingChannelPublic
): string {
  if (channel.instagramUsername) {
    return `@${channel.instagramUsername.replace(/^@/, '')}`;
  }
  if (channel.facebookPageName) {
    return channel.facebookPageName;
  }
  return 'Your Instagram';
}

export const AutomationConnectedCard: React.FC<
  AutomationConnectedCardProps
> = ({ channel }) => {
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const disconnect = useCallback(async () => {
    setDisconnectError(null);
    setDisconnectLoading(true);
    try {
      const res = await fetch(API_ROUTES.META_INSTAGRAM_DISCONNECT, {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || data.success === false) {
        setDisconnectError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not disconnect. Try again.'
        );
        return;
      }

      window.location.reload();
    } catch {
      setDisconnectError('Something went wrong. Try again.');
    } finally {
      setDisconnectLoading(false);
    }
  }, []);

  const connectedDate = new Date(channel.connectedAt).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <GlassCard
      padding="lg"
      rounded="rounded-2xl"
      className="mt-6 border-white/[0.09] bg-white/[0.025] sm:mt-8"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
          <CheckCircleIcon className="h-6 w-6 text-emerald-400" aria-hidden />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {AUTOMATION_CONNECTED_TITLE}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">
          {AUTOMATION_CONNECTED_LEAD}
        </p>

        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-4 text-left">
          <p className="text-sm font-semibold text-white">
            {formatConnectedLabel(channel)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            {AUTOMATION_CONNECTED_TEST_TIP}
          </p>
          <p className="mt-3 text-xs text-gray-600">
            Connected {connectedDate}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={disconnectLoading}
            disabled={disconnectLoading}
            onClick={() => void disconnect()}
          >
            {AUTOMATION_DISCONNECT_CTA}
          </Button>
        </div>

        {disconnectError ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {disconnectError}
          </p>
        ) : null}
      </div>
    </GlassCard>
  );
};
