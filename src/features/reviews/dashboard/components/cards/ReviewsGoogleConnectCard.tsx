'use client';

import { Button, GoogleIcon, IconButton } from '@/components/shared';
import { copyTextToClipboardSync } from '@/lib/copyTextToClipboard';
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import {
  GOOGLE_CONNECT_CONNECTED_STATUS,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_DISCONNECT,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_REVIEW_LINK_COPIED,
  GOOGLE_CONNECT_REVIEW_LINK_COPY,
  GOOGLE_CONNECT_REVIEW_LINK_LABEL,
  GOOGLE_CONNECT_REVIEW_LINK_MISSING,
  GOOGLE_CONNECT_REVIEW_LINK_OPEN,
  GOOGLE_CONNECT_TITLE,
} from '../../copy/googleConnectCopy';

type ReviewsGoogleConnectCardProps = {
  connected?: boolean;
  loading?: boolean;
  connectLoading?: boolean;
  connectError?: string | null;
  googleReviewUrl?: string | null;
  onDisconnect?: () => void;
  onConnect: () => void;
};

function ReviewsGoogleConnectCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-28 rounded-lg bg-white/15" />
        <div className="h-4 w-16 rounded bg-white/[0.08]" />
      </div>
      <div className="mt-4">
        <div className="h-3 w-16 rounded bg-white/[0.08]" />
        <div className="mt-1.5 h-9 w-full rounded-[10px] bg-white/[0.06]" />
      </div>
    </div>
  );
}

export const ReviewsGoogleConnectCard: React.FC<
  ReviewsGoogleConnectCardProps
> = ({
  connected = false,
  loading = false,
  connectLoading = false,
  connectError = null,
  googleReviewUrl = null,
  onDisconnect,
  onConnect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!googleReviewUrl) return;
    if (!copyTextToClipboardSync(googleReviewUrl)) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (loading) {
    return <ReviewsGoogleConnectCardSkeleton />;
  }

  if (!connected) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
        <h3 className="text-base font-semibold tracking-tight text-white">
          {GOOGLE_CONNECT_TITLE}
        </h3>
        <p className="mt-1 text-sm leading-snug text-zinc-400">
          {GOOGLE_CONNECT_LEAD}
        </p>
        {connectError ? (
          <p className="mt-3 text-xs leading-relaxed text-red-300" role="alert">
            {connectError}
          </p>
        ) : null}
        <div className="mt-4">
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="w-full cursor-pointer sm:w-auto"
            icon={<GoogleIcon className="h-4 w-4" />}
            loading={connectLoading}
            disabled={connectLoading}
            onClick={onConnect}
          >
            {GOOGLE_CONNECT_CTA}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="inline-flex h-9 min-h-9 cursor-default select-none items-center justify-center gap-2 rounded-lg bg-white px-3.5 text-sm font-medium text-black"
          role="status"
          aria-label={GOOGLE_CONNECT_CONNECTED_STATUS}
        >
          <GoogleIcon className="h-4 w-4 shrink-0" />
          {GOOGLE_CONNECT_CONNECTED_STATUS}
        </span>
        {onDisconnect ? (
          <button
            type="button"
            className="cursor-pointer shrink-0 text-sm font-medium text-zinc-300 hover:text-white"
            onClick={onDisconnect}
          >
            {GOOGLE_CONNECT_DISCONNECT}
          </button>
        ) : null}
      </div>

      {connectError ? (
        <p className="mt-3 text-xs leading-relaxed text-red-300" role="alert">
          {connectError}
        </p>
      ) : null}

      <div className="mt-4 min-w-0">
        <p className="text-xs font-medium text-zinc-500">
          {GOOGLE_CONNECT_REVIEW_LINK_LABEL}
        </p>
        {googleReviewUrl ? (
          <div className="mt-1.5 flex min-w-0 items-center gap-1 rounded-[10px] border border-white/[0.08] bg-black/25 py-1 pl-3 pr-1">
            <p
              className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300"
              title={googleReviewUrl}
            >
              {googleReviewUrl}
            </p>
            <IconButton
              size="sm"
              variant="ghost"
              className="shrink-0 text-zinc-400 hover:text-white"
              icon={
                copied ? (
                  <CheckIcon className="h-4 w-4" aria-hidden />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                )
              }
              aria-label={
                copied
                  ? GOOGLE_CONNECT_REVIEW_LINK_COPIED
                  : GOOGLE_CONNECT_REVIEW_LINK_COPY
              }
              title={
                copied
                  ? GOOGLE_CONNECT_REVIEW_LINK_COPIED
                  : GOOGLE_CONNECT_REVIEW_LINK_COPY
              }
              onClick={handleCopy}
            />
            <IconButton
              size="sm"
              variant="ghost"
              className="shrink-0 text-zinc-400 hover:text-white"
              icon={
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
              }
              aria-label={GOOGLE_CONNECT_REVIEW_LINK_OPEN}
              title={GOOGLE_CONNECT_REVIEW_LINK_OPEN}
              onClick={() =>
                window.open(googleReviewUrl, '_blank', 'noopener,noreferrer')
              }
            />
          </div>
        ) : (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            {GOOGLE_CONNECT_REVIEW_LINK_MISSING}
          </p>
        )}
      </div>
    </div>
  );
};
