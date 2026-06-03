'use client';

import React from 'react';
import { reviewReplyTextClass } from '../../constants/reviewTypography';
import { ReviewExpandableText } from './ReviewExpandableText';

interface ReviewOwnerReplyDisplayProps {
  body: string;
  className?: string;
  seeMoreLabel?: string;
  seeLessLabel?: string;
}

/** Owner reply under a customer review — shared by public profile and dashboard. */
export const ReviewOwnerReplyDisplay: React.FC<
  ReviewOwnerReplyDisplayProps
> = ({ body, className = 'mt-4 sm:mt-5', seeMoreLabel, seeLessLabel }) => {
  return (
    <figure
      className={`border-l border-zinc-700/80 pl-3 sm:border-zinc-700 sm:pl-4 ${className}`}
    >
      <blockquote>
        <ReviewExpandableText
          text={body}
          variant="ownerReply"
          className={reviewReplyTextClass}
          seeMoreLabel={seeMoreLabel}
          seeLessLabel={seeLessLabel}
        />
      </blockquote>
    </figure>
  );
};
