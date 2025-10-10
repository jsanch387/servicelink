import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import React from 'react';
// import { SectionTitle } from '@/components/shared/SectionTitle'; // Will be used later
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface AboutUsProps {
  businessProfile: CompleteBusinessProfile;
  editMode?: EditMode; // Will be used later
  onSave?: (_data: Record<string, unknown>) => Promise<void>; // Will be used later
  onCancel?: () => void; // Will be used later
}

export const AboutUs: React.FC<AboutUsProps> = ({
  businessProfile,
  editMode, // Will be used later
  onSave, // Will be used later
  onCancel, // Will be used later
}) => {
  // Suppress unused parameter warnings
  void editMode;
  void onSave;
  void onCancel;
  return (
    <section className="px-8 py-12 border-b border-neutral-700 bg-neutral-900/90">
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
