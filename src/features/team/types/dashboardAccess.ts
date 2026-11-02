import type {
  DashboardAccessRole,
  TeamPermission,
} from '../constants/teamPermissions';

export type DashboardAccessContext = {
  userId: string;
  businessId: string;
  isOwner: boolean;
  role: DashboardAccessRole;
  permissions: TeamPermission[];
};

export type ResolveDashboardContextResult =
  | { ok: true; context: DashboardAccessContext }
  | { ok: false; error: string; status: number };
