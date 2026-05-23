'use client';

import { ModernLoadingSpinner } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigation } from '@/features/landing-page/components/Navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { grantWorkshopAccess, hasWorkshopAccess } from '../utils/accessStorage';
import { captureWorkshopUtmsFromWindow } from '../utils/workshopUtmCapture';
import { AdsWorkshopGateForm } from './AdsWorkshopGateForm';
import { AdsWorkshopHero } from './AdsWorkshopHero';

export function WorkshopGatePage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    captureWorkshopUtmsFromWindow();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated || hasWorkshopAccess()) {
      router.replace(ROUTES.WORKSHOP_WATCH);
      return;
    }

    setShowGate(true);
  }, [isAuthenticated, isInitialized, router]);

  const handleAccessGranted = () => {
    const granted = grantWorkshopAccess();
    if (!granted) {
      // Rare: both storages blocked — still attempt navigation; watch may bounce.
      console.warn(
        '[workshop] Could not persist access flag in browser storage'
      );
    }
    router.push(ROUTES.WORKSHOP_WATCH);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--dashboard-bg)] flex flex-col">
      <Navigation />
      <div className="h-14 sm:h-20 shrink-0" aria-hidden />

      <main className="flex-1 w-full max-w-lg sm:max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-10 md:py-14 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {!showGate ? (
          <div className="flex justify-center py-16 sm:py-24">
            <ModernLoadingSpinner size="lg" variant="white" text="" />
          </div>
        ) : (
          <>
            <AdsWorkshopHero />
            <AdsWorkshopGateForm onAccessGranted={handleAccessGranted} />
          </>
        )}
      </main>
    </div>
  );
}
