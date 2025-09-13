import React from 'react';
import { ProfileHeader } from './ProfileHeader';
import { AboutUs } from './AboutUs';
import { WorkShowcase } from './WorkShowcase';
import { ServicesList } from './ServicesList';
import { ReviewsSection } from './ReviewsSection';
import { QuoteButton } from './QuoteButton';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface BusinessProfileProps {
  businessProfile: CompleteBusinessProfile;
  onRequestQuote?: () => void;
  contained?: boolean;
}

export const BusinessProfile: React.FC<BusinessProfileProps> = ({
  businessProfile,
  onRequestQuote,
  contained = false,
}) => {
  return (
    <div className="min-h-screen bg-neutral-900 font-sans antialiased text-gray-100">
      <div className="max-w-xl mx-auto bg-neutral-800 shadow-2xl overflow-hidden md:max-w-2xl lg:max-w-3xl">
        <ProfileHeader
          businessProfile={businessProfile}
          editMode="view"
          onSave={async () => {}}
          onCancel={() => {}}
        />
        <AboutUs
          businessProfile={businessProfile}
          editMode="view"
          onSave={async () => {}}
          onCancel={() => {}}
        />
        <WorkShowcase
          businessProfile={businessProfile}
          editMode="view"
          onSave={async () => {}}
          onCancel={() => {}}
        />
        <ServicesList
          businessProfile={businessProfile}
          editMode="view"
          onSave={async () => {}}
          onCancel={() => {}}
        />
        <ReviewsSection
          businessProfile={businessProfile}
          editMode="view"
          onSave={async () => {}}
          onCancel={() => {}}
        />
        <div
          className={contained ? 'h-20 bg-neutral-900' : 'h-8 bg-neutral-900'}
        ></div>
      </div>

      <QuoteButton onClick={onRequestQuote} contained={contained} />
    </div>
  );
};
