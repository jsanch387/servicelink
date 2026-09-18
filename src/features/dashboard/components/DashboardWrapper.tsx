'use client';

import type { DashboardAccessValue } from '../context/DashboardAccessContext';
import { Dashboard } from './Dashboard';

interface DashboardWrapperProps {
  children: React.ReactNode;
  isOnboardingCompleted: boolean;
  hasShopAccess: boolean;
  dashboardAccess: DashboardAccessValue;
  showMembershipsNav?: boolean;
  accountEmail?: string | null;
  hideChrome?: boolean;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  children,
  isOnboardingCompleted,
  hasShopAccess,
  dashboardAccess,
  showMembershipsNav = false,
  accountEmail = null,
  hideChrome = false,
}) => {
  return (
    <Dashboard
      isOnboardingCompleted={isOnboardingCompleted}
      hasShopAccess={hasShopAccess}
      dashboardAccess={dashboardAccess}
      showMembershipsNav={showMembershipsNav}
      accountEmail={accountEmail}
      hideChrome={hideChrome}
    >
      {children}
    </Dashboard>
  );
};
