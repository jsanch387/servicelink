import { Button } from '@/components/shared';
import {
  getPublicQuoteRequestPath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { normalizePublicBookingOfferedLocales } from '@/libs/bookingFlowLocale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
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
  /** When true, show verified badge on logo (derived from owner subscription_tier === 'pro'). */
  showVerifiedBadge?: boolean;
  /** When true with `isPublic` + slug, show Request quote CTA (Pro quote gate + accept_quote_req). */
  showRequestQuoteCta?: boolean;
  /** Public / owner preview: resolved booking-funnel locale (query → cookie → DB default). */
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

  return (
    <>
      {/* Cover Photo - High-end visual depth with gradient overlay */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-[#0f0f0f]">
        {businessProfile.cover_image_url ? (
          <ImageWithFallback
            src={businessProfile.cover_image_url}
            alt="Business Cover Photo"
            width={1200}
            height={400}
            className="w-full h-full object-cover object-center"
            fallbackLabel="COVER PHOTO"
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
        {/* Gradient overlay at the bottom edge only for seamless blending */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#0f0f0f] pointer-events-none" />
      </div>

      {/* Profile Section - Centered content with professional hierarchy */}
      <div className="relative px-6 -mt-16 z-10 flex flex-col items-center text-center">
        {/* Signature Logo Frame */}
        <div className="inline-block relative mb-6">
          <div className="p-1 rounded-[2.8rem] bg-neutral-700 shadow-2xl">
            {businessProfile.logo_url ? (
              <ImageWithFallback
                className="w-32 h-32 rounded-[2.4rem] border-4 border-[#0f0f0f] object-cover bg-neutral-800"
                src={businessProfile.logo_url}
                alt={`${businessProfile.business_name} logo`}
                width={256}
                height={256}
                fallbackLabel="LOGO"
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
          {showVerifiedBadge && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0f0f0f] border-2 border-neutral-600 shadow-lg"
              aria-label="Verified business"
            >
              <CheckBadgeIcon className="h-5 w-5 text-blue-400" />
            </span>
          )}
        </div>

        {/* Business Title */}
        <div className="w-full max-w-2xl mx-auto px-2">
          <h1 className="text-3xl font-extrabold text-gray-50 tracking-tight text-center break-words">
            {businessProfile.business_name}
          </h1>
        </div>

        {/* Category Badge Styling */}
        <p className="text-gray-400 text-[13px] font-bold uppercase tracking-[0.2em] mt-2">
          {businessProfile.business_type}
        </p>

        {/* Service Location */}
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
          <span className="text-sm font-semibold tracking-wide">
            {businessProfile.service_area}
          </span>
        </div>

        {/* Public CTAs: quote on → Request Quote + compact call; quote off → Contact (tel) */}
        {showCtaRow ? (
          <div className="mt-6 flex w-full max-w-sm items-center justify-center gap-3">
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
