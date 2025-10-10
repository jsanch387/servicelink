'use client';

import { Button } from '@/components/shared';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import {
  CheckCircleIcon,
  ClipboardIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';

interface SettingsData {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  slugData: {
    hasSlug: boolean;
    slug?: string;
    fullLink?: string;
  } | null;
}

interface SettingsContentProps {
  businessProfile: CompleteBusinessProfile;
  settingsData: SettingsData;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  businessProfile,
  settingsData,
}) => {
  const APP_DOMAIN = 'myservicelink.app';

  // Generate initial slug from business name
  const generateInitialSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Use server-side data
  const hasSlug = settingsData.slugData?.hasSlug || false;
  const existingSlug = settingsData.slugData?.slug;
  const existingFullLink = settingsData.slugData?.fullLink;

  const initialSlug =
    existingSlug ||
    (businessProfile.business_name
      ? generateInitialSlug(businessProfile.business_name)
      : 'your-business-name');

  const [customSlugInput, setCustomSlugInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [slugError, setSlugError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(hasSlug);
  const [generatedSlug, setGeneratedSlug] = useState(existingSlug || '');

  const currentSlug = linkGenerated
    ? generatedSlug
    : customSlugInput || 'your-custom-name';
  const FULL_LINK = linkGenerated
    ? existingFullLink || `${APP_DOMAIN}/${currentSlug}`
    : `${APP_DOMAIN}/${currentSlug}`;

  const handleCopyLink = useCallback(() => {
    if (!FULL_LINK) return;

    const textarea = document.createElement('textarea');
    textarea.value = FULL_LINK;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        console.log(`[ACTION] Copied link: ${FULL_LINK}`);
      } else {
        console.error('[ACTION] Copy command failed.');
      }
    } catch (err) {
      console.error('[ACTION] Could not copy text:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }, [FULL_LINK]);

  const handleViewProfile = useCallback(() => {
    if (!currentSlug) return;

    // For development, use localhost, for production use the full domain
    const isDevelopment = window.location.hostname === 'localhost';
    const profileUrl = isDevelopment
      ? `http://localhost:3000/${currentSlug}`
      : `https://myservicelink.app/${currentSlug}`;

    // Open the public profile in a new tab
    window.open(profileUrl, '_blank', 'noopener,noreferrer');
    console.log(`[ACTION] Opening profile: ${profileUrl}`);
  }, [currentSlug]);

  const handleSaveSlug = async () => {
    console.log('🚀 [SettingsContent] Starting slug creation process');

    setIsUpdating(true);
    setSlugError('');

    try {
      const response = await fetch('/api/business-profile/slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessProfileId: businessProfile.id,
          slugInput: customSlugInput.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error(
          '❌ [SettingsContent] Slug creation failed:',
          result.error
        );
        setSlugError(result.error);
        return;
      }

      console.log('✅ [SettingsContent] Slug created successfully:', {
        slug: result.data.slug,
        fullLink: result.data.fullLink,
        businessProfileId: result.data.businessProfileId,
      });

      // Update the state with the generated link
      setGeneratedSlug(result.data.slug);
      setLinkGenerated(true);

      // TODO: Update businessProfile state with new slug
    } catch (error) {
      console.error(
        '❌ [SettingsContent] Unexpected error creating slug:',
        error
      );
      setSlugError('Something went wrong. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="flex-1 py-10 px-4 sm:px-8 lg:px-12 overflow-y-auto bg-neutral-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight">
            Account <span className="text-orange-400">Settings</span>
          </h1>
          <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto">
            Create your custom link and manage your account settings.
          </p>
        </div>

        {/* Main Settings Cards */}
        <div className="space-y-12">
          {/* Public Link Management (Primary Focus) */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
            {/* Card Header */}
            <div className="mb-8 border-b border-neutral-700 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-3 uppercase tracking-wider">
                <LinkIcon className="h-6 w-6 text-orange-400" />
                <span>Your Custom Link</span>
              </h2>
            </div>

            {/* Link Status Banner */}
            <div
              className={`p-4 rounded-xl mb-6 flex items-center space-x-3 transition-colors duration-300 ${
                linkGenerated
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-orange-500/10 border border-orange-500/20'
              }`}
            >
              {linkGenerated ? (
                <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-400 flex-shrink-0" />
              )}
              <p className="text-white font-medium text-sm">
                {linkGenerated
                  ? 'Awesome! Your link is ready to share with customers.'
                  : 'Create your own custom link below so customers can find you online.'}
              </p>
            </div>

            {/* Link Input/Display Block */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400 block">
                {linkGenerated ? 'Your Link' : 'Choose Your Custom Link Name'}
              </label>

              <div className="flex flex-col sm:flex-row rounded-xl overflow-hidden border border-neutral-600">
                {/* Domain Prefix */}
                <span className="py-3 px-4 bg-neutral-900 text-gray-400 font-mono text-base flex items-center flex-shrink-0">
                  {APP_DOMAIN}/
                </span>

                {/* Slug Display/Input */}
                {!linkGenerated ? (
                  <input
                    type="text"
                    value={customSlugInput}
                    onChange={e => setCustomSlugInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-neutral-700 text-white font-mono text-base outline-none focus:ring-0"
                    placeholder="Enter your custom link name (e.g., my-business-name)"
                    disabled={isUpdating}
                  />
                ) : (
                  <span className="flex-1 px-4 py-3 bg-neutral-700 text-orange-400 font-mono text-base break-all">
                    {currentSlug}
                  </span>
                )}
              </div>

              {/* Error Message */}
              {slugError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm font-medium flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{slugError}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons (Create or Copy/View) */}
            <div className="flex gap-4 pt-6 mt-4 border-t border-neutral-700">
              {!linkGenerated ? (
                <Button
                  onClick={handleSaveSlug}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isUpdating}
                  disabled={isUpdating || !customSlugInput.trim()}
                  icon={!isUpdating && <CheckCircleIcon className="h-5 w-5" />}
                >
                  {isUpdating ? 'Creating Your Link...' : 'Create My Link'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCopyLink}
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    icon={<ClipboardIcon className="h-5 w-5" />}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    onClick={handleViewProfile}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    icon={<LinkIcon className="h-5 w-5" />}
                  >
                    View My Profile
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
            {/* Card Header */}
            <div className="mb-6 border-b border-neutral-700 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-3 uppercase tracking-wider">
                <EnvelopeIcon className="h-6 w-6 text-orange-400" />
                <span>Contact Support</span>
              </h2>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <p className="text-gray-300 text-base leading-relaxed">
                Need help or have questions? We're here to support you!
              </p>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Support Email</p>
                    <a
                      href="mailto:app.servicelink@gmail.com"
                      className="text-orange-400 hover:text-orange-300 transition-colors duration-200 text-lg font-mono"
                    >
                      app.servicelink@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 text-sm">
                We typically respond within 24 hours. Include your business name
                in the subject line for faster support.
              </p>
            </div>
          </div>

          {/* Placeholder for future settings */}
          <div className="p-6 text-center text-gray-500 border-t border-neutral-800">
            <p>
              More features coming soon: Notifications, Integrations, and
              Billing settings.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
