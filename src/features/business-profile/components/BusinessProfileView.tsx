'use client';

import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { AboutUs } from './AboutUs';
import { ProfileHeader } from './ProfileHeader';
import { ServicesList } from './ServicesList';
import { WorkShowcase } from './WorkShowcase';
// import { ReviewsSection } from './ReviewsSection'; // Will be used later
import { Button } from '@/components/shared';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { EditBusinessProfile } from './edit/EditBusinessProfile';
// import { BusinessProfileApi } from '../services/businessProfileApi'; // Will be used later

interface BusinessProfileViewProps {
  businessProfile: CompleteBusinessProfile;
  initialMode?: EditMode;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  businessProfile: initialBusinessProfile,
  initialMode = 'view',
}) => {
  const [editMode, setEditMode] = useState<EditMode>(initialMode);
  const [businessProfile, setBusinessProfile] =
    useState<CompleteBusinessProfile>(initialBusinessProfile);
  const [isLoading, setIsLoading] = useState(false);

  // Update edit mode when initialMode prop changes
  useEffect(() => {
    console.log('🔄 Initial mode changed:', initialMode);
    setEditMode(initialMode);
  }, [initialMode]);

  const handleEdit = () => {
    console.log('✏️ Switching to edit mode');
    setEditMode('edit');
    // Update URL to reflect edit mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'edit');
    window.history.pushState({}, '', url.toString());
  };

  const handlePreview = () => {
    console.log('👁️ Switching to preview mode');
    setEditMode('view');
    // Update URL to reflect view mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'view');
    window.history.pushState({}, '', url.toString());
  };

  const handleSave = async (data: Record<string, unknown>) => {
    console.log('💾 Handling save from EditBusinessProfile:', data);
    setIsLoading(true);

    try {
      // Transform the form data to match the expected structure
      const transformedData = {
        ...data,
        services: Array.isArray(data.services)
          ? data.services.map((service: Record<string, unknown>) => ({
              ...service,
              price_cents: service.price
                ? parseInt(service.price as string) * 100
                : 0,
            }))
          : [],
      };

      // Update local state with the transformed data
      setBusinessProfile(prev => ({
        ...prev,
        ...transformedData,
        services:
          transformedData.services as CompleteBusinessProfile['services'],
      }));

      // Switch to preview mode to show the updated profile
      setEditMode('view');
      // Update URL to reflect view mode
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'view');
      window.history.pushState({}, '', url.toString());
      console.log('✅ Business profile updated and switched to preview mode');
    } catch (error) {
      console.error('❌ Error updating business profile state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ Canceling edit mode');
    setEditMode('view');
    // Update URL to reflect view mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'view');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header with Edit Button */}
      <div className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {businessProfile.business_name}
              </h1>
              <p className="text-gray-400 mt-1">Your business profile</p>
            </div>

            <div className="flex gap-2">
              {editMode === 'view' ? (
                <Button
                  onClick={handleEdit}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  onClick={handlePreview}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-neutral-800 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {editMode === 'view' ? (
            // Preview Mode - Show customer view
            <>
              <ProfileHeader
                businessProfile={businessProfile}
                editMode={editMode}
                onSave={handleSave}
                onCancel={handleCancel}
              />
              <AboutUs
                businessProfile={businessProfile}
                editMode={editMode}
                onSave={handleSave}
                onCancel={handleCancel}
              />
              <ServicesList
                businessProfile={businessProfile}
                editMode={editMode}
                onSave={handleSave}
                onCancel={handleCancel}
              />
              <WorkShowcase
                businessProfile={businessProfile}
                editMode={editMode}
                onSave={handleSave}
                onCancel={handleCancel}
              />
              {/* <ReviewsSection
                businessProfile={businessProfile}
                editMode={editMode}
                onSave={handleSave}
                onCancel={handleCancel}
              /> */}
            </>
          ) : (
            // Edit Mode - Show unified edit form
            <div className="p-8">
              <EditBusinessProfile
                businessProfile={businessProfile}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
