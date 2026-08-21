'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { CompleteBusinessProfile } from '../types/businessProfile';
import { formatPhoneNumber } from '../utils/businessProfileHelpers';

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
  const phoneRaw = businessProfile.phone_number_call?.trim() || null;
  const email = businessProfile.email?.trim() || null;
  const phoneDisplay = phoneRaw ? formatPhoneNumber(phoneRaw) : null;
  const phoneHref = phoneRaw ? `tel:${phoneRaw.replace(/\D/g, '')}` : null;
  const hasAbout = Boolean(businessType || bio);
  const hasContact = Boolean(phoneDisplay || email);

  if (!hasAbout && !hasContact) {
    return <p className="text-sm text-zinc-500">{ui.profile.noBioYet}</p>;
  }

  return (
    <div className="space-y-6">
      {hasAbout ? (
        <div className="space-y-3">
          {businessType ? (
            <p className="text-[15px] font-medium leading-snug text-zinc-200">
              {businessType}
            </p>
          ) : null}
          {bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              {bio}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasContact ? (
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">
            {ui.profile.contactHeading}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {phoneDisplay && phoneHref ? (
              <li>
                <a
                  href={phoneHref}
                  className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300 transition-colors hover:text-white"
                >
                  <PhoneIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span>
                    <span className="sr-only">
                      {ui.profile.contactPhoneLabel}:{' '}
                    </span>
                    {phoneDisplay}
                  </span>
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300 transition-colors hover:text-white"
                >
                  <EnvelopeIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span>
                    <span className="sr-only">
                      {ui.profile.contactEmailLabel}:{' '}
                    </span>
                    {email}
                  </span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
