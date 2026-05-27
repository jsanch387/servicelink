'use client';

import { API_ROUTES } from '@/constants/routes';
import React, { useCallback, useState } from 'react';
import { AutomationIntroCarousel } from './AutomationIntroCarousel';

export type AutomationConnectExperienceProps = {
  hasBookingLink: boolean;
};

export const AutomationConnectExperience: React.FC<
  AutomationConnectExperienceProps
> = ({ hasBookingLink }) => {
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const startInstagramConnect = useCallback(async () => {
    setConnectError(null);
    setConnectLoading(true);
    try {
      const res = await fetch(API_ROUTES.META_INSTAGRAM_CONNECT, {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || data.success === false) {
        setConnectError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not connect. Try again.'
        );
        return;
      }

      if (typeof data.url !== 'string' || !data.url.trim()) {
        setConnectError('Facebook did not return a login link.');
        return;
      }

      window.location.assign(data.url);
    } catch {
      setConnectError('Something went wrong. Try again.');
    } finally {
      setConnectLoading(false);
    }
  }, []);

  return (
    <AutomationIntroCarousel
      hasBookingLink={hasBookingLink}
      connectLoading={connectLoading}
      connectError={connectError}
      onConnect={() => void startInstagramConnect()}
    />
  );
};
