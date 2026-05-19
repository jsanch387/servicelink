import { deriveSignupChannel } from '@/features/analytics/signupAttribution';
import { isProAccess } from '@/features/pricing/utils/isProAccess';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type {
  RecentSignupAttributionRow,
  SignupSourceBreakdownRow,
  StoredSignupAttribution,
  UserLifecycleMetrics,
  UserLifecycleMetricsResult,
} from '../types/userLifecycle';

const AUTH_EMAIL_LOOKUP_CHUNK = 20;

async function fetchAuthEmailMapForUserIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let i = 0; i < userIds.length; i += AUTH_EMAIL_LOOKUP_CHUNK) {
    const chunk = userIds.slice(i, i + AUTH_EMAIL_LOOKUP_CHUNK);
    const chunkResults = await Promise.all(
      chunk.map(async userId => {
        try {
          const {
            data: { user },
          } = await supabase.auth.admin.getUserById(userId);
          const email = user?.email?.trim();
          return { userId, email: email && email.length > 0 ? email : null };
        } catch {
          return { userId, email: null };
        }
      })
    );
    for (const { userId, email } of chunkResults) {
      if (email) map.set(userId, email);
    }
  }
  return map;
}

async function fetchAuthEmailsForUserIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userIds: string[]
): Promise<string[]> {
  const map = await fetchAuthEmailMapForUserIds(supabase, userIds);
  return [...new Set(map.values())].sort((a, b) => a.localeCompare(b));
}

function toIsoDateStart(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

function emptyProductMetrics(): Pick<
  UserLifecycleMetrics,
  | 'stripeConnectAccounts'
  | 'stripeChargesEnabledAccounts'
  | 'paymentsEnabledBusinesses'
  | 'bookingsWithOnlinePayment'
  | 'totalOnlineRevenueCents'
  | 'availabilityBookingEnabled'
  | 'quoteRequestsEnabled'
  | 'signupSourceBreakdown'
  | 'recentSignupsWithAttribution'
  | 'attributionDataUnavailable'
> {
  return {
    stripeConnectAccounts: 0,
    stripeChargesEnabledAccounts: 0,
    paymentsEnabledBusinesses: 0,
    bookingsWithOnlinePayment: 0,
    totalOnlineRevenueCents: 0,
    availabilityBookingEnabled: 0,
    quoteRequestsEnabled: 0,
    signupSourceBreakdown: [],
    recentSignupsWithAttribution: [],
    attributionDataUnavailable: false,
  };
}

function buildSignupSourceBreakdown(
  profiles: Array<{
    signup_channel: string | null;
    signup_attribution: StoredSignupAttribution | null;
  }>,
  totalUsers: number
): SignupSourceBreakdownRow[] {
  const counts = new Map<string, number>();
  for (const row of profiles) {
    const channel =
      row.signup_channel?.trim() ||
      (row.signup_attribution
        ? deriveSignupChannel(row.signup_attribution)
        : 'Not tracked yet');
    counts.set(channel, (counts.get(channel) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([channel, count]) => ({
      channel,
      count,
      percent:
        totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

async function buildRecentSignupsWithAttribution(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  rows: Array<{
    user_id: string;
    created_at: string;
    signup_channel: string | null;
    signup_attribution: StoredSignupAttribution | null;
  }>
): Promise<RecentSignupAttributionRow[]> {
  const slice = rows.slice(0, 50);
  const ids = slice.map(r => r.user_id);
  const emailsByUserId = await fetchAuthEmailMapForUserIds(supabase, ids);

  return slice.map(row => {
    const attr = row.signup_attribution;
    const channel =
      row.signup_channel?.trim() ||
      (attr ? deriveSignupChannel(attr) : 'Not tracked yet');
    return {
      userId: row.user_id,
      email: emailsByUserId.get(row.user_id) ?? null,
      signedUpAt: row.created_at,
      channel,
      utmSource: attr?.utm_source ?? null,
      utmMedium: attr?.utm_medium ?? null,
      utmCampaign: attr?.utm_campaign ?? null,
      landingPath: attr?.landing_path ?? null,
    };
  });
}

export async function getUserLifecycleMetrics(): Promise<UserLifecycleMetricsResult> {
  const generatedAtIso = new Date().toISOString();
  const todayStartIso = toIsoDateStart(0);
  const sevenDaysAgoIso = toIsoDateStart(6);
  const thirtyDaysAgoIso = toIsoDateStart(29);
  const sevenDaysAgoDate = sevenDaysAgoIso.slice(0, 10);
  const thirtyDaysAgoDate = thirtyDaysAgoIso.slice(0, 10);

  try {
    const supabase = createSupabaseAdminClient();

    const [
      signupsTodayResult,
      signups7dResult,
      signups30dResult,
      totalUsersResult,
      onboardingCompletedResult,
      totalBookingsResult,
      bookings7dResult,
      bookings30dResult,
      usageRowsResult,
      subscriptionRowsResult,
      paymentAccountsResult,
      paymentsEnabledResult,
      bookingPaymentsResult,
      availabilityResult,
      quoteRequestsResult,
      attributionChannelsResult,
      recentProfilesResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', todayStartIso),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoIso),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoIso),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('onboarding_status', 'completed'),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', sevenDaysAgoDate),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', thirtyDaysAgoDate),
      supabase.from('business_profiles').select(
        `
          profile_id,
          business_slug,
          services:business_services(count),
          images:business_images(count)
        `
      ),
      supabase
        .from('profiles')
        .select(
          'subscription_tier, subscription_status, subscription_current_period_end, stripe_subscription_id'
        )
        .eq('subscription_tier', 'pro')
        .not('stripe_subscription_id', 'is', null)
        .in('subscription_status', ['active', 'trialing']),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('payment_accounts').select('id, charges_enabled'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('payment_settings')
        .select('id')
        .eq('payments_enabled', true),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('booking_payments')
        .select('paid_online_amount_cents, payment_status, provider'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('business_availability')
        .select('id')
        .eq('accept_bookings', true),
      supabase
        .from('business_profiles')
        .select('id')
        .eq('accept_quote_req', true),
      supabase
        .from('profiles')
        .select('signup_channel, signup_attribution'),
      supabase
        .from('profiles')
        .select(
          'user_id, created_at, signup_channel, signup_attribution'
        )
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const attributionColumnMissing = Boolean(
      attributionChannelsResult.error?.message?.includes(
        'signup_attribution'
      ) ||
        attributionChannelsResult.error?.code === '42703' ||
        recentProfilesResult.error?.message?.includes('signup_attribution')
    );

    const warning =
      signupsTodayResult.error?.message ||
      signups7dResult.error?.message ||
      signups30dResult.error?.message ||
      totalUsersResult.error?.message ||
      onboardingCompletedResult.error?.message ||
      totalBookingsResult.error?.message ||
      bookings7dResult.error?.message ||
      bookings30dResult.error?.message ||
      usageRowsResult.error?.message ||
      subscriptionRowsResult.error?.message ||
      paymentAccountsResult.error?.message ||
      paymentsEnabledResult.error?.message ||
      bookingPaymentsResult.error?.message ||
      availabilityResult.error?.message ||
      quoteRequestsResult.error?.message ||
      (attributionChannelsResult.error && !attributionColumnMissing
        ? attributionChannelsResult.error.message
        : null) ||
      null;

    type SubscriptionRow = {
      subscription_tier: string | null;
      subscription_status: string | null;
      subscription_current_period_end: string | null;
      stripe_subscription_id: string | null;
    };
    const subscriptionRows = (subscriptionRowsResult.data ??
      []) as SubscriptionRow[];
    let payingActiveSubscribers = 0;
    let proTrialSubscribers = 0;
    for (const row of subscriptionRows) {
      if (
        !row.stripe_subscription_id?.trim() ||
        !isProAccess(
          row.subscription_tier,
          row.subscription_current_period_end
        )
      ) {
        continue;
      }
      const status = row.subscription_status?.trim().toLowerCase();
      if (status === 'active') payingActiveSubscribers += 1;
      else if (status === 'trialing') proTrialSubscribers += 1;
    }

    type UsageRow = {
      profile_id: string;
      business_slug: string | null;
      services: Array<{ count: number }> | null;
      images: Array<{ count: number }> | null;
    };
    const usageRows = (usageRowsResult.data ?? []) as UsageRow[];

    const usersWithCreatedService = usageRows.filter(
      row => (row.services?.[0]?.count ?? 0) > 0
    ).length;
    const usersWithUploadedImage = usageRows.filter(
      row => (row.images?.[0]?.count ?? 0) > 0
    ).length;
    const usersWithLink = usageRows.filter(
      row => !!row.business_slug && row.business_slug.trim().length > 0
    ).length;
    const mainWorkflowRows = usageRows.filter(row => {
      const serviceCount = row.services?.[0]?.count ?? 0;
      const imageCount = row.images?.[0]?.count ?? 0;
      const hasLink =
        !!row.business_slug && row.business_slug.trim().length > 0;
      return serviceCount > 0 && imageCount > 0 && hasLink;
    });
    const usersCompletedMainWorkflow = mainWorkflowRows.length;
    const mainWorkflowProfileIds = [
      ...new Set(mainWorkflowRows.map(row => row.profile_id).filter(Boolean)),
    ];
    const mainWorkflowCompletedUserEmails =
      mainWorkflowProfileIds.length > 0
        ? await fetchAuthEmailsForUserIds(supabase, mainWorkflowProfileIds)
        : [];

    const totalUsers = totalUsersResult.count ?? 0;
    const onboardingCompletedUsers = onboardingCompletedResult.count ?? 0;
    const onboardingCompletionRate =
      totalUsers > 0
        ? Math.round((onboardingCompletedUsers / totalUsers) * 100)
        : 0;
    type PaymentAccountRow = { charges_enabled?: boolean };
    const paymentAccountRows = (paymentAccountsResult.data ??
      []) as PaymentAccountRow[];
    const stripeConnectAccounts = paymentAccountRows.length;
    const stripeChargesEnabledAccounts = paymentAccountRows.filter(
      r => r.charges_enabled === true
    ).length;
    const paymentsEnabledBusinesses = (
      paymentsEnabledResult.data ?? []
    ).length;

    type BookingPaymentRow = {
      paid_online_amount_cents?: number;
      payment_status?: string;
      provider?: string;
    };
    const bookingPaymentRows = (bookingPaymentsResult.data ??
      []) as BookingPaymentRow[];
    let bookingsWithOnlinePayment = 0;
    let totalOnlineRevenueCents = 0;
    for (const row of bookingPaymentRows) {
      const paid = row.paid_online_amount_cents ?? 0;
      const status = row.payment_status?.toLowerCase() ?? '';
      const isPaidOnline =
        paid > 0 ||
        status === 'paid_full' ||
        status === 'deposit_paid';
      if (isPaidOnline && row.provider === 'stripe') {
        bookingsWithOnlinePayment += 1;
      }
      if (paid > 0) totalOnlineRevenueCents += paid;
    }

    const availabilityBookingEnabled = (availabilityResult.data ?? []).length;
    const quoteRequestsEnabled = (quoteRequestsResult.data ?? []).length;

    type AttributionChannelRow = {
      signup_channel: string | null;
      signup_attribution: StoredSignupAttribution | null;
    };
    type RecentProfileRow = AttributionChannelRow & {
      user_id: string;
      created_at: string;
    };
    const channelRows = attributionColumnMissing
      ? []
      : ((attributionChannelsResult.data ?? []) as AttributionChannelRow[]);
    const recentProfileRows = attributionColumnMissing
      ? []
      : ((recentProfilesResult.data ?? []) as RecentProfileRow[]);

    const signupSourceBreakdown = buildSignupSourceBreakdown(
      channelRows,
      totalUsers
    );
    const recentSignupsWithAttribution =
      await buildRecentSignupsWithAttribution(supabase, recentProfileRows);

    const topFeatures = [
      { feature: 'Onboarding Completed', users: onboardingCompletedUsers },
      { feature: 'Created a Service', users: usersWithCreatedService },
      { feature: 'Uploaded an Image', users: usersWithUploadedImage },
      { feature: 'Created Public Link', users: usersWithLink },
      {
        feature: 'Completed Main Workflow',
        users: usersCompletedMainWorkflow,
      },
      { feature: 'Stripe Connect linked', users: stripeConnectAccounts },
      {
        feature: 'Stripe charges enabled',
        users: stripeChargesEnabledAccounts,
      },
      { feature: 'Payments turned on', users: paymentsEnabledBusinesses },
      {
        feature: 'Bookings with Stripe payment',
        users: bookingsWithOnlinePayment,
      },
      { feature: 'Availability booking on', users: availabilityBookingEnabled },
      { feature: 'Quote requests on', users: quoteRequestsEnabled },
    ].sort((a, b) => b.users - a.users);

    const attributionWarning = attributionColumnMissing
      ? 'Signup source tracking: run migration docs/supabase/migrations/20260519_profiles_signup_attribution.sql — historical signups will show as “Not tracked yet”.'
      : null;

    return {
      metrics: {
        signupsToday: signupsTodayResult.count ?? 0,
        signupsLast7Days: signups7dResult.count ?? 0,
        signupsLast30Days: signups30dResult.count ?? 0,
        onboardingCompletedUsers,
        totalUsers,
        onboardingCompletionRate,
        totalBookings: totalBookingsResult.count ?? 0,
        bookingsLast7Days: bookings7dResult.count ?? 0,
        bookingsLast30Days: bookings30dResult.count ?? 0,
        payingActiveSubscribers,
        proTrialSubscribers,
        generatedAtIso,
        usersWithCreatedService,
        usersWithUploadedImage,
        usersCompletedMainWorkflow,
        mainWorkflowCompletedUserEmails,
        topFeatures,
        stripeConnectAccounts,
        stripeChargesEnabledAccounts,
        paymentsEnabledBusinesses,
        bookingsWithOnlinePayment,
        totalOnlineRevenueCents,
        availabilityBookingEnabled,
        quoteRequestsEnabled,
        signupSourceBreakdown,
        recentSignupsWithAttribution,
        attributionDataUnavailable: attributionColumnMissing,
      },
      warning: [warning, attributionWarning].filter(Boolean).join(' ') || null,
    };
  } catch (error) {
    return {
      metrics: {
        signupsToday: 0,
        signupsLast7Days: 0,
        signupsLast30Days: 0,
        onboardingCompletedUsers: 0,
        totalUsers: 0,
        onboardingCompletionRate: 0,
        totalBookings: 0,
        bookingsLast7Days: 0,
        bookingsLast30Days: 0,
        payingActiveSubscribers: 0,
        proTrialSubscribers: 0,
        generatedAtIso,
        usersWithCreatedService: 0,
        usersWithUploadedImage: 0,
        usersCompletedMainWorkflow: 0,
        mainWorkflowCompletedUserEmails: [],
        topFeatures: [],
        ...emptyProductMetrics(),
      },
      warning:
        error instanceof Error
          ? error.message
          : 'Unable to load lifecycle data',
    };
  }
}
