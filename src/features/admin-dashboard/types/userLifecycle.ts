import type { SignupAttributionPayload } from '@/features/analytics/signupAttribution';

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
  /** Sign-in emails for {@link payingActiveSubscribers}. */
  payingActiveSubscriberEmails: string[];
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
  /** Businesses with a Stripe Connect row. */
  stripeConnectAccounts: number;
  /** Connect accounts with charges_enabled. */
  stripeChargesEnabledAccounts: number;
  /** Owners who turned on ServiceLink checkout (payments_enabled). */
  paymentsEnabledBusinesses: number;
  /** Bookings with money collected online (Stripe). */
  bookingsWithOnlinePayment: number;
  /** Sum of paid_online_amount_cents across booking_payments. */
  totalOnlineRevenueCents: number;
  /** accept_bookings on business_availability. */
  availabilityBookingEnabled: number;
  /** accept_quote_req on business_profile. */
  quoteRequestsEnabled: number;
  /** Signups grouped by derived channel. */
  signupSourceBreakdown: SignupSourceBreakdownRow[];
  /** Recent signups with email + attribution (newest first). */
  recentSignupsWithAttribution: RecentSignupAttributionRow[];
  /** When true, run the signup_attribution migration. */
  attributionDataUnavailable: boolean;
}

export interface SignupSourceBreakdownRow {
  channel: string;
  count: number;
  percent: number;
}

export interface RecentSignupAttributionRow {
  userId: string;
  email: string | null;
  signedUpAt: string;
  channel: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPath: string | null;
}

export type StoredSignupAttribution = SignupAttributionPayload;

export interface UserLifecycleMetricsResult {
  metrics: UserLifecycleMetrics;
  warning: string | null;
}
