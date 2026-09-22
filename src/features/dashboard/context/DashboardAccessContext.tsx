'use client';

import {
  can,
  permissionsForRole,
  type DashboardAccessRole,
  type TeamPermission,
} from '@/features/team/constants/teamPermissions';
import React, { createContext, useContext, useMemo } from 'react';

export type DashboardAccessValue = {
  isOwner: boolean;
  role: DashboardAccessRole;
  permissions: TeamPermission[];
};

const DEFAULT_ACCESS: DashboardAccessValue = {
  isOwner: true,
  role: 'owner',
  permissions: permissionsForRole('owner'),
};

const DashboardAccessContext =
  createContext<DashboardAccessValue>(DEFAULT_ACCESS);

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
