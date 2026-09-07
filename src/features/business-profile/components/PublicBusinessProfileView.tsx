'use client';

import { useResetWindowScrollOnMount } from '@/components/shared';
import { PublicActiveSaleMarqueeBanner } from '@/features/marketing/components/PublicActiveSaleMarqueeBanner';
import React from 'react';
import {
  BusinessProfileReadView,
  type BusinessProfileReadViewProps,
} from './BusinessProfileReadView';

type PublicBusinessProfileViewProps = Omit<
  BusinessProfileReadViewProps,
  'isPublic' | 'showPublicFooter'
>;

/**
 * Public booking-link profile. Kept separate from the owner editor so the
 * public route does not download dashboard / edit-profile code.
 */
export const PublicBusinessProfileView: React.FC<
  PublicBusinessProfileViewProps
> = props => {
  useResetWindowScrollOnMount();

  return (
    <div className="min-h-screen bg-[#0f0f0f] [overflow-anchor:none]">
      <div className="flex min-h-screen flex-col bg-[#0f0f0f] [overflow-anchor:none]">
        {props.publicActiveSale ? (
          <PublicActiveSaleMarqueeBanner
            sale={props.publicActiveSale}
            bookingFlowLocale={props.bookingFlowLocale}
          />
        ) : null}
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col [&>*]:shrink-0">
          <BusinessProfileReadView {...props} isPublic showPublicFooter />
        </div>
      </div>
    </div>
  );
};
