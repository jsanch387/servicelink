'use client';

import React from 'react';
import { FreePaymentPreviewLockedDashboard } from './FreePaymentPreviewLockedDashboard';
import { PaymentsProTeaserBanner } from './PaymentsProTeaserBanner';

export interface FreePaymentPreviewProps {
  upsellTitle: string;
  upsellDescription: string;
}

/** Free-only payments home: upgrade banner + locked dimmed sections (real layout underneath). */
export const FreePaymentPreview: React.FC<FreePaymentPreviewProps> = ({
  upsellTitle,
  upsellDescription,
}) => (
  <>
    <PaymentsProTeaserBanner
      className="mt-6 sm:mt-8"
      title={upsellTitle}
      description={upsellDescription}
    />
    <FreePaymentPreviewLockedDashboard className="mt-8 sm:mt-10" />
  </>
);
