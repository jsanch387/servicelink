'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { ProfileHeader } from './ProfileHeader';
import { ServicesList } from './ServicesList';
import { WorkShowcase } from './WorkShowcase';
// import { ReviewsSection } from './ReviewsSection'; // Will be used later
import {
  Button,
  GlassCard,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ArrowRightIcon, PencilIcon } from '@heroicons/react/24/outline';
import { EditBusinessProfile } from './edit/EditBusinessProfile';
// import { BusinessProfileApi } from '../services/businessProfileApi'; // Will be used later

type TabType = 'services' | 'portfolio';

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
  const [activeTab, setActiveTab] = useState<TabType>('services');

  // Debug logging for public profiles
  useEffect(() => {
    if (isPublic) {
      // Public profile data loaded
    }
  }, [businessProfile, isPublic]);

  // Update edit mode when initialMode prop changes
  // For public profiles, always stay in view mode
  useEffect(() => {
    if (isPublic) {
      setEditMode('view');
    } else {
      setEditMode(initialMode);
    }
  }, [initialMode, isPublic]);

  const handleEdit = () => {
    // Prevent editing in public mode
    if (isPublic) {
      return;
    }
    setEditMode('edit');
    // Update URL to reflect edit mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'edit');
    window.history.pushState({}, '', url.toString());
  };

  // const handlePreview = () => {
  //   setEditMode('view');
  //   // Update URL to reflect view mode
  //   const url = new URL(window.location.href);
  //   url.searchParams.set('mode', 'view');
  //   window.history.pushState({}, '', url.toString());
  // };

  const handleSave = async (data: Record<string, unknown>) => {
    // Prevent saving in public mode
    if (isPublic) {
      return;
    }
    setIsLoading(true);

    try {
      // Merge saved data into state. Services are managed on the Services dashboard
      // route only, so always preserve existing services when updating from this form.
      setBusinessProfile(prev => ({
        ...prev,
        ...data,
        services: prev.services,
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
      }
    } catch {
      // Error updating business profile state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode('view');
    // Update URL to reflect view mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'view');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Floating Edit Button (FAB) - Only show in view mode for authenticated users */}
      {!isPublic && editMode === 'view' && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleEdit}
            variant="primary"
            className="flex items-center gap-2 shadow-2xl px-6 py-3 text-base font-semibold rounded-full"
          >
            <PencilIcon className="h-5 w-5" />
            Edit Profile
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-[#0f0f0f] min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Create Link CTA - Only show for authenticated users without a slug */}
          {!isPublic && slugData && !slugData.hasSlug && (
            <div className="px-4 pt-4 pb-3 sm:pt-6 sm:pb-4 w-full min-w-0">
              <GlassCard
                padding="none"
                rounded="rounded-2xl"
                blurColor="bg-zinc-500"
                showBlur={true}
                className="text-left w-full min-w-0 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Custom link
                  </h2>
                  <RequiredLabel title="Create a link to share your profile" />
                </div>
                <div className="mt-3 mb-4 min-w-0">
                  <WarningCallout>
                    You need a custom link so customers can find and book you.
                    Add one in Settings.
                  </WarningCallout>
                </div>
                <Button
                  href={ROUTES.DASHBOARD.SETTINGS}
                  variant="inverse"
                  size="md"
                  className="w-full sm:w-auto"
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Go to Settings
                </Button>
              </GlassCard>
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
                isPublic={isPublic}
              />

              {/* Tabs Navigation */}
              <div className="px-4 sm:px-8 mt-8 border-b border-white/[0.06]">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
                      activeTab === 'services'
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    Services
                    {activeTab === 'services' && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
                      activeTab === 'portfolio'
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    Our work
                    {activeTab === 'portfolio' && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'services' ? (
                <ServicesList
                  businessProfile={businessProfile}
                  editMode={editMode}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isPublic={isPublic}
                />
              ) : (
                <WorkShowcase
                  businessProfile={businessProfile}
                  editMode={editMode}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}

              {/* Footer - Only show on public profiles */}
              {isPublic && (
                <div className="px-4 sm:px-8 py-8 sm:py-10 mt-8">
                  <div className="w-full border-t border-white/[0.06] pt-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Link
                        href="/"
                        className="group inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <span className="text-[11px] uppercase tracking-wider">
                          Powered by
                        </span>
                        <Image
                          src="/favicon.png"
                          alt=""
                          width={14}
                          height={14}
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="text-gray-400 text-sm font-medium group-hover:text-white transition-colors">
                          ServiceLink
                        </span>
                      </Link>
                      <p className="text-gray-500 text-[11px] max-w-xs leading-relaxed">
                        Get your own profile and start booking clients.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
