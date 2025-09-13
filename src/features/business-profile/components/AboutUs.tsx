import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface AboutUsProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({
  businessProfile,
  editMode,
  onSave,
  onCancel,
}) => {
  return (
    <section className="px-6 py-8 sm:px-8 bg-neutral-800">
      <SectionTitle
        icon={<ChatBubbleLeftRightIcon className="h-7 w-7 text-gray-50" />}
      >
        About Us
      </SectionTitle>
      <p className="text-gray-400 leading-relaxed">
        {businessProfile.bio || 'No bio available'}
      </p>
    </section>
  );
};
