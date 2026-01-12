// Updated to relative path to resolve build error
import {
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  PhoneIcon,
} from '@heroicons/react/24/solid';
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
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  businessProfile,
  isPublic = false,
}) => {
  return (
    <>
      {/* Cover Photo - High-end visual depth with gradient overlay */}
      <div className="relative h-64 w-full overflow-hidden bg-neutral-900">
        {businessProfile.cover_image_url ? (
          <ImageWithFallback
            src={businessProfile.cover_image_url}
            alt="Business Cover Photo"
            width={1200}
            height={400}
            className="w-full h-full object-cover"
            fallbackLabel="COVER PHOTO"
            fallbackSize={{ w: 1200, h: 400 }}
            priority
          />
        ) : (
          <CoverPhotoPlaceholder
            businessName={businessProfile.business_name}
            className="w-full h-full"
            isPublic={isPublic}
          />
        )}
        {/* Gradient overlay at the bottom edge only for seamless blending */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-neutral-900 pointer-events-none" />
      </div>

      {/* Profile Section - Centered content with professional hierarchy */}
      <div className="relative px-6 -mt-16 z-10 flex flex-col items-center text-center">
        {/* Signature Logo Frame */}
        <div className="inline-block relative mb-6">
          <div className="p-1 rounded-[2.8rem] bg-neutral-700 shadow-2xl">
            {businessProfile.logo_url ? (
              <ImageWithFallback
                className="w-32 h-32 rounded-[2.4rem] border-4 border-neutral-900 object-cover bg-neutral-800"
                src={businessProfile.logo_url}
                alt={`${businessProfile.business_name} logo`}
                width={256}
                height={256}
                fallbackLabel="LOGO"
                fallbackSize={{ w: 256, h: 256 }}
                priority
              />
            ) : (
              <LogoPlaceholder
                businessName={businessProfile.business_name}
                size="md"
              />
            )}
          </div>
        </div>

        {/* Business Title & Verification */}
        <h1 className="text-3xl font-extrabold text-gray-50 flex items-center justify-center gap-2 tracking-tight">
          {businessProfile.business_name}
          <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
        </h1>

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

        {/* Professional Bio with improved spacing */}
        <p className="text-gray-400 text-[15px] mt-6 leading-relaxed max-w-lg mx-auto font-medium">
          {/* In a real implementation, this would pull from businessProfile.bio */}
          Premium services tailored for your unique needs. We are dedicated to
          providing the highest quality standards and professional excellence
          for every client.
        </p>

        {/* Primary Call-to-Action Grid */}
        <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-sm px-2">
          <a
            href={`tel:${businessProfile.phone_number_call}`}
            className="group flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.96] shadow-xl bg-white text-neutral-900 hover:bg-gray-100"
          >
            <PhoneIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            Call
          </a>
          <a
            href={`sms:${businessProfile.phone_number_text}`}
            className="group flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.96] shadow-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            Text
          </a>
        </div>
      </div>
    </>
  );
};
