import { StarIcon } from '@heroicons/react/24/solid';
import React from 'react';
// import { SectionTitle } from '@/components/shared/SectionTitle'; // Will be used later
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface ReviewsSectionProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  businessProfile,
  editMode,
  onSave,
  onCancel,
}) => {
  return (
    <section className="px-8 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <StarIcon className="h-6 w-6 text-orange-500" />
          Customer Reviews
        </h2>
      </div>
      <div className="space-y-6">
        {/* Mock reviews for now - TODO: implement real reviews */}
        <div className="bg-neutral-700 p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-3">
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
          <p className="text-gray-300 leading-relaxed">
            Excellent service! My car looks brand new. Highly recommend!
          </p>
          <p className="text-xs text-gray-500 mt-2 text-right">
            December 15, 2024
          </p>
        </div>

        <div className="bg-neutral-700 p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-3">
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
          <p className="text-gray-300 leading-relaxed">
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
