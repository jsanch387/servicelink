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
    <section className="px-8 py-12 border-b border-neutral-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-orange-500" />
          About Us
        </h2>
      </div>
      <p className="text-gray-300 leading-relaxed text-lg">
        {businessProfile.bio || 'No bio available'}
      </p>
    </section>
  );
};
