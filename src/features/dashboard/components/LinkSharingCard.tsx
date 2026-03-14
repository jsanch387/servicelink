/**
 * LinkSharingCard - Copyable public link in a glass morphism card
 */

'use client';

import { Button, GlassCard } from '@/components/shared';
import { ClipboardDocumentIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
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
      }
    } catch (err) {
      console.error('[ACTION] Could not copy text:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }, [fullLink]);

  const copyLink = fullLink.startsWith('http')
    ? fullLink
    : `https://${fullLink}`;
  const displayLink = copyLink.replace(/^https?:\/\//, '');

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur={true}
      className="w-full min-w-0 p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] flex-shrink-0">
          <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white/80" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">
            Your Public ServiceLink
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Share with customers — live and ready.
          </p>
        </div>
      </div>
      {/* Link + Copy: stacked on mobile, inline on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-3 sm:px-4 sm:py-3">
          <p
            className="font-mono text-xs sm:text-sm text-gray-300 truncate"
            title={copyLink}
          >
            {displayLink}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleCopyLink}
          variant="inverse"
          fullWidth
          className="sm:w-auto sm:flex-shrink-0 sm:min-w-[100px] sm:flex-initial"
          icon={
            copied ? (
              <CheckIcon className="h-4 w-4 text-emerald-600" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )
          }
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </GlassCard>
  );
};

export default LinkSharingCard;
