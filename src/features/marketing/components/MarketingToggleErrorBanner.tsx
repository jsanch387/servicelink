'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface MarketingToggleErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const MarketingToggleErrorBanner: React.FC<
  MarketingToggleErrorBannerProps
> = ({ message, onDismiss }) => {
  return (
    <div
      className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
      role="alert"
    >
      <p className="text-sm text-red-300">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="cursor-pointer shrink-0 rounded p-1 text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
        aria-label="Dismiss error"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
