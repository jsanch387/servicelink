export interface UserLifecycleMetrics {
  signupsToday: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  onboardingCompletedUsers: number;
  totalUsers: number;
  onboardingCompletionRate: number;
  totalBookings: number;
  bookingsLast7Days: number;
  bookingsLast30Days: number;
  generatedAtIso: string;
  usersWithCreatedService: number;
  usersWithUploadedImage: number;
  usersCompletedMainWorkflow: number;
  /** Sign-in emails from Supabase Auth for users who matched the main-workflow criteria. */
  mainWorkflowCompletedUserEmails: string[];
  topFeatures: Array<{
    feature: string;
    users: number;
  }>;
}

export interface UserLifecycleMetricsResult {
  metrics: UserLifecycleMetrics;
  warning: string | null;
}
