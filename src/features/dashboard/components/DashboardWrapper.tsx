'use client';

import { getSafePostAuthDashboardPath, ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dashboard } from './Dashboard';
import { DashboardLoadingState } from './DashboardLoadingState';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isInitialized } = useAuth();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      const safe = getSafePostAuthDashboardPath(pathname);
      router.replace(
        `${ROUTES.AUTH.LOGIN}?returnUrl=${encodeURIComponent(safe)}`
      );
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isInitialized && isAuthenticated && user?.id) {
        setIsLoadingOnboarding(true);
        const stateResult = await getOnboardingState(user.id);
        if (stateResult.success && stateResult.data?.status === 'completed') {
          setIsOnboardingCompleted(true);
        } else {
          setIsOnboardingCompleted(false);
        }
        setIsLoadingOnboarding(false);
      } else if (isInitialized && !isAuthenticated) {
        // If not authenticated, onboarding is not completed
        setIsOnboardingCompleted(false);
        setIsLoadingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isInitialized, isAuthenticated, user?.id]);

  if (!isAuthenticated && isInitialized) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)]">
        <DashboardLoadingState />
      </div>
    );
  }

  if (isLoadingOnboarding) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)]">
        <DashboardLoadingState />
      </div>
    );
  }

  return (
    <Dashboard isOnboardingCompleted={isOnboardingCompleted}>
      {children}
    </Dashboard>
  );
};
