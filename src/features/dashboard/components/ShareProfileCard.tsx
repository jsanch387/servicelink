'use client';

import React, { useState } from 'react';
import {
  LinkIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth';
import { Card, Button, IconButton } from '@/components/shared';
import { Input } from '@/components/shared';
import type { ShareableLinkData } from '../types/dashboard';

export const ShareProfileCard: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Mock shareable link data (replace with real API call)
  const shareData: ShareableLinkData = {
    publicUrl: `https://businesslink.com/profile/apex-auto-spa-${user?.profileId?.slice(-4) || '1234'}`,
    businessSlug: `apex-auto-spa-${user?.profileId?.slice(-4) || '1234'}`,
    isPublished: true,
    viewCount: 12,
    lastViewed: '2024-01-15',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <ShareIcon className="h-5 w-5 text-blue-400" />
          <span>Share Your Profile</span>
        </h3>
      </div>

      <p className="text-gray-300 mb-4">
        Share your business profile with customers and post it on your social
        media, website, or business cards.
      </p>

      {/* Shareable Link */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Your Public Profile Link
        </label>

        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              value={shareData.publicUrl}
              onChange={() => {}} // Read-only
              className="text-sm"
              disabled
            />
          </div>

          <IconButton
            icon={<ClipboardDocumentIcon />}
            onClick={handleCopy}
            variant="secondary"
            title="Copy to clipboard"
            aria-label="Copy to clipboard"
          />

          <IconButton
            icon={<LinkIcon />}
            onClick={() => window.open(shareData.publicUrl, '_blank')}
            variant="success"
            title="Preview your profile"
            aria-label="Preview your profile"
          />
        </div>

        {copied && (
          <div className="mt-2 text-xs text-green-400">
            Link copied to clipboard!
          </div>
        )}
      </div>
    </Card>
  );
};
