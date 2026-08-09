'use client';

import { Dashboard } from './Dashboard';

interface DashboardWrapperProps {
  children: React.ReactNode;
  isOnboardingCompleted: boolean;
  showMembershipsNav?: boolean;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  children,
  isOnboardingCompleted,
  showMembershipsNav = false,
}) => {
  return (
    <Dashboard
      isOnboardingCompleted={isOnboardingCompleted}
      showMembershipsNav={showMembershipsNav}
    >
      {children}
    </Dashboard>
  );
};
