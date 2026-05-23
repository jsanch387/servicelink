'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import type { ComponentProps } from 'react';

import {
  trackWorkshopEvent,
  WORKSHOP_ANALYTICS_EVENTS,
} from '../utils/workshopAnalytics';
import { markWorkshopAttribution } from '../utils/workshopAttribution';
import { trackWorkshopLeadInSupabase } from '../utils/workshopLeadTracking';

type AdsWorkshopSignupButtonProps = Omit<
  ComponentProps<typeof Button>,
  'href' | 'onClick'
> & {
  onNavigate?: () => void;
};

export function AdsWorkshopSignupButton({
  onNavigate,
  ...buttonProps
}: AdsWorkshopSignupButtonProps) {
  const handleClick = () => {
    markWorkshopAttribution();
    trackWorkshopEvent(WORKSHOP_ANALYTICS_EVENTS.SIGNUP_CLICK);
    void trackWorkshopLeadInSupabase('signup_click');
    onNavigate?.();
  };

  return (
    <Button
      href={ROUTES.WORKSHOP_SIGNUP}
      onClick={handleClick}
      {...buttonProps}
    />
  );
}
