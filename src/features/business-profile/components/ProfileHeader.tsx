import { Button } from '@/components/shared';
import { CheckBadgeIcon, PhoneIcon } from '@heroicons/react/24/solid';
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
  // eslint-disable-next-line no-unused-vars
  onSave: (_data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isPublic?: boolean;
  /** When true, show verified badge on logo (derived from owner subscription_tier === 'pro'). */
  showVerifiedBadge?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  businessProfile,
  isPublic = false,
  showVerifiedBadge = false,
}) => {
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

        {/* Professional Bio from profile */}
        {(businessProfile.bio?.trim() ?? '') && (
          <p className="text-gray-400 text-[15px] mt-6 leading-relaxed max-w-lg mx-auto font-medium">
            {businessProfile.bio}
          </p>
        )}

        {/* Call button - icon + phone number, only when business has a phone number */}
        {isPublic && businessProfile.phone_number_call?.trim() && (
          <Button
            href={`tel:${businessProfile.phone_number_call.trim()}`}
            variant="inverse"
            icon={<PhoneIcon className="h-5 w-5" />}
            iconPosition="left"
            className="mt-6 font-medium"
            aria-label="Call business"
          >
            Get In Touch
          </Button>
        )}
      </div>
    </>
  );
};
