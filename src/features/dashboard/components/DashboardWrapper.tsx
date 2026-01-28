'use client';

import { ModernLoadingSpinner } from '@/components/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getOnboardingState } from '@/features/onboarding/utils/onboardingHelpers';
import { useEffect, useState } from 'react';
import { Dashboard } from './Dashboard';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  children,
}) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);

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

  if (isLoadingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <ModernLoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <Dashboard isOnboardingCompleted={isOnboardingCompleted}>
      {children}
    </Dashboard>
  );
};
