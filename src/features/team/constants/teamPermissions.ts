/** Capability keys. Check `can(ctx, 'bookings.read')`, never `role === 'member'`. */
export const TEAM_PERMISSIONS = [
  'dashboard.read',
  'bookings.read',
  'bookings.run',
  'bookings.write',
  'customers.read',
  'customers.write',
  'quotes.read',
  'quotes.write',
  'reviews.read',
  'reviews.write',
  'profile.write',
  'services.write',
  'availability.write',
  'marketing.write',
  'billing.manage',
  'payments.manage',
  'team.manage',
  'account.delete',
] as const;

export type TeamPermission = (typeof TEAM_PERMISSIONS)[number];

/** Access role for the current shop. Owner is never a `business_members` row. */
export const DASHBOARD_ACCESS_ROLES = ['owner', 'member', 'manager'] as const;
export type DashboardAccessRole = (typeof DASHBOARD_ACCESS_ROLES)[number];

const WORK_READ: TeamPermission[] = [
  'dashboard.read',
  'bookings.read',
  'customers.read',
  'quotes.read',
  'reviews.read',
];

const JOB_RUN: TeamPermission[] = ['bookings.run'];

const WORK_WRITE: TeamPermission[] = [
  'bookings.write',
  'customers.write',
  'quotes.write',
  'reviews.write',
];

const SHOP_SETUP: TeamPermission[] = [
  'profile.write',
  'services.write',
  'availability.write',
  'marketing.write',
];

export const ROLE_PERMISSIONS: Record<DashboardAccessRole, TeamPermission[]> = {
  owner: [...TEAM_PERMISSIONS],
  member: [...WORK_READ, ...JOB_RUN],
  manager: [...WORK_READ, ...JOB_RUN, ...WORK_WRITE, ...SHOP_SETUP],
};

export function isTeamPermission(value: string): value is TeamPermission {
  return (TEAM_PERMISSIONS as readonly string[]).includes(value);
}

export function isDashboardAccessRole(
  value: string
): value is DashboardAccessRole {
  return (DASHBOARD_ACCESS_ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(
  role: DashboardAccessRole
): TeamPermission[] {
  return ROLE_PERMISSIONS[role];
}

export type DashboardPermissionContext = {
  isOwner: boolean;
  permissions: readonly TeamPermission[];
};

export function can(
  ctx: DashboardPermissionContext,
  permission: TeamPermission
): boolean {
  if (ctx.isOwner) return true;
  return ctx.permissions.includes(permission);
}
