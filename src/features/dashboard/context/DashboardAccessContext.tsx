'use client';

import {
  can,
  type TeamPermission,
} from '@/features/team/constants/teamPermissions';
import React, { createContext, useContext, useMemo } from 'react';

import {
  NO_DASHBOARD_ACCESS,
  type DashboardAccessValue,
} from '../constants/dashboardAccess';

export type { DashboardAccessValue } from '../constants/dashboardAccess';
export { NO_DASHBOARD_ACCESS } from '../constants/dashboardAccess';

const DashboardAccessContext =
  createContext<DashboardAccessValue>(NO_DASHBOARD_ACCESS);

export function DashboardAccessProvider({
  value,
  children,
}: {
  value: DashboardAccessValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardAccessContext.Provider value={value}>
      {children}
    </DashboardAccessContext.Provider>
  );
}

export function useDashboardAccess() {
  const value = useContext(DashboardAccessContext);

  return useMemo(
    () => ({
      ...value,
      can: (permission: TeamPermission) => can(value, permission),
    }),
    [value]
  );
}
