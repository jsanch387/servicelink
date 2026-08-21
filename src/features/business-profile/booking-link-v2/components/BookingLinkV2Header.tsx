'use client';

import {
  CoverPhotoPlaceholder,
  ImageWithFallback,
  LogoPlaceholder,
} from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { InstagramIcon, TikTokIcon } from '@/icons';
import { normalizePublicBookingOfferedLocales } from '@/libs/bookingFlowLocale';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { PublicBookingLanguageToggle } from '../../components/PublicBookingLanguageToggle';
import { ProfileRatingSummary } from '../../reviews';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import { socialLinksForDisplay } from '../../utils/socialMedia';
import { BookingLinkV2ContactActions } from './BookingLinkV2ContactActions';

interface BookingLinkV2HeaderProps {
  businessProfile: CompleteBusinessProfile;
  isPublic?: boolean;
  showVerifiedBadge?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  publicReviewSummary?: PublicProfileReviewsSummary | null;
}

export function BookingLinkV2Header({
  businessProfile,
  isPublic = false,
  showVerifiedBadge = false,
  bookingFlowLocale = 'en',
  publicReviewSummary = null,
}: BookingLinkV2HeaderProps) {
  const slugTrimmed = businessProfile.business_slug?.trim();
  const serviceArea = businessProfile.service_area?.trim() || null;
  const phoneNumber = businessProfile.phone_number_call?.trim() || '';
  const socialLinks = socialLinksForDisplay(businessProfile.social_media);

  return (
    <>
      <div className="relative h-40 w-full overflow-hidden bg-[#0f0f0f] sm:h-52">
        {businessProfile.cover_image_url ? (
          <ImageWithFallback
            src={businessProfile.cover_image_url}
            alt=""
            width={1200}
            height={400}
            className="h-full w-full object-cover object-center"
            fallbackLabel="Cover photo"
            fallbackSize={{ w: 1200, h: 400 }}
            priority
            sizes="(max-width: 640px) 100vw, 896px"
          />
        ) : (
          <CoverPhotoPlaceholder
            className="h-full w-full"
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#0f0f0f]" />
      </div>

      <div className="relative z-10 -mt-12 flex flex-col items-center px-4 text-center sm:-mt-14 sm:px-8">
        <div className="relative mb-4">
          <div className="rounded-[1.75rem] bg-zinc-800/80 p-1 shadow-xl ring-1 ring-white/10">
            {businessProfile.logo_url ? (
              <ImageWithFallback
                className="h-24 w-24 rounded-[1.5rem] border-2 border-[#0f0f0f] bg-zinc-900 object-cover sm:h-28 sm:w-28"
                src={businessProfile.logo_url}
                alt={`${businessProfile.business_name} logo`}
                width={224}
                height={224}
                fallbackLabel="Logo"
                fallbackSize={{ w: 224, h: 224 }}
                priority
                sizes="112px"
              />
            ) : (
              <LogoPlaceholder
                businessName={businessProfile.business_name}
                size="sm"
              />
            )}
          </div>
          {showVerifiedBadge ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0f0f0f] ring-2 ring-zinc-700"
              aria-label="Verified business"
            >
              <CheckBadgeIcon className="h-3.5 w-3.5 text-blue-400" />
            </span>
          ) : null}
        </div>

        <div className="w-full max-w-lg space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem] sm:leading-tight">
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
            className="justify-center"
          />
        </div>

        {phoneNumber ? (
          <BookingLinkV2ContactActions
            phoneNumber={phoneNumber}
            bookingFlowLocale={bookingFlowLocale}
          />
        ) : null}

        {socialLinks.length > 0 ? (
          <div
            className="mt-4 flex items-center justify-center gap-2"
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
}
