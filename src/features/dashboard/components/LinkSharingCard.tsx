/**
 * LinkSharingCard - Quick access to copy your booking link
 */

'use client';

import { Button } from '@/components/shared';
import { DashboardGlassCard } from './DashboardGlassCard';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useState } from 'react';

interface LinkSharingCardProps {
  fullLink: string;
}

export const LinkSharingCard: React.FC<LinkSharingCardProps> = ({
  fullLink,
}) => {
  const [copied, setCopied] = useState(false);

  const copyLink = fullLink.startsWith('http')
    ? fullLink
    : `https://${fullLink}`;
  const displayLink = copyLink.replace(/^https?:\/\//, '');

  const handleCopyLink = useCallback(async () => {
    if (!copyLink) return;
    try {
      await navigator.clipboard.writeText(copyLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = copyLink;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('[ACTION] Could not copy text:', err);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [copyLink]);

  return (
    <DashboardGlassCard fillGridCell={false} className="w-full min-w-0">
      <p className="text-sm text-zinc-400 mb-3">Your booking link</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:gap-3">
        <p
          className="flex-1 min-w-0 truncate rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 lg:py-3 font-mono text-sm text-zinc-200"
          title={copyLink}
        >
          {displayLink}
        </p>
        <Button
          type="button"
          onClick={handleCopyLink}
          variant="inverse"
          className="w-full shrink-0 sm:w-auto sm:min-w-[88px] !rounded-lg"
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
    </DashboardGlassCard>
  );
};

export default LinkSharingCard;
