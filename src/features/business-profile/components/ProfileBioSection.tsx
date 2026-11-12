'use client';

import { BookingPolicyAgreeModal } from '@/features/availability/booking/components/BookingPolicyAgreeModal';
import { publicSpecialtyLabels } from '@/constants/businessSpecialties';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { InstagramIcon, TikTokIcon } from '@/icons';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useState } from 'react';
import type { CompleteBusinessProfile } from '../types/businessProfile';
import { resolvePublicBookingPolicy } from '../utils/bookingPolicy';
import { socialLinksForDisplay } from '../utils/socialMedia';

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
  const bio = businessProfile.bio?.trim() || null;
  const specialties = publicSpecialtyLabels(
    businessProfile.business_type,
    businessProfile.specialties
  );
  const policy = resolvePublicBookingPolicy(businessProfile);
  const socialLinks = socialLinksForDisplay(businessProfile.social_media);

  if (!bio && !policy && specialties.length === 0 && socialLinks.length === 0) {
    return <p className="text-sm text-zinc-500">{ui.profile.noBioYet}</p>;
  }

  return (
    <div className="space-y-6">
      {socialLinks.length > 0 ? (
        <div
          className="flex items-center gap-2.5"
          aria-label={ui.profile.socialMediaAriaLabel}
        >
          {socialLinks.map(link => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 ring-1 ring-white/10 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              {link.id === 'instagram' ? (
                <InstagramIcon className="h-[18px] w-[18px]" />
              ) : (
                <TikTokIcon className="h-[18px] w-[18px]" />
              )}
            </a>
          ))}
        </div>
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
