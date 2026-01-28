'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { ProfileHeader } from './ProfileHeader';
import { ServicesList } from './ServicesList';
import { WorkShowcase } from './WorkShowcase';
// import { ReviewsSection } from './ReviewsSection'; // Will be used later
import { Button } from '@/components/shared';
import {
  ArrowRightIcon,
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
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
            <div className="px-4 pt-4 pb-3 sm:pt-6 sm:pb-4">
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
                isPublic={isPublic}
              />

              {/* Tabs Navigation */}
              <div className="px-4 sm:px-8 mt-8 border-b border-neutral-700">
                <div className="flex justify-center gap-8">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`pb-4 px-1 font-bold text-base transition-colors relative cursor-pointer ${
                      activeTab === 'services'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Services
                    {activeTab === 'services' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`pb-4 px-1 font-bold text-base transition-colors relative cursor-pointer ${
                      activeTab === 'portfolio'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Our work
                    {activeTab === 'portfolio' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></span>
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
                <div className="px-4 sm:px-8 py-12 mt-12">
                  {/* Separator Line */}
                  <div className="w-full border-t border-neutral-800 mb-8"></div>

                  <div className="flex flex-col items-center gap-4 text-center">
                    {/* Powered by text */}
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Powered by
                    </p>

                    {/* ServiceLink Button */}
                    <Link
                      href="/"
                      className="group inline-flex items-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700 transition-all"
                    >
                      {/* Logo Image */}
                      <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0 p-1.5">
                        <Image
                          src="/favicon.png"
                          alt="ServiceLink Logo"
                          width={20}
                          height={20}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {/* ServiceLink Text */}
                      <span className="text-white font-bold text-sm">
                        ServiceLink
                      </span>
                      {/* Arrow Icon */}
                      <ArrowRightIcon className="h-4 w-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {/* Call to Action Text */}
                    <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                      Get your own profile today and start booking clients with
                      your own professional link.
                    </p>
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
