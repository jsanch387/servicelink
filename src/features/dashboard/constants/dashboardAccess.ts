import type {
  DashboardAccessRole,
  TeamPermission,
} from '@/features/team/constants/teamPermissions';

export type DashboardAccessValue = {
  isOwner: boolean;
  role: DashboardAccessRole;
  permissions: TeamPermission[];
};

/** Shop lookup failed. No owner links until a real role is known. */
export const NO_DASHBOARD_ACCESS: DashboardAccessValue = {
  isOwner: false,
  role: 'member',
  permissions: [],
};
