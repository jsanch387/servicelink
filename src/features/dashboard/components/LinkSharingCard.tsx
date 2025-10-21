/**
 * LinkSharingCard - Main card for displaying and sharing the business link
 * Focuses on the primary action of copying and sharing the link
 */

'use client';

import { Button } from '@/components/shared';
import { ClipboardIcon, LinkIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';

interface LinkSharingCardProps {
  fullLink: string;
  slug: string;
  appDomain: string;
}

export const LinkSharingCard: React.FC<LinkSharingCardProps> = ({
  fullLink,
  slug,
  appDomain,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (!fullLink) return;

    // Ensure the link has HTTPS protocol for proper sharing
    const shareableLink = fullLink.startsWith('http')
      ? fullLink
      : `https://${fullLink}`;

    const textarea = document.createElement('textarea');
    textarea.value = shareableLink;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        console.log(`[ACTION] Copied link: ${shareableLink}`);
      }
    } catch (err) {
      console.error('[ACTION] Could not copy text:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }, [fullLink]);

  return (
    <div className="bg-neutral-800 p-4 sm:p-6 lg:p-8 rounded-2xl border-2 border-orange-500/30">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2 sm:space-x-3">
        <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-400 flex-shrink-0" />
        <span>Your Public ServiceLink</span>
      </h2>
      <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
        This is the link you share everywhere. It&apos;s live and ready for
        customers!
      </p>

      {/* Link Display Block */}
      <div className="flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-600 mb-4 sm:mb-6">
        {/* Domain Prefix */}
        <span className="py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-5 bg-neutral-900 text-gray-400 font-mono text-sm sm:text-base flex items-center flex-shrink-0">
          {appDomain}/
        </span>
        {/* Slug */}
        <span className="flex-1 py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-5 bg-neutral-900 text-orange-400 font-mono text-sm sm:text-base break-all border-t border-neutral-700">
          {slug}
        </span>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleCopyLink}
        variant="secondary"
        size="lg"
        className="w-full"
        icon={<ClipboardIcon className="h-5 w-5" />}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
    </div>
  );
};

export default LinkSharingCard;
