import { Button } from '@/components/shared/Button';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import React from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
// import { formatPhoneNumber } from '../utils/businessProfileHelpers'; // Will be used later

interface ProfileHeaderProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  businessProfile,
  editMode,
  onSave,
  onCancel,
}) => {
  return (
    <>
      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 md:h-72 bg-neutral-900 overflow-hidden">
        <ImageWithFallback
          src={businessProfile.cover_image_url || ''}
          alt="Business Cover Photo"
          width={1200}
          height={400}
          className="w-full h-full object-cover"
          fallbackLabel="COVER PHOTO"
          fallbackSize={{ w: 1200, h: 400 }}
        />
      </div>

      {/* Profile Header */}
      <div className="relative p-8 sm:p-12 flex flex-col items-center -mt-20">
        <ImageWithFallback
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-neutral-800 shadow-lg object-cover bg-gray-700"
          src={businessProfile.logo_url || ''}
          alt={`${businessProfile.business_name} logo`}
          width={256}
          height={256}
          fallbackLabel="LOGO"
          fallbackSize={{ w: 256, h: 256 }}
        />
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-50">
          {businessProfile.business_name}
        </h1>
        {/* Business type and serving area on separate lines */}
        <p className="text-lg sm:text-xl text-gray-400 mt-1">
          {businessProfile.business_type}
        </p>
        <p className="text-md sm:text-lg text-gray-500">
          {businessProfile.service_area}
        </p>
        <div className="flex items-center mt-2">
          <StarIcon className="h-5 w-5 text-yellow-300" />
          <span className="ml-1 text-gray-300 font-semibold">5.0</span>
          <span className="ml-2 text-gray-500 text-sm">(based on reviews)</span>
        </div>

        {/* Contact Options */}
        <div className="flex justify-center space-x-4 mt-6 w-full max-w-sm">
          <Button
            href={`tel:${businessProfile.phone_number_call}`}
            variant="primary"
            size="md"
            className="flex-1"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Call
          </Button>
          <Button
            href={`sms:${businessProfile.phone_number_text}`}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Text
          </Button>
        </div>
      </div>
    </>
  );
};
