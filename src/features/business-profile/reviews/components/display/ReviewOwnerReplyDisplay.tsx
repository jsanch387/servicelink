'use client';

import React from 'react';

interface ReviewOwnerReplyDisplayProps {
  body: string;
  className?: string;
}

/** Owner reply under a customer review — shared by public profile and dashboard. */
export const ReviewOwnerReplyDisplay: React.FC<
  ReviewOwnerReplyDisplayProps
> = ({ body, className = 'mt-5' }) => {
  return (
    <figure className={`border-l border-zinc-700 pl-4 ${className}`}>
      <blockquote className="text-sm leading-relaxed text-zinc-400">
        {body}
      </blockquote>
    </figure>
  );
};
