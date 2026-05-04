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
  /** Pro users with Stripe `active` status, valid period, and a subscription id (excludes trialing and tier-only). */
  payingActiveSubscribers: number;
  /** Pro users on Stripe free trial (`trialing`) with valid period and subscription id. */
  proTrialSubscribers: number;
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
