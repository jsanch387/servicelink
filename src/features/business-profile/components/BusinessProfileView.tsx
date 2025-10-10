'use client';

import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { AboutUs } from './AboutUs';
import { ProfileHeader } from './ProfileHeader';
import { ServicesList } from './ServicesList';
import { WorkShowcase } from './WorkShowcase';
// import { ReviewsSection } from './ReviewsSection'; // Will be used later
import { Button } from '@/components/shared';
import { EyeIcon, LinkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { EditBusinessProfile } from './edit/EditBusinessProfile';
// import { BusinessProfileApi } from '../services/businessProfileApi'; // Will be used later

interface SlugData {
  hasSlug: boolean;
  slug?: string;
  fullLink?: string;
}

interface BusinessProfileViewProps {
  businessProfile: CompleteBusinessProfile;
  initialMode?: EditMode;
  isPublic?: boolean; // New prop to indicate public viewing
  slugData?: SlugData; // Optional slug data for authenticated users
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  businessProfile: initialBusinessProfile,
  initialMode = 'view',
  isPublic = false,
  slugData,
}) => {
  const [editMode, setEditMode] = useState<EditMode>(initialMode);
  const [businessProfile, setBusinessProfile] =
    useState<CompleteBusinessProfile>(initialBusinessProfile);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging for public profiles
  useEffect(() => {
    if (isPublic) {
      console.log('🌐 [BusinessProfileView] Public profile data:', {
        businessName: businessProfile.business_name,
        servicesCount: businessProfile.services?.length || 0,
        imagesCount: businessProfile.images?.length || 0,
        services: businessProfile.services,
        images: businessProfile.images,
      });
    }
  }, [businessProfile, isPublic]);

  // Update edit mode when initialMode prop changes
  // For public profiles, always stay in view mode
  useEffect(() => {
    console.log('🔄 Initial mode changed:', initialMode);
    if (isPublic) {
      setEditMode('view');
    } else {
      setEditMode(initialMode);
    }
  }, [initialMode, isPublic]);

  const handleEdit = () => {
    // Prevent editing in public mode
    if (isPublic) {
      console.warn('🚫 Edit mode disabled for public profiles');
      return;
    }
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
    // Prevent saving in public mode
    if (isPublic) {
      console.warn('🚫 Save disabled for public profiles');
      return;
    }
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

      // Check if this is a partial update (like cover photo upload)
      // If it's just cover photo or logo updates, don't switch to preview mode
      const isPartialUpdate =
        Object.keys(data).length <= 2 &&
        (data.cover_image_url ||
          data.banner_path ||
          data.logo_url ||
          data.logo_path);

      if (!isPartialUpdate) {
        // Switch to preview mode to show the updated profile (full save)
        setEditMode('view');
        // Update URL to reflect view mode
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'view');
        window.history.pushState({}, '', url.toString());
        console.log('✅ Business profile updated and switched to preview mode');
      } else {
        console.log(
          '✅ Partial update applied (cover photo/logo), staying in edit mode'
        );
      }
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
      {/* Header with Edit Button - Only show for authenticated users */}
      {!isPublic && (
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
      )}

      {/* Main Content */}
      <div className="bg-neutral-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Create Link CTA - Only show for authenticated users without a slug */}
          {!isPublic && slugData && !slugData.hasSlug && (
            <div className="px-4 pt-6 pb-4">
              <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="bg-orange-500/10 rounded-full p-2">
                      <LinkIcon className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                      Create your public link
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Get a custom link to share your profile with customers and
                      start getting business.
                    </p>
                    <Button
                      onClick={() =>
                        (window.location.href = '/dashboard/settings')
                      }
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Create Link Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            <div>
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
