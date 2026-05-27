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
  isOnboardingCompleted?: boolean;
}
