/** Capability keys. Check `can(ctx, 'bookings.read')`, never `role === 'member'`. */
export const TEAM_PERMISSIONS = [
  'dashboard.read',
  'bookings.read',
  'bookings.run',
  'bookings.write',
  'bookings.delete',
  'customers.read',
  'customers.write',
  'quotes.read',
  'quotes.write',
  'invoices.read',
  'invoices.write',
  'expenses.read',
  'expenses.write',
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
export const DASHBOARD_ACCESS_ROLES = [
  'owner',
  'member',
  'coordinator',
  'manager',
] as const;
export type DashboardAccessRole = (typeof DASHBOARD_ACCESS_ROLES)[number];

/** Hired help: the board and the job — not the owner’s CRM / quotes / reviews. */
const MEMBER_READ: TeamPermission[] = ['dashboard.read', 'bookings.read'];

const JOB_RUN: TeamPermission[] = ['bookings.run'];

const SHOP_SETUP: TeamPermission[] = [
  'profile.write',
  'services.write',
  'availability.write',
  'marketing.write',
];

const COORDINATOR: TeamPermission[] = [
  ...MEMBER_READ,
  ...JOB_RUN,
  'bookings.write',
  'bookings.delete',
];

/** Office the manager runs. Not billing, payouts, the team, or deleting the account. */
const MANAGER_OFFICE: TeamPermission[] = [
  'customers.read',
  'customers.write',
  'quotes.read',
  'quotes.write',
  'invoices.read',
  'invoices.write',
  'expenses.read',
  'expenses.write',
  'reviews.read',
  'reviews.write',
  ...SHOP_SETUP,
];

export const ROLE_PERMISSIONS: Record<DashboardAccessRole, TeamPermission[]> = {
  owner: [...TEAM_PERMISSIONS],
  member: [...MEMBER_READ, ...JOB_RUN],
  coordinator: COORDINATOR,
  manager: [...COORDINATOR, ...MANAGER_OFFICE],
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
