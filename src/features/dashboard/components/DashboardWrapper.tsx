'use client';

import { Dashboard } from './Dashboard';

interface DashboardWrapperProps {
  children: React.ReactNode;
  isOnboardingCompleted: boolean;
  showMembershipsNav?: boolean;
  accountEmail?: string | null;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  children,
  isOnboardingCompleted,
  showMembershipsNav = false,
  accountEmail = null,
}) => {
  return (
    <Dashboard
      isOnboardingCompleted={isOnboardingCompleted}
      showMembershipsNav={showMembershipsNav}
      accountEmail={accountEmail}
    >
      {children}
    </Dashboard>
  );
};
