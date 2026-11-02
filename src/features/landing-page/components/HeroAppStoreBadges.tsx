import React from 'react';
import { AppStoreDownloadBadge } from './AppStoreDownloadBadge';
import { GooglePlayDownloadBadge } from './GooglePlayDownloadBadge';

export const HeroAppStoreBadges: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-end justify-center gap-3 sm:gap-4 ${className}`.trim()}
    >
      <AppStoreDownloadBadge />
      <GooglePlayDownloadBadge />
    </div>
  );
};
