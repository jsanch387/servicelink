'use client';

import React from 'react';

type BookingSaleAppliesNoticeProps = {
  line: string;
};

/** One-line notice when an active sale auto-applies to the chosen appointment date. */
export function BookingSaleAppliesNotice({ line }: BookingSaleAppliesNoticeProps) {
  return (
    <p className="text-sm text-amber-200/90 leading-snug" role="status">
      {line}
    </p>
  );
}
