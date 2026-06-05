import React from 'react';
import { AppStoreDownloadBadge } from './AppStoreDownloadBadge';
import { GooglePlayDownloadBadge } from './GooglePlayDownloadBadge';

export const HeroAppStoreBadges: React.FC = () => {
  return (
    <div className="mt-6 sm:mt-8 flex flex-wrap items-end justify-center gap-3 sm:gap-4">
      <AppStoreDownloadBadge />
      <GooglePlayDownloadBadge />
    </div>
  );
};
