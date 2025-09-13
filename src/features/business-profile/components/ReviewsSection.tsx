import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface ReviewsSectionProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  businessProfile,
  editMode,
  onSave,
  onCancel,
}) => {
  return (
    <section className="px-6 py-8 sm:px-8 bg-neutral-800">
      <SectionTitle icon={<StarIcon className="h-7 w-7 text-yellow-300" />}>
        Customer Reviews
      </SectionTitle>
      <div className="space-y-6">
        {/* Mock reviews for now - TODO: implement real reviews */}
        <div className="bg-neutral-700 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={`star-${i}`}
                  className="h-5 w-5 text-yellow-300"
                />
              ))}
            </div>
            <p className="ml-3 text-sm font-semibold text-gray-300">Sarah M.</p>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Excellent service! My car looks brand new. Highly recommend!
          </p>
          <p className="text-xs text-gray-500 mt-2 text-right">
            December 15, 2024
          </p>
        </div>

        <div className="bg-neutral-700 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={`star-${i}`}
                  className="h-5 w-5 text-yellow-300"
                />
              ))}
            </div>
            <p className="ml-3 text-sm font-semibold text-gray-300">Mike R.</p>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Professional and thorough. Will definitely use again!
          </p>
          <p className="text-xs text-gray-500 mt-2 text-right">
            December 10, 2024
          </p>
        </div>
      </div>
    </section>
  );
};
