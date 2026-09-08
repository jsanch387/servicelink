import { Button } from '@/components/shared';
import {
  getPublicQuoteRequestPath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { normalizePublicBookingOfferedLocales } from '@/libs/bookingFlowLocale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { InstagramIcon, TikTokIcon } from '@/icons';
import { ProfileRatingSummary } from '../reviews';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { PublicBookingLanguageToggle } from './PublicBookingLanguageToggle';
import React from 'react';
import {
  CoverPhotoPlaceholder,
  LogoPlaceholder,
} from '../../../components/shared';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import {
  getProfileCoverDisplaySrc,
  getProfileLogoDisplaySrc,
} from '../utils/workPhotoSrc';
import { socialLinksForDisplay } from '../utils/socialMedia';
import { ProfileMediaImage } from './ProfileMediaImage';

interface ProfileHeaderProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;

  onSave: (_data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isPublic?: boolean;
  showVerifiedBadge?: boolean;
  showRequestQuoteCta?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** When null/undefined or empty count, header star rating is hidden. */
  publicReviewSummary?: PublicProfileReviewsSummary | null;
  /** City/state + radius for the booking link, e.g. "Austin, TX · 25 mi". */
  coverageLabel?: string | null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  businessProfile,
  isPublic = false,
  showVerifiedBadge = false,
  showRequestQuoteCta = false,
  bookingFlowLocale = 'en',
  publicReviewSummary = null,
  coverageLabel = null,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const slugTrimmed = businessProfile.business_slug?.trim();
  const phoneTrimmed = businessProfile.phone_number_call?.trim();
  const showCtaRow =
    !!slugTrimmed &&
    (isPublic || showRequestQuoteCta) &&
    (showRequestQuoteCta || !!phoneTrimmed);
  const serviceArea =
    coverageLabel?.trim() || businessProfile.service_area?.trim() || null;
  const socialLinks = socialLinksForDisplay(businessProfile.social_media);
  const coverSrc = businessProfile.cover_image_url?.trim() || '';
  const logoSrc = businessProfile.logo_url?.trim() || '';
  const coverIsLcp = Boolean(coverSrc);
  const logoIsLcp = !coverIsLcp && Boolean(logoSrc);

  return (
    <>
      <div className="relative h-44 sm:h-56 md:h-60 w-full overflow-hidden bg-[#0f0f0f]">
        {coverSrc ? (
          <ProfileMediaImage
            src={coverSrc}
            displaySrc={getProfileCoverDisplaySrc(coverSrc)}
            alt="Business Cover Photo"
            width={1080}
            height={400}
            wrapperClassName="h-full w-full"
            className="h-full w-full object-cover object-center"
            fallbackLabel="Cover photo"
            fallbackSize={{ w: 1080, h: 400 }}
            priority={coverIsLcp}
            sizes="(max-width: 640px) 100vw, 896px"
          />
        ) : (
          <CoverPhotoPlaceholder
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
        <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-32 bg-gradient-to-b from-transparent to-[#0f0f0f] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-8 -mt-14 text-center">
        <div className="relative mb-5">
          <div className="rounded-[2rem] bg-zinc-800/80 p-1 shadow-xl ring-1 ring-white/10">
            {logoSrc ? (
              <ProfileMediaImage
                wrapperClassName="h-28 w-28 rounded-[1.75rem] bg-zinc-900 sm:h-32 sm:w-32"
                skeletonClassName="rounded-[1.75rem]"
                className="h-28 w-28 rounded-[1.75rem] border-2 border-[#0f0f0f] object-cover bg-zinc-900 sm:h-32 sm:w-32"
                src={logoSrc}
                displaySrc={getProfileLogoDisplaySrc(logoSrc)}
                alt={`${businessProfile.business_name} logo`}
                width={256}
                height={256}
                fallbackLabel="Logo"
                fallbackSize={{ w: 256, h: 256 }}
                priority={logoIsLcp}
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
              className="absolute -bottom-0.5 -right-0.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f0f0f] ring-2 ring-zinc-700"
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

          <ProfileRatingSummary
            bookingFlowLocale={bookingFlowLocale}
            summary={publicReviewSummary}
          />
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

        {socialLinks.length > 0 ? (
          <div
            className="mt-3.5 flex items-center justify-center gap-2.5"
            aria-label="Social media"
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
      </div>
    </>
  );
};
