'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import type { CompleteBusinessProfile } from '../types/businessProfile';

interface ProfileBioSectionProps {
  businessProfile: CompleteBusinessProfile;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({
  businessProfile,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const businessType = businessProfile.business_type?.trim() || null;
  const bio = businessProfile.bio?.trim() || null;

  if (!businessType && !bio) {
    return <p className="text-sm text-zinc-500">{ui.profile.noBioYet}</p>;
  }

  return (
    <div className="space-y-4">
      {businessType ? (
        <p className="text-[15px] font-medium leading-snug text-zinc-200">
          {businessType}
        </p>
      ) : null}
      {bio ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
          {bio}
        </p>
      ) : (
        <p className="text-sm text-zinc-500">{ui.profile.noBioYet}</p>
      )}
    </div>
  );
};
