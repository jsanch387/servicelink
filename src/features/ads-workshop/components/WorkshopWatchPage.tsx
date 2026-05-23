'use client';

import { ModernLoadingSpinner } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigation } from '@/features/landing-page/components/Navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AdsWorkshopContent } from './AdsWorkshopContent';
import { WorkshopVideoViewTracker } from './WorkshopVideoViewTracker';
import { hasWorkshopAccess } from '../utils/accessStorage';

export function WorkshopWatchPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated || hasWorkshopAccess()) {
      setAllowed(true);
      return;
    }

    router.replace(ROUTES.WORKSHOP);
  }, [isAuthenticated, isInitialized, router]);

  return (
    <div className="min-h-[100dvh] bg-[var(--dashboard-bg)] flex flex-col">
      <Navigation />
      <div className="h-14 sm:h-20 shrink-0" aria-hidden />

      <main
        id="workshop-access"
        className="flex-1 w-full max-w-lg sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-10 md:py-14 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Workshop video"
      >
        {!allowed ? (
          <div className="flex justify-center py-16 sm:py-24">
            <ModernLoadingSpinner size="lg" variant="white" text="" />
          </div>
        ) : (
          <>
            <WorkshopVideoViewTracker />
            <AdsWorkshopContent />
          </>
        )}
      </main>
    </div>
  );
}
