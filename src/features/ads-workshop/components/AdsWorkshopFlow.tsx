'use client';

import { ModernLoadingSpinner } from '@/components/shared';
import { useCallback, useEffect, useState } from 'react';

import {
  grantAdsWorkshopAccess,
  hasAdsWorkshopAccess,
} from '../utils/accessStorage';
import { AdsWorkshopContent } from './AdsWorkshopContent';
import { AdsWorkshopGateForm } from './AdsWorkshopGateForm';

export function AdsWorkshopFlow() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    setHasAccess(hasAdsWorkshopAccess());
  }, []);

  const handleAccessGranted = useCallback((_email: string) => {
    grantAdsWorkshopAccess();
    setHasAccess(true);
    requestAnimationFrame(() => {
      document
        .getElementById('workshop-video')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  if (hasAccess === null) {
    return (
      <div className="flex justify-center py-12">
        <ModernLoadingSpinner size="lg" variant="white" text="" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto w-full">
        <AdsWorkshopGateForm onAccessGranted={handleAccessGranted} />
      </div>
    );
  }

  return <AdsWorkshopContent />;
}
