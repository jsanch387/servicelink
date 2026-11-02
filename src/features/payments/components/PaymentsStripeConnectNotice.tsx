'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React from 'react';
import {
  STRIPE_CONNECT_NOTICE_BODY,
  STRIPE_CONNECT_NOTICE_CTA,
  STRIPE_CONNECT_NOTICE_TITLE,
} from '../constants/stripeProcessingFees';

export function PaymentsStripeConnectNotice() {
  return (
    <div
      className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3.5 sm:px-5"
      role="status"
    >
      <p className="text-sm font-medium text-amber-100">
        {STRIPE_CONNECT_NOTICE_TITLE}
      </p>
      <p className="mt-1 text-sm text-zinc-400">{STRIPE_CONNECT_NOTICE_BODY}</p>
      <div className="mt-3">
        <Button
          href={ROUTES.DASHBOARD.PAYMENTS_SETTINGS}
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
        >
          {STRIPE_CONNECT_NOTICE_CTA}
        </Button>
      </div>
    </div>
  );
}
