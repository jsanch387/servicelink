import { Button } from '@/components/shared';
import {
  getPublicQuoteRequestPath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { normalizePublicBookingOfferedLocales } from '@/libs/bookingFlowLocale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ProfileRatingSummary } from '../reviews';
import { PublicBookingLanguageToggle } from './PublicBookingLanguageToggle';
import React from 'react';
import { ImageWithFallback } from '../../../components';
import {
  CoverPhotoPlaceholder,
  LogoPlaceholder,
} from '../../../components/shared';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface ProfileHeaderProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;

  onSave: (_data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isPublic?: boolean;
  showVerifiedBadge?: boolean;
  showRequestQuoteCta?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  businessProfile,
  isPublic = false,
  showVerifiedBadge = false,
  showRequestQuoteCta = false,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const slugTrimmed = businessProfile.business_slug?.trim();
  const phoneTrimmed = businessProfile.phone_number_call?.trim();
  const showCtaRow =
    !!slugTrimmed &&
    (isPublic || showRequestQuoteCta) &&
    (showRequestQuoteCta || !!phoneTrimmed);
  const serviceArea = businessProfile.service_area?.trim() || null;

  return (
    <>
      <div className="relative h-44 sm:h-52 md:h-56 w-full overflow-hidden bg-[#0f0f0f]">
        {businessProfile.cover_image_url ? (
          <ImageWithFallback
            src={businessProfile.cover_image_url}
            alt="Business Cover Photo"
            width={1200}
            height={400}
            className="w-full h-full object-cover object-center"
            fallbackLabel="Cover photo"
            fallbackSize={{ w: 1200, h: 400 }}
            priority
            sizes="100vw"
          />
        ) : (
          <CoverPhotoPlaceholder
            businessName={businessProfile.business_name}
            className="w-full h-full"
            isPublic={isPublic}
          />
        )}
        {isPublic && slugTrimmed ? (
          <div className="pointer-events-auto absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
            <PublicBookingLanguageToggle
              offeredLocales={normalizePublicBookingOfferedLocales(
                businessProfile.public_booking_locales
              )}
              initialLocale={bookingFlowLocale}
              publicProfileSlug={slugTrimmed}
            />
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-[#0f0f0f] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 -mt-14 text-center">
        <div className="relative mb-5">
          <div className="rounded-[2rem] bg-zinc-800/80 p-1 shadow-xl ring-1 ring-white/10">
            {businessProfile.logo_url ? (
              <ImageWithFallback
                className="h-28 w-28 rounded-[1.75rem] border-2 border-[#0f0f0f] object-cover bg-zinc-900 sm:h-32 sm:w-32"
                src={businessProfile.logo_url}
                alt={`${businessProfile.business_name} logo`}
                width={256}
                height={256}
                fallbackLabel="Logo"
                fallbackSize={{ w: 256, h: 256 }}
                priority
                sizes="128px"
              />
            ) : (
              <LogoPlaceholder
                businessName={businessProfile.business_name}
                size="md"
              />
            )}
          </div>
          {showVerifiedBadge ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f0f0f] ring-2 ring-zinc-700"
              aria-label="Verified business"
            >
              <CheckBadgeIcon className="h-4 w-4 text-blue-400" />
            </span>
          ) : null}
        </div>

        <div className="w-full max-w-lg space-y-1.5">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-[1.65rem] sm:leading-tight">
            {businessProfile.business_name}
          </h1>

          {serviceArea ? (
            <p className="flex items-center justify-center gap-1.5 text-sm leading-snug text-zinc-400">
              <MapPinIcon
                className="h-4 w-4 shrink-0 text-zinc-500"
                aria-hidden
              />
              <span>{serviceArea}</span>
            </p>
          ) : null}

          <ProfileRatingSummary bookingFlowLocale={bookingFlowLocale} />
        </div>

        {showCtaRow ? (
          <div className="mt-5 flex w-full max-w-sm items-center justify-center gap-3">
            {showRequestQuoteCta ? (
              <>
                <Button
                  href={getPublicQuoteRequestPath(slugTrimmed, {
                    lang: bookingFlowLocale,
                  })}
                  variant="inverse"
                  className={
                    phoneTrimmed
                      ? 'w-[70%] font-semibold px-5'
                      : 'w-full max-w-xs font-semibold px-5'
                  }
                >
                  {ui.profile.requestQuote}
                </Button>
                {phoneTrimmed ? (
                  <Button
                    href={`tel:${phoneTrimmed}`}
                    variant="secondary"
                    size="sm"
                    aria-label="Call business"
                    className="w-[42px] shrink-0 px-0"
                  >
                    <PhoneIcon className="h-5 w-5 text-zinc-300" />
                  </Button>
                ) : null}
              </>
            ) : phoneTrimmed ? (
              <Button
                href={`tel:${phoneTrimmed}`}
                variant="secondary"
                className="w-auto shrink-0 font-semibold px-4"
                icon={<PhoneIcon className="h-5 w-5" aria-hidden />}
              >
                {ui.profile.contactPhoneCta}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
};
