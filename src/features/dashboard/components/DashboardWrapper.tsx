'use client';

import { Dashboard } from './Dashboard';

interface DashboardWrapperProps {
  children: React.ReactNode;
  isOnboardingCompleted: boolean;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  children,
  isOnboardingCompleted,
}) => {
  return (
    <Dashboard isOnboardingCompleted={isOnboardingCompleted}>
      {children}
    </Dashboard>
  );
};
