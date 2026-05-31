'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  reviewCollapsedMaxChars,
  reviewTextNeedsExpand,
  truncateReviewText,
  type ReviewExpandableTextVariant,
} from '../../utils/reviewTextDisplay';
import { reviewExpandToggleClass } from '../../constants/reviewTypography';

function subscribeDesktopMq(onStoreChange: () => void): () => void {
  const mq = window.matchMedia('(min-width: 640px)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getDesktopMqSnapshot(): boolean {
  return window.matchMedia('(min-width: 640px)').matches;
}

function useIsDesktopViewport(): boolean {
  return useSyncExternalStore(
    subscribeDesktopMq,
    getDesktopMqSnapshot,
    () => false
  );
}

interface ReviewExpandableTextProps {
  text: string;
  variant: ReviewExpandableTextVariant;
  className?: string;
  seeMoreLabel?: string;
  seeLessLabel?: string;
}

export const ReviewExpandableText: React.FC<ReviewExpandableTextProps> = ({
  text,
  variant,
  className = '',
  seeMoreLabel = 'See more',
  seeLessLabel = 'Show less',
}) => {
  const isDesktop = useIsDesktopViewport();
  const [expanded, setExpanded] = useState(false);

  const maxChars = reviewCollapsedMaxChars(variant, isDesktop);
  const needsExpand = reviewTextNeedsExpand(text, maxChars);

  const displayText = useMemo(() => {
    if (!needsExpand || expanded) return text;
    return truncateReviewText(text, maxChars);
  }, [text, needsExpand, expanded, maxChars]);

  if (!text.trim()) {
    return null;
  }

  return (
    <div>
      <p className={`whitespace-pre-line break-words ${className}`}>
        {displayText}
      </p>
      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className={`mt-1 inline-flex min-h-[44px] min-w-[44px] -ml-2 items-center gap-1 pl-2 transition-colors hover:text-zinc-400 active:text-zinc-400 sm:mt-1.5 sm:hover:text-zinc-300 sm:active:text-zinc-300 touch-manipulation ${reviewExpandToggleClass}`}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {seeLessLabel}
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {seeMoreLabel}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
};
