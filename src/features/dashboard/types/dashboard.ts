import type { DashboardAccessValue } from '../context/DashboardAccessContext';

export interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  hasCompletedOnboarding: boolean;
  profileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareableLinkData {
  publicUrl: string;
  businessSlug: string;
  isPublished: boolean;
  viewCount: number;
  lastViewed?: string;
}

export interface DashboardStats {
  profileViews: number;
  lastUpdated: string;
  isPublished: boolean;
  completionPercentage: number;
}

export interface DashboardProps {
  children?: React.ReactNode;
  isOnboardingCompleted?: boolean;
  /** Owner finished setup, or an active teammate on that shop. */
  hasShopAccess?: boolean;
  dashboardAccess?: DashboardAccessValue;
  /** Memberships / Subscriptions nav — rollout gate (open to all when enabled). */
  showMembershipsNav?: boolean;
  /** Signed-in account email for the dashboard help widget. */
  accountEmail?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DashboardContentProps {
  // No props needed for now
}

export interface DashboardHeaderProps {
  onMenuClick: () => void;
  sidebarOpen?: boolean;
  /** Hide notification bell when false (e.g. during onboarding to avoid routing to not-ready experiences) */
  showNotifications?: boolean;
}

export interface DashboardSidebarProps {
  open: boolean;

  setOpen: (_open: boolean) => void;
  hasShopAccess?: boolean;
  showMembershipsNav?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}
