'use client';

import { BookingPolicyAgreeModal } from '@/features/availability/booking/components/BookingPolicyAgreeModal';
import { publicSpecialtyLabels } from '@/constants/businessSpecialties';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useState } from 'react';
import type { CompleteBusinessProfile } from '../types/businessProfile';
import { resolvePublicBookingPolicy } from '../utils/bookingPolicy';

interface ProfileBioSectionProps {
  businessProfile: CompleteBusinessProfile;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({
  businessProfile,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [policyOpen, setPolicyOpen] = useState(false);
  const businessType = businessProfile.business_type?.trim() || null;
  const bio = businessProfile.bio?.trim() || null;
  const specialties = publicSpecialtyLabels(
    businessProfile.business_type,
    businessProfile.specialties
  );
  const policy = resolvePublicBookingPolicy(businessProfile);
  const hasIntro = Boolean(businessType || specialties.length > 0);

  if (!hasIntro && !bio && !policy) {
    return <p className="text-sm text-zinc-500">{ui.profile.noBioYet}</p>;
  }

  return (
    <div className="space-y-6">
      {hasIntro ? (
        <div className="space-y-2">
          {businessType ? (
            <p className="text-xs font-medium text-zinc-500">{businessType}</p>
          ) : null}
          {specialties.length > 0 ? (
            <ul
              className="flex flex-wrap gap-2"
              aria-label={ui.profile.specialtiesAriaLabel}
            >
              {specialties.map(label => (
                <li
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-zinc-300"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {bio ? (
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-400">
          {bio}
        </p>
      ) : null}

      {policy ? (
        <>
          <button
            type="button"
            onClick={() => setPolicyOpen(true)}
            className="cursor-pointer text-xs text-zinc-500 underline decoration-white/15 underline-offset-2 transition-colors hover:text-zinc-300 hover:decoration-white/30"
          >
            {ui.profile.bookingPolicyLabel}
          </button>
          <BookingPolicyAgreeModal
            isOpen={policyOpen}
            policyText={policy.text}
            viewOnly
            onClose={() => setPolicyOpen(false)}
            onAgreed={() => setPolicyOpen(false)}
            bookingFlowLocale={bookingFlowLocale}
          />
        </>
      ) : null}
    </div>
  );
};
